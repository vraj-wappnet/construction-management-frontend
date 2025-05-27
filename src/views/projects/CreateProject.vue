<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { projectService } from "../../services/api";

const router = useRouter();

const project = ref({
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "Planning",
});

const loading = ref(false);
const error = ref<string | null>(null);

const createProject = async () => {
  if (
    !project.value.name ||
    !project.value.location ||
    !project.value.startDate ||
    !project.value.endDate
  ) {
    error.value = "Please fill in all required fields";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    await projectService.createProject(project.value);
    router.push("/projects");
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to create project";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
    <div class="max-w-3xl mx-auto">
      <!-- Header Section -->
      <div
        class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900 md:text-3xl">
            Create New Project
          </h2>
          <p class="mt-2 text-sm text-gray-600 md:text-base">
            Fill in the details below to start a new project.
          </p>
        </div>
        <router-link
          to="/projects"
          class="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            fill="none"
            viewColor="blue"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Projects
        </router-link>
      </div>

      <!-- Form Section -->
      <div class="bg-white shadow-lg rounded-2xl overflow-hidden">
        <form @submit.prevent="createProject" class="p-6 sm:p-8 space-y-6">
          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 p-4 rounded-lg animate-fade-in">
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
                <p class="text-sm font-medium text-red-800">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                for="name"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                v-model="project.name"
                required
                class="block w-full h-12 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label
                for="location"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Location <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                v-model="project.location"
                required
                class="block w-full h-12 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
                placeholder="Enter project location"
              />
            </div>

            <div>
              <label
                for="startDate"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                v-model="project.startDate"
                required
                class="block w-full h-12 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
              />
            </div>

            <div>
              <label
                for="endDate"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                v-model="project.endDate"
                required
                class="block w-full h-12 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
              />
            </div>

            <div class="sm:col-span-2">
              <label
                for="description"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                v-model="project.description"
                rows="6"
                class="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
                placeholder="Describe your project..."
              ></textarea>
            </div>

            <div>
              <label
                for="status"
                class="block text-sm font-medium text-gray-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                v-model="project.status"
                class="block w-full h-12 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-base transition-all duration-200"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-4 pt-4">
            <router-link
              to="/projects"
              class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
              Cancel
            </router-link>
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <svg
                v-if="loading"
                class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
