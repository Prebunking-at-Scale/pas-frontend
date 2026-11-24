import { describe, it, expect, vi, afterEach } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import OrganizationLanguageSelect from '~/components/OrganizationLanguageSelect.vue'
import { organizationLanguageOptions } from '~/utils/organizationLanguages'

// Nuxt auto-imports aren't resolved in unit tests: give the component what it uses
vi.hoisted(async () => {
  const vue = await import('vue')
  Object.assign(globalThis, { computed: vue.computed, ref: vue.ref, watch: vue.watch })
})

// A native select stands in for the shadcn one, so the options can be read and picked
vi.mock('~/components/ui/select', () => ({
  Select: {
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" :disabled="disabled" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>'
  },
  SelectTrigger: { template: '<slot />' },
  SelectValue: { template: '<slot />' },
  SelectContent: { template: '<slot />' },
  SelectItem: { props: ['value'], template: '<option :value="value"><slot /></option>' },
}))

let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())

const codes = () => wrapper!.findAll('option').map(option => option.attributes('value'))
const standardCodes = organizationLanguageOptions.map(option => option.value)

describe('OrganizationLanguageSelect', () => {
  it('offers the standard languages and emits the one picked', async () => {
    wrapper = mount(OrganizationLanguageSelect, { props: { modelValue: 'en' } })

    expect(codes()).toEqual(standardCodes)

    await wrapper.get('select').setValue('es')
    expect(wrapper.emitted('update:modelValue')).toEqual([['es']])
  })

  it('offers a current language that is not in the standard list', () => {
    wrapper = mount(OrganizationLanguageSelect, { props: { modelValue: 'nb' } })

    expect(codes()).toEqual([...standardCodes, 'nb'])
    expect(wrapper.findAll('option').at(-1)!.text()).toBe('Bokmål')
  })

  it('keeps an unlisted language on offer after another is picked', async () => {
    wrapper = mount(OrganizationLanguageSelect, { props: { modelValue: 'nb' } })

    await wrapper.setProps({ modelValue: 'es' })

    expect(codes()).toEqual([...standardCodes, 'nb'])
  })
})
