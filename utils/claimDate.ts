import type { Claim } from '~/types/api'

/**
 * The date shown for a claim: its video's upload date, the same date Research filters
 * and sorts claims by. The video comes with the claim on most endpoints; a narrative's
 * claims carry it as uploaded_at. When the claim was processed is only the fallback.
 */
export const claimDate = (claim: Pick<Claim, 'video' | 'uploaded_at' | 'created_at'>): string | undefined =>
  claim.video?.uploaded_at || claim.uploaded_at || claim.created_at || undefined
