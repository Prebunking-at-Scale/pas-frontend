/**
 * Keywords in the keyword filter: phrases stay whole, duplicates are skipped however
 * they're written, and a saved selection adds to what's there.
 */
import { describe, it, expect } from 'vitest';
import { cleanKeyword, keywordKey, keywordsFromPaste, mergeKeywords } from '~/utils/keywords';

describe('cleanKeyword', () => {
  it('keeps a phrase as one keyword, with single spaces', () => {
    expect(cleanKeyword('  climate   change ')).toBe('climate change');
  });
});

describe('keywordKey', () => {
  it('ignores case, accents and hyphens', () => {
    expect(keywordKey('Cambio-Climático')).toBe(keywordKey('cambio climatico'));
  });
});

describe('mergeKeywords', () => {
  it('adds a saved selection to typed keywords, skipping duplicates', () => {
    expect(mergeKeywords(['climate change', 'Frontex'], ['frontex', 'migrants', 'Climate-Change', ' asylum ']))
      .toEqual(['climate change', 'Frontex', 'migrants', 'asylum']);
  });

  it('skips empty keywords', () => {
    expect(mergeKeywords([], ['', '   '])).toEqual([]);
  });
});

describe('keywordsFromPaste', () => {
  it('splits a pasted list by lines only', () => {
    expect(keywordsFromPaste('vacuna\nclimate change\r\n\n5G')).toEqual(['vacuna', 'climate change', '5G']);
  });

  it('leaves a single line, commas included, to be typed as one keyword', () => {
    expect(keywordsFromPaste('climate change, CO2')).toBeNull();
  });
});
