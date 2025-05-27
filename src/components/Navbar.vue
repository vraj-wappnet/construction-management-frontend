<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const isMenuOpen = ref(false);
const isScrolled = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const logout = async () => {
  await authStore.logout();
  router.push({ name: 'Home' });
  closeMenu();
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <nav 
    class="fixed w-full top-0 z-50 transition-all duration-300 font-sans"
    :class="isScrolled ? 'bg-blue-600 backdrop-blur-md shadow-lg' : 'bg-blue-700/90 backdrop-blur-sm'"
  >
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <router-link 
          to="/" 
          class="flex items-center space-x-2 text-white text-xl font-extrabold tracking-tight hover:text-yellow-400 transition-colors duration-300"
          @click="closeMenu"
        >
          <div class="relative">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center group-hover:from-yellow-400 group-hover:to-yellow-300 transition-all duration-300 transform group-hover:scale-110">
              <svg class="w-5 h-5 text-white group-hover:text-gray-900 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <div class="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <span>Construction<span class="text-yellow-400">Sync</span></span>
        </router-link>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button
            @click="toggleMenu"
            class="relative p-2 text-white focus:outline-none group"
            aria-label="Toggle menu"
          >
            <div class="w-6 h-6 relative">
              <span 
                class="absolute top-0 left-0 w-full h-0.5 bg-white transform transition-all duration-300 origin-center"
                :class="isMenuOpen ? 'rotate-45 translate-y-2.5' : 'rotate-0 translate-y-0'"
              ></span>
              <span 
                class="absolute top-2.5 left-0 w-full h-0.5 bg-white transform transition-all duration-300"
                :class="isMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'"
              ></span>
              <span 
                class="absolute top-5 left-0 w-full h-0.5 bg-white transform transition-all duration-300 origin-center"
                :class="isMenuOpen ? '-rotate-45 -translate-y-2.5' : 'rotate-0 translate-y-0'"
              ></span>
            </div>
          </button>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex md:items-center md:space-x-2">
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/"
              class="px-4 py-2 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
            >
              Home
            </router-link>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="group px-6 py-2 bg-yellow-400 text-gray-900 rounded-lg font-semibold hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md"
            >
              <span class="flex items-center space-x-2">
                <span>Get Started</span>
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
            </router-link>
          </template>

          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/dashboard"
              class="flex items-center px-4 py-2 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z"/>
              </svg>
              Dashboard
            </router-link>
            <router-link
              to="/projects"
              class="flex items-center px-4 py-2 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Projects
            </router-link>
            <router-link
              v-if="['Admin', 'Client'].includes(authStore.userRole)"
              to="/projects/create"
              class="flex items-center px-4 py-2 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Project
            </router-link>
            <button
              @click="logout"
              class="group flex items-center px-4 py-2 rounded-lg text-white hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 font-medium text-sm"
            >
              <svg class="w-4 h-4 mr-2 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </template>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div 
        class="md:hidden overflow-hidden transition-all duration-500 ease-in-out"
        :class="isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'"
      >
        <div class="py-4 space-y-2 border-t border-white/10 mt-4">
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/"
              class="group flex items-center px-4 py-3 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Home
            </router-link>
            <router-link
              to="/login"
              class="group flex items-center px-4 py-3 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              Login
            </router-link>
            <router-link
              to="/register"
              class="group flex items-center px-4 py-3 rounded-lg bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-all duration-300 font-semibold text-sm"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Get Started
            </router-link>
          </template>

          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/dashboard"
              class="group flex items-center px-4 py-3 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z"/>
              </svg>
              Dashboard
            </router-link>
            <router-link
              to="/projects"
              class="group flex items-center px-4 py-3 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Projects
            </router-link>
            <router-link
              v-if="['Admin', 'Client'].includes(authStore.userRole)"
              to="/projects/create"
              class="group flex items-center px-4 py-3 rounded-lg text-white hover:text-yellow-400 hover:bg-white/10 transition-all duration-300 font-medium text-sm"
              active-class="text-yellow-400 bg-white/10"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Project
            </router-link>
            <button
              @click="logout"
              class="group flex items-center w-full px-4 py-3 rounded-lg text-white hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 font-medium text-sm"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
@font-face {
  font-family: 'Inter';
  src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
}

:root {
  --blue-900: #1E3A8A;
  --blue-600: #3B82F6;
  --blue-400: #60A5FA;
  --yellow-400: #FACC15;
  --yellow-300: #FBBF24;
  --gray-50: #F3F4F6;
  --gray-900: #1F2937;
}

.backdrop-blur-md { backdrop-filter: blur(10px); }
.backdrop-blur-sm { backdrop-filter: blur(5px); }

.router-link-active {
  position: relative;
}

.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: var(--yellow-400);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
  50% { opacity: 0.7; transform: translateX(-50%) scale(1.2); }
}
</style>