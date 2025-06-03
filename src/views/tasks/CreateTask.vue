<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { taskService } from "../../services/api";
import { apiClient } from "../../services/api"; // Assuming apiClient is exported

interface TaskForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
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

interface Task {
  id: number;
  name: string;
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
const canCreateTask = computed(() => ["contractor", "site_engineer"].includes(userRole.value));

const taskForm = ref<TaskForm>({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "Not Started",
  progress: 0,
  assignedToIds: [],
  dependencyIds: [],
});
const users = ref<User[]>([]);
const tasks = ref<Task[]>([]);
const loading = ref(false);
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false
});

const fetchUsers = async () => {
  try {
    const response = await apiClient.get("/users"); // Adjust endpoint if needed
    users.value = response.data;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to load users", "error");
  }
};

const fetchTasks = async () => {
  try {
    const response = await taskService.getTasks(projectId.value);
    tasks.value = response.data;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to load tasks", "error");
  }
};

const submitTask = async () => {
  if (!canCreateTask.value) {
    showToast("You are not authorized to create tasks", "error");
    return;
  }
  if (!taskForm.value.name || !taskForm.value.startDate) {
    showToast("Name and start date are required", "error");
    return;
  }
  if (
    taskForm.value.endDate &&
    new Date(taskForm.value.endDate) < new Date(taskForm.value.startDate)
  ) {
    showToast("End date cannot be earlier than start date", "error");
    return;
  }
  try {
    loading.value = true;
    // Prepare task data without dependencyIds
    const taskData = {
      name: taskForm.value.name,
      description: taskForm.value.description,
      startDate: new Date(taskForm.value.startDate).toISOString(),
      endDate: taskForm.value.endDate ? new Date(taskForm.value.endDate).toISOString() : undefined,
      status: taskForm.value.status,
      progress: taskForm.value.progress,
      assignedToIds: taskForm.value.assignedToIds,
    };
    const response = await taskService.createTask(projectId.value, taskData);
    const taskId = response.data.id;
    // Add dependencies
    for (const dependencyId of taskForm.value.dependencyIds) {
      await taskService.addDependency(projectId.value, taskId, String(dependencyId));
    }
    showToast("Task created successfully", "success");
    router.push(`/projects/${projectId.value}/tasks`);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to create task", "error");
  } finally {
    loading.value = false;
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

// Initialize data
fetchUsers();
fetchTasks();
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Create Task</h1>
    <div v-if="toast.visible" :class="[
      'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300',
      toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
    ]">
      {{ toast.message }}
    </div>
    <div v-if="canCreateTask" class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="submitTask" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Task Name</label>
          <input
            v-model="taskForm.name"
            type="text"
            required
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            v-model="taskForm.description"
            rows="4"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            v-model="taskForm.startDate"
            type="date"
            required
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">End Date</label>
          <input
            v-model="taskForm.endDate"
            type="date"
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <select
            v-model="taskForm.status"
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
            v-model.number="taskForm.progress"
            type="number"
            min="0"
            max="100"
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Assign To</label>
          <select
            v-model="taskForm.assignedToIds"
            multiple
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.firstName }} {{ user.lastName }}
            </option>
          </select>
        </div>
        <!-- <div>
          <label class="block text-sm font-medium text-gray-700">Dependencies</label>
          <select
            v-model="taskForm.dependencyIds"
            multiple
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="task in tasks" :key="task.id" :value="task.id">
              {{ task.name }}
            </option>
          </select>
        </div> -->
        <div class="flex justify-end space-x-4">
          <button
            type="button"
            @click="router.push(`/projects/${projectId}/tasks`)"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {{ loading ? 'Creating...' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
    <div v-else class="bg-white rounded-lg shadow p-6">
      <p class="text-red-600">You are not authorized to create tasks.</p>
    </div>
  </div>
</template>