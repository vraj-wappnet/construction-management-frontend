<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { documentService } from "../../services/api";

interface Document {
  id: number;
  name: string;
  type: string;
  filePath: string;
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
const route = useRoute();

const projectId = computed(() => String(route.params.projectId));
const userRole = computed(() => authStore.userRole as string);
const canCreateDocument = computed(() =>
  ["admin", "site_engineer", "contractor"].includes(userRole.value)
);

const documents = ref<Document[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false,
});
const nameInput = ref("");
const typeInput = ref("");
const notesInput = ref("");
const fileInput = ref<File | null>(null);
const showCreateForm = ref(false);
const isCreating = ref(false);

const fetchDocuments = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await documentService.getDocuments(projectId.value);
    documents.value = response.data;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    error.value =
      apiError.response?.data?.message || "Failed to load documents";
    showToast(error.value, "error");
  } finally {
    loading.value = false;
  }
};

const createDocument = async () => {
  if (!canCreateDocument.value) {
    showToast("You are not authorized to create documents", "error");
    return;
  }
  if (!nameInput.value || !typeInput.value || !fileInput.value) {
    showToast("Name, type, and file are required", "error");
    return;
  }

  const formData = new FormData();
  formData.append("name", nameInput.value);
  formData.append("type", typeInput.value);
  if (notesInput.value) formData.append("notes", notesInput.value);
  formData.append("file", fileInput.value);

  try {
    isCreating.value = true;
    await documentService.createDocument(projectId.value, formData);
    showToast("Document created successfully", "success");
    nameInput.value = "";
    typeInput.value = "";
    notesInput.value = "";
    fileInput.value = null;
    showCreateForm.value = false;
    await fetchDocuments();
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to create document",
      "error"
    );
  } finally {
    isCreating.value = false;
  }
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 4000);
};

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] || null;
  if (file && typeInput.value === "pdf" && !file.type.includes("pdf")) {
    showToast("Please upload a valid PDF file", "error");
    fileInput.value = null;
    return;
  }
  fileInput.value = file;
};

const getDocumentIcon = (type: string) => {
  const iconMap: { [key: string]: string } = {
    blueprint: "📋",
    report: "📊",
    contract: "📄",
    video: "🎥",
    pdf: "📕",
    spreadsheet: "📊",
    presentation: "📽️",
    default: "📁",
  };
  return iconMap[type.toLowerCase()] || iconMap.default;
};

const getFileSize = (file: File | null) => {
  if (!file) return "";
  const size = file.size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getDownloadUrl = (filePath: string, type: string) => {
  try {
    if (type.toLowerCase() === "pdf") {
      const correctedUrl = filePath.replace("/image/upload/", "/raw/upload/");
      const urlParts = correctedUrl.split("/raw/upload/");
      if (urlParts.length === 2) {
        return `${urlParts[0]}/raw/upload/fl_attachment/${urlParts[1]}`;
      }
    }
    const urlParts = filePath.split("/image/upload/");
    if (urlParts.length === 2) {
      return `${urlParts[0]}/image/upload/fl_attachment/${urlParts[1]}`;
    }
    return filePath;
  } catch (err) {
    showToast("Invalid file URL for downloading", "error");
    return "#";
  }
};

const handleDownloadClick = async (filePath: string, type: string) => {
  const url = getDownloadUrl(filePath, type);
  if (url === "#") return;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.ok) {
      const link = document.createElement("a");
      link.href = url;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast(`File not found (HTTP ${response.status})`, "error");
    }
  } catch {
    showToast("Failed to download file", "error");
  }
};

onMounted(fetchDocuments);
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
  >
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
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white',
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

      <!-- Header -->
      <div
        class="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            class="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent"
          >
            Project Documents
          </h1>
          <p class="mt-2 text-gray-600 text-base sm:text-lg">
            Organize and manage your project files with ease
          </p>
        </div>
        <button
          v-if="canCreateDocument"
          @click="showCreateForm = !showCreateForm"
          class="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300"
        >
          <svg
            class="w-5 h-5 mr-2 transition-transform group-hover:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {{ showCreateForm ? "Close Form" : "Add Document" }}
        </button>
      </div>

      <!-- Create Form -->
      <Transition
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="transform -translate-y-6 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-6 opacity-0"
      >
        <div v-if="canCreateDocument && showCreateForm" class="mb-12">
          <div
            class="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8"
          >
            <div class="flex items-center mb-6">
              <div
                class="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl mr-4"
              >
                <svg
                  class="w-6 h-6 text-white"
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
              </div>
              <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
                Upload New Document
              </h2>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700"
                  >Document Name</label
                >
                <input
                  v-model="nameInput"
                  type="text"
                  placeholder="e.g., Project Blueprint v2.1"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700"
                  >Document Type</label
                >
                <select
                  v-model="typeInput"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                >
                  <option value="">Select type...</option>
                  <option value="blueprint">Blueprint</option>
                  <option value="report">Report</option>
                  <option value="contract">Contract</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="pdf">PDF</option>
                  <option value="spreadsheet">Spreadsheet</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700"
                  >Upload File</label
                >
                <div class="relative">
                  <input
                    type="file"
                    @change="handleFileChange"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-300"
                  />
                  <div
                    v-if="fileInput"
                    class="mt-2 text-sm text-gray-600 flex items-center"
                  >
                    <svg
                      class="w-4 h-4 mr-2"
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
                    {{ fileInput.name }} ({{ getFileSize(fileInput) }})
                  </div>
                </div>
              </div>

              <div class="space-y-2 sm:col-span-2">
                <label class="block text-sm font-semibold text-gray-700"
                  >Notes (Optional)</label
                >
                <textarea
                  v-model="notesInput"
                  placeholder="Add any additional notes about this document..."
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300 resize-none"
                ></textarea>
              </div>
            </div>

            <div class="flex justify-end mt-8 space-x-4">
              <button
                @click="showCreateForm = false"
                class="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                @click="createDocument"
                :disabled="isCreating"
                class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg
                  v-if="isCreating"
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
                {{ isCreating ? "Creating..." : "Create Document" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20"
      >
        <div class="relative">
          <div
            class="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"
          ></div>
          <div
            class="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-indigo-400"
          ></div>
        </div>
        <p class="mt-4 text-gray-600 font-medium text-lg">
          Loading documents...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 text-center"
      >
        <div
          class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-8 h-8 text-red-500"
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
        </div>
        <h3 class="text-xl font-semibold text-red-800 mb-2">
          Something went wrong
        </h3>
        <p class="text-red-600 mb-6">{{ error }}</p>
        <button
          @click="fetchDocuments"
          class="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
        >
          Try Again
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="documents.length === 0" class="text-center py-20">
        <div
          class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center"
        >
          <svg
            class="w-12 h-12 text-gray-400"
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
        </div>
        <h3 class="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">
          No documents yet
        </h3>
        <p class="text-gray-600 mb-6 max-w-md mx-auto">
          Start by uploading your first project document to keep your files
          organized
        </p>
        <button
          v-if="canCreateDocument"
          @click="showCreateForm = true"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300"
        >
          <svg
            class="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Your First Document
        </button>
      </div>

      <!-- Document Grid -->
      <div
        v-else
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      >
        <div
          v-for="document in documents"
          :key="document.id"
          class="group bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 overflow-hidden transform hover:scale-105 transition-all duration-300"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="text-4xl">{{ getDocumentIcon(document.type) }}</div>
              <span
                class="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-sm"
              >
                {{ document.type }}
              </span>
            </div>
            <h3
              class="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200"
            >
              {{ document.name }}
            </h3>
            <div class="flex items-center justify-between">
              <button
                @click="handleDownloadClick(document.filePath, document.type)"
                class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-lg hover:from-indigo-500 hover:to-blue-500 hover:text-white transform hover:scale-105 transition-all duration-300"
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations for smoother transitions */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.group:hover .pulse {
  animation: pulse 1.5s infinite;
}

/* Ensure inputs have consistent focus states */
input:focus,
select:focus,
textarea:focus {
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

  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>
