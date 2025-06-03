<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import PaymentForm from './PaymentForm.vue';
import { useAuthStore } from '../../stores/auth';
import { projectService } from '../../services/api';

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
  type: 'success' | 'error';
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
const route = useRoute();

const projects = ref<Project[]>([]);
const payments = ref<Payment[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref('All');
const showUpdateModal = ref(false);
const showAssignModal = ref(false);
const showDetailModal = ref(false);
const showPaymentModal = ref(false);
const selectedProject = ref<Project | null>(null);
const projectDetail = ref<Project | null>(null);
const selectedPayeeId = ref<number | null>(null);
const updateForm = ref<UpdateForm>({
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  status: '',
});
const siteEngineers = ref<SiteEngineer[]>([]);
const selectedSiteEngineer = ref<number | null>(null);
const toast = ref<Toast>({
  message: '',
  type: 'success',
  visible: false,
});

const userRole = computed(() => authStore.userRole as string);
const userId = computed(() => Number(authStore.user?.id) || 0);

const canInitiatePayment = computed(() => ['client', 'contractor'].includes(userRole.value));
const canCreateProject = computed(() => ['admin', 'client'].includes(userRole.value));
const canUpdateDelete = computed(() => {
  const canUpdate = ['admin', 'client'].includes(userRole.value);
  console.log('canUpdateDelete:', { userRole: userRole.value, canUpdate });
  return canUpdate;
});

// Debug payment modal conditions
watch([showPaymentModal, selectedProject, selectedPayeeId], () => {
  console.log('Payment modal state:', {
    showPaymentModal: showPaymentModal.value,
    selectedProjectId: selectedProject.value?.id,
    selectedPayeeId: selectedPayeeId.value,
  });
});

onMounted(async () => {
  console.log('Auth state:', {
    userRole: userRole.value,
    userId: userId.value,
    authStore: authStore.user,
  });
  if (!authStore.user?.id || !userRole.value) {
    console.warn('Invalid auth state, redirecting to login');
    showToast('Please log in to view projects', 'error');
    // window.location.href = '/login';
  }
  await Promise.all([fetchProjects(), fetchPaymentHistory()]);
  if (userRole.value === 'contractor') {
    await fetchSiteEngineers();
  }
});

const fetchProjects = async () => {
  try {
    loading.value = true;
    error.value = null;
    console.log('Fetching projects for role:', userRole.value, 'userId:', userId.value, 'route:', route.path);
    let response;
    if (userRole.value === 'contractor' && route.path === '/projects/accepted') {
      console.log('Fetching accepted projects for contractor');
      response = await projectService.getProjects();
      const data = Array.isArray(response.data) ? response.data : response.data?.projects || [];
      projects.value = data.filter((project: Project) => project.acceptedByContractor === true);
    } else {
      response = await (userRole.value === 'contractor'
        ? projectService.getProjects()
        : projectService.getMyProjects());
      projects.value = Array.isArray(response.data)
        ? response.data
        : response.data?.projects || [];
    }
    projects.value = projects.value.map((project) => ({
      ...project,
      acceptedByContractor:
        project.acceptedByContractor ??
        (project.contractors?.some((c: { id: number }) => c.id === userId.value) &&
          project.status !== 'planned'),
    }));
    console.log('Fetched projects:', projects.value);
    if (projects.value.length === 0) {
      console.warn('No projects found');
      error.value = route.path === '/projects/accepted'
        ? 'No accepted projects found.'
        : 'No projects found. Please check your permissions or contact support.';
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load projects';
    console.error('Fetch Projects Error:', err);
  } finally {
    loading.value = false;
  }
};

const fetchPaymentHistory = async () => {
  try {
    console.log('Fetching payment history for user:', userId.value);
    const response = await projectService.getPaymentHistory();
    payments.value = response.data;
    console.log('Fetched payment history:', payments.value);
  } catch (err: any) {
    console.error('Fetch Payment History Error:', err);
    showToast('Failed to load payment history', 'error');
  }
};

const fetchProjectDetail = async (projectId: number) => {
  try {
    const response = await projectService.getProject(projectId);
    projectDetail.value = {
      ...response.data,
      acceptedByContractor:
        response.data.acceptedByContractor ??
        (response.data.contractors?.some((c: { id: number }) => c.id === userId.value) &&
          response.data.status !== 'planned'),
    };
    showDetailModal.value = true;
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed to load project details', 'error');
    console.error('Fetch Project Detail Error:', err);
  }
};

const fetchSiteEngineers = async () => {
  try {
    const response = await projectService.getSiteEngineers();
    siteEngineers.value = response.data;
    console.log('Site Engineers:', siteEngineers.value);
  } catch (err: any) {
    showToast('Failed to load site engineers', 'error');
    console.error('Fetch Site Engineers:', err);
  }
};

const navigateToProjectDetail = (projectId: number) => {
  fetchProjectDetail(projectId);
};

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
  if (statusFilter.value !== 'All') {
    filtered = filtered.filter((project) => project.status === statusFilter.value);
  }
  console.log('Filtered projects:', filtered);
  return filtered;
});

const getProjectStatusClass = (status: string) => {
  switch (status) {
    case 'planned':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'delayed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const openUpdateModal = (project: Project) => {
  selectedProject.value = project;
  updateForm.value = {
    name: project.name,
    description: project.description,
    location: project.location,
    startDate: project.startDate.split('T')[0],
    endDate: project.endDate ? project.endDate.split('T')[0] : '',
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
      showToast('End date cannot be earlier than start date', 'error');
      return;
    }
    await projectService.updateProject(selectedProject.value.id, updateForm.value);
    await fetchProjects();
    showUpdateModal.value = false;
    showToast('Project updated successfully', 'success');
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed to update project', 'error');
  }
};

const deleteProject = async (projectId: number) => {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    await projectService.deleteProject(projectId);
    await fetchProjects();
    showToast('Project deleted successfully', 'success');
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed to delete project', 'error');
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
    showToast('Project accepted successfully', 'success');
    await fetchProjects();
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed to accept project', 'error');
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
    showToast('Site engineer assigned successfully', 'success');
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Failed to assign site engineer', 'error');
  }
};

const openPaymentModal = (project: Project, payeeId: number) => {
  if (!Number.isInteger(payeeId) || payeeId <= 0) {
    console.error('Invalid payeeId:', payeeId);
    showToast('Invalid payee selected', 'error');
    return;
  }
  console.log('Opening payment modal:', { projectId: project.id, payeeId });
  selectedProject.value = project;
  selectedPayeeId.value = payeeId;
  showPaymentModal.value = true;
};

const handlePayeeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (target && selectedProject.value) {
    const payeeId = Number(target.value);
    console.log('Payee selected:', { payeeId });
    if (isNaN(payeeId) || payeeId <= 0) {
      console.error('Invalid payeeId from dropdown:', target.value);
      showToast('Please select a valid payee', 'error');
      return;
    }
    openPaymentModal(selectedProject.value, payeeId);
  }
};

const handlePaymentSuccess = async () => {
  console.log('Payment success handled for project:', selectedProject.value?.id, 'payee:', selectedPayeeId.value);
  showToast('Payment processed successfully', 'success');
  showPaymentModal.value = false;
  selectedProject.value = null;
  selectedPayeeId.value = null;
  await Promise.all([fetchProjects(), fetchPaymentHistory()]);
};

const handlePaymentError = (message: string) => {
  console.error('Payment error handled:', message);
  showToast(message || 'Failed to process payment', 'error');
  showPaymentModal.value = false;
  selectedProject.value = null;
  selectedPayeeId.value = null;
};

const canShowPaymentButton = (project: Project) => {
  console.log('canShowPaymentButton:', {
    projectId: project.id,
    userRole: userRole.value,
    userId: userId.value,
    canInitiate: canInitiatePayment.value,
    contractors: project.contractors,
    siteEngineers: project.siteEngineers,
    status: project.status,
  });
  if (!canInitiatePayment.value) return false;
  if (userRole.value === 'client') {
    const hasContractors = (project.contractors?.length ?? 0) > 0;
    console.log('Client check:', { inProgress: project.status === 'in_progress', hasContractors });
    return project.status === 'in_progress' && hasContractors;
  }
  if (userRole.value === 'contractor') {
    const isAssigned = project.contractors?.some((c: { id: number }) => c.id === userId.value);
    const hasSiteEngineers = (project.siteEngineers?.length ?? 0) > 0;
    console.log('Contractor check:', { isAssigned, hasSiteEngineers });
    return isAssigned && hasSiteEngineers;
  }
  return false;
};

const isPayeePaid = (projectId: number, payeeId: number) => {
  const paid = payments.value.some(
    (payment) =>
      payment.project.id === projectId &&
      payment.payee.id === payeeId &&
      payment.status === 'succeeded'
  );
  console.log('isPayeePaid:', { projectId, payeeId, paid });
  return paid;
};

const getPayeeOptions = (project: Project) => {
  const options = userRole.value === 'client'
    ? project.contractors || []
    : userRole.value === 'contractor'
    ? project.siteEngineers || []
    : [];
  console.log('getPayeeOptions:', {
    projectId: project.id,
    options,
    valid: options.every(payee => typeof payee.id === 'number' && payee.id > 0),
  });
  return options.filter(payee => typeof payee.id === 'number' && payee.id > 0);
};

const showToast = (message: string, type: 'success' | 'error') => {
  console.log('Showing toast:', { message, type });
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
          'fixed top-4 right-4 p-4 rounded-md shadow-lg',
          toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
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
            <template v-else>
              Manage all projects
            </template>
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
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <h3 class="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
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
        <div v-for="project in filteredProjects" :key="project.id" class="bg-white rounded-md shadow">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 truncate">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ project.name || 'Unnamed Project' }}
                  </h3>
                  <span
                    :class="[
                      getProjectStatusClass(project.status),
                      'px-2 py-1 text-xs rounded-full',
                    ]"
                  >
                    {{ project.status || 'Unknown' }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-500 truncate">
                  {{ project.location || 'No location specified' }}
                </p>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs font-medium text-gray-500">Start Date</p>
                <p class="text-sm text-gray-900">
                  {{ project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A' }}
                </p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-500">End Date</p>
                <p class="text-sm text-gray-900">
                  {{ project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A' }}
                </p>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="canUpdateDelete && (userRole === 'admin' || project.client?.id === userId)"
                @click="openUpdateModal(project)"
                class="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
              >
                Edit
              </button>
              <button
                v-if="canUpdateDelete && (userRole === 'admin' || project.client?.id === userId)"
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
                  project.contractors?.some((c: { id: number }) => c.id === userId) &&
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
                  project.contractors?.some((c: { id: number }) => c.id === userId) &&
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
                    Payee ID: {{ payee.id }} {{ isPayeePaid(project.id, payee.id) ? '(Paid)' : '' }}
                  </option>
                </select>
                <button
                  v-else-if="getPayeeOptions(project).length === 1 && !isPayeePaid(project.id, getPayeeOptions(project)[0].id)"
                  @click="openPaymentModal(project, getPayeeOptions(project)[0].id)"
                  class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Pay
                </button>
                <span
                  v-else-if="getPayeeOptions(project).length >= 1 && getPayeeOptions(project).every(payee => isPayeePaid(project.id, payee.id))"
                  class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                >
                  All Paid
                </span>
                <span
                  v-else-if="getPayeeOptions(project).length === 1 && isPayeePaid(project.id, getPayeeOptions(project)[0].id)"
                  class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                >
                  Paid
                </span>
                <span v-else class="text-sm text-gray-500">No valid payees available</span>
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
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input
                v-model="updateForm.name"
                type="text"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                v-model="updateForm.description"
                rows="3"
                class="mt-1 w-full rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Location</label>
              <input
                v-model="updateForm.location"
                type="text"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                v-model="updateForm.startDate"
                type="date"
                required
                class="mt-1 w-full h-10 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">End Date</label>
              <input
                v-model="updateForm.endDate"
                type="date"
                class="mt-1 w-full h-10 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Status</label>
              <select
                v-model="updateForm.status"
                class="mt-1 w-full h-10 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showUpdateModal = false"
                class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                @click="updateProject"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        <div class="bg-white rounded-md p-6 w-full max-w-md">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Assign Site Engineer</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Select Site Engineer</label>
              <select
                v-model="selectedSiteEngineer"
                class="mt-1 w-full h-10 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="null" disabled selected>Select a site engineer</option>
                <option
                  v-for="siteEngineer in siteEngineers"
                  :key="siteEngineer.id"
                  :value="siteEngineer.id"
                >
                  {{ siteEngineer.firstName }} {{ siteEngineer.lastName }}
                </option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showAssignModal = false"
                class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                @click="assignSiteEngineer"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
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
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Project Details</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <p class="text-sm text-gray-900">{{ projectDetail.id }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p class="text-sm text-gray-900">{{ projectDetail.name }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p class="text-sm text-gray-600">{{ projectDetail.description || 'No description' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <p class="text-sm text-gray-600">{{ projectDetail.location || 'No location' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <p class="text-sm text-gray-600">
                {{ new Date(projectDetail.startDate).toLocaleDateString() }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <p class="text-sm text-gray-600">
                {{ projectDetail.endDate ? new Date(projectDetail.endDate).toLocaleDateString() : 'N/A' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p class="text-sm text-gray-600">{{ projectDetail.status }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <p class="text-sm text-gray-600">{{ projectDetail.client?.id || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contractors</label>
              <p class="text-sm text-gray-600">
                {{ projectDetail.contractors?.map((c) => c.id).join(', ') || 'None' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Site Engineers</label>
              <p class="text-sm text-gray-600">
                {{ projectDetail.siteEngineers?.map((e) => e.id).join(', ') || 'None' }}
              </p>
            </div>
            <div v-if="canShowPaymentButton(projectDetail)">
              <select
                v-if="getPayeeOptions(projectDetail).length > 1"
                @change="handlePayeeChange"
                class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <option value="" disabled selected>Select Payee</option>
                <option
                  v-for="payee in getPayeeOptions(projectDetail)"
                  :key="payee.id"
                  :value="payee.id"
                  :disabled="isPayeePaid(projectDetail.id, payee.id)"
                >
                  Payee ID: {{ payee.id }} {{ isPayeePaid(projectDetail.id, payee.id) ? '(Paid)' : '' }}
                </option>
              </select>
              <button
                v-else-if="getPayeeOptions(projectDetail).length === 1 && !isPayeePaid(projectDetail.id, getPayeeOptions(projectDetail)[0].id)"
                @click="openPaymentModal(projectDetail, getPayeeOptions(projectDetail)[0].id)"
                class="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Pay
              </button>
              <span
                v-else-if="getPayeeOptions(projectDetail).length >= 1 && getPayeeOptions(projectDetail).every(payee => isPayeePaid(projectDetail.id, payee.id))"
                class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
              >
                All Paid
              </span>
              <span
                v-else-if="getPayeeOptions(projectDetail).length === 1 && isPayeePaid(projectDetail.id, getPayeeOptions(projectDetail)[0].id)"
                class="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
              >
                Paid
              </span>
              <span v-else class="text-sm text-gray-600">No valid payees available</span>
            </div>
            <div class="flex justify-end mt-4">
              <button
                @click="showDetailModal = false"
                class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
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
