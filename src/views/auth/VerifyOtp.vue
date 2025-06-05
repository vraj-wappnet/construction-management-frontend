<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const otp = ref('');
const loading = ref(false);
const email = ref(route.query.email?.toString() || '');

const verifyOtp = async () => {
  if (!otp.value || !email.value) return;
  
  loading.value = true;
  await authStore.verifyOtp({ email: email.value, otp: otp.value });
  
  if (!authStore.error) {
    router.push({ name: 'reset-password', query: { email: email.value } });
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
  <div class="w-full max-w-md space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900">Verify OTP</h2>
      <p class="mt-2 text-sm text-gray-600">
        We've sent a 6-digit OTP to {{ email }}
      </p>
    </div>

    <div v-if="authStore.error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">{{ authStore.error }}</h3>
        </div>
      </div>
    </div>

    <form class="mt-6 space-y-6" @submit.prevent="verifyOtp">
      <div>
        <label for="otp" class="block text-sm font-medium text-gray-700">OTP Code</label>
        <div class="mt-1">
          <input id="otp"
                 v-model="otp"
                 name="otp"
                 type="text"
                 inputmode="numeric"
                 pattern="[0-9]*"
                 maxlength="6"
                 required
                 class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div>
      </div>

      <div>
        <button type="submit"
                :disabled="loading || !otp || otp.length !== 6"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verify OTP
        </button>
      </div>
    </form>
    
    <div class="mt-6 text-center">
      <router-link 
        :to="{ 
          name: 'forgot-password', 
          query: { email: email } 
        }" 
        class="text-sm font-medium text-primary-600 hover:text-primary-500"
      >
        Resend OTP
      </router-link>
    </div>
  </div>
</template>