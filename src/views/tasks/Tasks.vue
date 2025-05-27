```vue
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { taskService } from "../../services/api";

interface Task {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  progress: number;
  assignedToIds: number[];
  dependencyIds: number[];
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

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const projectId = computed(() => String(route.params.projectId));
const userRole = computed(() => authStore.userRole as string);
// Restrict task creation to contractors and site engineers
const canCreateTask = computed(() => ["contractor", "site_engineer"].includes(userRole.value));
const canUpdateDelete = computed(() => userRole.value === "site_engineer");

const tasks = ref<Task[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false,
});

const fetchTasks = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await taskService.getTasks(projectId.value);
    tasks.value = response.data;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    error.value = apiError.response?.data?.message || "Failed to load tasks";
  } finally {
    loading.value = false;
  }
};

const getTaskStatusClass = (status: string) => {
  switch (status) {
    case "Not Started":
      return "bg-blue-500 text-white";
    case "In Progress":
      return "bg-yellow-500 text-white";
    case "Completed":
      return "bg-green-500 text-white";
    case "Delayed":
      return "bg-red-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const navigateToTaskDetail = (taskId: number) => {
  router.push(`/projects/${projectId.value}/tasks/${taskId}`);
};

const deleteTask = async (taskId: number) => {
  if (!canUpdateDelete.value) {
    showToast("You are not authorized to delete tasks", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await taskService.deleteTask(projectId.value, String(taskId));
    await fetchTasks();
    showToast("Task deleted successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to delete task", "error");
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

onMounted(fetchTasks);
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Tasks</h1>
    <div v-if="toast.visible" :class="[
      'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300',
      toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
    ]">
      {{ toast.message }}
    </div>
    <!-- Create Task button: visible only to contractors and site engineers -->
    <div v-if="canCreateTask" class="mb-6 flex justify-end">
      <router-link
        :to="`/projects/${projectId}/tasks/create`"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-300"
      >
        Create Task
      </router-link>
    </div>
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
    <div v-else-if="error" class="bg-red-100 p-4 rounded-lg">
      <p class="text-sm font-medium text-red-800">{{ error }}</p>
    </div>
    <div v-else-if="tasks.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <p class="text-gray-500">No tasks found.</p>
      <router-link
        v-if="canCreateTask"
        :to="`/projects/${projectId}/tasks/create`"
        class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-300"
      >
        Create Task
      </router-link>
    </div>
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900 truncate">{{ task.name }}</h3>
            <span
              :class="[
                getTaskStatusClass(task.status),
                'px-2 py-1 text-xs rounded-full',
              ]"
            >
              {{ task.status }}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500 truncate">{{ task.description || "N/A" }}</p>
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-medium text-gray-500">Start Date</p>
              <p class="text-sm text-gray-900">{{ new Date(task.startDate).toLocaleDateString() }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500">End Date</p>
              <p class="text-sm text-gray-900">
                {{ task.endDate ? new Date(task.endDate).toLocaleDateString() : "N/A" }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500">Progress</p>
              <p class="text-sm text-gray-900">{{ task.progress }}%</p>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              @click="navigateToTaskDetail(task.id)"
              class="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
            >
              View Details
            </button>
            <button
              v-if="canUpdateDelete"
              @click="navigateToTaskDetail(task.id)"
              class="inline-flex items-center px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
            >
              Edit
            </button>
            <button
              v-if="canUpdateDelete"
              @click="deleteTask(task.id)"
              class="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```