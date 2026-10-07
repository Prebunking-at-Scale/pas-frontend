/**
 * The search page keeps its whole state in the URL (docs/filters.md), so the query
 * round trip and the params sent to the API must agree.
 */
import { describe, it, expect } from 'vitest';
import {
  countMoreFilters,
  emptySearchState,
  hasSearchFilters,
  searchApiParams,
  searchPageFromQuery,
  searchRequestParams,
  searchStateFromQuery,
  searchStateToQuery,
} from '~/utils/searchQuery';
import { endOfDayISO, startOfDayISO } from '~/utils/date';

describe('searchStateFromQuery', () => {
  it('defaults to the narratives tab with no filters', () => {
    expect(searchStateFromQuery({})).toEqual(emptySearchState('narratives'));
  });

  it('ignores an unknown tab', () => {
    expect(searchStateFromQuery({ tab: 'actors' }).tab).toBe('narratives');
  });

  it('reads single and repeated params as lists', () => {
    const state = searchStateFromQuery({ keyword: 'vacuna', topic_id: ['t-health', 't-eu'] });
    expect(state.keyword).toEqual(['vacuna']);
    expect(state.topic_id).toEqual(['t-health', 't-eu']);
  });
});

describe('searchStateToQuery', () => {
  it('round-trips a state', () => {
    const state = {
      ...emptySearchState('claims'),
      keyword: ['carbon tax', '5g'],
      platform: ['tiktok'],
      date_from: '2026-08-01',
    };
    expect(searchStateFromQuery(searchStateToQuery(state) as never)).toEqual(state);
  });

  it('keeps multi-word keywords whole', () => {
    const query = searchStateToQuery({ ...emptySearchState(), keyword: ['carbon tax'] });
    expect(query.keyword).toEqual(['carbon tax']);
  });

  it('only includes the page after the first', () => {
    expect(searchStateToQuery(emptySearchState(), 1).page).toBeUndefined();
    expect(searchPageFromQuery(searchStateToQuery(emptySearchState(), 3) as never)).toBe(3);
  });
});

describe('keyword mode', () => {
  it('is sent only as "all", and only with keywords', () => {
    expect(searchApiParams({ ...emptySearchState(), keyword: ['a', 'b'], keyword_mode: 'all' }).keyword_mode).toBe('all');
    expect(searchApiParams({ ...emptySearchState(), keyword: ['a', 'b'] }).keyword_mode).toBeUndefined();
    expect(searchApiParams({ ...emptySearchState(), keyword_mode: 'all' }).keyword_mode).toBeUndefined();
  });

  it('round-trips through the URL', () => {
    const state = { ...emptySearchState(), keyword: ['inmigrante', 'pisos'], keyword_mode: 'all' as const };
    expect(searchStateFromQuery(searchStateToQuery(state) as never)).toEqual(state);
  });
});

describe('searchApiParams', () => {
  const state = { ...emptySearchState(), spread_pattern: ['viral'] };

  it('sends tab-specific filters only on their own tab', () => {
    expect(searchApiParams({ ...state, tab: 'narratives' })).toEqual({ spread_pattern: ['viral'] });
    expect(searchApiParams({ ...state, tab: 'claims' })).toEqual({});
    expect(searchApiParams({ ...state, tab: 'videos' })).toEqual({});
  });

  it('does not count another tab\'s filters as active', () => {
    expect(hasSearchFilters({ ...state, tab: 'videos' })).toBe(false);
    expect(hasSearchFilters({ ...state, tab: 'narratives' })).toBe(true);
  });
});

describe('countMoreFilters', () => {
  it('ignores topic, language and keywords, which are always visible', () => {
    expect(countMoreFilters({ ...emptySearchState(), topic_id: ['t'], language: ['es'], keyword: ['k'] })).toBe(0);
  });

  it('counts each hidden filter once, and the date range as one', () => {
    const state = { ...emptySearchState('videos'), platform: ['tiktok', 'youtube'], date_from: '2026-08-01', date_to: '2026-08-31' };
    expect(countMoreFilters(state)).toBe(2);
  });

  it('counts a tab-specific filter only on its own tab', () => {
    const state = { ...emptySearchState(), spread_pattern: ['viral'] };
    expect(countMoreFilters({ ...state, tab: 'narratives' })).toBe(1);
    expect(countMoreFilters({ ...state, tab: 'claims' })).toBe(0);
  });
});

describe('searchRequestParams', () => {
  it('sends the upload days as the start of the first and the end of the last', () => {
    const state = { ...emptySearchState('videos'), date_from: '2026-09-01', date_to: '2026-09-03', platform: ['tiktok'] };
    expect(searchRequestParams(state)).toEqual({
      platform: ['tiktok'],
      start_date: startOfDayISO('2026-09-01'),
      end_date: endOfDayISO('2026-09-03'),
    });
  });

  it('leaves out the dates that aren\'t set', () => {
    const state = { ...emptySearchState('claims'), date_to: '2026-09-03' };
    expect(searchRequestParams(state)).toEqual({ end_date: endOfDayISO('2026-09-03') });
    expect(searchRequestParams(emptySearchState())).toEqual({});
  });
});
