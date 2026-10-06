// Client for core-api's alerts (docs/alerts-implementation.md): your own alerts, their
// order in the panel, and a preview of your next e-mail.
import type { Alert, AlertError, AlertInput, DigestEntry } from '~/utils/alertRules'

/** The validation codes of a 422 from the API, or save_failed for anything else. */
export const alertErrorsOf = (error: unknown): AlertError[] => {
  const response = (error as { response?: { status?: number; _data?: { extra?: { errors?: AlertError[] } } } })?.response
  const errors = response?.status === 422 ? response._data?.extra?.errors : undefined
  return errors && errors.length > 0 ? errors : ['save_failed']
}

/** Only what core-api takes: new conditions have no id yet. */
const body = (alert: AlertInput): AlertInput => ({
  name: alert.name,
  enabled: alert.enabled,
  conditions: alert.conditions.map(({ type, narrative_id, filters }) => ({ type, narrative_id, filters })),
})

export const alertsService = {
  async list(): Promise<Alert[]> {
    const { apiFetch } = useApi()
    return (await apiFetch<{ data: Alert[] }>('/api/alerts')).data
  },

  async get(id: string): Promise<Alert> {
    const { apiFetch } = useApi()
    return (await apiFetch<{ data: Alert }>(`/api/alerts/${id}`)).data
  },

  async create(alert: AlertInput): Promise<Alert> {
    const { apiFetch } = useApi()
    return (await apiFetch<{ data: Alert }>('/api/alerts', { method: 'POST', body: body(alert) })).data
  },

  async update(id: string, alert: AlertInput): Promise<Alert> {
    const { apiFetch } = useApi()
    return (await apiFetch<{ data: Alert }>(`/api/alerts/${id}`, { method: 'PUT', body: body(alert) })).data
  },

  async remove(id: string): Promise<void> {
    const { apiFetch } = useApi()
    await apiFetch(`/api/alerts/${id}`, { method: 'DELETE' })
  },

  async reorder(ids: string[]): Promise<Alert[]> {
    const { apiFetch } = useApi()
    return (await apiFetch<{ data: Alert[] }>('/api/alerts/order', { method: 'PUT', body: { ids } })).data
  },

  async digestPreview(): Promise<DigestEntry[]> {
    const { apiFetch } = useApi()
    return (await apiFetch<{ data: DigestEntry[] }>('/api/alerts/digest-preview')).data
  },
}
