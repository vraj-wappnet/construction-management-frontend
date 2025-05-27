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

const getProjectStatusClass = (status: string) => {
  switch (status) {
    case "Planning":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "On Hold":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const dashboardStats = ref([
  {
    title: "Total Projects",
    value: computed(() => projects.value.length),
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    color: "blue",
    link: "/projects",
  },
  {
    title: "Open Tasks",
    value: 15,
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    color: "yellow",
    link: "/tasks",
  },
  {
    title: "Materials",
    value: 24,
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    color: "green",
    link: "/materials",
  },
  {
    title: "Pending Invoices",
    value: "$12",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    color: "red",
    link: "/invoices",
  },
]);
</script>

<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Header Section -->
      <div
        class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 class="text-3xl font-bold text-gray-900 md:text-4xl">
            Dashboard
          </h1>
          <p class="mt-2 text-sm text-gray-600 md:text-base">
            Welcome back, {{ authStore.user?.firstName }}
            <span class="hidden sm:inline"> | </span>
            <span class="block sm:inline mt-1 sm:mt-0 sm:ml-2">
              Today is
              {{
                new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }}
            </span>
          </p>
        </div>
        <div v-if="canCreateProject">
          <router-link
            to="/projects/create"
            class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 hover:text-white transition-all duration-300 text-sm md:text-base"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            New Project
          </router-link>
        </div>
      </div>

      <!-- Dashboard stats cards -->
      <div
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="stat in dashboardStats"
          :key="stat.title"
          class="bg-white shadow-md rounded-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="p-6">
            <div class="flex items-center">
              <div :class="`flex-shrink-0 bg-${stat.color}-100 rounded-xl p-3`">
                <svg
                  :class="`h-8 w-8 text-${stat.color}-600`"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    :d="stat.icon"
                  />
                </svg>
              </div>
              <div class="ml-5 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    {{ stat.title }}
                  </dt>
                  <dd class="text-2xl font-bold text-gray-900 md:text-3xl">
                    {{ stat.value }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <router-link
              :to="stat.link"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors duration-200"
            >
              View all
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent projects section -->
      <div class="mt-8 bg-white rounded-2xl shadow-md overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-200">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <h2 class="text-xl font-semibold text-gray-900 md:text-2xl">
              Recent Projects
            </h2>
            <router-link
              to="/projects"
              class="mt-2 sm:mt-0 text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors duration-200"
            >
              View all projects
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </router-link>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="p-8 flex justify-center items-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
          ></div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="p-6 bg-red-50 rounded-lg mx-4 my-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
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
                Error loading projects
              </h3>
              <p class="mt-1 text-sm text-red-700">{{ error }}</p>
              <div class="mt-4">
                <button
                  @click="onMounted"
                  class="text-sm font-medium text-red-700 hover:text-red-600 transition-colors duration-200"
                >
                  <span class="inline-flex items-center">
                    Try again
                    <svg
                      class="ml-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="projects.length === 0" class="p-8 text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            No projects found
          </h3>
          <p class="mt-1 text-sm text-gray-600">
            Get started by creating a new project.
          </p>
          <div v-if="canCreateProject" class="mt-6">
            <router-link
              to="/projects/create"
              class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 hover:text-white transition-all duration-300 text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clip-rule="evenodd"
                />
              </svg>
              New Project
            </router-link>
          </div>
        </div>

        <!-- Projects grid -->
        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="project in projects.slice(0, 6)"
            :key="project.id"
            class="px-6 py-5 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
            @click="navigateToProject(project.id)"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <h3
                    class="text-base font-semibold text-gray-900 truncate md:text-lg"
                  >
                    {{ project.name }}
                  </h3>
                  <span
                    :class="[
                      getProjectStatusClass(project.status),
                      'px-2.5 py-0.5 text-xs font-medium rounded-full',
                    ]"
                  >
                    {{ project.status }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-600 truncate">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 inline mr-1 -mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
                  {{ project.location }}
                </p>
              </div>
              <div class="mt-3 sm:mt-0 sm:ml-4 sm:flex-shrink-0">
                <div class="flex items-center text-sm text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
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
            <div class="mt-4">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-600">Progress</p>
                <p class="text-sm font-semibold text-gray-900">
                  {{ project.progress || 0 }}%
                </p>
              </div>
              <div class="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  :style="`width: ${project.progress || 0}%`"
                ></div>
              </div>
            </div>
            <div
              class="mt-3 flex items-center justify-between text-sm text-gray-600"
            >
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Updated
                  {{ new Date(project.updatedAt).toLocaleDateString() }}
                </span>
              </div>
              <span
                class="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800 transition-colors duration-200"
              >
                View details
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom responsive adjustments */
@media (max-width: 640px) {
  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 640px) and (max-width: 1024px) {
  .sm\\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) and (max-width: 1280px) {
  .lg\\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .xl\\:grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
