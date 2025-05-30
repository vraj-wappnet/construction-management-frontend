<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const email = ref(route.query.email?.toString() || '');
const successMessage = ref('');

const resetPassword = async () => {
  if (!password.value || password.value !== confirmPassword.value) return;
  
  loading.value = true;
  await authStore.resetPassword({ 
    email: email.value, 
    password: password.value,
    password_confirmation: confirmPassword.value
  });
  
  if (!authStore.error) {
    successMessage.value = 'Your password has been reset successfully!';
    setTimeout(() => {
      router.push({ name: 'login' });
    }, 1500);
  }
  
  loading.value = false;
};

onMounted(() => {
  if (!email.value) {
    router.push({ name: 'forgot-password' });
  }
});
</script>

<template>
  <div>
    <h2 class="text-center text-2xl font-bold text-gray-700 mb-6">Reset Password</h2>
    
    <div v-if="authStore.error" class="mb-4 bg-red-50 p-4 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">{{ authStore.error }}</h3>
        </div>
      </div>
    </div>
    
    <div v-if="successMessage" class="mb-4 bg-green-50 p-4 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800">{{ successMessage }}</p>
        </div>
      </div>
    </div>
    
    <form class="space-y-6" @submit.prevent="resetPassword">
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">New Password</label>
        <div class="mt-1">
          <input id="password"
                 v-model="password"
                 name="password"
                 type="password"
                 required
                 class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div>
      </div>
      
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <div class="mt-1">
          <input id="confirmPassword"
                 v-model="confirmPassword"
                 name="confirmPassword"
                 type="password"
                 required
                 class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div>
        <p v-if="password && confirmPassword && password !== confirmPassword" class="mt-1 text-sm text-red-600">
          Passwords do not match
        </p>
      </div>

      <div>
        <button type="submit"
                :disabled="loading || !password || !confirmPassword || password !== confirmPassword"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Reset Password
        </button>
      </div>
    </form>
  </div>
</template>