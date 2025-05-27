<!-- <script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import AppLayout from "./layouts/AppLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";
import Home from "./Home.vue";
import Navbar from "./components/Navbar.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

onMounted(async () => {
  // Check authentication status
  await authStore.checkAuth();

  // Redirect authenticated users to Dashboard if on Home or an auth route
  if (
    authStore.isAuthenticated &&
    (route.name === "Home" || route.meta.layout === "auth")
  ) {
    router.push({ name: "Dashboard" });
  }
  // Redirect unauthenticated users to Home if not already there
  else if (!authStore.isAuthenticated && route.name !== "Home") {
    router.push({ name: "Home" });
  }
});
</script>

<template>
  <div>
    <Home v-if="route.name === 'Home'" />
    <div v-else>
      <Navbar />
      <AuthLayout v-if="route.meta.layout === 'auth'" />
      <AppLayout v-else />
    </div>
  </div>
</template> -->
<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import AppLayout from "./layouts/AppLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";
import Home from "./Home.vue";
import Navbar from "./components/Navbar.vue";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isLoading = computed(() => authStore.loading);

onMounted(async () => {
  // Check authentication status
  await authStore.checkAuth();

  // Redirect authenticated users to Dashboard if on Home or an auth route
  if (
    authStore.isAuthenticated &&
    (route.name === "Home" || route.meta.layout === "auth")
  ) {
    router.push({ name: "Dashboard" });
  }
  // Redirect unauthenticated users to Home if not already there or on an auth route
  else if (
    !authStore.isAuthenticated &&
    route.name !== "Home" &&
    route.meta.layout !== "auth"
  ) {
    router.push({ name: "Home" });
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Loading state -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Main content -->
    <div v-else>
      <Home v-if="route.name === 'Home'" />
      <div v-else>
        <Navbar />
        <AuthLayout v-if="route.meta.layout === 'auth'" />
        <AppLayout v-else />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth loading transition */
.transition-opacity {
  transition: opacity 0.3s ease-in-out;
}
</style>