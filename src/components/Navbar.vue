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
    :class="isScrolled ? 'bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-xl shadow-xl border-b border-white/10' : 'bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-sm shadow-md border-b border-white/10'"
  >
    <div class="container mx-auto px-1 py-3">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <router-link 
          to="/" 
          class="flex items-center space-x-2 group"
          @click="closeMenu"
        >
          <div class="relative">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
              <svg class="w-5 h-5 text-white group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:bg-green-300 transition-all duration-300"></div>
          </div>
          <span class="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 group-hover:from-blue-300 group-hover:to-purple-300 transition-all duration-500">Construction<span class="text-blue-400">Sync</span></span>
        </router-link>

        <!-- Mobile Menu Button -->
        <div class="md:hidden">
          <button
            @click="toggleMenu"
            class="relative p-2 text-white focus:outline-none group rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
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
              class="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm group relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-500/10"
            >
              <span class="relative z-10">Home</span>
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm group relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-500/10"
            >
              <span class="relative z-10">Login</span>
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              to="/register"
              class="group px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg relative"
            >
              <span class="flex items-center space-x-2 relative z-10">
                <span>Get Started</span>
                <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </span>
              <span class="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            </router-link>
          </template>

          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/dashboard"
              class="flex items-center px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm group relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-500/10"
            >
              <svg class="w-4 h-4 mr-2 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z"/>
              </svg>
              <span class="relative z-10">Dashboard</span>
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              to="/projects"
              class="flex items-center px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm group relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-500/10"
            >
              <svg class="w-4 h-4 mr-2 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <span class="relative z-10">Projects</span>
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              v-if="['Admin', 'Client'].includes(authStore.userRole)"
              to="/projects/create"
              class="flex items-center px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm group relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30 shadow-lg shadow-blue-500/10"
            >
              <svg class="w-4 h-4 mr-2 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              <span class="relative z-10">New Project</span>
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <button
              @click="logout"
              class="group flex items-center px-4 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-400/20 transition-all duration-300 font-medium text-sm relative"
            >
              <svg class="w-4 h-4 mr-2 text-gray-400 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span class="relative z-10">Logout</span>
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </button>
          </template>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div 
        class="md:hidden overflow-hidden transition-all duration-500 ease-in-out"
        :class="isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'"
      >
        <div class="py-4 space-y-2 border-t border-white/10 mt-4 bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-xl">
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/"
              class="group flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Home
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              to="/login"
              class="group flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              Login
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              to="/register"
              class="group flex items-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-400 hover:to-purple-500 transition-all duration-300 font-semibold text-sm shadow-md hover:shadow-lg relative"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Get Started
              <span class="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            </router-link>
          </template>

          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/dashboard"
              class="group flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2v0z"/>
              </svg>
              Dashboard
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              to="/projects"
              class="group flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Projects
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <router-link
              v-if="['Admin', 'Client'].includes(authStore.userRole)"
              to="/projects/create"
              class="group flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-300 font-medium text-sm relative"
              active-class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-400/30"
              @click="closeMenu"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Project
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </router-link>
            <button
              @click="logout"
              class="group flex items-center w-full px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-400/20 transition-all duration-300 font-medium text-sm relative"
            >
              <svg class="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Logout
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Custom scrollbar styling */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Custom animations */
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

/* Glassmorphism effect enhancement */
.backdrop-blur-xl {
  backdrop-filter: blur(20px);
}

/* Smooth transitions for all interactive elements */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced focus states */
button:focus-visible,
a:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

/* Micro-interactions */
.group:hover .group-hover\:scale-110 {
  transform: scale(1.1);
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>