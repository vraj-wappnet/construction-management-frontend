<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { projectService } from "../services/api";

const router = useRouter();
const authStore = useAuthStore();

const projects = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const userRole = computed(() => authStore.userRole);

onMounted(async () => {
  try {
    const response = await projectService.getProjects();
    projects.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to load projects";
  } finally {
    loading.value = false;
  }
});

const navigateToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const canCreateProject = computed(() =>
  ["Admin", "Client"].includes(userRole.value)
);

function getStatGradient(color: string): string {
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    teal: "from-teal-500 to-teal-600",
    indigo: "from-indigo-500 to-indigo-600",
    pink: "from-pink-500 to-pink-600",
  };
  return gradients[color] || "from-slate-500 to-slate-600";
}

// Utility function for project status classes
function getProjectStatusClass(status: string): string {
  const statusClasses: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    completed: "bg-blue-100 text-blue-800 border border-blue-200",
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    "on-hold": "bg-orange-100 text-orange-800 border border-orange-200",
    cancelled: "bg-red-100 text-red-800 border border-red-200",
  };
  return (
    statusClasses[status?.toLowerCase()] ||
    "bg-slate-100 text-slate-800 border border-slate-200"
  );
}
const dashboardStats = ref([
  {
    title: "Total Projects",
    value: computed(() => projects.value.length),
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    color: "blue",
    link: "/projects",
  },
  {
    title: "Tasks",
    value: 3,
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: "yellow",
    link: "/tasks",
  },
  {
    title: "Materials",
    value: 4,
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    color: "green",
    link: "/materials",
  },
]);
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden"
  >
    <div class="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Enhanced Header Section -->
        <div class="mb-12">
          <div
            class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
          >
            <!-- Welcome Section -->
            <div class="space-y-2">
              <div class="flex items-center space-x-4">
                <div
                  class="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg"
                >
                  <svg
                    class="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <div>
                  <h1
                    class="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent"
                  >
                    Dashboard
                  </h1>
                  <div class="mt-2 space-y-1">
                    <p class="text-xl text-slate-700 font-medium">
                      Welcome back,
                      <span
                        class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold"
                      >
                        {{ authStore.user?.firstName }}
                      </span>
                    </p>
                    <p class="text-slate-600 flex items-center">
                      <svg
                        class="w-4 h-4 mr-2 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {{
                        new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Enhanced Action Button -->
            <div v-if="canCreateProject" class="flex-shrink-0">
              <router-link
                to="/projects/create"
                class="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div
                  class="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ></div>
                <svg
                  class="relative z-10 w-6 h-6 mr-3 transform group-hover:rotate-180 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span class="relative z-10 text-lg">New Project</span>
                <div
                  class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                ></div>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Enhanced Dashboard Stats Cards -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
        >
          <div
            v-for="(stat, index) in dashboardStats"
            :key="stat.title"
            class="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-300"
            :style="{ animationDelay: `${index * 100}ms` }"
          >
            <!-- Gradient overlay -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>

            <div class="relative z-10 p-8">
              <div class="flex items-center justify-between mb-6">
                <div
                  :class="`p-4 rounded-2xl bg-gradient-to-br ${getStatGradient(
                    stat.color
                  )} shadow-lg group-hover:scale-110 transition-transform duration-300`"
                >
                  <svg
                    class="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      :d="stat.icon"
                    />
                  </svg>
                </div>
                <div class="text-right">
                  <div
                    class="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                  >
                    {{ stat.value }}
                  </div>
                  <div class="text-sm font-semibold text-slate-600 mt-1">
                    {{ stat.title }}
                  </div>
                </div>
              </div>

              <div
                class="flex items-center justify-between pt-4 border-t border-slate-200/50"
              >
                <router-link
                  :to="stat.link"
                  class="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors duration-200 group-hover:translate-x-1 transform"
                >
                  View Details
                  <svg
                    class="w-4 h-4 ml-2"
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
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Recent Projects Section -->
        <div
          class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          <!-- Section Header -->
          <div
            class="px-8 py-6 bg-gradient-to-r from-slate-50/50 to-white/50 border-b border-slate-200/50"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg"
                >
                  <svg
                    class="w-6 h-6 text-white"
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
                </div>
                <h2
                  class="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                >
                  Recent Projects
                </h2>
              </div>
              <router-link
                to="/projects"
                class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 hover:text-white transform hover:scale-105 transition-all duration-200 shadow-sm"
              >
                View All Projects
                <svg
                  class="w-4 h-4 ml-2"
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
              </router-link>
            </div>
          </div>

          <!-- Enhanced Loading State -->
          <div
            v-if="loading"
            class="flex flex-col items-center justify-center py-20"
          >
            <div class="relative">
              <div
                class="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"
              ></div>
              <div
                class="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400"
              ></div>
            </div>
            <p class="mt-6 text-slate-600 font-medium">
              Loading your projects...
            </p>
            <div class="mt-4 flex space-x-1">
              <div
                class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              ></div>
              <div
                class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style="animation-delay: 0.1s"
              ></div>
              <div
                class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style="animation-delay: 0.2s"
              ></div>
            </div>
          </div>

          <!-- Enhanced Error State -->
          <div v-else-if="error" class="p-8">
            <div
              class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 text-center"
            >
              <div
                class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"
              >
                <svg
                  class="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Projects
              </h3>
              <p class="text-red-600 mb-6">{{ error }}</p>
              <button
                @click="onMounted"
                class="inline-flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
            </div>
          </div>

          <!-- Enhanced Empty State -->
          <div v-else-if="projects.length === 0" class="p-12 text-center">
            <div
              class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center"
            >
              <svg
                class="w-12 h-12 text-slate-400"
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
            </div>
            <h3 class="text-2xl font-bold text-slate-800 mb-4">
              Ready to Start Your First Project?
            </h3>
            <p class="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Transform your ideas into reality. Create your first project and
              begin your journey to success.
            </p>
            <router-link
              v-if="canCreateProject"
              to="/projects/create"
              class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <svg
                class="w-6 h-6 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Your First Project
            </router-link>
          </div>

          <!-- Enhanced Projects List -->
          <div v-else class="divide-y divide-slate-200/50">
            <div
              v-for="(project, index) in projects.slice(0, 6)"
              :key="project.id"
              class="group px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-300 cursor-pointer"
              :style="{ animationDelay: `${index * 50}ms` }"
              @click="navigateToProject(project.id)"
            >
              <div
                class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
              >
                <!-- Project Info -->
                <div class="flex-1 min-w-0">
                  <div
                    class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4"
                  >
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <h3
                          class="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200"
                        >
                          {{ project.name }}
                        </h3>
                        <span
                          :class="[
                            getProjectStatusClass(project.status),
                            'px-3 py-1 text-xs font-bold rounded-full shadow-sm',
                          ]"
                        >
                          {{ project.status }}
                        </span>
                      </div>
                      <div class="flex items-center text-slate-600 space-x-4">
                        <div class="flex items-center">
                          <svg
                            class="w-4 h-4 mr-2 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span class="font-medium">{{
                            project.location
                          }}</span>
                        </div>
                        <div class="flex items-center">
                          <svg
                            class="w-4 h-4 mr-2 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span class="font-medium">
                            Due
                            {{
                              new Date(
                                project.dueDate || project.updatedAt
                              ).toLocaleDateString()
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Progress Section -->
                  <!-- <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-semibold text-slate-700"
                        >Progress</span
                      >
                      <span
                        class="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                      >
                        {{ project.progress || 0 }}%
                      </span>
                    </div>
                    <div
                      class="w-full bg-slate-200 rounded-full h-3 overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        :style="`width: ${project.progress || 0}%`"
                      ></div>
                    </div>
                  </div> -->

                  <!-- Updated Info -->
                  <div
                    class="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50"
                  >
                    <div class="flex items-center text-sm text-slate-600">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="font-medium">
                        Updated
                        {{ new Date(project.updatedAt).toLocaleDateString() }}
                      </span>
                    </div>
                    <div
                      class="flex items-center text-blue-600 font-semibold group-hover:text-indigo-600 transition-colors duration-200"
                    >
                      <span class="mr-2">View Details</span>
                      <svg
                        class="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #6366f1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #4f46e5);
}
</style>
