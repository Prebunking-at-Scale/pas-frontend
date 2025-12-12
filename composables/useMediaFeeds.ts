import type { ChannelFeed, KeywordFeed, MediaFeedsResponse } from '~/types/api'
import { apiService } from '~/services/api'

export const useMediaFeeds = () => {

  const fetchMediaFeeds = async (): Promise<MediaFeedsResponse> => {
    const response = await apiService.getMediaFeeds()
    return response
  }

  return {
    fetchMediaFeeds
  }
}
