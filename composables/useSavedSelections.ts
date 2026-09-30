// The saved selections of one kind (keywords, entities or channels), shared by every
// filter of that kind on the page (docs/filters.md, "Saved selections"): the
// organisation's defaults first, then the person's own, which only they see.
import { savedSelectionErrorOf, savedSelectionsService } from '~/services/savedSelections'
import { sortSavedSelections, validateSavedSelection } from '~/utils/savedSelections'
import type { SavedSelection, SavedSelectionError, SavedSelectionKind } from '~/utils/savedSelections'

export const useSavedSelections = (kind: SavedSelectionKind) => {
  const selections = useState<SavedSelection[] | null>(`savedSelections:${kind}`, () => null)

  const load = async () => {
    if (selections.value !== null) return
    try {
      selections.value = await savedSelectionsService.list(kind)
    } catch (error) {
      console.error('Failed to load saved selections:', error)
      selections.value = []
    }
  }

  /** Saves the values under a name; returns why it couldn't, or null once saved. */
  const save = async (name: string, values: string[]): Promise<SavedSelectionError | 'save_failed' | null> => {
    const error = validateSavedSelection({ kind, name, values }, selections.value ?? [])
    if (error) return error
    try {
      const saved = await savedSelectionsService.create(kind, name.trim(), values)
      selections.value = sortSavedSelections([...(selections.value ?? []), saved])
      return null
    } catch (e) {
      const known = savedSelectionErrorOf(e)
      if (known) return known
      console.error('Failed to save selection:', e)
      return 'save_failed'
    }
  }

  const remove = async (id: string) => {
    try {
      await savedSelectionsService.remove(id)
      selections.value = (selections.value ?? []).filter(s => s.id !== id)
    } catch (error) {
      console.error('Failed to delete saved selection:', error)
    }
  }

  return { selections: computed(() => selections.value ?? []), load, save, remove }
}
