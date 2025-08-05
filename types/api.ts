// API Types based on OpenAPI spec

export interface Video {
  id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  title: string;
  description: string;
  platform: string;
  source_url: string;
  destination_path: string;
  uploaded_at?: string | null;
  published_at?: string | null;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  channel?: string | null;
  channel_followers?: number | null;
  scrape_topic?: string | null;
  scrape_keyword?: string | null;
  duration?: number | null;
  language?: string | null;
  topics?: Topic[];
  metadata?: Record<string, any>;
}

export interface VideoFilters {
  platform?: string[] | null;
  channel?: string[] | null;
  metadata?: string | null;
  cursor?: string | null;
  limit?: number;
}

export interface CursorResponse<T> {
  data: T[];
  cursor?: string | null;
}

export interface JSONResponse<T> {
  data: T;
}

// Narrative type based on API spec
export interface Narrative {
  id: string;
  title: string;
  description: string;
  claims?: Claim[];
  topics?: Topic[];
  videos?: Video[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  first_seen?: string;
  last_seen?: string;
  is_active?: boolean;
  related_content_count?: number;
  actors?: Actor[];
  entities?: Entity[];
  views_count?: number;
  comments_count?: number;
  platform_breakdown?: PlatformBreakdown;
  evolution_data?: EvolutionDataPoint[];
}

export interface Actor {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'group';
  frequency: number;
  image_url?: string;
  role?: string; // e.g., "Senator", "CEO", "Minister"
  affiliation?: string; // e.g., "Republican Party", "Company Name"
}

export interface Entity {
  id: string;
  name: string;
  type: 'institution' | 'location' | 'product' | 'event' | 'concept';
  frequency: number;
  image_url?: string;
  description?: string;
}

export interface Topic {
  id: string;
  topic: string;
  frequency: number;
}

export interface TopicWithStats {
  id: string;
  topic: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  narrative_count: number;
  claim_count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}

export interface PlatformBreakdown {
  instagram: number;
  tiktok: number;
  youtube: number;
}

export interface EvolutionDataPoint {
  date: string;
  narrative1_count: number;
  narrative2_count: number;
}

export interface Claim {
  id: string;
  video_id: string;
  video: Video;
  claim: string;
  start_time_s: number;
  embedding?: number[];
  topics?: Topic[];
  created_at?: string;
  updated_at?: string;
  // Legacy fields for compatibility
  text?: string;
  confidence?: number;
  source_video_id?: string;
  timestamp?: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  display_name: string;
  country_codes: string[];
  language: string;
  short_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    user: User;
    organisations: Record<string, {
      organisation: Organization;
      token: string;
      is_organisation_admin: boolean;
    }>;
    first_time_setup: boolean;
  };
}

export interface IdentityResponse {
  user: User;
  organisation: Organization;
  is_organisation_admin: boolean;
}

export interface PasswordUpdateRequest {
  password: string;
}

export interface UserUpdateRequest {
  display_name: string;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  condition: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Video detail response includes video data plus related content
export interface VideoDetailResponse extends Video {
  transcript?: {
    video_id: string;
    sentences: Array<{
      id: string;
      source: string;
      text: string;
      start_time_s: number;
      metadata: Record<string, any>;
    }>;
  };
  claims?: {
    video_id: string;
    claims: Claim[];
  };
  narratives?: Narrative[];
}