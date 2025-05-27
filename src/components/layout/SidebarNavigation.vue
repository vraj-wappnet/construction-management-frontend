```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";

defineProps<{
  isOpen?: boolean; // Optional prop for external control
}>();

const emit = defineEmits<{
  (e: "closeSidebar"): void;
  (e: "openSidebar"): void;
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Reactive state for sidebar visibility
const isSidebarOpen = ref<boolean>(true); // Default to open on desktop
const isMobile = ref<boolean>(window.innerWidth < 768); // Detect mobile on mount

// Update isMobile on window resize
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) {
    isSidebarOpen.value = true; // Auto-open on desktop
  } else {
    isSidebarOpen.value = false; // Auto-close on mobile
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Toggle sidebar visibility
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
  if (isSidebarOpen.value) {
    emit("openSidebar");
  } else {
    emit("closeSidebar");
  }
};

const userRole = computed(() => authStore.userRole);

const navigationItems = computed(() => {
  const items = [
    {
      name: "Dashboard",
      path: "/",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      name: "Projects",
      path: "/projects",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
  ];

  if (["admin", "contractor", "site_engineer"].includes(userRole.value)) {
    items.push({
      name: "Vendors",
      path: "/vendors",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    });
  }

  if (userRole.value === "admin") {
    items.push({
      name: "Users",
      path: "/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    });
  }

  return items;
});

const logout = () => {
  authStore.logout();
  isSidebarOpen.value = false;
  emit("closeSidebar");
  router.push({ name: "Home" });
};
</script>

<template>
  <!-- Mobile Sidebar -->
  <div
    v-if="isMobile && isSidebarOpen"
    class="fixed inset-x-0 top-16 bottom-0 z-40 transition-transform duration-300"
    :class="{ 'translate-x-0': isSidebarOpen, '-translate-x-full': !isSidebarOpen }"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-gray-900 bg-opacity-75"
      @click="toggleSidebar"
    ></div>

    <div class="relative flex-1 flex flex-col max-w-xs w-full bg-blue-800">
      <div class="flex flex-col h-0 flex-1">
        <!-- Toggle Button for Mobile -->
        <div class="p-4">
          <button
            class="p-2 rounded-lg bg-blue-900 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200 w-10"
            @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
          >
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="isSidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
              />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <nav class="px-2 py-4 space-y-1">
            <router-link
              v-for="item in navigationItems"
              :key="item.name"
              :to="item.path"
              class="group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-all duration-200"
              :class="[
                route.path === item.path || route.path.startsWith(item.path + '/')
                  ? 'bg-blue-900 text-yellow-400'
                  : 'text-white hover:bg-blue-700 hover:text-yellow-400',
              ]"
              @click="toggleSidebar"
            >
              <svg
                class="mr-4 h-6 w-6 flex-shrink-0"
                :class="[
                  route.path === item.path || route.path.startsWith(item.path + '/')
                    ? 'text-yellow-400'
                    : 'text-blue-300 group-hover:text-yellow-400',
                ]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="item.icon"
                />
              </svg>
              {{ item.name }}
            </router-link>
          </nav>
        </div>
      </div>

      <div class="flex-shrink-0 flex border-t border-blue-900 p-4">
        <div class="flex items-center w-full">
          <div
            class="bg-blue-900 rounded-full h-10 w-10 flex items-center justify-center text-yellow-400 font-semibold text-lg"
          >
            {{ authStore.user?.firstName?.charAt(0).toUpperCase() }}
          </div>
          <div class="ml-3 flex-1">
            <p class="text-base font-medium text-white truncate">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </p>
            <div class="flex space-x-4">
              <router-link
                to="/profile"
                class="text-sm font-medium text-blue-200 hover:text-yellow-400 transition-colors duration-200"
                @click="toggleSidebar"
              >
                Profile
              </router-link>
              <button
                @click="logout"
                class="text-sm font-medium text-blue-200 hover:text-red-400 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop Sidebar -->
  <div
    class="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:pt-16 transition-all duration-300"
    :class="isSidebarOpen ? 'md:w-72' : 'md:w-16'"
  >
    <div class="flex-1 flex flex-col min-h-0 bg-blue-800">
      <div class="flex flex-col flex-1">
        <!-- Toggle Button for Desktop -->
        <div class="p-4">
          <button
            class="p-2 rounded-lg bg-blue-900 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-colors duration-200"
            :class="isSidebarOpen ? 'w-10' : 'w-full'"
            @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
          >
            <svg
              class="h-6 w-6 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="isSidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'"
              />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <nav class="flex-1 px-2 py-4 space-y-1">
            <router-link
              v-for="item in navigationItems"
              :key="item.name"
              :to="item.path"
              class="group flex items-center px-3 py-2 rounded-lg transition-all duration-200 relative"
              :class="[
                route.path === item.path || route.path.startsWith(item.path + '/')
                  ? 'bg-blue-900 text-yellow-400'
                  : 'text-white hover:bg-blue-700 hover:text-yellow-400',
                isSidebarOpen ? 'text-sm font-medium' : 'justify-center',
              ]"
            >
              <svg
                class="h-6 w-6 flex-shrink-0"
                :class="[
                  route.path === item.path || route.path.startsWith(item.path + '/')
                    ? 'text-yellow-400'
                    : 'text-blue-300 group-hover:text-yellow-400',
                  isSidebarOpen ? 'mr-3' : 'mx-auto',
                ]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="item.icon"
                />
              </svg>
              <span v-if="isSidebarOpen" class="truncate">{{ item.name }}</span>
              <!-- Tooltip for collapsed state -->
              <span
                v-if="!isSidebarOpen"
                class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50"
              >
                {{ item.name }}
              </span>
            </router-link>
          </nav>
        </div>
      </div>

      <div class="flex-shrink-0 flex border-t border-blue-900 p-4">
        <div class="flex items-center w-full">
          <div
            class="bg-blue-900 rounded-full h-10 w-10 flex items-center justify-center text-yellow-400 font-semibold text-lg"
          >
            {{ authStore.user?.firstName?.charAt(0).toUpperCase() }}
          </div>
          <div v-if="isSidebarOpen" class="ml-3 flex-1">
            <p class="text-sm font-medium text-white truncate">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </p>
            <div class="flex space-x-4">
              <router-link
                to="/profile"
                class="text-xs font-medium text-blue-200 hover:text-yellow-400 transition-colors duration-200"
              >
                Profile
              </router-link>
              <button
                @click="logout"
                class="text-xs font-medium text-blue-200 hover:text-red-400 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>