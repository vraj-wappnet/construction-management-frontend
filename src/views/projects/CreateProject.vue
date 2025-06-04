<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { projectService } from "../../services/api";
import * as Yup from 'yup';

const router = useRouter();

interface ProjectForm {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
}

const project = ref<ProjectForm>({
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  status: "Planning",
});

const loading = ref(false);
const error = ref<string | null>(null);
const formErrors = ref<Record<string, string>>({});

// Yup validation schema
const projectFormSchema = Yup.object().shape({
  name: Yup.string()
    .required('Project name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  location: Yup.string()
    .required('Location is required')
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location cannot exceed 100 characters'),
  startDate: Yup.date()
    .required('Start date is required')
    .typeError('Invalid start date'),
  endDate: Yup.date()
    .required('End date is required')
    .min(Yup.ref('startDate'), 'End date cannot be before start date')
    .typeError('Invalid end date'),
  description: Yup.string()
    .max(500, 'Description cannot exceed 500 characters'),
  status: Yup.string()
    .required('Status is required')
    .oneOf(['Planning', 'In Progress', 'On Hold', 'Completed'], 'Invalid status'),
});

const createProject = async () => {
  try {
    // Validate form using Yup
    await projectFormSchema.validate(project.value, { abortEarly: false });
    formErrors.value = {};

    loading.value = true;
    error.value = null;

    await projectService.createProject(project.value);
    router.push("/projects");
  } catch (err: any) {
    if (err instanceof Yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error: any) => {
        if (error.path) {
          errors[error.path] = error.message;
        }
      });
      formErrors.value = errors;
      error.value = "Please correct the form errors";
    } else {
      error.value = err.response?.data?.message || "Failed to create project";
    }
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
                class="block w-full h-12 px-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': formErrors.name }"
                placeholder="Enter project name"
              />
              <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
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
                class="block w-full h-12 px-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': formErrors.location }"
                placeholder="Enter project location"
              />
              <p v-if="formErrors.location" class="mt-1 text-sm text-red-500">{{ formErrors.location }}</p>
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
                class="block w-full h-12 px-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': formErrors.startDate }"
              />
              <p v-if="formErrors.startDate" class="mt-1 text-sm text-red-500">{{ formErrors.startDate }}</p>
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
                class="block w-full h-12 px-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': formErrors.endDate }"
              />
              <p v-if="formErrors.endDate" class="mt-1 text-sm text-red-500">{{ formErrors.endDate }}</p>
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
                class="block w-full px-2 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': formErrors.description }"
                placeholder="Describe your project..."
              ></textarea>
              <p v-if="formErrors.description" class="mt-1 text-sm text-red-500">{{ formErrors.description }}</p>
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
                class="block w-full h-12 px-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': formErrors.status }"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
              <p v-if="formErrors.status" class="mt-1 text-sm text-red-500">{{ formErrors.status }}</p>
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

<style scoped>
/* Ensure text collides with border by reducing padding */
input,
textarea,
select {
  padding-left: 8px;
  padding-right: 8px;
}

/* Darker border on focus */
input:focus,
textarea:focus,
select:focus {
  border-color: #1e40af; /* Darker blue */
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.2);
}

/* Animation for error message */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>