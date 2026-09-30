// Saved selections for the filters with many options (docs/filters.md): a named set of
// keywords, entities or channels that can be loaded into the filter in one click. The
// organisation's defaults come from its feeds; the rest are the person's own.

export type SavedSelectionKind = 'keyword' | 'entity_id' | 'channel'

export const SAVED_SELECTION_KINDS: SavedSelectionKind[] = ['keyword', 'entity_id', 'channel']

export interface SavedSelection {
  id: string
  kind: SavedSelectionKind
  name: string
  values: string[]
  /** The organisation's, from its feeds: shown first, and can't be deleted. */
  is_default: boolean
  created_at: string | null
}

export const SAVED_SELECTION_NAME_MAX = 60

export type SavedSelectionError = 'invalid_kind' | 'name_required' | 'name_too_long' | 'name_taken' | 'values_required'

/** What's wrong with a new selection, given the ones already saved; null when it can be saved. */
export const validateSavedSelection = (
  input: { kind: string; name: string; values: string[] },
  existing: Pick<SavedSelection, 'kind' | 'name'>[],
): SavedSelectionError | null => {
  if (!SAVED_SELECTION_KINDS.includes(input.kind as SavedSelectionKind)) return 'invalid_kind'
  const name = input.name.trim()
  if (!name) return 'name_required'
  if (name.length > SAVED_SELECTION_NAME_MAX) return 'name_too_long'
  if (input.values.filter(Boolean).length === 0) return 'values_required'
  if (existing.some(s => s.kind === input.kind && s.name.toLowerCase() === name.toLowerCase())) return 'name_taken'
  return null
}

/** Defaults first, then the rest by name. */
export const sortSavedSelections = (selections: SavedSelection[]) =>
  [...selections].sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.name.localeCompare(b.name))
