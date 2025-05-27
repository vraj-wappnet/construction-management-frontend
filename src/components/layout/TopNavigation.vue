<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

defineProps<{
  pageTitle: string;
}>();

const emit = defineEmits<{
  (e: "toggleSidebar"): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const isMobileMenuOpen = ref(false);
const isScrolled = ref(false);
const isHoveringLogo = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const logout = async () => {
  await authStore.logout();
  router.push({ name: "Home" });
  closeMobileMenu();
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <nav
    class="fixed w-full top-0 z-50 font-sans transition-all duration-500"
    :class="
      isScrolled
        ? 'bg-bule-800 backdrop-blur-md shadow-xl'
        : 'bg-blue-800 backdrop-blur-sm shadow-md'
    "
  >
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex-shrink-0 flex items-center">
          <router-link
            to="/"
            class="flex items-center space-x-2"
            @mouseenter="isHoveringLogo = true"
            @mouseleave="isHoveringLogo = false"
            @click="closeMobileMenu"
          >
            <div
              class="relative group transition-all duration-500 transform hover:scale-105"
            >
              <div
                class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl flex items-center justify-center group-hover:from-yellow-400 group-hover:to-yellow-300 transition-all duration-500 shadow-md"
              >
                <svg
                  class="w-6 h-6 text-white group-hover:text-gray-900 transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"
                  />
                </svg>
              </div>
              <div
                class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse group-hover:bg-yellow-300 transition-all duration-300"
              ></div>
              <div
                class="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></div>
            </div>
            <span
              class="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-100 group-hover:from-yellow-300 group-hover:to-yellow-200 transition-all duration-500"
            >
              Construction<span class="text-yellow-400">Sync</span>
            </span>
          </router-link>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:block">
          <div class="ml-10 flex items-center space-x-1">
            <template v-if="!authStore.isAuthenticated">
              <router-link
                to="/"
                class="relative px-4 py-2 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/20 transition-all duration-300 font-medium text-sm group"
                active-class="text-yellow-300"
                @click="closeMobileMenu"
              >
                <span class="relative z-10">Home</span>
                <span
                  class="absolute inset-0 bg-yellow-400/10 rounded-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                ></span>
              </router-link>
              <router-link
                to="/login"
                class="relative px-4 py-2 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/20 transition-all duration-300 font-medium text-sm group"
                active-class="text-yellow-300"
                @click="closeMobileMenu"
              >
                <span class="relative z-10">Login</span>
                <span
                  class="absolute inset-0 bg-yellow-400/10 rounded-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                ></span>
              </router-link>
              <router-link
                to="/register"
                class="relative group px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:from-yellow-300 hover:to-yellow-400 transition-all duration-500 transform hover:scale-[1.03] shadow-md hover:shadow-lg"
                @click="closeMobileMenu"
              >
                <span class="flex items-center space-x-2 relative z-10">
                  <span>Get Started</span>
                  <svg
                    class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <span
                  class="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                ></span>
              </router-link>
            </template>

            <template v-if="authStore.isAuthenticated">
              <router-link
                to="/projects"
                class="relative flex items-center px-4 py-2 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/20 transition-all duration-300 font-medium text-sm group"
                active-class="text-yellow-300"
                @click="closeMobileMenu"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span class="relative z-10">Projects</span>
                <span
                  class="absolute inset-0 bg-yellow-400/10 rounded-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                ></span>
              </router-link>
               <router-link
                to="/profile"
                class="relative flex items-center px-4 py-2 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/20 transition-all duration-300 font-medium text-sm group"
                active-class="text-yellow-300"
                @click="closeMobileMenu"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z"
                  />
                </svg>
                <span class="relative z-10">Profile</span>
                <span
                  class="absolute inset-0 bg-yellow-400/10 rounded-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                ></span>
              </router-link>
              <router-link
                v-if="['Admin', 'Client'].includes(authStore.userRole)"
                to="/projects/create"
                class="relative flex items-center px-4 py-2 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/20 transition-all duration-300 font-medium text-sm group"
                active-class="text-yellow-300"
                @click="closeMobileMenu"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span class="relative z-10">New Project</span>
                <span
                  class="absolute inset-0 bg-yellow-400/10 rounded-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                ></span>
              </router-link>
              <button
                @click="logout"
                class="relative group flex items-center px-4 py-2 rounded-lg text-white hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 font-medium text-sm"
              >
                <svg
                  class="w-4 h-4 mr-2 transform group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span class="relative z-10">Logout</span>
                <span
                  class="absolute inset-0 bg-red-400/10 rounded-lg scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300"
                ></span>
              </button>
            </template>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <div class="-mr-2 flex md:hidden">
          <!-- Sidebar Toggle Button -->
          <button
            @click="emit('toggleSidebar')"
            class="p-2 text-white hover:bg-indigo-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300 mr-2"
            aria-label="Toggle sidebar"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>

          <button
            @click="toggleMobileMenu"
            class="p-2 text-white hover:bg-indigo-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
            aria-label="Toggle menu"
          >
            <div class="w-6 h-6 relative transform transition-all duration-300">
              <span
                class="absolute top-0 left-0 w-full h-0.5 bg-white transform transition-all duration-300 origin-center"
                :class="
                  isMobileMenuOpen
                    ? 'rotate-45 translate-y-2.5'
                    : 'rotate-0 translate-y-0'
                "
              ></span>
              <span
                class="absolute top-2.5 left-0 w-full h-0.5 bg-white transform transition-all duration-300"
                :class="
                  isMobileMenuOpen
                    ? 'opacity-0 scale-0'
                    : 'opacity-100 scale-100'
                "
              ></span>
              <span
                class="absolute top-5 left-0 w-full h-0.5 bg-white transform transition-all duration-300 origin-center"
                :class="
                  isMobileMenuOpen
                    ? '-rotate-45 -translate-y-2.5'
                    : 'rotate-0 translate-y-0'
                "
              ></span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden bg-indigo-600/95 backdrop-blur-md border-t border-indigo-500/30 shadow-xl"
      >
        <div class="pt-2 pb-4 px-4 space-y-1">
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/"
              class="group flex items-center px-3 py-3 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/30 transition-all duration-300 font-medium"
              active-class="text-yellow-300 bg-indigo-500/20"
              @click="closeMobileMenu"
            >
              <svg
                class="w-5 h-5 mr-3 text-yellow-300 opacity-70 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Home
            </router-link>
            <router-link
              to="/login"
              class="group flex items-center px-3 py-3 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/30 transition-all duration-300 font-medium"
              active-class="text-yellow-300 bg-indigo-500/20"
              @click="closeMobileMenu"
            >
              <svg
                class="w-5 h-5 mr-3 text-yellow-300 opacity-70 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Login
            </router-link>
            <router-link
              to="/register"
              class="group flex items-center px-3 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400 transition-all duration-500 font-semibold"
              @click="closeMobileMenu"
            >
              <svg
                class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              Get Started
            </router-link>
          </template>

          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/dashboard"
              class="group flex items-center px-3 py-3 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/30 transition-all duration-300 font-medium"
              active-class="text-yellow-300 bg-indigo-500/20"
              @click="closeMobileMenu"
            >
              <svg
                class="w-5 h-5 mr-3 text-yellow-300 opacity-70 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z"
                />
              </svg>
              Dashboard
            </router-link>
            <router-link
              to="/projects"
              class="group flex items-center px-3 py-3 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/30 transition-all duration-300 font-medium"
              active-class="text-yellow-300 bg-indigo-500/20"
              @click="closeMobileMenu"
            >
              <svg
                class="w-5 h-5 mr-3 text-yellow-300 opacity-70 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Projects
            </router-link>
            <router-link
              v-if="['Admin', 'Client'].includes(authStore.userRole)"
              to="/projects/create"
              class="group flex items-center px-3 py-3 rounded-lg text-white hover:text-yellow-300 hover:bg-indigo-500/30 transition-all duration-300 font-medium"
              active-class="text-yellow-300 bg-indigo-500/20"
              @click="closeMobileMenu"
            >
              <svg
                class="w-5 h-5 mr-3 text-yellow-300 opacity-70 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Project
            </router-link>
            <button
              @click="logout"
              class="group w-full flex items-center px-3 py-3 rounded-lg text-white hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 font-medium"
            >
              <svg
                class="w-5 h-5 mr-3 text-red-300 opacity-70 group-hover:opacity-100 transition-opacity transform group-hover:rotate-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </template>
        </div>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
/* Enhanced active link indicator */
.router-link-active {
  position: relative;
}

.router-link-active:not(.router-link-exact-active)::after {
  content: "";
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: #fde047; /* Yellow-300 */
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.router-link-exact-active {
  background-color: rgba(253, 224, 71, 0.1);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateX(-50%) scale(1.3);
  }
}

/* Smooth transitions for mobile menu */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Glow effect for logo */
.logo-glow {
  filter: drop-shadow(0 0 8px rgba(253, 224, 71, 0.4));
}
</style>
