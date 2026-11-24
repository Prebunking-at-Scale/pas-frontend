import { describe, it, expect } from 'vitest'
import { organizationLanguageOptions, organizationLanguageOptionsFor } from '~/utils/organizationLanguages'

describe('organizationLanguageOptions', () => {
  it('only offers codes core-api accepts: two lowercase letters, each once', () => {
    const codes = organizationLanguageOptions.map(option => option.value)

    expect(codes.every(code => /^[a-z]{2}$/.test(code))).toBe(true)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

describe('organizationLanguageOptionsFor', () => {
  it('returns the standard list when the current language is in it', () => {
    expect(organizationLanguageOptionsFor('es')).toEqual(organizationLanguageOptions)
  })

  it('returns the standard list when there is no current language', () => {
    expect(organizationLanguageOptionsFor('')).toEqual(organizationLanguageOptions)
    expect(organizationLanguageOptionsFor(undefined)).toEqual(organizationLanguageOptions)
  })

  it('adds a current language that is not in the standard list, by name', () => {
    const options = organizationLanguageOptionsFor('uk')

    expect(options).toHaveLength(organizationLanguageOptions.length + 1)
    expect(options.at(-1)).toEqual({ value: 'uk', label: 'Ukrainian' })
  })

  it('adds each unlisted language once, and never a listed one twice', () => {
    const options = organizationLanguageOptionsFor('uk', 'es', 'nb', 'uk')

    expect(options.map(option => option.value).slice(organizationLanguageOptions.length)).toEqual(['uk', 'nb'])
  })

  it('falls back to the code for a language it has no name for', () => {
    expect(organizationLanguageOptionsFor('zz').at(-1)).toEqual({ value: 'zz', label: 'ZZ' })
  })
})
