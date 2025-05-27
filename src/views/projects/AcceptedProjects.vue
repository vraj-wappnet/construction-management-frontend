<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { projectService } from "../../services/api";

const router = useRouter();
const authStore = useAuthStore();

const projects = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const statusFilter = ref("In Progress"); // Default to In Progress for accepted projects
const showAssignModal = ref(false);
const selectedProject = ref<any>(null);
const siteEngineers = ref<any[]>([]);
const selectedSiteEngineer = ref<number | null>(null);
const toast = ref<{
  message: string;
  type: "success" | "error";
  visible: boolean;
}>({
  message: "",
  type: "success",
  visible: false,
});

const userRole = computed(() => authStore.userRole);

onMounted(async () => {
  if (userRole.value !== "contractor") {
    router.push("/projects");
    return;
  }
  await fetchProjects();
  await fetchSiteEngineers();
});

const fetchProjects = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await projectService.getMyProjects();
    projects.value = response.data;
  } catch (err: any) {
    error.value =
      err.response?.data?.message || "Failed to load accepted projects";
  } finally {
    loading.value = false;
  }
};

const fetchSiteEngineers = async () => {
  try {
    const response = await projectService.getSiteEngineers();
    siteEngineers.value = response.data;
  } catch (err: any) {
    showToast("Failed to load site engineers", "error");
  }
};

const navigateToProject = (projectId: string) => {
  router.push(`/projects/${projectId}`);
};

const filteredProjects = computed(() => {
  let filtered = [...projects.value];
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.location.toLowerCase().includes(query)
    );
  }
  if (statusFilter.value !== "All") {
    filtered = filtered.filter(
      (project) => project.status === statusFilter.value
    );
  }
  return filtered;
});

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

const openAssignModal = (project: any) => {
  selectedProject.value = project;
  selectedSiteEngineer.value = null;
  showAssignModal.value = true;
};

const assignSiteEngineer = async () => {
  if (!selectedProject.value || !selectedSiteEngineer.value) return;
  try {
    await projectService.assignSiteEngineer(
      selectedProject.value.id,
      selectedSiteEngineer.value
    );
    await fetchProjects();
    showAssignModal.value = false;
    showToast("Site engineer assigned successfully", "success");
  } catch (err: any) {
    showToast(
      err.response?.data?.message || "Failed to assign site engineer",
      "error"
    );
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => (toast.value.visible = false), 3000);
};
</script>

<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Toast Notification -->
      <div
        v-if="toast.visible"
        :class="[
          'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300',
          toast.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800',
        ]"
      >
        {{ toast.message }}
      </div>

      <!-- Header -->
      <div
        class="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Accepted Projects</h1>
          <p class="mt-1 text-sm text-gray-500">View your accepted projects</p>
        </div>
        <router-link
          to="/projects"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-300"
        >
          Back to All Projects
        </router-link>
      </div>

      <!-- Filters -->
      <div
        class="mb-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0"
      >
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or location..."
          class="w-full sm:w-64 h-10 px-4 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          v-model="statusFilter"
          class="w-full sm:w-48 h-10 px-4 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="In Progress">In Progress</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center my-8">
        <svg
          class="animate-spin h-8 w-8 text-blue-600"
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

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-100 text-red-800 p-4 rounded-lg">
        <div class="flex items-center justify-between">
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

      <!-- Empty State -->
      <div
        v-else-if="filteredProjects.length === 0"
        class="text-center py-12 bg-white rounded-lg shadow"
      >
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
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No accepted projects found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {{
            searchQuery || statusFilter !== "All"
              ? "Try adjusting your search."
              : "You have not accepted any projects yet."
          }}
        </p>
        <div class="mt-6">
          <router-link to="/projects">
            <button
              class="inline-flex items-center px-4 py-2 bg-blue-600 rounded-lg shadow-sm text-white hover:bg-blue-700"
            >
              View All Projects
            </button>
          </router-link>
        </div>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="bg-white overflow-hidden shadow rounded-lg"
        >
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 truncate">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ project.name }}
                  </h3>
                  <span
                    :class="[
                      getProjectStatusClass(project.status),
                      'px-2 py-1 text-xs rounded-full',
                    ]"
                  >
                    {{ project.status }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500 truncate">
                  {{ project.location }}
                </p>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-medium text-gray-500">Start Date</p>
                <p class="text-sm text-gray-900">
                  {{ new Date(project.startDate).toLocaleDateString() }}
                </p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500">End Date</p>
                <p class="text-sm text-gray-900">
                  {{
                    project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : "N/A"
                  }}
                </p>
              </div>
            </div>
            <!-- Actions -->
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="project.contractors?.some((c: any) => c.id === authStore.user)"
                @click.stop="openAssignModal(project)"
                class="inline-flex items-center justify-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Assign Site Engineer
              </button>
              <button
                @click="navigateToProject(project.id)"
                class="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Modal -->
    <div
      v-if="showAssignModal"
      class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-lg font-medium text-gray-900 mb-4">
          Assign Site Engineer
        </h2>
        <form @submit.prevent="assignSiteEngineer" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Select Site Engineer</label
            >
            <select
              v-model="selectedSiteEngineer"
              required
              class="mt-1 w-full h-10 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null" disabled>Select a site engineer</option>
              <option
                v-for="engineer in siteEngineers"
                :key="engineer.id"
                :value="engineer.id"
              >
                {{ engineer.firstName }} {{ engineer.lastName }}
              </option>
            </select>
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="showAssignModal = false"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
