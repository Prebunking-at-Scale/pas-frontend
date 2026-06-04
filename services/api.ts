// API Service with mock data
import { type Video, type VideoFilters, type CursorResponse, type JSONResponse, type Narrative, type NarrativeSummary, type NarrativeDetail, type NarrativeStatsResponse, type Actor, type Entity, type Topic, type User, type Alert, type Claim, type TopicWithStats, type PaginatedResponse, type VideoDetailResponse, type NarrativePatch, type NarrativeFeedback, type ClaimFeedback, type LanguageListResponse, type MediaFeedsResponse, type ChannelFeed, type KeywordFeed, type CreateChannelFeedRequest, type CreateChannelFeedFromUrlRequest, type CreateKeywordFeedRequest, type UpdateKeywordFeedRequest, type NarrativeAnalysisIndicatorsResponse, type AnalysisIndicator, AnalysisIndicatorType, NarrativeAlertLevel } from '~/types/api';
import { useApi } from '~/composables/useApi';
import { differenceInHours } from 'date-fns';
import type { IntervalResult } from 'date-fns';

// API calls now go through our frontend proxy to hide the API key
// The proxy handles authentication with the backend

// Mock data generators
const generateMockVideo = (index: number): Video => ({
  id: `video-${index}`,
  created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  title: `Video Title ${index}`,
  description: `This is a description for video ${index} discussing various topics and narratives.`,
  platform: ['youtube', 'tiktok', 'instagram'][Math.floor(Math.random() * 3)],
  source_url: `https://example.com/video/${index}`,
  destination_path: `/storage/videos/video-${index}.mp4`,
  uploaded_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  views: Math.floor(Math.random() * 1000000),
  likes: Math.floor(Math.random() * 100000),
  comments: Math.floor(Math.random() * 10000),
  channel: `Channel ${Math.floor(Math.random() * 20)}`,
  channel_followers: Math.floor(Math.random() * 5000000),
  scrape_topic: ['politics', 'health', 'technology', 'economy'][Math.floor(Math.random() * 4)],
  scrape_keyword: `keyword${Math.floor(Math.random() * 10)}`,
  metadata: {
    duration: Math.floor(Math.random() * 600) + 30,
    language: ['en', 'es', 'fr', 'de'][Math.floor(Math.random() * 4)]
  }
});

const mockActors = [
  {
    name: 'Joe Biden',
    type: 'person' as const,
    role: 'President',
    affiliation: 'United States',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/200px-Joe_Biden_presidential_portrait.jpg'
  },
  {
    name: 'Ursula von der Leyen',
    type: 'person' as const,
    role: 'President',
    affiliation: 'European Commission',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Ursula_von_der_Leyen_2019_%28cropped%29.jpg/200px-Ursula_von_der_Leyen_2019_%28cropped%29.jpg'
  },
  {
    name: 'António Guterres',
    type: 'person' as const,
    role: 'Secretary-General',
    affiliation: 'United Nations',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ant%C3%B3nio_Guterres_2019_%28cropped%29.jpg/200px-Ant%C3%B3nio_Guterres_2019_%28cropped%29.jpg'
  }
];

const mockEntities = [
  {
    name: 'United Nations',
    type: 'institution' as const,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/200px-Flag_of_the_United_Nations.svg.png',
    description: 'International organization'
  },
  {
    name: 'World Bank',
    type: 'institution' as const,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/The_World_Bank_logo.svg/200px-The_World_Bank_logo.svg.png',
    description: 'International financial institution'
  },
  {
    name: 'WHO',
    type: 'institution' as const,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/WHO_logo.svg/200px-WHO_logo.svg.png',
    description: 'World Health Organization'
  }
];

const generateMockActor = (index: number): Actor => {
  const mockActor = mockActors[index % mockActors.length];
  return {
    id: `actor-${index}`,
    ...mockActor,
    frequency: Math.floor(Math.random() * 100) + 1
  };
};

const generateMockEntity = (index: number): Entity => {
  const mockEntity = mockEntities[index % mockEntities.length];
  return {
    id: `entity-${index}`,
    ...mockEntity,
    frequency: Math.floor(Math.random() * 80) + 1
  };
};

const generateMockTopic = (index: number): Topic => ({
  id: `topic-${index}`,
  topic: `Topic ${index}`,
  frequency: Math.floor(Math.random() * 120) + 1
});

const generateMockNarrative = (index: number): Narrative => ({
  id: `narrative-${index}`,
  title: `Narrative ${index}: Important Story`,
  description: `This narrative discusses important topics related to current events and social issues. It has been spreading across multiple platforms.`,
  first_seen: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
  last_seen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
  is_active: Math.random() > 0.3,
  related_content_count: Math.floor(Math.random() * 500) + 10,
  actors: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => generateMockActor(i)),
  entities: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, i) => generateMockEntity(i)),
  topics: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => generateMockTopic(i)),
  views_count: Math.floor(Math.random() * 5000000) + 100000,
  comments_count: Math.floor(Math.random() * 50000) + 1000,
  platform_breakdown: {
    instagram: Math.floor(Math.random() * 40),
    tiktok: Math.floor(Math.random() * 40),
    youtube: Math.floor(Math.random() * 40)
  },
  evolution_data: Array.from({ length: 6 }, (_, i) => ({
    date: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    narrative1_count: Math.floor(Math.random() * 200) + 50,
    narrative2_count: Math.floor(Math.random() * 200) + 50
  }))
});

const generateMockClaim = (index: number, videoId: string): Claim => ({
  id: `claim-${index}`,
  text: `This is claim number ${index} extracted from the video content.`,
  confidence: Math.random() * 0.5 + 0.5,
  source_video_id: videoId,
  timestamp: `${Math.floor(Math.random() * 300)}s`
});

// API Service
export const apiService = {
  // Video endpoints
  async getVideos(params?: {
    platform?: string[] | null;
    channel?: string[] | null;
    text?: string;
    limit?: number;
    offset?: number;
    language?: string;
  }): Promise<PaginatedResponse<Video>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();

      const query: any = {
        limit,
        offset
      };

      // Add filters to query if provided
      if (params?.platform?.length) {
        query.platform = params.platform;
      }
      if (params?.channel?.length) {
        query.channel = params.channel;
      }
      if (params?.text) {
        query.text = params.text;
      }
      if (params?.language && params.language !== 'all') {
        query.language = params.language;
      }

      const response = await apiFetch('/api/videos', {
        method: 'GET',
        query
      });

      return response as PaginatedResponse<Video>;
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getVideo(videoId: string): Promise<VideoDetailResponse> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<VideoDetailResponse>>(`/api/videos/${videoId}`, {
        method: 'GET'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch video:', error);
      // For now, return mock data as fallback
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockVideo(parseInt(videoId.split('-')[1] || '1'));
    }
  },

  async createVideo(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<JSONResponse<Video>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: {
        ...video,
        id: `video-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  },

  async updateVideo(videoId: string, updates: Partial<Video>): Promise<JSONResponse<Video>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const existingVideo = generateMockVideo(parseInt(videoId.split('-')[1] || '1'));
    return {
      data: {
        ...existingVideo,
        ...updates,
        updated_at: new Date().toISOString()
      }
    };
  },

  async deleteVideo(videoId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock deletion
  },

  // Narrative endpoints
  // Returns NarrativeSummary with counts instead of full objects for optimized list rendering
  async getNarratives(params?: {
    limit?: number;
    offset?: number;
    topic_id?: string;
    entity_id?: string;
    text?: string;
    language?: string;
    alert_level?: NarrativeAlertLevel[];
    sort?: string;
  }): Promise<PaginatedResponse<NarrativeSummary>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();

      const query: any = {
        limit,
        offset
      };

      // Add optional filters
      if (params?.topic_id) {
        query.topic_id = params.topic_id;
      }
      if (params?.entity_id) {
        query.entity_id = params.entity_id;
      }
      if (params?.text) {
        query.text = params.text;
      }
      // Add language filter if provided
      if (params?.language && params.language !== 'all') {
        query.language = params.language;
      }
      // alert_level is a repeatable query parameter: ?alert_level=viral&alert_level=alert
      if (params?.alert_level && params.alert_level.length > 0) {
        query.alert_level = params.alert_level;
      }
      // sort=composite ranks by latest composite virality score (top first)
      if (params?.sort) {
        query.sort = params.sort;
      }

      const response = await apiFetch('/api/narratives', {
        method: 'GET',
        query
      });

      return response as PaginatedResponse<NarrativeSummary>;
    } catch (error) {
      console.error('Failed to fetch narratives:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getNarrative(narrativeId: string): Promise<NarrativeDetail> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/narratives/${narrativeId}`, {
        method: 'GET'
      });

      // Extract narrative from the data wrapper
      const narrative = (response as { data: NarrativeDetail }).data;

      // Set default values for UI fields if not present
      return {
        ...narrative,
        entities: narrative.entities || [],
        topics: narrative.topics || [],
        claims: narrative.claims || [],
        videos: narrative.videos || [],
        claim_count: narrative.claim_count || 0,
        video_count: narrative.video_count || 0,
        total_views: narrative.total_views || 0,
        total_likes: narrative.total_likes || 0,
        total_comments: narrative.total_comments || 0,
        platforms: narrative.platforms || [],
        language_count: narrative.language_count || 0
      };
    } catch (error) {
      console.error('Failed to fetch narrative:', error);
      throw error;
    }
  },

  async updateNarrative(narrativeId: string, updates: NarrativePatch): Promise<Narrative> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/narratives/${narrativeId}`, {
        method: 'PATCH',
        body: updates
      });

      const narrative = (response as { data: Narrative }).data;
      return narrative;
    } catch (error) {
      console.error('Failed to update narrative:', error);
      throw error;
    }
  },

  async getNarrativeClaims(narrativeId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Claim>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/narratives/${narrativeId}/claims`, {
        method: 'GET',
        query: {
          limit,
          offset
        }
      });

      return response as PaginatedResponse<Claim>;
    } catch (error) {
      console.error('Failed to fetch narrative claims:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getNarrativeVideos(narrativeId: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Video>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/narratives/${narrativeId}/videos`, {
        method: 'GET',
        query: {
          limit,
          offset
        }
      });

      return response as PaginatedResponse<Video>;
    } catch (error) {
      console.error('Failed to fetch narrative videos:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getNarrativeStats(narrativeId: string): Promise<NarrativeStatsResponse> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/narratives/${narrativeId}/stats`, {
        method: 'GET'
      });

      return (response as { data: NarrativeStatsResponse }).data;
    } catch (error) {
      console.error('Failed to fetch narrative stats:', error);
      // Return empty stats on error
      return {
        narrative_id: narrativeId,
        time_series: [],
        totals: {
          views: 0,
          likes: 0,
          comments: 0,
          video_count: 0
        }
      };
    }
  },

  // Viral narratives with hours parameter - uses summary endpoint optimized for dashboard display
  async getViralNarratives(hours: number | null, limit?: number): Promise<NarrativeSummary[]> {
    const { $config } = useNuxtApp();
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch('/api/narratives/viral/summary', {
        method: 'GET',
        query: {
          hours: hours ?? undefined,
          limit: limit || $config.public.viralNarrativesLimit
        }
      });

      const data = response as { data: NarrativeSummary[] };
      // Already sorted by views from the API
      return data.data;
    } catch (error) {
      console.error('Failed to fetch viral narratives:', error);
      return [];
    }
  },

  // Prevalent narratives - narratives with most videos in a time frame
  // Endpoint: GET /api/narratives/prevalent/summary
  // Returns narrative summaries sorted by video count in specified time period
  async getPrevalentNarratives(hours: number | null, limit?: number): Promise<NarrativeSummary[]> {
    const { $config } = useNuxtApp();
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch('/api/narratives/prevalent/summary', {
        method: 'GET',
        query: {
          hours: hours ?? undefined,
          limit: limit || $config.public.prevalentNarrativesLimit
        }
      });

      const data = response as { data: NarrativeSummary[] };
      // Already sorted by video count from the API
      return data.data;
    } catch (error) {
      console.error('Failed to fetch prevalent narratives:', error);
      return [];
    }
  },

  async deleteNarrative(narrativeId: string): Promise<void> {
    try {
      const { apiFetch } = useApi();
      await apiFetch(`/api/narratives/${narrativeId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete narrative:', error);
      throw error;
    }
  },

  // Dashboard data
  async getDashboardStats(
    timeframeInterval: IntervalResult<Date, Date, undefined> | null // null = all time, no date filter
  ): Promise<{
    topics: TopicWithStats[];
    entities: Entity[];
    actors: any[];
    viralNarratives: NarrativeSummary[];
    prevalentNarratives: NarrativeSummary[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const hours = timeframeInterval ? differenceInHours(timeframeInterval.end, timeframeInterval.start) : null;

    // Get real topics data from the API
    let topicsData: TopicWithStats[] = [];
    try {
      const topicsResponse = await this.getTopicsWithStats({ limit: 5, startDate: timeframeInterval?.start, endDate: timeframeInterval?.end });
      topicsData = topicsResponse.data || [];
    } catch (error) {
      console.error('Failed to fetch topics for dashboard:', error);
      // Use fallback mock data if API fails
      topicsData = [];
    }

    // Get entities data from the API
    let entitiesData: Entity[] = [];
    try {
      const entitiesResponse = await this.getEntities({ limit: 10, hours });
      entitiesData = entitiesResponse.data || [];
    } catch (error) {
      console.error('Failed to fetch entities for dashboard:', error);
      // Use fallback empty data if API fails
      entitiesData = [];
    }

    return {
      topics: topicsData,
      entities: entitiesData,
      actors: [],
      viralNarratives: await this.getViralNarratives(hours),
      prevalentNarratives: await this.getPrevalentNarratives(hours)
    };
  },


  // Alerts endpoints - using authenticated fetch
  async getAlerts(params?: {
    enabled_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Alert[]; total: number; limit: number; offset: number }> {
    try {
      // Import useApi inside the function to get proper context
      const { apiFetch } = useApi();
      
      const query: any = {
        limit: params?.limit || 100,
        offset: params?.offset || 0
      };
      
      if (params?.enabled_only) {
        query.enabled_only = true;
      }
      
      const response = await apiFetch('/api/alerts', {
        method: 'GET',
        query
      }) as { data: Alert[]; total: number; page: number; size: number };
      
      // Transform the API response to match our expected format
      return {
        items: response.data || [],
        total: response.total || 0,
        limit: response.size || (params?.limit || 100),
        offset: params?.offset || 0
      };
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      // Return empty response on error
      return {
        items: [],
        total: 0,
        limit: params?.limit || 100,
        offset: params?.offset || 0
      };
    }
  },

  async getAlert(alertId: string): Promise<Alert> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/alerts/${alertId}`, {
        method: 'GET'
      });
      
      return response as Alert;
    } catch (error) {
      console.error('Failed to fetch alert:', error);
      throw error;
    }
  },

  async createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'organisation_id' | 'user_id'>): Promise<Alert> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch('/api/alerts', {
        method: 'POST',
        body: alert
      });
      
      return response as Alert;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  },

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        body: updates
      });
      
      return response as Alert;
    } catch (error) {
      console.error('Failed to update alert:', error);
      throw error;
    }
  },

  async deleteAlert(alertId: string): Promise<void> {
    try {
      const { apiFetch } = useApi();
      await apiFetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  },

  // Entity endpoints
  async getEntities(params?: {
    limit?: number;
    offset?: number;
    text?: string;
    hours?: number | null;
    language?: string;
    narratives_min?: number;
    narratives_max?: number;
  }): Promise<PaginatedResponse<Entity>> {
    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();

      const query: any = {
        limit,
        offset
      };

      // Add text filter if provided
      if (params?.text) {
        query.text = params.text;
      }

      // Add hours filter if provided
      if (params?.hours) {
        query.hours = params.hours;
      }

      if (params?.language && params.language !== 'all') {
        query.language = params.language;
      }

      if (typeof params?.narratives_min === 'number') {
        query.narratives_min = params.narratives_min;
      }

      if (typeof params?.narratives_max === 'number') {
        query.narratives_max = params.narratives_max;
      }

      const response = await apiFetch('/api/entities', {
        method: 'GET',
        query
      });

      return response as PaginatedResponse<Entity>;
    } catch (error) {
      console.error('Failed to fetch entities:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getEntity(entityId: string): Promise<Entity> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/entities/${entityId}`, {
        method: 'GET'
      });

      // The API wraps the entity in a data property
      return (response as { data: Entity }).data;
    } catch (error) {
      console.error('Failed to fetch entity:', error);
      throw error;
    }
  },

  async getEntityNarratives(entityId: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Narrative>> {
    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/entities/${entityId}/narratives`, {
        method: 'GET',
        query: {
          limit,
          offset
        }
      });

      return response as PaginatedResponse<Narrative>;
    } catch (error) {
      console.error('Failed to fetch entity narratives:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  // Actor endpoints
  async getActor(actorId: string): Promise<Actor & {
    narratives: Narrative[];
    videos: Video[];
    related_entities: Entity[];
    related_topics: Topic[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const actor: Actor = {
      id: actorId,
      name: 'Joe Biden',
      type: 'person',
      frequency: 234,
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/200px-Joe_Biden_presidential_portrait.jpg',
      role: 'President',
      affiliation: 'United States'
    };

    return {
      ...actor,
      narratives: Array.from({ length: 8 }, (_, i) => generateMockNarrative(i + 1)),
      videos: Array.from({ length: 15 }, (_, i) => generateMockVideo(i + 1)),
      related_entities: [
        { id: 'entity-1', name: 'NIH', type: 'institution', frequency: 89, description: 'National Institutes of Health' },
        { id: 'entity-2', name: 'CDC', type: 'institution', frequency: 76, description: 'Centers for Disease Control' }
      ],
      related_topics: [
        { id: 'topic-1', topic: 'COVID-19', frequency: 456 },
        { id: 'topic-2', topic: 'Vaccines', frequency: 234 }
      ]
    };
  },

  // Topic endpoints
  async getTopic(topicId: string): Promise<Topic & {
    narratives: Narrative[];
    videos: Video[];
    related_actors: Actor[];
    related_entities: Entity[];
    trend_data: { date: string; count: number }[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // For now, return mock data with generic name
    // The actual topic name will come from the topics store
    const topic: Topic = {
      id: topicId,
      topic: 'Topic',
      frequency: 1234
    };

    return {
      ...topic,
      narratives: Array.from({ length: 12 }, (_, i) => generateMockNarrative(i + 1)),
      videos: Array.from({ length: 20 }, (_, i) => generateMockVideo(i + 1)),
      related_actors: [
        { id: 'actor-1', name: 'Greta Thunberg', type: 'person', frequency: 156, role: 'Activist' },
        { id: 'actor-2', name: 'UN Climate Action', type: 'organization', frequency: 98 }
      ],
      related_entities: [
        { id: 'entity-1', name: 'Paris Agreement', type: 'event', frequency: 234 },
        { id: 'entity-2', name: 'IPCC', type: 'institution', frequency: 189 }
      ],
      trend_data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
        count: Math.floor(Math.random() * 100) + 50
      }))
    };
  },

  // New topic methods based on API spec
  async getTopicsWithStats(params?: { startDate?: Date, endDate?: Date, limit?: number; offset?: number }): Promise<PaginatedResponse<TopicWithStats>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    const startDateStr = params?.startDate ? params.startDate.toISOString() : undefined;
    const endDateStr = params?.endDate ? params.endDate.toISOString() : undefined;

    try {
      const { apiFetch } = useApi();
      const response = await apiFetch('/api/topics/stats', {
        method: 'GET',
        query: {
          limit,
          offset,
          start_date: startDateStr,
          end_date: endDateStr
        }
      });

      // The API returns the response directly as a PaginatedResponse
      return response as PaginatedResponse<TopicWithStats>;
    } catch (error) {
      console.error('Failed to fetch topics with stats:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getTopicClaims(topicId: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Claim>> {
    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/topics/${topicId}/claims`, {
        method: 'GET',
        query: {
          limit,
          offset
        }
      });

      return response as PaginatedResponse<Claim>;
    } catch (error) {
      console.error('Failed to fetch topic claims:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getTopicNarratives(topicId: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Narrative>> {
    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();
      const response = await apiFetch(`/api/topics/${topicId}/narratives`, {
        method: 'GET',
        query: {
          limit,
          offset
        }
      });

      return response as PaginatedResponse<Narrative>;
    } catch (error) {
      console.error('Failed to fetch topic narratives:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  // Claims endpoints
  async getClaims(params?: {
    topic_id?: string;
    text?: string;
    min_score?: number;
    max_score?: number;
    limit?: number;
    offset?: number;
    language?: string | null;
  }): Promise<PaginatedResponse<Claim>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    try {
      const { apiFetch } = useApi();

      const query: any = {
        limit,
        offset
      };

      // Add topic filter if provided
      if (params?.topic_id) {
        query.topic_id = params.topic_id;
      }

      // Add text search if provided
      if (params?.text) {
        query.text = params.text;
      }
      // Add language filter if provided
      if (params?.language && params.language !== 'all') {
        query.language = params.language;
      }

      // Add score range if provided
      if (params?.min_score !== undefined) {
        query.min_score = params.min_score;
      }
      if (params?.max_score !== undefined) {
        query.max_score = params.max_score;
      }

      const response = await apiFetch('/api/claims', {
        method: 'GET',
        query
      });

      return response as PaginatedResponse<Claim>;
    } catch (error) {
      console.error('Failed to fetch claims:', error);
      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: 1,
        size: limit
      };
    }
  },

  async getLanguages(): Promise<string[]> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<LanguageListResponse[]>>('/api/languages', {
        method: 'GET'
      });

      console.dir(response.data, { depth: null });
      return (response.data || [])?.map(item => item.language) || [];
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      return ['en', 'es', 'fr', 'de'];
    }
  },

  async getMediaFeeds(): Promise<MediaFeedsResponse> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<MediaFeedsResponse>>('/api/media_feeds', {
        method: 'GET'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch media feeds:', error);
      return {
        channel_feeds: [],
        keyword_feeds: []
      };
    }
  },

  async createChannelFeed(data: CreateChannelFeedRequest): Promise<ChannelFeed> {
    const { apiFetch } = useApi();
    const response = await apiFetch<JSONResponse<ChannelFeed>>('/api/media_feeds/channels', {
      method: 'POST',
      body: data
    });
    return response.data;
  },

  async createChannelFeedFromUrl(data: CreateChannelFeedFromUrlRequest): Promise<ChannelFeed> {
    const { apiFetch } = useApi();
    const response = await apiFetch<JSONResponse<ChannelFeed>>('/api/media_feeds/channels/from-url', {
      method: 'POST',
      body: data
    });
    return response.data;
  },

  async createKeywordFeed(data: CreateKeywordFeedRequest): Promise<KeywordFeed> {
    const { apiFetch } = useApi();
    const response = await apiFetch<JSONResponse<KeywordFeed>>('/api/media_feeds/keywords', {
      method: 'POST',
      body: data
    });
    return response.data;
  },

  async updateKeywordFeed(feedId: string, data: UpdateKeywordFeedRequest): Promise<KeywordFeed> {
    const { apiFetch } = useApi();
    const response = await apiFetch<JSONResponse<KeywordFeed>>(`/api/media_feeds/keywords/${feedId}`, {
      method: 'PATCH',
      body: data
    });
    return response.data;
  },

  async archiveKeywordFeed(feedId: string): Promise<void> {
    const { apiFetch } = useApi();
    await apiFetch(`/api/media_feeds/keywords/${feedId}`, {
      method: 'DELETE'
    });
  },

  async getNarrativeFeedback(narrativeId: string): Promise<NarrativeFeedback|null> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<NarrativeFeedback|null>>(`/api/feedback/narratives/${narrativeId}`, {
        method: 'GET'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch narrative feedback:', error);
      // Return empty response on error
      return null;
    }
  },

  async sendNarrativeFeedback(narrativeId: string, feedbackScore: number) {
    try {
      const { apiFetch } = useApi();

      return await apiFetch(`/api/feedback/narratives/${narrativeId}`, {
        method: 'POST',
        body: { feedback_score: feedbackScore }
      });
    } catch (error) {
      console.error('Failed to send narrative feedback:', error);
      throw error;
    }
  },

  async getClaimFeedback(claimId: string, narrativeId: string): Promise<ClaimFeedback | null> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<ClaimFeedback | null>>(`/api/feedback/claims/${claimId}/narratives/${narrativeId}`, {
        method: 'GET'
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch claim feedback:', error);
      // Return empty response on error
      return null;
    }
  },

  async sendClaimFeedback(claimId: string, narrativeId: string, feedbackScore: number) {
    try {
      const { apiFetch } = useApi();
      return await apiFetch(`/api/feedback/claims/${claimId}/narratives/${narrativeId}`, {
        method: 'POST',
        body: { feedback_score: feedbackScore }
      });
    } catch (error) {
      console.error('Failed to send claim feedback:', error);
      throw error;
    }
  },

  async getNarrativeAnalysisIndicatorsHistory(
    narrativeId: string,
    days = 7,
  ): Promise<NarrativeAnalysisIndicatorsResponse[]> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<NarrativeAnalysisIndicatorsResponse[]>>(
        `/api/narratives/${narrativeId}/indicators/history`,
        { method: 'GET', query: { days } },
      );
      return response.data ?? [];
    } catch (error) {
      console.error('Failed to fetch narrative analysis indicators history:', error);
      return [];
    }
  },

  async getNarrativeAnalysisIndicators(
    narrativeId: string,
    date?: string,
  ): Promise<NarrativeAnalysisIndicatorsResponse | null> {
    try {
      const { apiFetch } = useApi();
      const response = await apiFetch<JSONResponse<NarrativeAnalysisIndicatorsResponse>>(
        `/api/narratives/${narrativeId}/indicators`,
        {
          method: 'GET',
          query: date ? { date } : undefined,
        },
      );

      return response.data;
    } catch (error) {
      // 404 just means there are no indicators for that day yet — common when
      // walking back several days for the trend sparkline. Don't pollute the
      // console with one error per missing day.
      const status = (error as { statusCode?: number; status?: number })?.statusCode
        ?? (error as { statusCode?: number; status?: number })?.status;
      if (status !== 404) {
        console.error('Failed to fetch narrative analysis indicators:', error);
      }
      return null;
    }
  }

};
