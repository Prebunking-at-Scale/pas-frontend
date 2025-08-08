export type AlertType = 'narrative_views' | 'narrative_claims_count' | 'narrative_videos_count' | 'narrative_with_topic' | 'keyword'

export type AlertScope = 'general' | 'specific'

export { Alert } from './api'

export interface CreateAlertRequest {
  scope: AlertScope
  alert_type: AlertType
  narrative_id?: string
  threshold?: number
  topic_id?: string
  keyword?: string
  enabled?: boolean
  name: string
}

export interface UpdateAlertRequest {
  enabled?: boolean
  threshold?: number
  keyword?: string
  name: string
}

export interface AlertsResponse {
  items: Alert[]
  total: number
  limit: number
  offset: number
}