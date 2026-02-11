import type { Narrative, NarrativeDetail } from '~/types/api';

export interface NarrativeStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

export function calculateNarrativeStats(narrative: Narrative | NarrativeDetail): NarrativeStats {
  // Check if it's NarrativeDetail with pre-calculated values
  if ('total_views' in narrative && typeof narrative.total_views === 'number') {
    return {
      totalViews: narrative.total_views,
      totalLikes: narrative.total_likes,
      totalComments: narrative.total_comments
    };
  }

  // Fallback: calculate from videos array (legacy Narrative type)
  const legacyNarrative = narrative as Narrative;
  if (!legacyNarrative.videos || legacyNarrative.videos.length === 0) {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0
    };
  }

  return {
    totalViews: legacyNarrative.videos.reduce((sum, video) => sum + (video.views || 0), 0),
    totalLikes: legacyNarrative.videos.reduce((sum, video) => sum + (video.likes || 0), 0),
    totalComments: legacyNarrative.videos.reduce((sum, video) => sum + (video.comments || 0), 0)
  };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}