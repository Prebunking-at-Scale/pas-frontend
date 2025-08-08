import type { Alert, CreateAlertRequest, UpdateAlertRequest, AlertsResponse, AlertType, AlertScope } from '~/types/alert'
import { apiService } from '~/services/api'

export const useAlerts = () => {

  const validateAlertRequest = (request: CreateAlertRequest): string | null => {
    if (!request.name) {
      return 'Alert name is required'
    }

    // Scope validation
    if (request.scope === 'general' && request.narrative_id) {
      return 'General scope alerts cannot have a narrative_id'
    }
    if (request.scope === 'specific' && !request.narrative_id) {
      return 'Specific scope alerts must have a narrative_id'
    }

    // Alert type validation
    const thresholdTypes = ['narrative_views', 'narrative_claims_count', 'narrative_videos_count']
    if (thresholdTypes.includes(request.alert_type)) {
      if (!request.threshold) {
        return `Alert type ${request.alert_type} requires a threshold`
      }
      if (request.topic_id || request.keyword) {
        return `Alert type ${request.alert_type} cannot have topic_id or keyword`
      }
    }

    if (request.alert_type === 'narrative_with_topic') {
      if (!request.topic_id) {
        return 'Alert type narrative_with_topic requires a topic_id'
      }
      if (request.scope !== 'general') {
        return 'Alert type narrative_with_topic must have general scope'
      }
      if (request.threshold || request.keyword) {
        return 'Alert type narrative_with_topic cannot have threshold or keyword'
      }
    }

    if (request.alert_type === 'keyword') {
      if (!request.keyword) {
        return 'Alert type keyword requires a keyword'
      }
      if (request.scope !== 'general') {
        return 'Alert type keyword must have general scope'
      }
      if (request.threshold || request.topic_id) {
        return 'Alert type keyword cannot have threshold or topic_id'
      }
    }

    return null
  }

  const fetchAlerts = async (enabledOnly = false, limit = 100, offset = 0): Promise<AlertsResponse> => {
    const response = await apiService.getAlerts({
      enabled_only: enabledOnly,
      limit,
      offset
    })
    return response
  }

  const fetchAlert = async (alertId: string): Promise<Alert> => {
    const response = await apiService.getAlert(alertId)
    return response
  }

  const createAlert = async (request: CreateAlertRequest): Promise<Alert> => {
    const validationError = validateAlertRequest(request)
    if (validationError) {
      throw new Error(validationError)
    }

    const response = await apiService.createAlert(request)
    return response
  }

  const updateAlert = async (alertId: string, request: UpdateAlertRequest): Promise<Alert> => {
    const response = await apiService.updateAlert(alertId, request)
    return response
  }

  const deleteAlert = async (alertId: string): Promise<void> => {
    await apiService.deleteAlert(alertId)
  }

  return {
    validateAlertRequest,
    fetchAlerts,
    fetchAlert,
    createAlert,
    updateAlert,
    deleteAlert
  }
}