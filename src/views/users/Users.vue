<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { userService } from "../../services/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
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

const users = ref<User[]>([]);
const loading = ref(true);
const toast = ref<Toast>({ message: "", type: "success", visible: false });

const canDeleteUsers = computed(() => authStore.userRole === "admin");

const fetchUsers = async () => {
  if (!authStore.isAuthenticated) {
    router.push("/login");
    return;
  }
  try {
    loading.value = true;
    const response = await userService.getUsers();
    users.value = response.data;
    console.log("Users fetched:", users.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load users",
      "error"
    );
  } finally {
    loading.value = false;
  }
};

const deleteUser = async (id: string) => {
  if (!canDeleteUsers.value) {
    showToast("You are not authorized to delete users", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await userService.deleteUser(id);
    await fetchUsers();
    showToast("User deleted successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to delete user",
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

onMounted(fetchUsers);
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Users</h1>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toast.visible"
      :class="[
        'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform',
        toast.type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white',
        toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      ]"
    >
      {{ toast.message }}
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center my-12">
      <svg
        class="animate-spin h-10 w-10 text-indigo-600"
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

    <!-- No Users Found -->
    <div
      v-else-if="users.length === 0"
      class="bg-white rounded-lg shadow p-6 text-center"
    >
      <p class="text-gray-500 text-lg">No users found.</p>
    </div>

    <!-- Users List -->
    <div v-else>
      <!-- Desktop Table View -->
      <div class="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                First Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Last Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Role
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >
                {{ user.firstName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ user.lastName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    user.role === 'admin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800',
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  v-if="canDeleteUsers && user.id !== authStore.userId"
                  @click="deleteUser(user.id)"
                  class="text-red-600 hover:text-red-800 font-semibold"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-4">
        <div
          v-for="user in users"
          :key="user.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ user.firstName }} {{ user.lastName }}
            </h3>
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                user.role === 'admin'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800',
              ]"
            >
              {{ user.role }}
            </span>
          </div>
          <div class="mt-2 space-y-1">
            <p class="text-sm text-gray-600">
              <span class="font-medium">Email:</span> {{ user.email }}
            </p>
          </div>
          <div class="mt-4 flex justify-end">
            <button
              v-if="canDeleteUsers && user.id !== authStore.userId"
              @click="deleteUser(user.id)"
              class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure Tailwind transitions work smoothly */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
