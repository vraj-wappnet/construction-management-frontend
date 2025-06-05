```vue
<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import PaymentForm from "./PaymentForm.vue";
import { useAuthStore } from "../../stores/auth";
import { projectService } from "../../services/api";
import * as Yup from "yup";
import { useToastStore } from "../../stores/toast";

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

interface Payment {
  id: number;
  project: { id: number };
  payee: { id: number };
  status: string;
  amount: number;
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

interface AuthStore {
  userRole: string | null;
  user: { id: string | number } | null;
}

interface Payee {
  id: number;
}

const authStore = useAuthStore() as AuthStore;
const toastStore = useToastStore();

const updateFormErrors = ref<Record<string, string>>({});

const projects = ref<Project[]>([]);
const payments = ref<Payment[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref("");
const statusFilter = ref("All");
const showUpdateModal = ref(false);
const showAssignModal = ref(false);
const showDetailModal = ref(false);
const showPaymentModal = ref(false);
const selectedProject = ref<Project | null>(null);
const projectDetail = ref<Project | null>(null);
const selectedPayeeId = ref<number | null>(null);
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

const userRole = computed(() => authStore.userRole ?? "unknown");
const userId = computed(() => Number(authStore.user?.id ?? 0));

const canInitiatePayment = computed(() =>
  ["client", "contractor"].includes(userRole.value)
);
const canCreateProject = computed(() =>
  ["admin", "client"].includes(userRole.value)
);

const canUpdateDelete = computed(() => {
  const canUpdate = ["admin", "client", "contractor"].includes(userRole.value);
  console.log("canUpdateDelete:", { userRole: userRole.value, canUpdate });
  return canUpdate;
});

// Debug payment modal conditions
watch([showPaymentModal, selectedProject, selectedPayeeId], () => {
  console.log("Payment modal state:", {
    showPaymentModal: showPaymentModal.value,
    selectedProjectId: selectedProject.value?.id,
    selectedPayeeId: selectedPayeeId.value,
  });
});

onMounted(async () => {
  console.log("Auth state:", {
    userRole: userRole.value,
    userId: userId.value,
    authStore: authStore.user,
  });
  
  if (!authStore.user?.id || !userRole.value) {
    console.warn("Invalid auth state, redirecting to login");
    toastStore.error("Please log in to view projects", 7000);
    // window.location.href = "/login";
    return;
  }
  
  try {
    loading.value = true;
    // Fetch projects and payment history in parallel
    await Promise.all([
      fetchProjects(),
      fetchPaymentHistory(),
      userRole.value === 'contractor' ? fetchSiteEngineers() : Promise.resolve()
    ]);
  } catch (error) {
    console.error('Error initializing data:', error);
    toastStore.error('Failed to load initial data');
  } finally {
    loading.value = false;
  }
});

const updateFormSchema = Yup.object().shape({
  name: Yup.string()
    .required("Project name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: Yup.string().max(
    500,
    "Description cannot exceed 500 characters"
  ),
  location: Yup.string()
    .required("Location is required")
    .min(3, "Location must be at least 3 characters")
    .max(100, "Location cannot exceed 100 characters"),
  startDate: Yup.date()
    .required("Start date is required")
    .typeError("Invalid start date"),
  endDate: Yup.date()
    .nullable()
    .min(Yup.ref("startDate"), "End date cannot be before start date")
    .typeError("Invalid end date"),
  status: Yup.string()
    .required("Status is required")
    .oneOf(
      ["planned", "in_progress", "delayed", "completed", "cancelled"],
      "Invalid status"
    ),
});

const fetchProjects = async () => {
  try {
    loading.value = true;
    error.value = null;
    console.log(
      "Fetching projects for role:",
      userRole.value,
      "userId:",
      userId.value
    );
    const response = await (userRole.value === "contractor"
      ? projectService.getProjects()
      : projectService.getMyProjects());
    projects.value = Array.isArray(response.data)
      ? response.data
      : response.data?.projects || [];
    projects.value = projects.value.map((project) => ({
      ...project,
      acceptedByContractor:
        project.acceptedByContractor ??
        (project.contractors?.some((c) => c.id === userId.value) &&
          project.status !== "planned"),
    }));
    console.log("Fetched projects:", projects.value);
    if (projects.value.length === 0) {
      console.warn("No projects returned from API");
      error.value =
        "No projects found. Please check your permissions or contact support.";
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || "Failed to load projects";
    console.error("Fetch Projects Error:", err);
  } finally {
    loading.value = false;
  }
};

const fetchPaymentHistory = async () => {
  try {
    console.log("Fetching payment history for user:", userId.value);
    const response = await projectService.getPaymentHistory();
    payments.value = response.data;
    console.log("Fetched payment history:", payments.value);
  } catch (err: any) {
    console.error("Fetch Payment History Error:", err);
    toastStore.error("Failed to load payment history", 7000); // Longer duration for success
  }
};

const fetchProjectDetail = async (projectId: number) => {
  try {
    const response = await projectService.getProject(projectId);
    projectDetail.value = {
      ...response.data,
      acceptedByContractor:
        response.data.acceptedByContractor ??
        (response.data.contractors?.some((c: any) => c.id === userId.value) &&
          response.data.status !== "planned"),
    };
    showDetailModal.value = true;
  } catch (err: any) {
    // showToast(
    //   err.response?.data?.message || "Failed to load project details",
    //   "error"
    // );
    toastStore.error("Failed to load project details", 7000);

    console.error("Fetch Project Detail Error:", err);
  }
};

const fetchSiteEngineers = async () => {
  try {
    const response = await projectService.getSiteEngineers();
    siteEngineers.value = response.data;
    console.log("Site Engineers:", siteEngineers.value);
  } catch (err: any) {
    toastStore.error("Failed to load site engineer", 7000);

    console.error("Fetch Site Engineers:", err);
  }
};

const navigateToProjectDetail = (projectId: number) => {
  fetchProjectDetail(projectId);
};

const filteredProjects = computed<Project[]>(() => {
  let filtered = [...projects.value];
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.location && p.location.toLowerCase().includes(query))
    );
  }
  if (statusFilter.value !== "All") {
    filtered = filtered.filter(
      (project) => project.status === statusFilter.value
    );
  }
  console.log("Filtered projects:", filtered);
  return filtered;
});

const formatStatusText = (status: string | undefined) => {
  if (!status) return 'Unknown';
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getProjectStatusClass = (status: string | undefined) => {
  switch (status ?? "unknown") {
    case "planned":
      return "bg-blue-100 text-blue-800";
    case "in_progress":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "delayed":
      return "bg-red-100 text-red-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const openUpdateModal = (project: Project) => {
  selectedProject.value = project;
  updateForm.value = {
    name: project.name,
    description: project.description,
    location: project.location,
    startDate: project.startDate.split("T")[0],
    endDate: project.endDate ? project.endDate.split("T")[0] : "",
    status: project.status,
  };
  showUpdateModal.value = true;
};

const updateProject = async () => {
  if (!selectedProject.value) return;
  try {
    await updateFormSchema.validate(updateForm.value, { abortEarly: false });
    updateFormErrors.value = {};

    if (
      updateForm.value.endDate &&
      new Date(updateForm.value.endDate) < new Date(updateForm.value.startDate)
    ) {
      toastStore.error("End date cannot be earlier than start date");

      return;
    }
    await projectService.updateProject(
      selectedProject.value.id,
      updateForm.value
    );
    await fetchProjects();
    showUpdateModal.value = false;
    toastStore.success("Project updated successfully");
  } catch (err: any) {
    if (err instanceof Yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((error: any) => {
        if (error.path) {
          errors[error.path] = error.message;
        }
      });
      updateFormErrors.value = errors;
    } else {
      // showToast(
      //   err.response?.data?.message || "Failed to update project",
      //   "error"
      // );
    }
  }
};

const deleteProject = async (projectId: number) => {
  if (!confirm("Are you sure you want to delete this project?")) return;
  try {
    await projectService.deleteProject(projectId);
    await fetchProjects();
    toastStore.success("Project deleted successfully");
  } catch (err: any) {
    // showToast(
    //   err.response?.data?.message || "Failed to delete project",
    //   "error"
    // );
    toastStore.error("failed to delete project");
  }
};

const acceptProject = async (projectId: number) => {
  try {
    await projectService.acceptProject(projectId);
    projects.value = projects.value.map((project) =>
      project.id === projectId
        ? {
            ...project,
            acceptedByContractor: true,
            contractors: project.contractors
              ? [...project.contractors, { id: userId.value }]
              : [{ id: userId.value }],
          }
        : project
    );
    toastStore.success("Project accepted successfully");
    await fetchProjects();
  } catch (err: any) {
    // showToast(
    //   err.response?.data?.message || "Failed to accept project",
    //   "error"
    // );
    toastStore.error("failed to update project");
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
    toastStore.success("Site engineer assigned successfully");
  } catch (err: any) {
    // showToast(
    //   err.response?.data?.message || "Failed to assign site engineer",
    //   "error"
    // );
    toastStore.error("failed to assign site engineer");
  }
};

const openPaymentModal = (project: Project, payeeId: number) => {
  if (!Number.isInteger(payeeId) || payeeId <= 0) {
    console.error("Invalid payeeId:", payeeId);
    toastStore.error("Invalid payee selected");
    return;
  }
  console.log("Opening payment modal:", { projectId: project.id, payeeId });
  selectedProject.value = project;
  selectedPayeeId.value = payeeId;
  showPaymentModal.value = true;
};

const handlePayeeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (target && selectedProject.value) {
    const payeeId = Number(target.value);
    console.log("Payee selected:", { payeeId });
    if (isNaN(payeeId) || payeeId <= 0) {
      console.error("Invalid payeeId from dropdown:", target.value);
      toastStore.error("Please select a valid payee");
      return;
    }
    openPaymentModal(selectedProject.value, payeeId);
  }
};

const handlePaymentSuccess = async () => {
  console.log('Payment success triggered');
  toastStore.success("Payment successful!");
  showPaymentModal.value = false;
  
  // Immediately update the UI optimistically
  if (selectedProject.value && selectedPayeeId.value) {
    const newPayment = {
      id: Date.now(), // Temporary ID
      projectId: selectedProject.value.id,
      payeeId: selectedPayeeId.value,
      status: 'succeeded',
      amount: 0,
      created_at: new Date().toISOString(),
      // Include both nested and flat properties for compatibility
      project: { id: selectedProject.value.id },
      payee: { id: selectedPayeeId.value }
    };
    
    console.log('Adding optimistic payment:', newPayment);
    payments.value = [...payments.value, newPayment];
  }
  
  // Then refresh the data in the background
  try {
    loading.value = true;
    console.log('Refreshing payment data...');
    await Promise.all([fetchPaymentHistory(), fetchProjects()]);
    console.log('Payment data refreshed');
  } catch (error) {
    console.error("Error updating payment status:", error);
    // Don't show error to user since we've already updated optimistically
  } finally {
    loading.value = false;
    selectedProject.value = null;
    selectedPayeeId.value = null;
  }
};

const handlePaymentError = (message: string) => {
  console.error("Payment error handled:", message);
  toastStore.error(message || "Failed to process payment");
  showPaymentModal.value = false;
  selectedProject.value = null;
  selectedPayeeId.value = null;
};

const canShowPaymentButton = (project: Project) => {
  console.log("canShowPaymentButton:", {
    projectId: project.id,
    userRole: userRole.value,
    userId: userId.value,
    canInitiate: canInitiatePayment.value,
    contractors: project.contractors,
    siteEngineers: project.siteEngineers,
    status: project.status,
  });
  if (!canInitiatePayment.value) return false;
  if (userRole.value === "client") {
    const hasContractors = (project.contractors?.length ?? 0) > 0;
    console.log("Client check:", {
      inProgress: project.status === "in_progress",
      hasContractors,
    });
    return project.status === "in_progress" && hasContractors;
  }
  if (userRole.value === "contractor") {
    const isAssigned =
      project.contractors?.some((c) => c.id === userId.value) ?? false;
    const hasSiteEngineers = (project.siteEngineers?.length ?? 0) > 0;
    console.log("Contractor check:", { isAssigned, hasSiteEngineers });
    return isAssigned && hasSiteEngineers;
  }
  return false;
};

const isPayeePaid = (projectId: number, payeeId: number) => {
  const paidStatuses = ['succeeded', 'paid', 'completed', 'payment_pending'];
  return payments.value.some(
    (payment) => {
      const projectMatch = payment.project?.id === projectId;
      const payeeMatch = payment.payee?.id === payeeId;
      const statusMatch = payment.status && paidStatuses.includes(payment.status.toLowerCase());
      
      console.log('isPayeePaid check:', {
        payment,
        projectId,
        payeeId,
        projectMatch,
        payeeMatch,
        statusMatch,
        status: payment.status
      });
      return projectMatch && payeeMatch && statusMatch;
    }
  );
};

const hasPaymentInProgress = (projectId: number, payeeId: number) => {
  const inProgressStatuses = ['processing', 'pending', 'in_progress', 'requires_payment_method', 'requires_confirmation', 'requires_action'];
  
  return payments.value.some(
    (payment) => {
      const projectMatch = payment.project?.id === projectId;
      const payeeMatch = payment.payee?.id === payeeId;
      const statusMatch = payment.status && inProgressStatuses.includes(payment.status.toLowerCase());
      
      console.log('hasPaymentInProgress check:', {
        payment,
        projectId,
        payeeId,
        projectMatch,
        payeeMatch,
        statusMatch,
        status: payment.status
      });
      
      return projectMatch && payeeMatch && statusMatch;
    }
  );
};

const getPayeeOptions = (project: Project): Payee[] => {
  const options =
    userRole.value === "client"
      ? project.contractors || []
      : userRole.value === "contractor"
      ? project.siteEngineers || []
      : [];
  return options.filter(
    (payee) => typeof payee.id === "number" && payee.id > 0
  );
};

</script>

<template>
  <div class="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Toast Notification -->
      <div
        v-if="toast.visible"
        :class="[
          'fixed top-4 right-4 p-4 rounded-md shadow-lg',
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
            <template v-if="userRole === 'contractor'">
              View and accept your assigned projects
            </template>
            <template v-else-if="userRole === 'site_engineer'">
              View your assigned projects
            </template>
            <template v-else-if="userRole === 'client'">
              Manage your created projects
            </template>
            <template v-else> Manage all projects </template>
          </p>
        </div>
        <div class="flex space-x-4">
          <router-link
            v-if="userRole === 'contractor'"
            to="/projects/accepted"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Accepted Projects
          </router-link>
          <router-link
            v-if="canCreateProject"
            to="/projects/create"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <svg
              class="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
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
          class="w-full sm:w-64 h-10 px-4 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          v-model="statusFilter"
          class="w-full sm:w-48 h-10 px-4 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
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
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-100 p-4 rounded-md">
        <div class="flex items-center">
          <svg
            class="h-5 w-5 text-red-600"
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
          <p class="ml-3 text-sm text-red-600">{{ error }}</p>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredProjects.length === 0"
        class="text-center py-12 bg-white rounded-md shadow"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          No projects found
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="searchQuery || statusFilter !== 'All'">
            Try adjusting your search or filter.
          </template>
          <template v-else>
            No projects assigned. Contact your admin.
          </template>
        </p>
        <div v-if="canCreateProject" class="mt-6">
          <router-link
            to="/projects/create"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
          class="bg-white rounded-md shadow"
        >
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 truncate">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ project.name || "Unnamed Project" }}
                  </h3>
                  <span
                    :class="[
                      getProjectStatusClass(project.status),
                      'px-2 py-1 text-xs rounded-full',
                    ]"
                  >
                    {{ formatStatusText(project.status) }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500 truncate">
                  {{ project.location || "No location specified" }}
                </p>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-medium text-gray-500">Start Date</p>
                <p class="text-sm text-gray-900">
                  {{
                    project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : "N/A"
                  }}
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
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="
                  (canUpdateDelete &&
                    (userRole === 'admin' || project.client?.id === userId)) ||
                  (userRole === 'contractor' &&
                    project.contractors?.some((c) => c.id === userId))
                "
                @click="openUpdateModal(project)"
                class="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
              >
                Edit
              </button>
              <button
                v-if="
                  canUpdateDelete &&
                  (userRole === 'admin' || project.client?.id === userId)
                "
                @click="deleteProject(project.id)"
                class="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <div v-if="userRole === 'contractor'">
                <button
                  v-if="!project.acceptedByContractor"
                  @click="acceptProject(project.id)"
                  class="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Accept
                </button>
                <span
                  v-else
                  class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
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
                class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Assign Site Engineer
              </button>
              <button
                v-if="
                  userRole === 'contractor' &&
                  project.contractors?.some((c) => c.id === userId) &&
                  project.siteEngineers?.length
                "
                class="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm"
                disabled
              >
                Site Engineer Assigned
              </button>
              <div v-if="canShowPaymentButton(project)">
                <select
                  v-if="getPayeeOptions(project).length > 1"
                  @change="handlePayeeChange"
                  class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  <option value="" disabled selected>Select Payee</option>
                  <option
                    v-for="payee in getPayeeOptions(project)"
                    :key="payee.id"
                    :value="payee.id"
                    :disabled="isPayeePaid(project.id, payee.id)"
                  >
                    Payee ID: {{ payee.id }}
                    {{ isPayeePaid(project.id, payee.id) ? "(Paid)" : "" }}
                  </option>
                </select>
                <template v-if="getPayeeOptions(project).length === 1">
                  <template v-if="!isPayeePaid(project.id, getPayeeOptions(project)[0].id)">
                    <button
                      v-if="!hasPaymentInProgress(project.id, getPayeeOptions(project)[0].id)"
                      @click="openPaymentModal(project, getPayeeOptions(project)[0].id)"
                      :disabled="loading"
                      class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <span>Pay</span>
                      <svg v-if="loading" class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </button>
                    <span
                      v-else
                      class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium flex items-center gap-1"
                    >
                     
paid                    </span>
                  </template>
                  <span
                    v-else
                    class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium flex items-center gap-1"
                  >
                    <svg class="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Paid
                  </span>
                </template>
                <span v-else class="text-sm text-gray-500"
                  >No valid payees available</span
                >
              </div>
              <button
                @click="navigateToProjectDetail(project.id)"
                class="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
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
        <div class="bg-white rounded-md p-6 w-full max-w-md">
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
                class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': updateFormErrors.name }"
              />
              <p v-if="updateFormErrors.name" class="mt-1 text-sm text-red-500">
                {{ updateFormErrors.name }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Description</label
              >
              <textarea
                v-model="updateForm.description"
                rows="3"
                class="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': updateFormErrors.description }"
              />
              <p
                v-if="updateFormErrors.description"
                class="mt-1 text-sm text-red-500"
              >
                {{ updateFormErrors.description }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Location</label
              >
              <input
                v-model="updateForm.location"
                type="text"
                required
                class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': updateFormErrors.location }"
              />
              <p
                v-if="updateFormErrors.location"
                class="mt-1 text-sm text-red-500"
              >
                {{ updateFormErrors.location }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Start Date</label
              >
              <input
                v-model="updateForm.startDate"
                type="date"
                required
                class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': updateFormErrors.startDate }"
              />
              <p
                v-if="updateFormErrors.startDate"
                class="mt-1 text-sm text-red-500"
              >
                {{ updateFormErrors.startDate }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >End Date</label
              >
              <input
                v-model="updateForm.endDate"
                type="date"
                class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': updateFormErrors.endDate }"
              />
              <p
                v-if="updateFormErrors.endDate"
                class="mt-1 text-sm text-red-500"
              >
                {{ updateFormErrors.endDate }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Status</label
              >
              <select
                v-model="updateForm.status"
                class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors duration-200"
                :class="{ 'border-red-500': updateFormErrors.status }"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p
                v-if="updateFormErrors.status"
                class="mt-1 text-sm text-red-500"
              >
                {{ updateFormErrors.status }}
              </p>
            </div>
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showUpdateModal = false"
                class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                @click="updateProject"
                class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Update
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
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              Assign Site Engineer
            </h3>
            <button
              @click="showAssignModal = false"
              class="text-gray-400 hover:text-gray-500"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Select Site Engineer
                <span class="text-red-500">*</span>
              </label>

              <div class="relative">
                <select
                  v-model="selectedSiteEngineer"
                  class="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm appearance-none bg-white"
                >
                  <option value="null" disabled selected>
                    Choose an engineer...
                  </option>
                  <option
                    v-for="siteEngineer in siteEngineers"
                    :key="siteEngineer.id"
                    :value="siteEngineer.id"
                    class="py-2"
                  >
                    {{ siteEngineer.firstName }} {{ siteEngineer.lastName }}
                  </option>
                </select>
                <div
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                >
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              <p
                v-if="!selectedSiteEngineer"
                class="mt-1 text-sm text-gray-500"
              >
                Please select a site engineer to assign
              </p>
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                @click="showAssignModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                @click="assignSiteEngineer"
                :disabled="!selectedSiteEngineer"
                :class="[
                  'px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2',
                  selectedSiteEngineer
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-blue-300 cursor-not-allowed',
                ]"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Modal -->
      <div
        v-if="showPaymentModal && selectedProject && selectedPayeeId"
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-800"
      >
        <div class="bg-white rounded-md p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
          <PaymentForm
            :project-id="selectedProject.id"
            :payee-id="selectedPayeeId"
            @payment-success="handlePaymentSuccess"
            @payment-error="handlePaymentError"
            @close="showPaymentModal = false"
          />
        </div>
      </div>

      <!-- Project Detail Modal -->
      <div
        v-if="showDetailModal && projectDetail"
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-md p-8 w-full max-w-md">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">
            Project Details
          </h3>
          <div class="space-y-0">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ID</label
              >
              <p class="text-sm text-gray-900">{{ projectDetail.id }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Name</label
              >
              <p class="text-sm text-gray-900">{{ projectDetail.name }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Description</label
              >
              <p class="text-sm text-gray-600">
                {{ projectDetail.description || "No description" }}
              </p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Location</label
              >
              <p class="text-sm text-gray-600">
                {{ projectDetail.location || "No location" }}
              </p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Start Date</label
              >
              <p class="text-sm text-gray-600">
                {{ new Date(projectDetail.startDate).toLocaleDateString() }}
              </p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >End Date</label
              >
              <p class="text-sm text-gray-600">
                {{
                  projectDetail.endDate
                    ? new Date(projectDetail.endDate).toLocaleDateString()
                    : "N/A"
                }}
              </p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Status</label
              >
              <p class="text-sm text-gray-600">{{ projectDetail.status }}</p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Client ID</label
              >
              <p class="text-sm text-gray-600">
                {{ projectDetail.client?.id || "N/A" }}
              </p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Contractors</label
              >
              <p class="text-sm text-gray-600">
                {{
                  projectDetail.contractors?.map((c) => c.id).join(", ") ||
                  "None"
                }}
              </p>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Site Engineers</label
              >
              <p class="text-sm text-gray-600">
                {{
                  projectDetail.siteEngineers?.map((e) => e.id).join(", ") ||
                  "None"
                }}
              </p>
            </div>

            <div class="flex justify-end mt-4">
              <button
                @click="showDetailModal = false"
                class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-700 hover:text-white"
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

<style scoped>
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
</style>
```
