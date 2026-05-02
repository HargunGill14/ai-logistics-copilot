import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

const VALID_DOC_TYPES = ['insurance_cert', 'mc_authority', 'w9', 'void_check'] as const
type DocumentType = typeof VALID_DOC_TYPES[number]

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface AiResult {
  verdict: 'valid' | 'invalid' | 'review'
  confidence: number
  flags: string[]
}

async function analyzeWithClaude(
  signedUrl: string,
  docType: DocumentType,
  mimeType: string
): Promise<AiResult> {
  try {
    const isImage = mimeType.startsWith('image/')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: isImage
            ? [
                {
                  type: 'image',
                  source: { type: 'url', url: signedUrl },
                },
                {
                  type: 'text',
                  text: `You are a freight compliance analyst. Analyze this ${docType} document. Return ONLY JSON: { "verdict": "valid"|"invalid"|"review", "confidence": 0-100, "flags": [] }. Flags: EXPIRED, WRONG_INSURED_NAME, LOW_COVERAGE, ALTERED_DOCUMENT, MISSING_POLICY_NUMBER`,
                },
              ]
            : [
                {
                  type: 'text',
                  text: `You are a freight compliance analyst. Analyze this ${docType} document at URL: ${signedUrl}. Return ONLY JSON: { "verdict": "valid"|"invalid"|"review", "confidence": 0-100, "flags": [] }. Flags: EXPIRED, WRONG_INSURED_NAME, LOW_COVERAGE, ALTERED_DOCUMENT, MISSING_POLICY_NUMBER`,
                },
              ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const clean = content.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as AiResult
    return {
      verdict: ['valid', 'invalid', 'review'].includes(parsed.verdict) ? parsed.verdict : 'review',
      confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, parsed.confidence)) : 0,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    }
  } catch {
    return { verdict: 'review', confidence: 0, flags: ['AI_ANALYSIS_FAILED'] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 10 per hour
    const allowed = rateLimit(`docs:${user.id}`, 10, 3600000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'carrier') {
      return NextResponse.json({ error: 'Only carriers can upload documents' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('document_type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    if (!docType || !(VALID_DOC_TYPES as readonly string[]).includes(docType)) {
      return NextResponse.json(
        { error: `document_type must be one of: ${VALID_DOC_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, and PNG files are allowed' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File must be 10MB or less' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'bin'
    const storagePath = `${user.id}/${docType}_${Date.now()}.${ext}`

    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('carrier-documents')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('carrier-documents')
      .createSignedUrl(storagePath, 3600)

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to create analysis URL' }, { status: 500 })
    }

    const aiResult = await analyzeWithClaude(signedData.signedUrl, docType as DocumentType, file.type)

    const { error: insertError } = await supabase.from('verification_documents').insert({
      carrier_id: user.id,
      document_type: docType,
      storage_path: storagePath,
      file_name: file.name,
      file_size_kb: Math.ceil(file.size / 1024),
      ai_verdict: aiResult.verdict,
      ai_flags: aiResult.flags,
      ai_confidence: aiResult.confidence,
      analyzed_at: new Date().toISOString(),
    })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    return NextResponse.json({ verdict: aiResult.verdict, flags: aiResult.flags }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
