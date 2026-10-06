/**
 * The alert rules shared by the editor, the list and "Add to alerts": the same checks
 * core-api makes (core/alerts/validation.py), and how a search or a narrative becomes a
 * condition.
 */
import { describe, it, expect } from 'vitest'
import {
  conditionFollowing,
  conditionFromSearch,
  conditionSearchQuery,
  isSameCondition,
  sanitizeCondition,
  sanitizeFilters,
  shownType,
  validateAlert,
} from '~/utils/alertRules'
import type { AlertInput } from '~/utils/alertRules'

const alert = (overrides: Partial<AlertInput> = {}): AlertInput => ({
  name: 'Migration watch',
  enabled: true,
  conditions: [{ type: 'new_narrative', narrative_id: null, filters: { topic_id: ['t-migration'] } }],
  ...overrides,
})

describe('validateAlert', () => {
  it('accepts a named alert with a condition that has a filter', () => {
    expect(validateAlert(alert())).toEqual([])
  })

  it('needs a name, not too long, and at least one condition', () => {
    expect(validateAlert(alert({ name: '  ' }))).toContain('name_required')
    expect(validateAlert(alert({ name: 'x'.repeat(121) }))).toContain('name_too_long')
    expect(validateAlert(alert({ conditions: [] }))).toContain('conditions_required')
  })

  it('needs a filter, except on a condition that follows a narrative', () => {
    expect(validateAlert(alert({ conditions: [{ type: 'new_claim', narrative_id: null, filters: {} }] })))
      .toContain('empty_condition')
    expect(validateAlert(alert({ conditions: [conditionFollowing('n-1')] }))).toEqual([])
  })

  it('ties the narrative to the condition that follows one', () => {
    expect(validateAlert(alert({ conditions: [{ type: 'new_claim_in_narrative', narrative_id: null, filters: {} }] })))
      .toContain('narrative_required')
    expect(validateAlert(alert({ conditions: [{ type: 'new_claim', narrative_id: 'n-1', filters: { language: ['es'] } }] })))
      .toContain('narrative_not_allowed')
  })

  it("rejects filters the type doesn't allow", () => {
    expect(validateAlert(alert({ conditions: [{ type: 'new_narrative', narrative_id: null, filters: { min_score: 3, topic_id: ['t'] } }] })))
      .toContain('filter_not_allowed')
  })
})

describe('conditions', () => {
  it('shows a claim in a narrative as New claim', () => {
    expect(shownType('new_claim_in_narrative')).toBe('new_claim')
    expect(shownType('new_narrative')).toBe('new_narrative')
  })

  it('keeps only the filters a type allows, and the keyword mode only with keywords', () => {
    expect(sanitizeFilters('new_narrative', { topic_id: ['t'], min_score: 2, keyword_mode: 'all' })).toEqual({ topic_id: ['t'] })
    expect(sanitizeFilters('new_claim', { keyword: ['a'], keyword_mode: 'all', min_score: 2 }))
      .toEqual({ keyword: ['a'], keyword_mode: 'all', min_score: 2 })
  })

  it('drops the narrative when a condition stops following one', () => {
    expect(sanitizeCondition({ type: 'new_claim', narrative_id: 'n-1', filters: { language: ['es'] } }).narrative_id).toBeNull()
  })

  it('compares conditions ignoring the order of values', () => {
    expect(isSameCondition(
      { type: 'new_claim', narrative_id: null, filters: { language: ['es', 'en'] } },
      { type: 'new_claim', narrative_id: null, filters: { language: ['en', 'es'] } },
    )).toBe(true)
  })

  it('opens Research for a condition over everything, and nothing for one following a narrative', () => {
    expect(conditionSearchQuery('new_claim', { language: ['es'], min_score: 3 }))
      .toEqual({ tab: 'claims', language: ['es'], min_score: '3' })
    expect(conditionSearchQuery('new_claim_in_narrative', {})).toBeNull()
  })
})

describe('conditionFromSearch', () => {
  it('turns the Narratives tab into a New narrative condition, without the date', () => {
    expect(conditionFromSearch('narratives', { topic_id: 't-1', keyword: ['vacuna'], date_from: '2026-01-01' })).toEqual({
      type: 'new_narrative',
      narrative_id: null,
      filters: { topic_id: ['t-1'], keyword: ['vacuna'] },
    })
  })

  it('turns the Claims tab into a New claim condition, score and keyword mode included', () => {
    expect(conditionFromSearch('claims', { language: 'es', min_score: '2.5', keyword: 'x', keyword_mode: 'all' })).toEqual({
      type: 'new_claim',
      narrative_id: null,
      filters: { language: ['es'], min_score: 2.5, keyword: ['x'], keyword_mode: 'all' },
    })
  })
})
