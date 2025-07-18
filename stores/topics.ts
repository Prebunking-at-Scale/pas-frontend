import { defineStore } from 'pinia';
import type { TopicWithStats } from '~/types/api';
import { apiService } from '~/services/api';

export const useTopicsStore = defineStore('topics', {
  state: () => ({
    topics: [] as TopicWithStats[],
    loading: false,
    error: null as string | null,
    lastFetch: null as Date | null,
  }),

  getters: {
    getTopicById: (state) => {
      return (id: string) => state.topics.find(topic => topic.id === id);
    },

    getTopicByName: (state) => {
      return (name: string) => state.topics.find(topic => topic.topic === name);
    },

    // Check if we should refetch (cache for 5 minutes)
    shouldRefetch: (state) => {
      if (!state.lastFetch) return true;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return state.lastFetch < fiveMinutesAgo;
    }
  },

  actions: {
    async fetchTopics(force = false) {
      // Don't refetch if we have recent data unless forced
      if (!force && !this.shouldRefetch && this.topics.length > 0) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await apiService.getTopicsWithStats({ limit: 100 });
        this.topics = response.data;
        this.lastFetch = new Date();
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        this.error = 'Failed to load topics';
        // Keep existing data if we have any
        if (this.topics.length === 0) {
          this.topics = [];
        }
      } finally {
        this.loading = false;
      }
    },

    // Get a single topic, fetching if necessary
    async ensureTopicLoaded(topicId: string) {
      const existingTopic = this.getTopicById(topicId);
      
      // If we have the topic and data is fresh, return it
      if (existingTopic && !this.shouldRefetch) {
        return existingTopic;
      }

      // Otherwise fetch all topics
      await this.fetchTopics();
      return this.getTopicById(topicId);
    },

    // Clear the cache
    clearCache() {
      this.topics = [];
      this.lastFetch = null;
      this.error = null;
    }
  }
});