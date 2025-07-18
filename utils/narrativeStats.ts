import type { Narrative } from '~/types/api';

export interface NarrativeStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

export function calculateNarrativeStats(narrative: Narrative): NarrativeStats {
  if (!narrative.videos || narrative.videos.length === 0) {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0
    };
  }

  return {
    totalViews: narrative.videos.reduce((sum, video) => sum + (video.views || video.views_count || 0), 0),
    totalLikes: narrative.videos.reduce((sum, video) => sum + (video.likes || video.likes_count || 0), 0),
    totalComments: narrative.videos.reduce((sum, video) => sum + (video.comments || video.comments_count || 0), 0)
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