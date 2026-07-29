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

export interface NarrativeSummary {
  id: string;
  title: string;
  description?: string;
  claim_count: number;
  video_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  platforms: string[];
  topics?: Topic[];
  language_count?: number;
  entity_count?: number;
  score_count?: number;
  average_score?: number | null;
  created_at?: string;
  updated_at?: string;
  spread_level?: RawNarrativeSpreadLevel | null;
}

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

export interface NarrativePatch {
  title?: string;
  description?: string;
  claim_ids?: string[];
  topic_ids?: string[];
  metadata?: Record<string, any>;
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

export interface WikidataClaim {
  id?: string;
  type?: string;
  label?: string;
  url?: string;
  filename?: string;
  resolution?: number[];
}

export interface WikidataInfo {
  id: string;
  claims: {
    P17?: WikidataClaim[];
    P18?: WikidataClaim[];  // image
    P31?: WikidataClaim[];  // instance of
    P41?: WikidataClaim[];  // flag image
    P6?: WikidataClaim[];   // head of government
    P154?: WikidataClaim[]; // logo image
  };
  labels: {
    en?: {
      value: string;
    };
  };
  descriptions: {
    en?: {
      value: string;
    };
  };
}

export interface EntityMetadata {
  entity_type?: string;
  wikidata_info?: WikidataInfo;
  [key: string]: any;
}

export interface Entity {
  id: string;
  wikidata_id?: string;
  name: string;
  metadata?: EntityMetadata;
  created_at?: string;
  updated_at?: string;
  total_claims?: number;
  total_videos?: number;
  linked_narratives?: number;
  platforms?: string[];
  languages?: string[];
  
  // Legacy fields for compatibility
  type?: 'institution' | 'location' | 'product' | 'event' | 'concept';
  frequency?: number;
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
  is_super_admin: boolean;
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

export interface CreateOrganisationRequest {
  display_name?: string;
  country_codes?: string[];
  language?: string;
  short_name?: string;
}

export interface OrganisationInviteRequest {
  user_email: string;
  as_admin?: boolean;
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
  scope: 'general' | 'specific';
  alert_type: 'narrative_views' | 'narrative_claims_count' | 'narrative_videos_count' | 'narrative_with_topic' | 'keyword';
  narrative_id?: string;
  threshold?: number;
  topic_id?: string;
  keyword?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  organisation_id: string;
  user_id: string;
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

export interface NarrativeFeedback {
  id: string;
  user_id: string;
  narrative_id: string;
  feedback_score: number; // 1 for like, 0 for dislike
  feedback_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface NarrativeFeedbackSummary {
  score_count: number; // number of users who rated the narrative
  average_score: number | null; // average feedback score (null when none exist)
}

export interface ClaimFeedback {
  id: string;
  user_id: string;
  claim_id: string;
  narrative_id: string;
  feedback_score: number; // 1 for like, 0 for dislike
  feedback_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface LanguageListResponse {
  language: string;
  count: number;
}

export interface ChannelFeed {
  id: string;
  organisation_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  channel: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
}

export interface KeywordFeed {
  id: string;
  organisation_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  topic_id: string;
  topic_name: string;
  keywords: string[];
}

export interface MediaFeedsResponse {
  channel_feeds: ChannelFeed[];
  keyword_feeds: KeywordFeed[];
}

export interface CreateChannelFeedRequest {
  channel: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
}

export interface CreateChannelFeedFromUrlRequest {
  url: string;
}

export interface CreateKeywordFeedRequest {
  topic_id: string;
  keywords: string[];
}

export interface UpdateKeywordFeedRequest {
  topic_id: string;
  keywords: string[];
}

// Time series data point from /narratives/{id}/stats
export interface NarrativeStatsDataPoint {
  date: string;
  views: number;
  likes: number;
  comments: number;
  cumulative_views: number;
  cumulative_likes: number;
  cumulative_comments: number;
  video_count: number;
  cumulative_video_count: number;
}

// Stats totals
export interface NarrativeStatsTotals {
  views: number;
  likes: number;
  comments: number;
  video_count: number;
}

// Response from /narratives/{id}/stats
export interface NarrativeStatsResponse {
  narrative_id: string;
  time_series: NarrativeStatsDataPoint[];
  totals: NarrativeStatsTotals;
}

// Full narrative detail with preview + counts
export interface NarrativeDetail {
  id: string;
  title: string;
  description: string;
  topics?: Topic[];
  entities?: Entity[];
  claims: Claim[];           // Preview (first 20)
  claim_count: number;       // Total count
  videos: Video[];           // Preview (first 20)
  video_count: number;       // Total count
  total_views: number;
  total_likes: number;
  total_comments: number;
  platforms: string[];
  language_count: number;
  narrative_context?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  spread_level: RawNarrativeSpreadLevel | null;
}

/**
 * The four regions of the percentile plane (core/config.py, D1 of the redesign).
 *
 * They do NOT tile the plane: a narrative that is small *and* flat gets no badge at
 * all, and no badge is `null` rather than a level. Only narratives the backend could
 * measure on both axes are classifiable, so most narratives carry no level — that is
 * the design, not missing data.
 *
 * `none`, `alert` and `watch` are retired. They survive in the Postgres enum so that a
 * stale query parameter returns an empty result instead of a 400, but the classifier no
 * longer emits them; `normalizeSpreadLevel` maps them to null.
 */
export enum NarrativeSpreadLevel {
  VIRAL='viral',
  EARLY_SURGE='early_surge',
  CONSOLIDATED='consolidated',
  TRENDING='trending'
}

/** What the API may actually put in `spread_level`, retired values included. */
export type RawNarrativeSpreadLevel = NarrativeSpreadLevel | 'none' | 'alert' | 'watch';

export enum AnalysisIndicatorType {
  COMPOSITE_VIRALITY = 'composite_virality',
  ACCELERATION_RATE = 'acceleration_rate',
}

export interface AnalysisIndicator<IndicatorMetadata> {
  id: string;
  indicator_value: number;
  indicator_type: AnalysisIndicatorType;
  calculated_at: string;
  metadata?: IndicatorMetadata;
}

export interface NarrativeAnalysisIndicatorsResponse {
  narrative_id: string;
  composite_virality: AnalysisIndicator<CompositeViralityMetadata>;
  /**
   * Absent when the narrative was not visited on this date, which is the common case:
   * composite ranks every narrative ever measured (~22k), acceleration only those
   * re-measured that day (~2k). Read `null` as "not measured", NEVER as zero — a rate
   * we did not observe is uncomputable, not flat.
   */
  acceleration_rate: AnalysisIndicator<AccelerationRateMetadata> | null;
  date: string;
}


/**
 * `percentile` is the narrative's rank across the run's cohort and is the number the
 * classifier reads. `indicator_value` is a weighted blend of two ranks and is not
 * itself a rank, so anything positional ("top 5%") must use `percentile`.
 */
export interface CompositeViralityMetadata {
  engagement_percentile: number;
  reach_percentile: number;
  engagement_weight: number;
  reach_weight: number;
  percentile?: number | null;
}

export interface AccelerationRateMetadata {
  change_engagement: number;
  change_video_count: number;
  change_views: number;
  engagement_weight: number;
  video_volume_weight: number;
  views_weight: number;
  /** Ranked over the day's visited cohort only — never comparable to the composite one. */
  percentile?: number | null;
  /** How much of the narrative was actually re-measured, i.e. how much weight the rate deserves. */
  refreshed_videos?: number | null;
  mean_gap_days?: number | null;
}
