// API Service with mock data
import type { Video, VideoFilters, CursorResponse, JSONResponse, Narrative, Actor, Entity, Topic, User, Alert, Claim } from '~/types/api';

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
  name: `Topic ${index}`,
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
  async getVideos(filters?: VideoFilters): Promise<CursorResponse<Video>> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

    let videos = Array.from({ length: 50 }, (_, i) => generateMockVideo(i + 1));

    // Apply filters
    if (filters?.platform?.length) {
      videos = videos.filter(v => filters.platform!.includes(v.platform));
    }
    if (filters?.channel?.length) {
      videos = videos.filter(v => v.channel && filters.channel!.includes(v.channel));
    }

    const limit = filters?.limit || 25;
    const startIndex = filters?.cursor ? parseInt(filters.cursor) : 0;
    const paginatedVideos = videos.slice(startIndex, startIndex + limit);

    return {
      data: paginatedVideos,
      cursor: startIndex + limit < videos.length ? String(startIndex + limit) : null
    };
  },

  async getVideo(videoId: string): Promise<JSONResponse<Video | null>> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      data: generateMockVideo(parseInt(videoId.split('-')[1] || '1'))
    };
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

  // Narrative endpoints (not in spec, but needed for UI)
  async getNarratives(filters?: {
    platform?: string[];
    language?: string[];
    dateFrom?: string;
    dateTo?: string;
    actors?: string[];
    entities?: string[];
    topics?: string[];
    keywords?: string[];
  }): Promise<{ data: Narrative[]; total: number }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    let narratives = Array.from({ length: 30 }, (_, i) => generateMockNarrative(i + 1));

    // Apply filters (mock filtering)
    if (filters?.platform?.length) {
      // Mock filter logic
      narratives = narratives.slice(0, Math.floor(narratives.length * 0.8));
    }

    return {
      data: narratives,
      total: narratives.length
    };
  },

  async getNarrative(narrativeId: string): Promise<Narrative> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockNarrative(parseInt(narrativeId.split('-')[1] || '1'));
  },

  async getNarrativeClaims(narrativeId: string): Promise<Claim[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return Array.from({ length: 10 }, (_, i) => generateMockClaim(i + 1, `video-${i + 1}`));
  },

  // Dashboard data
  async getDashboardStats(): Promise<{
    topics: { name: string; count: number }[];
    entities: any[];
    actors: any[];
    viralNarratives: Narrative[];
    prevalentNarratives: Narrative[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock data for dashboard
    return {
      topics: [
        { id: 'topic-1', name: 'Climate Change', count: 234 },
        { id: 'topic-2', name: 'Economy', count: 189 },
        { id: 'topic-3', name: 'Healthcare', count: 156 },
        { id: 'topic-4', name: 'Technology', count: 145 },
        { id: 'topic-5', name: 'Education', count: 98 }
      ],
      entities: [
        {
          id: 'entity-1',
          name: 'United Nations',
          count: 89,
          type: 'institution',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/200px-Flag_of_the_United_Nations.svg.png'
        },
        {
          id: 'entity-2',
          name: 'World Bank',
          count: 67,
          type: 'institution',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/The_World_Bank_logo.svg/200px-The_World_Bank_logo.svg.png'
        },
        {
          id: 'entity-3',
          name: 'WHO',
          count: 56,
          type: 'institution',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/WHO_logo.svg/200px-WHO_logo.svg.png'
        },
        {
          id: 'entity-4',
          name: 'NASA',
          count: 45,
          type: 'institution',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png'
        },
        {
          id: 'entity-5',
          name: 'European Union',
          count: 34,
          type: 'institution',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/200px-Flag_of_Europe.svg.png'
        }
      ],
      actors: [
        {
          id: 'actor-1',
          name: 'Joe Biden',
          count: 156,
          type: 'person',
          role: 'President',
          affiliation: 'United States',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/200px-Joe_Biden_presidential_portrait.jpg'
        },
        {
          id: 'actor-2',
          name: 'Ursula von der Leyen',
          count: 134,
          type: 'person',
          role: 'President',
          affiliation: 'European Commission',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Ursula_von_der_Leyen_2019_%28cropped%29.jpg/200px-Ursula_von_der_Leyen_2019_%28cropped%29.jpg'
        },
        {
          id: 'actor-3',
          name: 'António Guterres',
          count: 98,
          type: 'person',
          role: 'Secretary-General',
          affiliation: 'United Nations',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Ant%C3%B3nio_Guterres_2019_%28cropped%29.jpg/200px-Ant%C3%B3nio_Guterres_2019_%28cropped%29.jpg'
        },
        {
          id: 'actor-4',
          name: 'Christine Lagarde',
          count: 87,
          type: 'person',
          role: 'President',
          affiliation: 'European Central Bank',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Christine_Lagarde_%282020%29.jpg/200px-Christine_Lagarde_%282020%29.jpg'
        },
        {
          id: 'actor-5',
          name: 'Emmanuel Macron',
          count: 76,
          type: 'person',
          role: 'President',
          affiliation: 'France',
          image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Emmanuel_Macron_in_2023.jpg/200px-Emmanuel_Macron_in_2023.jpg'
        }
      ],
      viralNarratives: Array.from({ length: 6 }, (_, i) => generateMockNarrative(i + 1)),
      prevalentNarratives: Array.from({ length: 4 }, (_, i) => generateMockNarrative(i + 10))
    };
  },

  // Auth endpoints (mock)
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication
    if (email && password) {
      return {
        user: {
          id: 'user-1',
          email,
          name: 'Test User',
          role: 'admin',
          created_at: new Date().toISOString()
        },
        token: 'mock-jwt-token'
      };
    }

    throw new Error('Invalid credentials');
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    // Mock logout
  },

  async getCurrentUser(): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if logged in (mock)
    if (typeof localStorage !== 'undefined' && localStorage.getItem('auth-token')) {
      return {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        created_at: new Date().toISOString()
      };
    }

    return null;
  },

  // Alerts endpoints (mock)
  async getAlerts(): Promise<Alert[]> {
    await new Promise(resolve => setTimeout(resolve, 400));

    return Array.from({ length: 5 }, (_, i) => ({
      id: `alert-${i + 1}`,
      name: `Alert ${i + 1}`,
      description: `This alert monitors for specific conditions in narratives`,
      condition: 'views > 100000',
      is_active: Math.random() > 0.3,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }));
  },

  async createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>): Promise<Alert> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      ...alert,
      id: `alert-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const existingAlert = {
      id: alertId,
      name: 'Existing Alert',
      description: 'Description',
      condition: 'views > 50000',
      is_active: true,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      ...existingAlert,
      ...updates,
      updated_at: new Date().toISOString()
    };
  },

  async deleteAlert(alertId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Mock deletion
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
        { id: 'topic-1', name: 'Public Health', frequency: 234 },
        { id: 'topic-2', name: 'Pandemic Response', frequency: 189 }
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
        { id: 'topic-1', name: 'COVID-19', frequency: 456 },
        { id: 'topic-2', name: 'Vaccines', frequency: 234 }
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

    const topic: Topic = {
      id: topicId,
      name: 'Climate Change',
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
  }
};
