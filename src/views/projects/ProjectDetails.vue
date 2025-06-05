<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { projectService } from "../../services/api";

const route = useRoute();
const project = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const projectId = Number(route.params.id);
    if (isNaN(projectId)) {
      throw new Error('Invalid project ID');
    }
    const response = await projectService.getProject(projectId);
    project.value = response.data;
  } catch (err: any) {
    error.value =
      err.response?.data?.message || "Failed to load project details";
  } finally {
    loading.value = false;
  }
});

const getStatusClass = (status: string) => {
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
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center my-8">
      <svg
        class="animate-spin h-8 w-8 text-primary-500"
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
    </div>

    <div v-else-if="error" class="bg-red-50 p-4 rounded-md">
      <div class="flex">
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
          <p class="text-sm font-medium text-red-800">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="project" class="space-y-6">
      <!-- Project Header -->
      <div class="bg-white shadow rounded-lg px-4 py-5 sm:p-6">
        <div class="md:flex md:items-center md:justify-between">
          <div class="flex-1 min-w-0">
            <h2
              class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate"
            >
              {{ project.name }}
            </h2>
            <div
              class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6"
            >
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <svg
                  class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ project.location }}
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500">
                <span
                  :class="[
                    getStatusClass(project.status),
                    'px-2 py-1 text-xs rounded-full',
                  ]"
                >
                  {{ project.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

     

      <!-- Project Navigation -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="divide-y divide-gray-200">
          <router-link
            :to="`/projects/${project.id}/tasks`"
            class="block hover:bg-gray-50"
          >
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-primary-600 truncate">
                  Tasks
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  <p
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                  >
                    View All
                  </p>
                </div>
              </div>
            </div>
          </router-link>

          <router-link
            :to="`/projects/${project.id}/materials`"
            class="block hover:bg-gray-50"
          >
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-primary-600 truncate">
                  Materials
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  <p
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                  >
                    View All
                  </p>
                </div>
              </div>
            </div>
          </router-link>

          <router-link
            :to="`/projects/${project.id}/documents`"
            class="block hover:bg-gray-50"
          >
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-primary-600 truncate">
                  Documents
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  <p
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                  >
                    View All
                  </p>
                </div>
              </div>
            </div>
          </router-link>

          <router-link
            :to="`/projects/${project.id}/invoices`"
            class="block hover:bg-gray-50"
          >
           
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
