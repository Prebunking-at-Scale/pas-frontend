/**
 * Saved selections (docs/filters.md): what a valid one is, and the order they're listed in.
 */
import { describe, it, expect } from 'vitest';
import { sortSavedSelections, validateSavedSelection } from '~/utils/savedSelections';
import type { SavedSelection } from '~/utils/savedSelections';

const existing = [{ kind: 'channel' as const, name: 'ORG-channels' }];

describe('validateSavedSelection', () => {
  it('accepts a named, non-empty selection', () => {
    expect(validateSavedSelection({ kind: 'keyword', name: 'Vaccines', values: ['vacuna'] }, existing)).toBeNull();
  });

  it('needs a name and at least one value', () => {
    expect(validateSavedSelection({ kind: 'keyword', name: '  ', values: ['x'] }, existing)).toBe('name_required');
    expect(validateSavedSelection({ kind: 'keyword', name: 'Empty', values: [] }, existing)).toBe('values_required');
  });

  it('rejects a name already used for the same kind, ignoring case', () => {
    expect(validateSavedSelection({ kind: 'channel', name: 'org-CHANNELS', values: ['x'] }, existing)).toBe('name_taken');
    expect(validateSavedSelection({ kind: 'keyword', name: 'ORG-channels', values: ['x'] }, existing)).toBeNull();
  });

  it('rejects unknown kinds', () => {
    expect(validateSavedSelection({ kind: 'topic_id', name: 'Topics', values: ['t'] }, existing)).toBe('invalid_kind');
  });
});

describe('sortSavedSelections', () => {
  it('lists the organization defaults first, then by name', () => {
    const s = (name: string, is_default: boolean) => ({ id: name, kind: 'keyword', name, values: ['x'], is_default, created_at: '' }) as SavedSelection;
    expect(sortSavedSelections([s('b', false), s('ORG-Health', true), s('a', false), s('ORG-Climate', true)]).map(x => x.name))
      .toEqual(['ORG-Climate', 'ORG-Health', 'a', 'b']);
  });
});
