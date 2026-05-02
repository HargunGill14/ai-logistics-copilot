export interface FmcsaCarrier {
  allowedToOperate?: string
  safetyRating?: string
  bipdInsuranceOnFile?: string
  cargoInsuranceOnFile?: string
  authorityDate?: string
  [key: string]: unknown
}

export function computeTrustScore(carrier: FmcsaCarrier): number {
  let score = 0
  const authorized = carrier.allowedToOperate === 'Y'
  const rating = (carrier.safetyRating ?? '').toLowerCase()

  const authorityAgeDays = computeAuthorityAgeDays(carrier.authorityDate)

  if (authorized) score += 40
  else score -= 40

  if (authorityAgeDays !== null && authorityAgeDays > 365) score += 20
  if (authorityAgeDays !== null && authorityAgeDays < 180) score -= 20

  if (rating === 'satisfactory') score += 20
  else if (rating === 'conditional') score -= 10
  else if (rating === 'unsatisfactory') score -= 30

  if (carrier.bipdInsuranceOnFile === 'Y') score += 10
  if (carrier.cargoInsuranceOnFile === 'Y') score += 10

  return Math.max(0, Math.min(100, score))
}

export function extractRiskFlags(carrier: FmcsaCarrier): string[] {
  const flags: string[] = []
  const rating = (carrier.safetyRating ?? '').toLowerCase()
  const authorityAgeDays = computeAuthorityAgeDays(carrier.authorityDate)

  if (carrier.allowedToOperate !== 'Y') flags.push('NOT_AUTHORIZED')
  if (rating === 'conditional') flags.push('CONDITIONAL_SAFETY_RATING')
  if (rating === 'unsatisfactory') flags.push('UNSATISFACTORY_SAFETY_RATING')
  if (carrier.bipdInsuranceOnFile !== 'Y') flags.push('NO_BIPD_INSURANCE')
  if (authorityAgeDays !== null && authorityAgeDays < 180) flags.push('NEW_AUTHORITY_UNDER_6_MONTHS')

  return flags
}

export function computeAuthorityAgeDays(authorityDate?: string): number | null {
  if (!authorityDate) return null
  const then = new Date(authorityDate)
  if (isNaN(then.getTime())) return null
  return Math.floor((Date.now() - then.getTime()) / 86400000)
}

export function deriveVerificationStatus(
  trustScore: number,
  riskFlags: string[]
): 'pending' | 'verified' | 'flagged' | 'rejected' {
  if (riskFlags.includes('NOT_AUTHORIZED')) return 'rejected'
  if (riskFlags.includes('UNSATISFACTORY_SAFETY_RATING')) return 'flagged'
  if (trustScore >= 60) return 'verified'
  if (trustScore >= 30) return 'flagged'
  return 'rejected'
}

export async function fetchFmcsaCarrier(query: string): Promise<FmcsaCarrier> {
  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(query)}?webKey=${process.env.FMCSA_API_KEY}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`FMCSA API error: ${res.status}`)
  const json = await res.json()
  return (json?.content?.carrier ?? json?.carrier ?? json) as FmcsaCarrier
}
