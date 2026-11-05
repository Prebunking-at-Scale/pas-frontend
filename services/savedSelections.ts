// Client for core-api's saved selections (docs/research-implementation.md): the
// organisation's defaults, from its feeds, and each person's own lists.
import type { SavedSelection, SavedSelectionError, SavedSelectionKind } from '~/utils/savedSelections'

const SAVED_SELECTION_ERRORS: SavedSelectionError[] = [
  'invalid_kind', 'name_required', 'name_too_long', 'name_taken', 'values_required',
]

/** The reason code of a 422 from the API, when it is one we know. */
export const savedSelectionErrorOf = (error: unknown): SavedSelectionError | null => {
  const response = (error as { response?: { status?: number; _data?: { detail?: string } } })?.response
  const detail = response?.status === 422 ? response._data?.detail : undefined
  return SAVED_SELECTION_ERRORS.includes(detail as SavedSelectionError) ? detail as SavedSelectionError : null
}

export const savedSelectionsService = {
  async list(kind: SavedSelectionKind): Promise<SavedSelection[]> {
    const { apiFetch } = useApi()
    const response = await apiFetch<{ data: SavedSelection[] }>('/api/saved-selections', { query: { kind } })
    return response.data
  },

  async create(kind: SavedSelectionKind, name: string, values: string[]): Promise<SavedSelection> {
    const { apiFetch } = useApi()
    const response = await apiFetch<{ data: SavedSelection }>('/api/saved-selections', {
      method: 'POST',
      body: { kind, name, values },
    })
    return response.data
  },

  async remove(id: string): Promise<void> {
    const { apiFetch } = useApi()
    await apiFetch(`/api/saved-selections/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
