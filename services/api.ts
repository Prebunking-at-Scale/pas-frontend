// API Service with mock data
import type { Video, VideoFilters, CursorResponse, JSONResponse, Narrative, Actor, Entity, Topic, User, Alert, Claim, TopicWithStats, PaginatedResponse, VideoDetailResponse } from '~/types/api';
import { useApi } from '~/composables/useApi';

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
  }): Promise<PaginatedResponse<Video>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    
    try {
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
      
      const response = await $fetch('/api/videos', {
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
      const response = await $fetch<JSONResponse<VideoDetailResponse>>(`/api/videos/${videoId}`, {
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
  async getNarratives(params?: {
    limit?: number;
    offset?: number;
    topic_id?: string;
    text?: string;
  }): Promise<PaginatedResponse<Narrative>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    
    try {
      const query: any = {
        limit,
        offset
      };
      
      // Add optional filters
      if (params?.topic_id) {
        query.topic_id = params.topic_id;
      }
      if (params?.text) {
        query.text = params.text;
      }
      
      const response = await $fetch('/api/narratives', {
        method: 'GET',
        query
      });
      
      return response as PaginatedResponse<Narrative>;
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

  async getNarrative(narrativeId: string): Promise<Narrative> {
    try {
      const response = await $fetch(`/api/narratives/${narrativeId}`, {
        method: 'GET'
      });
      
      // Extract narrative from the data wrapper
      const narrative = (response as { data: Narrative }).data;
      
      // Set default values for UI fields if not present
      return {
        ...narrative,
        actors: narrative.actors || [],
        entities: narrative.entities || [],
        topics: narrative.topics || [],
        related_content_count: narrative.claim_ids?.length || 0,
        is_active: true, // Default to active since API doesn't provide this
        first_seen: narrative.created_at || new Date().toISOString(),
        last_seen: narrative.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch narrative:', error);
      throw error;
    }
  },

  async getNarrativeClaims(narrativeId: string): Promise<Claim[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return Array.from({ length: 10 }, (_, i) => generateMockClaim(i + 1, `video-${i + 1}`));
  },

  // Viral narratives with hours parameter
  async getViralNarratives(hours?: number, limit?: number): Promise<Narrative[]> {
    // Get config values if not provided
    const { $config } = useNuxtApp();
    const hoursParam = hours ?? $config.public.viralNarrativesHours ?? 168;
    const limitParam = limit ?? $config.public.viralNarrativesLimit ?? 20;
    try {
      const response = await $fetch('/api/narratives/viral', {
        method: 'GET',
        query: {
          hours: hoursParam,
          limit: limitParam
        }
      });
      
      const data = response as { data: Narrative[] };
      // Order by the sum of views of each video in the narrative
      return data.data.sort((a: Narrative, b: Narrative) => {
        const aViews = a.videos.reduce((sum, video) => sum + video.views, 0);
        const bViews = b.videos.reduce((sum, video) => sum + video.views, 0);
        return bViews - aViews;
      });
    } catch (error) {
      console.error('Failed to fetch viral narratives:', error);
      // Return mock data as fallback
      return Array.from({ length: 6 }, (_, i) => generateMockNarrative(i + 1));
    }
  },

  // Prevalent narratives - narratives with most videos in a time frame
  // Endpoint: GET /api/narratives/prevalent
  // Returns narratives sorted by video count in specified time period
  async getPrevalentNarratives(hours?: number, limit?: number): Promise<Narrative[]> {
    // Get config values if not provided
    const { $config } = useNuxtApp();
    const hoursParam = hours ?? $config.public.prevalentNarrativesHours ?? 168;
    const limitParam = limit ?? $config.public.prevalentNarrativesLimit ?? 10;
    try {
      const response = await $fetch('/api/narratives/prevalent', {
        method: 'GET',
        query: {
          hours: hoursParam,
          limit: limitParam
        }
      });
      
      const data = response as { data: Narrative[] };
      // Order them by the count of videos in the narrative, descending
      return data.data.sort((a: Narrative, b: Narrative) => b.videos.length - a.videos.length);
    } catch (error) {
      console.error('Failed to fetch prevalent narratives:', error);
      // Return mock data as fallback - simulate narratives with many videos
      return Array.from({ length: 4 }, (_, i) => {
        const narrative = generateMockNarrative(i + 10);
        // Add more videos to simulate "prevalent" narratives
        narrative.videos = Array.from({ length: 8 + i * 2 }, (_, j) => generateMockVideo(j + 1));
        return narrative;
      });
    }
  },

  // Dashboard data
  async getDashboardStats(): Promise<{
    topics: TopicWithStats[];
    entities: any[];
    actors: any[];
    viralNarratives: Narrative[];
    prevalentNarratives: Narrative[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Get config values
    const { $config } = useNuxtApp();
    const viralHours = $config.public.viralNarrativesHours || 168;
    const prevalentHours = $config.public.prevalentNarrativesHours || 168;

    // Get real topics data from the API
    let topicsData: TopicWithStats[] = [];
    try {
      const topicsResponse = await this.getTopicsWithStats({ limit: 5 });
      topicsData = topicsResponse.data || [];
    } catch (error) {
      console.error('Failed to fetch topics for dashboard:', error);
      // Use fallback mock data if API fails
      topicsData = [];
    }
    
    return {
      topics: topicsData,
      entities: [],
      actors: [],
      viralNarratives: await this.getViralNarratives(viralHours), 
      prevalentNarratives: await this.getPrevalentNarratives(prevalentHours)
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
  async getEntity(entityId: string): Promise<Entity & {
    narratives: Narrative[];
    videos: Video[];
    related_actors: Actor[];
    related_topics: Topic[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const entity: Entity = {
      id: entityId,
      name: 'World Health Organization',
      type: 'institution',
      frequency: 156,
      image_url: '/api/placeholder/200/200',
      description: 'The World Health Organization is a specialized agency of the United Nations responsible for international public health.'
    };

    return {
      ...entity,
      narratives: Array.from({ length: 5 }, (_, i) => generateMockNarrative(i + 1)),
      videos: Array.from({ length: 10 }, (_, i) => generateMockVideo(i + 1)),
      related_actors: [
        { id: 'actor-1', name: 'Dr. Tedros Adhanom', type: 'person', frequency: 45, role: 'Director-General' },
        { id: 'actor-2', name: 'Maria Van Kerkhove', type: 'person', frequency: 32, role: 'Technical Lead' }
      ],
      related_topics: [
        { id: 'topic-1', topic: 'Public Health', frequency: 234 },
        { id: 'topic-2', topic: 'Pandemic Response', frequency: 189 }
      ]
    };
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
  async getTopicsWithStats(params?: { limit?: number; offset?: number }): Promise<PaginatedResponse<TopicWithStats>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    
    try {
      const response = await $fetch('/api/topics/stats', {
        method: 'GET',
        query: {
          limit,
          offset
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
      const response = await $fetch(`/api/topics/${topicId}/claims`, {
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
      const response = await $fetch(`/api/topics/${topicId}/narratives`, {
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
  }): Promise<PaginatedResponse<Claim>> {
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    
    try {
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
      
      // Add score range if provided
      if (params?.min_score !== undefined) {
        query.min_score = params.min_score;
      }
      if (params?.max_score !== undefined) {
        query.max_score = params.max_score;
      }
      
      const response = await $fetch('/api/claims', {
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
  }
};
