<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { taskService } from "../../services/api";
import { apiClient } from "../../services/api";
import * as Yup from "yup";

interface TaskForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  assignedToId: number | null;
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

// Yup validation schema
const schema = Yup.object().shape({
  name: Yup.string().required("Task name is required").min(3, "Task name must be at least 3 characters"),
  description: Yup.string().max(500, "Description cannot exceed 500 characters"),
  startDate: Yup.string().required("Start date is required"),
  endDate: Yup.string().nullable().test(
    "is-after-start",
    "End date cannot be earlier than start date",
    (value, context) => {
      if (!value) return true;
      return new Date(value) >= new Date(context.parent.startDate);
    }
  ),
  status: Yup.string().required("Status is required"),
  progress: Yup.number().min(0, "Progress cannot be less than 0").max(100, "Progress cannot exceed 100"),
  assignedToId: Yup.number().nullable(),
});

const taskForm = ref<TaskForm>({
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "Not Started",
  progress: 0,
  assignedToId: null,
  dependencyIds: [],
});
const users = ref<User[]>([]);
const tasks = ref<Task[]>([]);
const loading = ref(false);
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false,
});
const errors = ref<Partial<Record<keyof TaskForm, string>>>({});

const fetchUsers = async () => {
  try {
    const response = await apiClient.get("/users");
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

const validateField = async (field: keyof TaskForm) => {
  try {
    await schema.validateAt(field, taskForm.value);
    errors.value[field] = "";
  } catch (err: unknown) {
    errors.value[field] = (err as Yup.ValidationError).message;
  }
};

const submitTask = async () => {
  if (!canCreateTask.value) {
    showToast("You are not authorized to create tasks", "error");
    return;
  }
  try {
    await schema.validate(taskForm.value, { abortEarly: false });
    errors.value = {};
    try {
      loading.value = true;
      const taskData = {
        name: taskForm.value.name,
        description: taskForm.value.description,
        startDate: new Date(taskForm.value.startDate).toISOString(),
        endDate: taskForm.value.endDate ? new Date(taskForm.value.endDate).toISOString() : undefined,
        status: taskForm.value.status,
        progress: taskForm.value.progress,
        assignedToId: taskForm.value.assignedToId,
      };
      const response = await taskService.createTask(projectId.value, taskData);
      const taskId = response.data.id;
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
  } catch (err: unknown) {
    const validationErrors = (err as Yup.ValidationError).inner;
    errors.value = validationErrors.reduce((acc, curr) => {
      if (curr.path) acc[curr.path as keyof TaskForm] = curr.message;
      return acc;
    }, {} as Partial<Record<keyof TaskForm, string>>);
    showToast("Please fix the form errors", "error");
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

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
            @blur="validateField('name')"
            class="mt-1 w-full h-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
          />
          <p v-if="errors.name" class="text-red-600 text-sm mt-1">{{ errors.name }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            v-model="taskForm.description"
            rows="4"
            @blur="validateField('description')"
            class="mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
          ></textarea>
          <p v-if="errors.description" class="text-red-600 text-sm mt-1">{{ errors.description }}</p>
        </div>
        <div class="flex space-x-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              v-model="taskForm.startDate"
              type="date"
              @blur="validateField('startDate')"
              class="mt-1 w-full h-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
            />
            <p v-if="errors.startDate" class="text-red-600 text-sm mt-1">{{ errors.startDate }}</p>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700">End Date</label>
            <input
              v-model="taskForm.endDate"
              type="date"
              @blur="validateField('endDate')"
              class="mt-1 w-full h-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
            />
            <p v-if="errors.endDate" class="text-red-600 text-sm mt-1">{{ errors.endDate }}</p>
          </div>
        </div>
        <div class="flex space-x-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select
              v-model="taskForm.status"
              @blur="validateField('status')"
              class="mt-1 w-full h-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
            <p v-if="errors.status" class="text-red-600 text-sm mt-1">{{ errors.status }}</p>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700">Progress (%)</label>
            <input
              v-model.number="taskForm.progress"
              type="number"
              min="0"
              max="100"
              @blur="validateField('progress')"
              class="mt-1 w-full h-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
            />
            <p v-if="errors.progress" class="text-red-600 text-sm mt-1">{{ errors.progress }}</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Assign To</label>
          <select
            v-model="taskForm.assignedToId"
            @blur="validateField('assignedToId')"
            class="mt-1 w-full h-10 rounded-md border border-gray-300 shadow-sm focus:border-blue-700 transition-colors duration-200"
          >
            <option :value="null" disabled>Select a user</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.firstName }} {{ user.lastName }}
            </option>
          </select>
          <p v-if="errors.assignedToId" class="text-red-600 text-sm mt-1">{{ errors.assignedToId }}</p>
        </div>
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