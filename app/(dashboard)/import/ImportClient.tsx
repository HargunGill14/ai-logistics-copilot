'use client'

import { useMemo, useState } from 'react'
import Papa from 'papaparse'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ImportResult, ImportRowError } from '@/types'

type ImportKind = 'loads' | 'carriers'

interface CsvRow {
  [header: string]: string
}

interface FieldDefinition {
  key: string
  label: string
  required: boolean
  hint?: string
}

const fieldsByKind: Record<ImportKind, FieldDefinition[]> = {
  loads: [
    { key: 'origin_city', label: 'Origin city', required: true, hint: 'Chicago' },
    { key: 'origin_state', label: 'Origin state', required: true, hint: 'IL' },
    { key: 'destination_city', label: 'Destination city', required: true, hint: 'Atlanta' },
    { key: 'destination_state', label: 'Destination state', required: true, hint: 'GA' },
    { key: 'pickup_date', label: 'Pickup date', required: true, hint: 'MM/DD/YYYY or YYYY-MM-DD' },
    { key: 'equipment_type', label: 'Equipment type', required: true, hint: 'Dry Van, DV, Reefer' },
    { key: 'target_rate', label: 'Target rate', required: true, hint: '3200' },
    { key: 'delivery_date', label: 'Delivery date', required: false, hint: 'MM/DD/YYYY or YYYY-MM-DD' },
    { key: 'weight_lbs', label: 'Weight lbs', required: false, hint: '42000' },
    { key: 'commodity', label: 'Commodity', required: false },
    { key: 'max_rate', label: 'Max rate', required: false },
    { key: 'bid_deadline', label: 'Bid deadline', required: false, hint: 'MM/DD/YYYY or YYYY-MM-DD' },
    { key: 'notes', label: 'Notes', required: false },
  ],
  carriers: [
    { key: 'carrier_name', label: 'Carrier name', required: true, hint: 'Apex Drayage LLC' },
    { key: 'contact_name', label: 'Contact name', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'mc_number', label: 'MC number', required: false },
    { key: 'usdot_number', label: 'USDOT number', required: false },
    { key: 'equipment_type', label: 'Equipment type', required: false, hint: 'Dry Van, Flatbed' },
    { key: 'notes', label: 'Notes', required: false },
  ],
}

const emptyResult: ImportResult = { imported: 0, failed: 0, errors: [] }

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function bestGuessHeader(headers: string[], field: FieldDefinition): string {
  const target = normalizeHeader(field.key)
  const label = normalizeHeader(field.label)
  return headers.find((header) => normalizeHeader(header) === target || normalizeHeader(header) === label) ?? ''
}

function buildErrorCsv(errors: ImportRowError[]): string {
  const escapeCell = (value: string | number | undefined) => {
    const text = String(value ?? '')
    return `"${text.replaceAll('"', '""')}"`
  }

  return [
    ['row', 'field', 'code', 'message'].map(escapeCell).join(','),
    ...errors.map((error) =>
      [error.row, error.field, error.code, error.message].map(escapeCell).join(',')
    ),
  ].join('\n')
}

export default function ImportPage() {
  const [activeKind, setActiveKind] = useState<ImportKind>('loads')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<ImportResult>(emptyResult)
  const [progress, setProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const fields = fieldsByKind[activeKind]
  const previewRows = rows.slice(0, 5)
  const mappedRows = useMemo(
    () =>
      rows.map((row) =>
        fields.reduce<Record<string, string>>((acc, field) => {
          const header = mapping[field.key]
          acc[field.key] = header ? row[header] ?? '' : ''
          return acc
        }, {})
      ),
    [fields, mapping, rows]
  )
  const missingRequired = fields.filter((field) => field.required && !mapping[field.key])
  const canImport = rows.length > 0 && missingRequired.length === 0 && !submitting

  function resetImportState(kind = activeKind) {
    setHeaders([])
    setRows([])
    setMapping({})
    setFileName('')
    setParseError('')
    setResult(emptyResult)
    setProgress(0)
    setActiveKind(kind)
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    resetImportState(activeKind)

    if (!file) {
      return
    }

    setFileName(file.name)
    setProgress(15)

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (parsed) => {
        const cleanRows = parsed.data.filter((row) =>
          Object.values(row).some((value) => String(value ?? '').trim().length > 0)
        )
        const parsedHeaders = parsed.meta.fields?.filter(Boolean) ?? []

        if (parsed.errors.length > 0 || parsedHeaders.length === 0) {
          setParseError('Unable to parse this CSV. Export the sheet as CSV and try again.')
          setProgress(0)
          return
        }

        const guesses = fields.reduce<Record<string, string>>((acc, field) => {
          acc[field.key] = bestGuessHeader(parsedHeaders, field)
          return acc
        }, {})

        setHeaders(parsedHeaders)
        setRows(cleanRows)
        setMapping(guesses)
        setProgress(35)
      },
      error: () => {
        setParseError('Unable to parse this CSV. Export the sheet as CSV and try again.')
        setProgress(0)
      },
    })
  }

  async function submitImport() {
    if (!canImport) {
      return
    }

    setSubmitting(true)
    setResult(emptyResult)
    setProgress(65)

    try {
      const response = await fetch(`/api/import/${activeKind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: mappedRows }),
      })
      const data = (await response.json()) as Partial<ImportResult> & { error?: string }

      if (!response.ok) {
        setResult({
          imported: data.imported ?? 0,
          failed: data.failed ?? rows.length,
          errors:
            data.errors && data.errors.length > 0
              ? data.errors
              : [{ row: 0, code: 'insert_failed', message: data.error ?? 'Import failed' }],
        })
        setProgress(100)
        return
      }

      setResult({
        imported: data.imported ?? 0,
        failed: data.failed ?? 0,
        errors: data.errors ?? [],
      })
      setProgress(100)
    } catch {
      setResult({
        imported: 0,
        failed: rows.length,
        errors: [{ row: 0, code: 'insert_failed', message: 'Import failed. Try again later.' }],
      })
      setProgress(100)
    } finally {
      setSubmitting(false)
    }
  }

  function downloadErrors() {
    if (result.errors.length === 0) {
      return
    }

    const blob = new Blob([buildErrorCsv(result.errors)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeKind}-import-errors.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Import Data</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload Google Sheets CSV exports, map columns, preview rows, and import records.
          </p>
        </div>
        <Badge className="bg-[#0d9488]/10 text-[#0f766e]">CSV / Google Sheets</Badge>
      </div>

      <Tabs
        value={activeKind}
        onValueChange={(value) => resetImportState(value as ImportKind)}
        className="gap-4"
      >
        <TabsList className="bg-slate-100">
          <TabsTrigger value="loads">Loads</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
        </TabsList>

        {(['loads', 'carriers'] as ImportKind[]).map((kind) => (
          <TabsContent key={kind} value={kind} className="space-y-6">
            <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                  <FileSpreadsheet className="h-5 w-5 text-[#1a3a5c]" />
                  {kind === 'loads' ? 'Load CSV' : 'Carrier CSV'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div>
                    <Label htmlFor={`${kind}-csv`}>CSV upload</Label>
                    <Input
                      id={`${kind}-csv`}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="mt-2 rounded-lg bg-white"
                    />
                    {fileName && <p className="mt-2 text-xs text-slate-500">{fileName}</p>}
                    {parseError && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {parseError}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">Progress</span>
                      <span className="text-slate-500">{progress}%</span>
                    </div>
                    <progress
                      value={progress}
                      max={100}
                      className="mt-3 h-2 w-full overflow-hidden rounded-full accent-[#0d9488]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {headers.length > 0 && (
              <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-base text-slate-900">Column Mapping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label htmlFor={`${kind}-${field.key}`} className="justify-between">
                          <span>{field.label}</span>
                          {field.required && <span className="text-xs text-red-500">Required</span>}
                        </Label>
                        <select
                          id={`${kind}-${field.key}`}
                          value={mapping[field.key] ?? ''}
                          onChange={(event) =>
                            setMapping((current) => ({
                              ...current,
                              [field.key]: event.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1a3a5c] focus:ring-2 focus:ring-[#1a3a5c]/20"
                        >
                          <option value="">Do not import</option>
                          {headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                        {field.hint && <p className="text-xs text-slate-500">{field.hint}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-base text-slate-900">5-Row Preview</CardTitle>
                      <Badge variant="outline">{rows.length} rows detected</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {fields.slice(0, 6).map((field) => (
                            <TableHead key={field.key}>{field.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, index) => (
                          <TableRow key={`${kind}-preview-${index}`}>
                            {fields.slice(0, 6).map((field) => {
                              const header = mapping[field.key]
                              return (
                                <TableCell key={field.key} className="max-w-44 truncate text-slate-700">
                                  {header ? row[header] || '-' : '-'}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {missingRequired.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Map required fields before importing: {missingRequired.map((field) => field.label).join(', ')}.
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={submitImport}
                        disabled={!canImport}
                        className="rounded-lg bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90"
                      >
                        <Upload className="h-4 w-4" />
                        {submitting ? 'Importing...' : `Import ${kind === 'loads' ? 'Loads' : 'Carriers'}`}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadErrors}
                        disabled={result.errors.length === 0}
                        className="rounded-lg"
                      >
                        <Download className="h-4 w-4" />
                        Error report
                      </Button>
                    </div>

                    {(result.imported > 0 || result.failed > 0) && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" />
                          Imported {result.imported}
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          Failed {result.failed}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
