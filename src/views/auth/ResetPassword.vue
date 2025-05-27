<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

const email = ref(authStore.verifiedEmail || '');
const otp = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const passwordError = ref('');

const currentStep = computed(() => {
  if (!email.value) return 1;
  if (!authStore.isVerifiedOtp) return 2;
  return 3;
});
   
const validatePasswords = () => {
  if (password.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters';
    return false;
  }
  passwordError.value = '';
  return true;
};

const verifyOtp = async () => {
  if (!email.value || !otp.value) return;

  loading.value = true;
  await authStore.verifyOtp({
    email: email.value,
    otp: otp.value,
  });
  loading.value = false;
};

const resetPassword = async () => {
  if (!email.value || !otp.value || !password.value || !confirmPassword.value) {
    passwordError.value = 'Please fill in all fields';
    return;
  }

  if (!validatePasswords()) return;

  if (!authStore.isVerifiedOtp) {
    passwordError.value = 'OTP not verified';
    return;
  }

  loading.value = true;
  authStore.error = null; // Clear previous errors
  try {
    const payload = {
      email: email.value,
      otp: otp.value,
      newPassword: password.value, // Map password to newPassword
    };
    await authStore.resetPassword(payload);
  } catch (err) {
    console.error('Reset password error:', err);
    passwordError.value = authStore.error || 'Failed to reset password';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <h2 class="text-center text-2xl font-bold text-gray-700 mb-6">
      Reset your password
    </h2>

    <div v-if="authStore.error || passwordError" class="mb-4 bg-red-50 p-4 rounded-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            {{ authStore.error || passwordError }}
          </h3>
        </div>
      </div>
    </div>

    <!-- Step 1: Enter email -->
    <div v-if="currentStep === 1">
      <p class="text-sm text-gray-500 mb-6">
        Enter your email address to receive a password reset code.
      </p>
      <form
        class="space-y-6"
        @submit.prevent="authStore.forgotPassword({ email: email.value })"
      >
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
          <div class="mt-1">
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            :disabled="loading || !email"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Send OTP Code
          </button>
        </div>
      </form>
    </div>

    <!-- Step 2: Enter OTP -->
    <div v-else-if="currentStep === 2">
      <p class="text-sm text-gray-500 mb-6">
        We've sent a verification code to <strong>{{ email }}</strong>. Please enter the code below to continue.
      </p>
      <form class="space-y-6" @submit.prevent="verifyOtp">
        <div>
          <label for="otp" class="block text-sm font-medium text-gray-700">Verification code</label>
          <div class="mt-1">
            <input
              id="otp"
              v-model="otp"
              name="otp"
              type="text"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <button
            type="submit"
            :disabled="loading || !otp"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Verify Code
          </button>
        </div>
      </form>
      <div class="mt-4 text-center">
        <button
          @click="authStore.forgotPassword({ email: email.value })"
          class="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          Didn't receive a code? Send again
        </button>
      </div>
    </div>

    <!-- Step 3: Enter new password -->
    <div v-else>
      <p class="text-sm text-gray-500 mb-6">
        Your identity has been verified. Please enter a new password for your account.
      </p>
      <form class="space-y-6" @submit.prevent="resetPassword">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">New password</label>
          <div class="mt-1">
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm new password</label>
          <div class="mt-1">
            <input
              id="confirm-password"
              v-model="confirmPassword"
              name="confirm-password"
              type="password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <p v-if="passwordError" class="mt-1 text-sm text-red-600">{{ passwordError }}</p>
        </div>
        <div>
          <button
            type="submit"
            :disabled="loading || !password || !confirmPassword"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Reset Password
          </button>
        </div>
      </form>
    </div>

    <div class="mt-6 text-center">
      <router-link
        to="/login"
        class="text-sm font-medium text-primary-600 hover:text-primary-500"
      >
        Back to login
      </router-link>
    </div>
  </div>
</template>