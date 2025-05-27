<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { profileService } from "../../services/api";

interface UserProfile {
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

const profile = ref<UserProfile | null>(null);
const loading = ref(true);
const toast = ref<Toast>({ message: "", type: "success", visible: false });
const showEditModal = ref(false);

const editForm = ref({
  firstName: "",
  lastName: "",
  email: "",
});

const fetchProfile = async () => {
  if (!authStore.isAuthenticated) {
    router.push("/login");
    return;
  }
  try {
    loading.value = true;
    const response = await profileService.getUserProfile();
    profile.value = response.data;
    console.log("Profile fetched:", profile.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to load profile", "error");
  } finally {
    loading.value = false;
  }
};

const openEditModal = () => {
  if (profile.value) {
    editForm.value = {
      firstName: profile.value.firstName,
      lastName: profile.value.lastName,
      email: profile.value.email,
    };
    showEditModal.value = true;
  }
};

const updateProfile = async () => {
  if (!editForm.value.firstName || !editForm.value.email) {
    showToast("First name and email are required", "error");
    return;
  }
  try {
    const profileData = {
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
    };
    await profileService.updateProfile(profileData);
    await fetchProfile();
    showEditModal.value = false;
    showToast("Profile updated successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to update profile", "error");
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

onMounted(fetchProfile);
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Toast Notification -->
    <div
      v-if="toast.visible"
      :class="[
        'fixed top-6 right-6 p-4 rounded-xl shadow-2xl transition-all duration-300 transform',
        toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
        toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      ]"
    >
      {{ toast.message }}
    </div>

    <!-- Page Header -->
    <h1 class="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">
      My Profile
    </h1>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center my-12">
      <svg
        class="animate-spin h-12 w-12 text-indigo-600"
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
    <div
      v-else-if="!profile"
      class="bg-white rounded-xl shadow-lg p-8 text-center max-w-lg mx-auto"
    >
      <p class="text-red-600 font-medium">Unable to load profile.</p>
    </div>

    <!-- Profile Card -->
    <div
      v-else
      class="bg-white rounded-xl shadow-lg max-w-lg mx-auto overflow-hidden transition-all duration-300 hover:shadow-xl"
    >
      <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6">
        <h2 class="text-xl font-semibold text-white">
          {{ profile.firstName }} {{ profile.lastName || '' }}
        </h2>
        <p class="text-sm text-indigo-100 mt-1">{{ profile.email }}</p>
      </div>
      <div class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700">First Name</label>
          <p class="mt-2 text-base text-gray-900 font-medium">{{ profile.firstName }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Last Name</label>
          <p class="mt-2 text-base text-gray-900 font-medium">{{ profile.lastName || "N/A" }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <p class="mt-2 text-base text-gray-900 font-medium">{{ profile.email }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Role</label>
          <p class="mt-2 text-base text-gray-900 font-medium">{{ profile.role }}</p>
        </div>
        <div class="flex justify-end">
          <button
            @click="openEditModal"
            class="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
    >
      <div
        class="bg-white rounded-xl p-8 w-full max-w-md transform transition-all duration-300"
        :class="showEditModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
      >
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
        <form @submit.prevent="updateProfile" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">First Name</label>
            <input
              v-model="editForm.firstName"
              type="text"
              required
              class="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              v-model="editForm.lastName"
              type="text"
              class="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="editForm.email"
              type="email"
              required
              class="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="showEditModal = false"
              class="px-6 py-2 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
/* Smooth transitions for Tailwind */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>