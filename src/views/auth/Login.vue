<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useToastStore } from "../../stores/toast";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const loading = ref(false);

const login = async () => {
  toastStore.clearAll(); // Clear existing toasts to prevent stacking
  if (!email.value || !password.value) {
    toastStore.error("Email and password are required", 5000);
    return;
  }

  loading.value = true;

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    });

    if (!authStore.error) {
      toastStore.success("Login successful!", 7000); // Longer duration for success
      router.push({ name: "Dashboard" });
    } else {
      toastStore.error(authStore.error, 5000);
    }
  } catch (error : any) {
    const errorMessage =
      authStore.error ||
      error.response?.data?.message ||
      "Login failed. Please try again.";
    toastStore.error(errorMessage, 5000);
    console.error("Login error:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="max-w-md mx-auto">
    <h2 class="text-center text-2xl font-bold text-gray-700 mb-6">
      Sign in to your account
    </h2>

    <form class="space-y-6" @submit.prevent="login">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700"
          >Email address</label
        >
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
        <label for="password" class="block text-sm font-medium text-gray-700"
          >Password</label
        >
        <div class="mt-1">
          <input
            id="password"
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm">
          <router-link
            to="/forgot-password"
            class="font-medium text-primary-600 hover:text-primary-500"
            >Forgot your password?</router-link
          >
        </div>
      </div>

      <div>
        <button
          type="submit"
          :disabled="loading || !email || !password"
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
          Sign in
        </button>
      </div>
    </form>

    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500"> Or </span>
        </div>
      </div>

      <div class="mt-6">
        <router-link
          to="/register"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50"
        >
          Create a new account
        </router-link>
      </div>
    </div>
  </div>
</template>