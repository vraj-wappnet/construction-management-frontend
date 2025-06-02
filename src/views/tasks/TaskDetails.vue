<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { taskService } from "../../services/api";
import { apiClient } from "../../services/api";

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

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

interface ApiTaskResponse {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  progress: number;
  assignedTo: { id: number; email: string; firstName: string; lastName: string; [key: string]: any }[];
  dependencies: { id: number }[];
  project: { id: number; name: string; [key: string]: any };
}

interface ApiError {
  response?: {
    status?: number;
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

const projectId = computed(() => String(route.params.projectId || ""));
const taskId = computed(() => String(route.params.id || ""));
const userRole = computed(() => authStore.userRole as string);
const canUpdateDelete = computed(() => userRole.value === "site_engineer");

const task = ref<Task | null>(null);
const users = ref<User[]>([]);
const tasks = ref<Task[]>([]);
const loading = ref(true);
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false,
});

const updateForm = ref({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "",
  progress: 0,
  assignedToIds: [] as number[],
  dependencyIds: [] as number[],
});

const showUpdateModal = ref<boolean>(false);

// Map user IDs to names for display
const userMap = computed(() => {
  const map = new Map<number, string>();
  users.value.forEach((user) => {
    map.set(user.id, `${user.firstName} ${user.lastName}`);
  });
  return map;
});

const assignedToNames = computed(() =>
  task.value?.assignedToIds.map((id) => userMap.value.get(id) || `User ${id}`).join(", ") || "None"
);

const dependencyNames = computed(() =>
  task.value?.dependencyIds
    .map((id) => tasks.value.find((t) => t.id === id)?.name || `Task ${id}`)
    .join(", ") || "None"
);

// Safely parse date to YYYY-MM-DD
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const fetchTask = async () => {
  if (!projectId.value || !taskId.value) {
    console.error("Invalid projectId or taskId:", { projectId: projectId.value, taskId: taskId.value });
    showToast("Invalid project or task ID", "error");
    router.push("/projects");
    return;
  }

  try {
    loading.value = true;
    console.log(`Fetching task: /projects/${projectId.value}/tasks/${taskId.value}`);
    const response = await taskService.getTask(projectId.value, taskId.value);
    console.log("Task response:", response.data);

    if (!response.data) {
      throw new Error("No task data returned");
    }

    const apiTask = response.data as ApiTaskResponse;

    // Transform API response to match Task interface
    task.value = {
      id: apiTask.id,
      name: apiTask.name,
      description: apiTask.description,
      startDate: apiTask.startDate,
      endDate: apiTask.endDate,
      status: apiTask.status,
      progress: apiTask.progress,
      assignedToIds: apiTask.assignedTo.map((user) => user.id),
      dependencyIds: apiTask.dependencies.map((dep) => dep.id),
    };
    // Safely assign updateForm
    try {
      updateForm.value = {
        name: task.value.name || "",
        description: task.value.description || "",
        startDate: formatDate(task.value.startDate),
        endDate: formatDate(task.value.endDate),
        status: task.value.status || "Not Started",
        progress: task.value.progress || 0,
        assignedToIds: Array.isArray(task.value.assignedToIds) ? task.value.assignedToIds : [],
        dependencyIds: Array.isArray(task.value.dependencyIds) ? task.value.dependencyIds : [],
      };
      console.log("updateForm assigned:", updateForm.value);
    } catch (err) {
      console.error("Error assigning updateForm:", err);
      showToast("Failed to initialize update form", "error");
    }

    await nextTick(); // Ensure reactivity
    console.log("Task loaded:", { loading: loading.value, task: task.value });
  } catch (err: unknown) {
    const apiError = err as ApiError;
    console.error("Fetch task error:", apiError);
    const message =
      apiError.response?.status === 404
        ? "Task not found"
        : apiError.response?.data?.message || "Failed to load task details";
    showToast(message, "error");
    if (apiError.response?.status === 404) {
      router.push(`/projects/${projectId.value}/tasks`);
    }
  } finally {
    loading.value = false;
    console.log("Finally block, loading:", loading.value);
  }
};

const fetchUsers = async () => {
  try {
    const response = await apiClient.get("/users");
    users.value = Array.isArray(response.data) ? response.data : [];
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load users",
      "error"
    );
  }
};

const fetchTasks = async () => {
  try {
    const response = await taskService.getTasks(projectId.value);
    tasks.value = Array.isArray(response.data)
      ? response.data
          .filter((t: ApiTaskResponse) => t.id !== Number(taskId.value))
          .map((t: ApiTaskResponse) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            startDate: t.startDate,
            endDate: t.endDate,
            status: t.status,
            progress: t.progress,
            assignedToIds: t.assignedTo.map((user) => user.id),
            dependencyIds: t.dependencies.map((dep) => dep.id),
          }))
      : [];
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load tasks",
      "error"
    );
  }
};

const updateTask = async () => {
  if (!canUpdateDelete.value) {
    showToast("You are not authorized to update tasks", "error");
    return;
  }
  if (!updateForm.value.name || !updateForm.value.startDate) {
    showToast("Name and start date are required", "error");
    return;
  }
  if (
    updateForm.value.endDate &&
    new Date(updateForm.value.endDate) < new Date(updateForm.value.startDate)
  ) {
    showToast("End date cannot be earlier than start date", "error");
    return;
  }
  if (!taskId.value) {
    showToast("Invalid task ID", "error");
    return;
  }
  try {
    const taskData = {
      name: updateForm.value.name,
      description: updateForm.value.description,
      startDate: new Date(updateForm.value.startDate).toISOString(),
      endDate: updateForm.value.endDate
        ? new Date(updateForm.value.endDate).toISOString()
        : undefined,
      status: updateForm.value.status,
      progress: updateForm.value.progress,
      assignedTo: updateForm.value.assignedToIds.map((id) => ({ id })),
      dependencies: updateForm.value.dependencyIds.map((id) => ({ id })),
    };
    console.log(
      `Updating task: /projects/${projectId.value}/tasks/${taskId.value}`,
      taskData
    );
    await taskService.updateTask(projectId.value, taskId.value, taskData);
    await fetchTask();
    showUpdateModal.value = false;
    showToast("Task updated successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to update task",
      "error"
    );
  }
};

const deleteTask = async () => {
  if (!canUpdateDelete.value) {
    showToast("You are not authorized to delete tasks", "error");
    return;
  }
  if (!taskId.value) {
    showToast("Invalid task ID", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await taskService.deleteTask(projectId.value, taskId.value);
    showToast("Task deleted successfully", "success");
    router.push(`/projects/${projectId.value}/tasks`);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to delete task",
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

onMounted(() => {
  console.log("Route params:", route.params);
  fetchTask();
  if (canUpdateDelete.value) {
    fetchUsers();
    fetchTasks();
  }
});
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
    <h1 class="text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Task Details</h1>

    <!-- Toast Notification -->
    <div
      v-if="toast.visible"
      :class="[
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform',
        toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800',
        'animate-fade-in'
      ]"
    >
      {{ toast.message }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-[200px]">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
    </div>

    <!-- Task Details -->
    <div v-else-if="task" class="bg-white rounded-xl shadow-sm p-6 sm:p-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700">Task Name</label>
          <p class="mt-1 text-lg font-semibold text-gray-900">{{ task.name }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <p
            :class="[
              'mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'Completed' ? 'bg-green-100 text-green-800' :
              task.status === 'Delayed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            ]"
          >
            {{ task.status }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <p class="mt-1 text-sm text-gray-600">{{ task.description || "N/A" }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Progress</label>
          <div class="mt-1">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div
                :class="[
                  'h-2.5 rounded-full transition-all duration-300',
                  task.progress >= 70 ? 'bg-green-600' : task.progress >= 30 ? 'bg-yellow-600' : 'bg-red-600'
                ]"
                :style="{ width: `${task.progress}%` }"
              ></div>
            </div>
            <p class="mt-1 text-sm text-gray-600">{{ task.progress }}%</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Start Date</label>
          <p class="mt-1 text-sm text-gray-600">{{ formatDate(task.startDate) }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">End Date</label>
          <p class="mt-1 text-sm text-gray-600">{{ task.endDate ? formatDate(task.endDate) : "N/A" }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Assigned To</label>
          <p class="mt-1 text-sm text-gray-600">{{ assignedToNames }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Dependencies</label>
          <p class="mt-1 text-sm text-gray-600">{{ dependencyNames }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="canUpdateDelete" class="mt-8 flex justify-end space-x-4">
        <button
          @click="showUpdateModal = true"
          class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
        >
          Edit Task
        </button>
        <button
          @click="deleteTask"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Delete Task
        </button>
      </div>
    </div>

    <!-- Task Not Found -->
    <div v-else class="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
      <p class="text-lg text-red-600 font-medium">Task not found.</p>
      <router-link
        :to="`/projects/${projectId}/tasks`"
        class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Back to Tasks
      </router-link>
    </div>

    <!-- Update Task Modal -->
    <div
      v-if="showUpdateModal"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Update Task</h2>
          <button
            @click="showUpdateModal = false"
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="updateTask" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Task Name</label>
            <input
              v-model="updateForm.name"
              type="text"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              :class="{ 'border-red-500': !updateForm.name }"
            />
            <p v-if="!updateForm.name" class="mt-1 text-sm text-red-600">Task name is required</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="updateForm.description"
              rows="4"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              v-model="updateForm.startDate"
              type="date"
              required
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              :class="{ 'border-red-500': !updateForm.startDate }"
            />
            <p v-if="!updateForm.startDate" class="mt-1 text-sm text-red-600">Start date is required</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">End Date</label>
            <input
              v-model="updateForm.endDate"
              type="date"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select
              v-model="updateForm.status"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Progress (%)</label>
            <input
              v-model.number="updateForm.progress"
              type="number"
              min="0"
              max="100"
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Assign To</label>
            <select
              v-model="updateForm.assignedToIds"
              multiple
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.firstName }} {{ user.lastName }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Dependencies</label>
            <select
              v-model="updateForm.dependencyIds"
              multiple
              class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option v-for="task in tasks" :key="task.id" :value="task.id">
                {{ task.name }}
              </option>
            </select>
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="showUpdateModal = false"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
