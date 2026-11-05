import { describe, it, expect } from 'vitest'
import { claimDate } from '~/utils/claimDate'
import type { Claim, Video } from '~/types/api'

const video = (uploaded_at?: string) => ({ uploaded_at }) as Video

describe('claimDate', () => {
  it("is the video's upload date, not when the claim was processed", () => {
    const claim = { video: video('2026-04-30T07:43:44'), created_at: '2026-05-06T01:10:20' } as Claim
    expect(claimDate(claim)).toBe('2026-04-30T07:43:44')
  })

  it("uses uploaded_at on a narrative's claims, which come without their video", () => {
    const claim = { uploaded_at: '2026-04-30T18:32:23', created_at: '2026-05-24T13:00:18' } as Claim
    expect(claimDate(claim)).toBe('2026-04-30T18:32:23')
  })

  it('falls back to when the claim was processed', () => {
    expect(claimDate({ video: video(undefined), created_at: '2026-05-06T01:10:20' } as Claim)).toBe('2026-05-06T01:10:20')
    expect(claimDate({} as Claim)).toBeUndefined()
  })
})
