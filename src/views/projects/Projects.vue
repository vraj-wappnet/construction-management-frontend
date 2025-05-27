<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../../stores/auth";
import { projectService } from "../../services/api";

// Define interfaces for type safety
interface Project {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: string;
  client?: { id: number };
  contractors?: Array<{ id: number }>;
  siteEngineers?: Array<{ id: number }>;
  acceptedByContractor?: boolean;
}

interface SiteEngineer {
  id: number;
  firstName: string;
  lastName: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Toast {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

interface UpdateForm {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

const authStore = useAuthStore();

const projects = ref<Project[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const statusFilter = ref("All");
const showUpdateModal = ref(false);
const showAssignModal = ref(false);
const showDetailModal = ref(false);
const selectedProject = ref<Project | null>(null);
const projectDetail = ref<Project | null>(null);
const updateForm = ref<UpdateForm>({
  name: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "",
});
const siteEngineers = ref<SiteEngineer[]>([]);
const selectedSiteEngineer = ref<number | null>(null);
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false,
});

const userRole = computed(() => authStore.userRole as string);
const userId = computed(() =>
  authStore.user?.id ? Number(authStore.user.id) : 0
);

onMounted(async () => {
  console.log("User Role:", userRole.value, "User ID:", userId.value);
  await fetchProjects();
  if (userRole.value === "contractor") {
    await fetchSiteEngineers();
  }
});

const fetchProjects = async () => {
  try {
    loading.value = true;
    error.value = null;
    console.log(
      "Fetching projects for role:",
      userRole.value,
      "with token:",
      localStorage.getItem("token")
    );
    const response = await (userRole.value === "contractor"
      ? projectService.getProjects()
      : projectService.getMyProjects());
    console.log("API Response:", response);
    projects.value = Array.isArray(response.data)
      ? response.data
      : response.data?.projects || [];
    // Ensure acceptedByContractor is set if not provided by backend
    projects.value = projects.value.map(project => ({
      ...project,
      acceptedByContractor: project.acceptedByContractor ?? 
        (project.contractors?.some(c => c.id === userId.value) && project.status !== "planned")
    }));
    console.log("Assigned Projects:", projects.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    error.value = apiError.response?.data?.message || "Failed to load projects";
    console.error("Fetch Projects Error:", err);
  } finally {
    loading.value = false;
  }
};

const fetchProjectDetail = async (projectId: number) => {
  try {
    const response = await projectService.getProject(projectId);
    console.log("Project Detail Response:", response);
    projectDetail.value = {
      ...response.data,
      acceptedByContractor: response.data.acceptedByContractor ?? 
        (response.data.contractors?.some((c: { id: number }) => c.id === userId.value) && 
         response.data.status !== "planned")
    };
    showDetailModal.value = true;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load project details",
      "error"
    );
    console.error("Fetch Project Detail Error:", err);
  }
};

const fetchSiteEngineers = async () => {
  try {
    const response = await projectService.getSiteEngineers();
    siteEngineers.value = response.data;
    console.log("Site Engineers:", siteEngineers.value);
  } catch (err: unknown) {
    showToast("Failed to load site engineers", "error");
    console.error("Fetch Site Engineers:", err);
  }
};

const navigateToProjectDetail = (projectId: number) => {
  fetchProjectDetail(projectId);
};

const canCreateProject = computed(() =>
  ["admin", "client"].includes(userRole.value)
);
const canUpdateDelete = computed(() =>
  ["admin", "client"].includes(userRole.value)
);

const filteredProjects = computed(() => {
  let filtered = [...projects.value];
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase()?.includes(query) ||
        p.location?.toLowerCase()?.includes(query)
    );
  }
  if (statusFilter.value !== "All") {
    filtered = filtered.filter(
      (project) => project.status === statusFilter.value
    );
  }
  console.log("Filtered Projects:", filtered);
  return filtered;
});

const getProjectStatusClass = (status: string) => {
  switch (status) {
    case "planned":
      return "bg-blue-500 text-white";
    case "in_progress":
      return "bg-yellow-500 text-white";
    case "completed":
      return "bg-green-500 text-white";
    case "delayed":
      return "bg-red-500 text-white";
    case "cancelled":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const openUpdateModal = (project: Project) => {
  selectedProject.value = project;
  updateForm.value = {
    name: project.name,
    description: project.description,
    location: project.location,
    startDate:
      project.startDate.split("T")[0] ||
      new Date(project.startDate).toISOString().split("T")[0],
    endDate: project.endDate
      ? project.endDate.split("T")[0] ||
        new Date(project.endDate).toISOString().split("T")[0]
      : "",
    status: project.status,
  };
  showUpdateModal.value = true;
};

const updateProject = async () => {
  if (!selectedProject.value) return;
  try {
    if (
      updateForm.value.endDate &&
      new Date(updateForm.value.endDate) < new Date(updateForm.value.startDate)
    ) {
      showToast("End date cannot be earlier than start date", "error");
      return;
    }
    await projectService.updateProject(
      selectedProject.value.id,
      updateForm.value
    );
    await fetchProjects();
    showUpdateModal.value = false;
    showToast("Project updated successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to update project",
      "error"
    );
  }
};

const deleteProject = async (projectId: number) => {
  if (!confirm("Are you sure you want to delete this project?")) return;
  try {
    await projectService.deleteProject(projectId);
    await fetchProjects();
    showToast("Project deleted successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to delete project",
      "error"
    );
  }
};

const acceptProject = async (projectId: number) => {
  try {
    await projectService.acceptProject(projectId);
    // Optimistically update the local project state
    projects.value = projects.value.map(project =>
      project.id === projectId
        ? {
            ...project,
            acceptedByContractor: true,
            contractors: project.contractors
              ? [...project.contractors, { id: userId.value }]
              : [{ id: userId.value }]
          }
        : project
    );
    showToast("Project accepted successfully", "success");
    // Fetch updated projects from backend to ensure consistency
    await fetchProjects();
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to accept project",
      "error"
    );
  }
};

const openAssignModal = (project: Project) => {
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
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to assign site engineer",
      "error"
    );
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
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
          <h1 class="text-2xl font-bold text-gray-900">Projects</h1>
          <p class="mt-1 text-sm text-gray-500">
            {{
              userRole === "contractor"
                ? "View and accept your assigned projects"
                : userRole === "site_engineer"
                ? "View your assigned projects"
                : userRole === "client"
                ? "Manage your created projects"
                : "Manage all projects"
            }}
          </p>
        </div>
        <div class="flex space-x-4">
          <router-link
            v-if="userRole === 'contractor'"
            to="/projects/accepted"
            class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg shadow-sm hover:bg-yellow-700 transition-all duration-300"
          >
            View Accepted Projects
          </router-link>
          <router-link
            v-if="canCreateProject"
            to="/projects/create"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-300"
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
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
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
      <div v-else-if="error" class="bg-red-100 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-800"
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
          No projects found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {{
            searchQuery || statusFilter !== "All"
              ? "Try adjusting your search or filter criteria."
              : "No projects assigned. Contact your admin to get assigned to projects."
          }}
        </p>
        <div v-if="canCreateProject" class="mt-6">
          <router-link
            to="/projects/create"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
          >
            New Project
          </router-link>
        </div>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="bg-white overflow-hidden shadow rounded-lg transition-all duration-200"
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
            <!-- Role-Specific Actions -->
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="
                  canUpdateDelete &&
                  (userRole === 'admin' || project.client?.id === userId)
                "
                @click.stop="openUpdateModal(project)"
                class="inline-flex items-center px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
              >
                Edit
              </button>
              <button
                v-if="
                  canUpdateDelete &&
                  (userRole === 'admin' || project.client?.id === userId)
                "
                @click.stop="deleteProject(project.id)"
                class="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <div v-if="userRole === 'contractor'">
                <button
                  v-if="!project.acceptedByContractor"
                  @click.stop="acceptProject(project.id)"
                  class="inline-flex items-center px-4 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Accept
                </button>
                <span
                  v-else
                  class="inline-flex items-center px-4 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                >
                  Accepted
                </span>
              </div>
              <button
                v-if="
                  userRole === 'contractor' &&
                  project.contractors?.some((c) => c.id === userId) &&
                  !project.siteEngineers?.length
                "
                @click="openAssignModal(project)"
                class="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Assign Site Engineer
              </button>
              <button
                v-if="
                  userRole === 'contractor' &&
                  project.contractors?.some((c) => c.id === userId) &&
                  project.siteEngineers?.length
                "
                class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
              >
                Site Engineer Assigned
              </button>
              <button
                @click="navigateToProjectDetail(project.id)"
                class="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Project Modal -->
      <div
        v-if="showUpdateModal"
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Update Project</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Name</label
              >
              <input
                v-model="updateForm.name"
                type="text"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Description</label
              >
              <textarea
                v-model="updateForm.description"
                rows="3"
                class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Location</label
              >
              <input
                v-model="updateForm.location"
                type="text"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Start Date</label
              >
              <input
                v-model="updateForm.startDate"
                type="date"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >End Date</label
              >
              <input
                v-model="updateForm.endDate"
                type="date"
                class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Status</label
              >
              <select
                v-model="updateForm.status"
                class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="flex justify-end space-x-4">
              <button
                type="button"
                @click="showUpdateModal = false"
                class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="updateProject"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Assign Site Engineer Modal -->
      <div
        v-if="showAssignModal"
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 class="text-lg font-medium text-gray-900 mb-6">
            Assign Site Engineer
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Select Site Engineer</label
              >
              <select
                v-model="selectedSiteEngineer"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="assignSiteEngineer"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Detail Modal -->
      <div
        v-if="showDetailModal"
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg p-6 w-full max-w-lg">
          <h2 class="text-lg font-medium text-gray-900 mb-4">
            Project Details
          </h2>
          <div v-if="projectDetail" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">ID</label>
              <p class="mt-1 text-sm text-gray-900">{{ projectDetail.id }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Name</label
              >
              <p class="mt-1 text-sm text-gray-900">{{ projectDetail.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Description</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{ projectDetail.description }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Location</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{ projectDetail.location }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Start Date</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{ new Date(projectDetail.startDate).toLocaleDateString() }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >End Date</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{
                  projectDetail.endDate
                    ? new Date(projectDetail.endDate).toLocaleDateString()
                    : "N/A"
                }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Status</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{ projectDetail.status }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Client ID</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{ projectDetail.client?.id || "N/A" }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Contractors</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{
                  projectDetail.contractors?.map((c) => c.id).join(", ") ||
                  "None"
                }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Site Engineers</label
              >
              <p class="mt-1 text-sm text-gray-900">
                {{
                  projectDetail.siteEngineers?.map((e) => e.id).join(", ") ||
                  "N/A"
                }}
              </p>
            </div>
            <div class="flex justify-end">
              <button
                type="button"
                @click="showDetailModal = false"
                class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
