import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Nuxt auto-imports aren't resolved in unit tests: give the component what it uses,
// before it is imported.
vi.hoisted(async () => {
  const vue = await import('vue')
  Object.assign(globalThis, {
    computed: vue.computed,
    useRouter: () => ({ resolve: (to: string) => ({ href: to }) }),
  })
})

import CardLink from '~/components/CardLink.vue'

let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())

const mountInCard = (onCardClick: () => void) => {
  const Card = defineComponent({
    render: () => h('div', { onClick: onCardClick }, [h(CardLink, { to: '/narratives/n1', label: 'A narrative' })]),
  })
  wrapper = mount(Card)
  return wrapper
}

// Vue skips an event older than its listener, and a click fired the instant the card
// mounts can carry an earlier timestamp here: click a moment later, as a person does.
const click = async (target: Element, init: MouseEventInit = {}) => {
  await new Promise(resolve => setTimeout(resolve, 5))
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })
  target.dispatchEvent(event)
  return event
}

describe('CardLink', () => {
  it('is a real link to the card’s page, named after it', () => {
    const link = mountInCard(vi.fn()).get('a')
    expect(link.attributes('href')).toBe('/narratives/n1')
    expect(link.attributes('aria-label')).toBe('A narrative')
  })

  it('leaves a plain click to the card’s own handler', async () => {
    const onCardClick = vi.fn()
    const event = await click(mountInCard(onCardClick).get('a').element)
    expect(event.defaultPrevented).toBe(true)
    expect(onCardClick).toHaveBeenCalledOnce()
  })

  it.each(['ctrlKey', 'metaKey', 'shiftKey'] as const)('leaves a %s click to the browser (new tab)', async (key) => {
    const onCardClick = vi.fn()
    const event = await click(mountInCard(onCardClick).get('a').element, { [key]: true })
    expect(event.defaultPrevented).toBe(false)
    expect(onCardClick).not.toHaveBeenCalled()
  })
})
