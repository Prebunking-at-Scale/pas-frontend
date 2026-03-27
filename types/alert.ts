import type { Alert, AlertChannel } from './api'

export type AlertType = 'narrative_views' | 'narrative_claims_count' | 'narrative_videos_count' | 'narrative_with_topic' | 'keyword'

export type AlertScope = 'general' | 'specific'

export type { Alert };

export interface CreateAlertRequest {
  scope: AlertScope
  alert_type: AlertType
  narrative_id?: string
  threshold?: number
  topic_id?: string
  keyword?: string
  enabled?: boolean
  name: string
  channels: AlertChannel[]
}

export interface UpdateAlertRequest {
  enabled?: boolean
  threshold?: number
  keyword?: string
  name: string
  channels: AlertChannel[]
}

export interface AlertsResponse {
  items: Alert[]
  total: number
  limit: number
  offset: number
}