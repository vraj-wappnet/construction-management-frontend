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
  profilePicture?: string; // Added profilePicture field
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
const isUpdating = ref(false);

const editForm = ref({
  firstName: "",
  lastName: "",
  email: "",
  profilePicture: null as File | null, // Added profilePicture field for file upload
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
      profilePicture: null,
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
    isUpdating.value = true;
    const formData = new FormData();
    formData.append("firstName", editForm.value.firstName);
    formData.append("lastName", editForm.value.lastName);
    formData.append("email", editForm.value.email);
    if (editForm.value.profilePicture) {
      formData.append("profilePicture", editForm.value.profilePicture);
      console.log('Uploading profile picture:', editForm.value.profilePicture.name);
    } else {
      console.log('No profile picture selected for upload');
    }

    await profileService.updateProfile(formData);
    await fetchProfile();
    showEditModal.value = false;
    showToast("Profile updated successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    console.error('Update profile error:', apiError);
    showToast(apiError.response?.data?.message || "Failed to update profile", "error");
  } finally {
    isUpdating.value = false;
  }
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  if (file && !file.type.match(/image\/(jpeg|png|gif)/)) {
    showToast("Profile picture must be a JPEG, PNG, or GIF image", "error");
    editForm.value.profilePicture = null;
    return;
  }
  editForm.value.profilePicture = file;
};

const getFileSize = (file: File | null) => {
  if (!file) return "";
  const size = file.size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 4000);
};

onMounted(fetchProfile);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
      <!-- Toast Notification -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-4 opacity-0"
      >
        <div
          v-if="toast.visible"
          :class="[
            'fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl max-w-sm',
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          ]"
        >
          <div class="flex items-center">
            <svg
              class="w-6 h-6 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="toast.type === 'success'"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="font-medium">{{ toast.message }}</span>
          </div>
        </div>
      </Transition>


      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
          <div class="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-indigo-400"></div>
        </div>
        <p class="mt-4 text-gray-600 font-medium text-lg">Loading profile...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="!profile"
        class="bg-white rounded-xl shadow-lg p-8 text-center max-w-lg mx-auto"
      >
        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-red-600 font-medium">Unable to load profile.</p>
      </div>

      <!-- Profile Card -->
      <div
        v-else
        class="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg max-w-lg mx-auto overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100"
      >
        <div class="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 flex items-center space-x-4">
          <div class="relative">
            <img
              v-if="profile.profilePicture"
              :src="profile.profilePicture"
              alt="Profile Picture"
              class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div
              v-else
              class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-xl"
            >
              {{ profile.firstName[0] }}{{ profile.lastName ? profile.lastName[0] : '' }}
            </div>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-white">
              {{ profile.firstName }} {{ profile.lastName || '' }}
            </h2>
            <p class="text-sm text-indigo-100 mt-1">{{ profile.email }}</p>
          </div>
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
              class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Profile Modal -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="showEditModal"
          class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
        >
          <div
            class="bg-white/90 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-gray-100 shadow-xl"
          >
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>
            <form @submit.prevent="updateProfile" class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700">First Name</label>
                <input
                  v-model="editForm.firstName"
                  type="text"
                  required
                  class="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700">Last Name</label>
                <input
                  v-model="editForm.lastName"
                  type="text"
                  class="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700">Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  required
                  class="mt-2 w-full h-12 px-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 backdrop-blur-sm transition-all duration-300"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700">Profile Picture</label>
                <div class="relative mt-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    @change="handleFileChange"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-300"
                  />
                  <div v-if="editForm.profilePicture" class="mt-2 text-sm text-gray-600 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    {{ editForm.profilePicture.name }} ({{ getFileSize(editForm.profilePicture) }})
                  </div>
                </div>
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
                  :disabled="isUpdating"
                  class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <svg
                    v-if="isUpdating"
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  {{ isUpdating ? "Saving..." : "Save" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations for smoother transitions */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.group:hover .pulse {
  animation: pulse 1.5s infinite;
}

/* Ensure inputs have consistent focus states */
input:focus, select:focus, textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  h1 {
    font-size: 1.875rem;
  }

  .max-w-md {
    max-width: 100%;
  }
}
</style>