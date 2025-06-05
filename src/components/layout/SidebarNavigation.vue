<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const props = defineProps<{
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: "closeSidebar"): void;
  (e: "openSidebar"): void;
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const isSidebarOpen = ref<boolean>(false);
const isMobile = ref<boolean>(window.innerWidth < 768);

watch(() => props.isOpen, (newVal) => {
  if (newVal !== undefined) {
    isSidebarOpen.value = newVal;
  }
});

const handleResize = () => {
  const wasMobile = isMobile.value;
  isMobile.value = window.innerWidth < 768;
  if (wasMobile !== isMobile.value) {
    if (isMobile.value) {
      isSidebarOpen.value = false;
      emit("closeSidebar");
    } else {
      isSidebarOpen.value = true;
      emit("openSidebar");
    }
  }
};

onMounted(() => {
  isMobile.value = window.innerWidth < 768;
  isSidebarOpen.value = !isMobile.value;
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

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
      path: "/dashboard",
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
  <div>
    <!-- Mobile Sidebar -->
    <div
      v-if="isMobile"
      class="fixed inset-x-0 top-16 bottom-0 z-50 transition-all duration-300 ease-out"
      :class="{'translate-x-0': isSidebarOpen, '-translate-x-full': !isSidebarOpen}"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        @click="toggleSidebar"
      ></div>

      <div class="relative flex-1 flex flex-col max-w-sm w-full bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl">
        <div class="flex flex-col h-0 flex-1">
          <div class="p-6 border-b border-white/10">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <span class="text-white font-semibold text-lg">Menu</span>
              </div>
              <button
                class="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 backdrop-blur-sm"
                @click="toggleSidebar"
                :aria-label="isSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
            <nav class="space-y-2">
              <router-link
                v-for="(item, index) in navigationItems"
                :key="item.name"
                :to="item.path"
                class="group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 relative overflow-hidden"
                :class="[
                  route.path === item.path || route.path.startsWith(item.path + '/')
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20',
                ]"
                :style="{ 'animation-delay': `${index * 50}ms` }"
                @click="toggleSidebar"
              >
                <div
                  v-if="route.path === item.path || route.path.startsWith(item.path + '/')"
                  class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"
                ></div>
                <svg
                  class="mr-4 h-6 w-6 flex-shrink-0 transition-all duration-300"
                  :class="[
                    route.path === item.path || route.path.startsWith(item.path + '/')
                      ? 'text-blue-300'
                      : 'text-gray-400 group-hover:text-white group-hover:scale-110',
                  ]"
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
                <span class="transition-all duration-300">{{ item.name }}</span>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </router-link>
            </nav>
          </div>
        </div>

        <!-- Mobile User Section -->
        <div class="flex-shrink-0 border-t border-white/10 p-6 bg-gradient-to-r from-slate-900/50 to-blue-900/50">
          <div class="flex items-center w-full">
            <div class="relative">
              <img
                v-if="authStore.user?.profilePicture"
                :src="authStore.user.profilePicture"
                alt="Profile Picture"
                class="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <div
                v-else
                class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-12 w-12 flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 hover:scale-105"
              >
                {{ authStore.user?.firstName?.charAt(0).toUpperCase() }}
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            <div class="ml-4 flex-1">
              <p class="text-base font-semibold text-white truncate">
                {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
              </p>
              <div class="flex space-x-4 mt-1">
                <router-link
                  to="/profile"
                  class="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200"
                  @click="toggleSidebar"
                >
                  Profile
                </router-link>
                <button
                  @click="logout"
                  class="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200"
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
      class="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:pt-16 transition-all duration-500 ease-in-out z-40"
      :class="isSidebarOpen ? 'md:w-80' : 'md:w-20'"
    >
      <div class="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl">
        <div class="flex flex-col flex-1">
          <div class="p-6 border-b border-white/10">
            <div class="flex items-center justify-between">
              <div v-if="isSidebarOpen" class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-white font-bold text-xl">Management Panel</h2>
                </div>
              </div>
              <button
                class="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 backdrop-blur-sm hover:scale-105"
                :class="isSidebarOpen ? '' : 'mx-auto'"
                @click="toggleSidebar"
                :aria-label="isSidebarOpen ? 'Close sidebar' : 'Open sidebar'"
              >
                <svg
                  class="h-6 w-6 transition-transform duration-300"
                  :class="{ 'rotate-180': isSidebarOpen }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
            <nav class="flex-1 space-y-2">
              <router-link
                v-for="(item, index) in navigationItems"
                :key="item.name"
                :to="item.path"
                class="group flex items-center px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden"
                :class="[
                  route.path === item.path || route.path.startsWith(item.path + '/')
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-400/30 shadow-lg shadow-blue-500/10'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20',
                  isSidebarOpen ? 'text-base font-medium justify-start' : 'justify-center w-14 h-14',
                ]"
                :style="{ 'animation-delay': `${index * 50}ms` }"
              >
                <div
                  v-if="route.path === item.path || route.path.startsWith(item.path + '/')"
                  class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"
                ></div>
                <svg
                  class="h-6 w-6 flex-shrink-0 transition-all duration-300"
                  :class="[
                    route.path === item.path || route.path.startsWith(item.path + '/')
                      ? 'text-blue-300'
                      : 'text-gray-400 group-hover:text-white group-hover:scale-110',
                    isSidebarOpen ? 'mr-4' : 'mx-auto',
                  ]"
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
                <span 
                  v-if="isSidebarOpen" 
                  class="truncate transition-all duration-300"
                >
                  {{ item.name }}
                </span>
                <div
                  v-if="!isSidebarOpen"
                  class="absolute left-full ml-4 px-3 py-2 bg-slate-800/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 shadow-xl border border-white/10 whitespace-nowrap pointer-events-none"
                >
                  {{ item.name }}
                  <div class="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800/90 border-l border-t border-white/10 rotate-45"></div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </router-link>
            </nav>
          </div>
        </div>

        <!-- Desktop User Section -->
        <div class="flex-shrink-0 border-t border-white/10 p-6 bg-gradient-to-r from-slate-900/50 to-blue-900/50">
          <div class="flex items-center w-full">
            <div class="relative">
              <img
                v-if="authStore.user?.profilePicture"
                :src="authStore.user.profilePicture"
                alt="Profile Picture"
                class="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105"
              />
              <div
                v-else
                class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-12 w-12 flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 hover:scale-105"
              >
                {{ authStore.user?.firstName?.charAt(0).toUpperCase() }}
              </div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            <div v-if="isSidebarOpen" class="ml-4 flex-1 opacity-100 transition-opacity duration-300">
              <p class="text-base font-semibold text-white truncate">
                {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
              </p>
              <div class="flex space-x-4 mt-1">
                <router-link
                  to="/profile"
                  class="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors duration-200 hover:underline"
                >
                  Profile
                </router-link>
                <button
                  @click="logout"
                  class="text-sm font-medium text-gray-400 hover:text-red-400 transition-colors duration-200 hover:underline"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.router-link-exact-active {
  animation: slideInFromLeft 0.3s ease-out;
}

.backdrop-blur-xl {
  backdrop-filter: blur(20px);
}

* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>