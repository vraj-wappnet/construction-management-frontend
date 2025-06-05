<script setup lang="ts">
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import Navbar from "./components/Navbar.vue";

const router = useRouter();
const isLoaded = ref(false);
const stats = ref([
  { number: 0, target: 500, suffix: "+", label: "Active Projects" },
  { number: 0, target: 1200, suffix: "+", label: "Happy Clients" },
  { number: 0, target: 50, suffix: "M+", label: "Materials Tracked" },
  { number: 0, target: 99, suffix: "%", label: "Uptime" },
]);

// Navigation methods
const goToLogin = () => {
  router.push("/login");
};

const goToRegister = () => {
  router.push("/register");
};

// Counter animation
const animateCounters = () => {
  stats.value.forEach((stat) => {
    const duration = 2000;
    const increment = stat.target / (duration / 50);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.target) {
        stat.number = stat.target;
        clearInterval(timer);
      } else {
        stat.number = Math.floor(current);
      }
    }, 50);
  });
};

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true;
  }, 100);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    });
  });

  const statsSection = document.getElementById("stats-section");
  if (statsSection) {
    observer.observe(statsSection);
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-900 font-sans overflow-x-hidden">
    <Navbar />
    <section
      class="relative min-h-screen bg-gradient-to-br from-slate-900/95 to-blue-900/95 text-white pt-32 pb-20 overflow-hidden backdrop-blur-sm flex items-center"
    >
      <!-- Subtle Background Pattern -->
      <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>

      <!-- Floating Construction Icons -->
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/4 left-1/5 animate-float">
          <svg
            class="w-10 h-10 text-blue-400 opacity-30"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"
            />
          </svg>
        </div>
        <div class="absolute top-1/3 right-1/5 animate-float-delayed">
          <svg
            class="w-8 h-8 text-purple-400 opacity-30"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-4-4 1.41-1.41L12 14.17l6.59-6.59L20 9l-8 8z"
            />
          </svg>
        </div>
      </div>

      <div class="container mx-auto px-6 text-center relative z-10">
        <div
          class="transform transition-all duration-1000 ease-out"
          :class="
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          "
        >
          <h1
            class="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 leading-tight tracking-tight"
          >
            Build Smarter with
            <span class="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">ConstructionSync</span>
          </h1>
          <p
            class="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed opacity-90 font-medium text-gray-300"
          >
            Streamline your construction projects with our all-in-one management
            platform designed for efficiency and precision.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-6">
            <button
              @click="goToLogin"
              class="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative"
            >
              <span class="flex items-center justify-center gap-2 relative z-10">
                Sign In
                <svg
                  class="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
              <span
                class="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></span>
            </button>
            <button
              @click="goToRegister"
              class="group bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span class="flex items-center justify-center gap-2">
                Start Building
                <svg
                  class="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section id="stats-section" class="py-16 bg-gray-900">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="text-center transform transition-all duration-500 hover:scale-105"
            :style="{ transitionDelay: `${index * 150}ms` }"
          >
            <div class="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
              {{ stat.number }}{{ stat.suffix }}
            </div>
            <div class="text-gray-300 font-medium text-lg">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-gradient-to-b from-gray-900 to-slate-800">
      <div class="container mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Comprehensive Construction Management
          </h2>
          <p class="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Manage every stage of your construction projects with our powerful,
            user-friendly tools.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature Cards -->
          <div
            v-for="(feature, index) in [
              {
                title: 'Project Planning',
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
                color: 'blue',
                desc: 'Plan projects with precision using intuitive tools for timelines and milestones.',
              },
              {
                title: 'Resource Management',
                icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                color: 'green',
                desc: 'Optimize resource allocation to reduce costs and improve efficiency.',
              },
              {
                title: 'Team Collaboration',
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                color: 'purple',
                desc: 'Enable seamless communication and document sharing across teams.',
              },
              {
                title: 'Progress Tracking',
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                color: 'orange',
                desc: 'Track progress with real-time dashboards and automated reports.',
              },
              {
                title: 'Quality Control',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                color: 'red',
                desc: 'Ensure compliance with quality checkpoints and inspection schedules.',
              },
              {
                title: 'Financial Management',
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                color: 'yellow',
                desc: 'Control budgets and track expenses with robust financial tools.',
              },
            ]"
            :key="index"
            class="group bg-slate-800/50 p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-sm border border-white/10"
          >
            <div
              class="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
              :class="`bg-${feature.color}-100/20 group-hover:bg-${feature.color}-200/30 transition-colors`"
            >
              <svg
                class="w-7 h-7"
                :class="`text-${feature.color}-400`"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="feature.icon"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-3">
              {{ feature.title }}
            </h3>
            <p class="text-gray-300 leading-relaxed text-sm">
              {{ feature.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section
      class="relative bg-gradient-to-r from-slate-900 to-blue-900 py-20 overflow-hidden backdrop-blur-sm"
    >
      <div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div class="container mx-auto px-6 text-center relative z-10">
        <div class="max-w-4xl mx-auto text-white">
          <h2 class="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Transform Your Projects?
          </h2>
          <p class="text-lg md:text-xl mb-10 opacity-90 text-gray-300">
            Join the construction revolution with ConstructionSync and deliver
            projects faster and smarter.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-6">
            <button
              @click="goToRegister"
              class="group bg-gradient-to-r from-blue-500 to-purple-600 text-white px-10 py-4 rounded-xl font-bold hover:from-blue-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative"
            >
              <span class="flex items-center justify-center gap-2 relative z-10">
                Start Your Free Trial
                <svg
                  class="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
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
                class="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></span>
            </button>
            <button
              class="group bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105 relative"
            >
              <span class="flex items-center justify-center gap-2 relative z-10">
                Watch Demo
                <svg
                  class="w-6 h-6 transform group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m2-10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <span
                class="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              ></span>
            </button>
          </div>
          <div class="mt-8 text-sm opacity-80 text-gray-300">
            No credit card required • 30-day free trial • Cancel anytime
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 text-white py-12">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 class="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">ConstructionSync</h3>
            <p class="text-gray-300 leading-relaxed text-sm">
              Empowering construction teams with intelligent project management
              solutions.
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-lg text-white">Product</h4>
            <ul class="space-y-2 text-gray-300 text-sm">
              <li>
                <a href="#" class="hover:text-blue-400 transition"
                  >Features</a
                >
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">Pricing</a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">Demo</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-lg text-white">Support</h4>
            <ul class="space-y-2 text-gray-300 text-sm">
              <li>
                <a href="#" class="hover:text-blue-400 transition"
                  >Help Center</a
                >
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">Contact</a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition"
                  >Training</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4 text-lg text-white">Company</h4>
            <ul class="space-y-2 text-gray-300 text-sm">
              <li>
                <a href="#" class="hover:text-blue-400 transition">About</a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">Careers</a>
              </li>
              <li>
                <a href="#" class="hover:text-blue-400 transition">Privacy</a>
              </li>
            </ul>
          </div>
        </div>
        <div
          class="border-t border-white/10 pt-8 text-center text-gray-300 text-sm"
        >
          <p>© 2025 ConstructionSync. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@font-face {
  font-family: "Inter";
  src: url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
}

:root {
  --slate-900: #0f172a;
  --blue-900: #1e3a8a;
  --blue-500: #3b82f6;
  --purple-600: #7c3aed;
  --blue-400: #60a5fa;
  --purple-400: #a78bfa;
  --gray-900: #1f2937;
  --gray-300: #d1d5db;
}

.bg-grid-pattern {
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes float-delayed {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 5s ease-in-out infinite;
}
.animate-float-delayed {
  animation: float-delayed 7s ease-in-out infinite;
}

html {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--gray-900);
}

::-webkit-scrollbar-thumb {
  background: var(--blue-500);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--purple-600);
}

/* Smooth transitions for all interactive elements */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced focus states */
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--blue-400);
  outline-offset: 2px;
}
</style>