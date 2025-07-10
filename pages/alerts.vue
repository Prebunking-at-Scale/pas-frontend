<template>
  <div>
      <div class="flex justify-between items-center mb-6">
        <button 
          @click="showCreateModal = true"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          {{ $t('alerts.createNew') }}
        </button>
      </div>

      <!-- Alerts List -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200">
          <li v-for="alert in alerts" :key="alert.id" class="px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">{{ alert.name }}</h3>
                <p class="text-sm text-gray-500">{{ alert.description }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ $t('alerts.condition') }}: <code>{{ alert.condition }}</code>
                </p>
              </div>
              <div class="flex items-center space-x-4">
                <div class="flex items-center">
                  <span class="text-sm text-gray-500 mr-2">{{ $t('alerts.status') }}:</span>
                  <span 
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      alert.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ alert.is_active ? $t('common.active') : $t('common.inactive') }}
                  </span>
                </div>
                <button 
                  @click="toggleAlert(alert)"
                  class="text-indigo-600 hover:text-indigo-900"
                >
                  {{ alert.is_active ? $t('common.disable') : $t('common.enable') }}
                </button>
                <button 
                  @click="deleteAlert(alert.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  {{ $t('common.delete') }}
                </button>
              </div>
            </div>
          </li>
        </ul>
        <div v-if="alerts.length === 0" class="px-6 py-12 text-center">
          <p class="text-gray-500">{{ $t('alerts.noAlerts') }}</p>
        </div>
      </div>

      <!-- Create Alert Modal (Mock) -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('alerts.createNew') }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('alerts.name') }}</label>
              <input 
                v-model="newAlert.name"
                type="text" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('alerts.description') }}</label>
              <textarea 
                v-model="newAlert.description"
                rows="3" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('alerts.condition') }}</label>
              <input 
                v-model="newAlert.condition"
                type="text" 
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                placeholder="e.g., views > 100000"
              >
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button 
              @click="showCreateModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {{ $t('common.cancel') }}
            </button>
            <button 
              @click="createAlert"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {{ $t('common.create') }}
            </button>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { apiService } from '~/services/api';
import type { Alert } from '~/types/api';

definePageMeta({
  layout: 'default',
  middleware: 'auth'
});

const { $i18n } = useNuxtApp();
const router = useRouter();


// State
const alerts = ref<Alert[]>([]);
const showCreateModal = ref(false);
const newAlert = ref({
  name: '',
  description: '',
  condition: '',
  is_active: true
});

// Load alerts
const loadAlerts = async () => {
  try {
    alerts.value = await apiService.getAlerts();
  } catch (error) {
    console.error('Failed to load alerts:', error);
  }
};

// Alert operations
const createAlert = async () => {
  try {
    const created = await apiService.createAlert(newAlert.value);
    alerts.value.push(created);
    showCreateModal.value = false;
    newAlert.value = {
      name: '',
      description: '',
      condition: '',
      is_active: true
    };
  } catch (error) {
    console.error('Failed to create alert:', error);
  }
};

const toggleAlert = async (alert: Alert) => {
  try {
    const updated = await apiService.updateAlert(alert.id, { is_active: !alert.is_active });
    const index = alerts.value.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      alerts.value[index] = updated;
    }
  } catch (error) {
    console.error('Failed to toggle alert:', error);
  }
};

const deleteAlert = async (alertId: string) => {
  if (confirm($i18n.t('alerts.confirmDelete'))) {
    try {
      await apiService.deleteAlert(alertId);
      alerts.value = alerts.value.filter(a => a.id !== alertId);
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  }
};

// Load data on mount
onMounted(() => {
  loadAlerts();
});
</script>