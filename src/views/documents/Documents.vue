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
// Restrict document creation to admins, site engineers, and contractors
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

const fetchDocuments = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await documentService.getDocuments(projectId.value);
    documents.value = response.data;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    error.value = apiError.response?.data?.message || "Failed to load documents";
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
    await documentService.createDocument(projectId.value, formData);
    showToast("Document created successfully", "success");
    nameInput.value = "";
    typeInput.value = "";
    notesInput.value = "";
    fileInput.value = null;
    showCreateForm.value = false;
    await fetchDocuments(); // Refresh the document list
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to create document",
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

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  fileInput.value = input.files?.[0] || null;
};

const getDocumentIcon = (type: string) => {
  const iconMap: { [key: string]: string } = {
    blueprint: "📋",
    report: "📊",
    contract: "📄",
    image: "🖼️",
    video: "🎥",
    audio: "🎵",
    pdf: "📕",
    spreadsheet: "📊",
    presentation: "📽️",
    default: "📁"
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

onMounted(fetchDocuments);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <!-- Enhanced Toast Notification -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-x-full opacity-0"
      enter-to-class="transform translate-x-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-x-0 opacity-100"
      leave-to-class="transform translate-x-full opacity-0"
    >
      <div
        v-if="toast.visible"
        :class="[
          'fixed top-6 right-6 p-4 rounded-xl shadow-2xl backdrop-blur-sm border z-50 max-w-sm',
          toast.type === 'success'
            ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
            : 'bg-red-50/90 text-red-800 border-red-200',
        ]"
      >
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <svg v-if="toast.type === 'success'" class="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <p class="font-medium">{{ toast.message }}</p>
        </div>
      </div>
    </Transition>

    <div class="container mx-auto px-4 py-8 max-w-7xl">
      <!-- Enhanced Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Project Documents
            </h1>
            <p class="text-slate-600 text-lg">Manage and organize your project files</p>
          </div>
          
          <!-- Enhanced Create Button -->
          <button
            v-if="canCreateDocument"
            @click="showCreateForm = !showCreateForm"
            class="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <svg class="w-5 h-5 mr-2 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {{ showCreateForm ? 'Cancel' : 'Add Document' }}
          </button>
        </div>
      </div>

      <!-- Enhanced Create Form with Animation -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div v-if="canCreateDocument && showCreateForm" class="mb-8">
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div class="flex items-center mb-6">
              <div class="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mr-4">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-slate-800">Create New Document</h2>
            </div>
            
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700">Document Name</label>
                <input
                  v-model="nameInput"
                  type="text"
                  placeholder="e.g., Project Blueprint v2.1"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>
              
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700">Document Type</label>
                <select
                  v-model="typeInput"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
                <label class="block text-sm font-semibold text-slate-700">Upload File</label>
                <div class="relative">
                  <input
                    type="file"
                    @change="handleFileChange"
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <div v-if="fileInput" class="mt-2 text-sm text-slate-600">
                    📁 {{ fileInput.name }} ({{ getFileSize(fileInput) }})
                  </div>
                </div>
              </div>
              
              <div class="space-y-2 lg:col-span-2">
                <label class="block text-sm font-semibold text-slate-700">Notes (Optional)</label>
                <textarea
                  v-model="notesInput"
                  placeholder="Add any additional notes about this document..."
                  rows="3"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                ></textarea>
              </div>
            </div>
            
            <div class="flex justify-end mt-8 space-x-3">
              <button
                @click="showCreateForm = false"
                class="px-6 py-3 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                @click="createDocument"
                class="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Enhanced Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          <div class="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400"></div>
        </div>
        <p class="mt-4 text-slate-600 font-medium">Loading documents...</p>
      </div>

      <!-- Enhanced Error State -->
      <div v-else-if="error" class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-8 text-center">
        <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
        <p class="text-red-600">{{ error }}</p>
        <button
          @click="fetchDocuments"
          class="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>

      <!-- Enhanced Empty State -->
      <div v-else-if="documents.length === 0" class="text-center py-16">
        <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
          <svg class="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-slate-800 mb-2">No documents yet</h3>
        <p class="text-slate-600 mb-6">Start by uploading your first project document</p>
        <button
          v-if="canCreateDocument"
          @click="showCreateForm = true"
          class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add Your First Document
        </button>
      </div>

      <!-- Enhanced Document Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="document in documents"
          :key="document.id"
          class="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl border border-white/20 overflow-hidden transform hover:scale-105 transition-all duration-300"
        >
          <!-- Document Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-4">
              <div class="text-3xl">{{ getDocumentIcon(document.type) }}</div>
              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                {{ document.type }}
              </span>
            </div>
            
            <h3 class="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {{ document.name }}
            </h3>
          </div>
          
          <!-- Document Actions -->
          <div class="px-6 pb-6">
            <div class="flex items-center justify-between">
              <div class="text-xs text-slate-500 font-medium">
                📄 Document File
              </div>
              <a
                :href="document.filePath"
                target="_blank"
                class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-semibold rounded-lg hover:from-blue-500 hover:to-indigo-500 hover:text-white transform hover:scale-105 transition-all duration-200 shadow-sm"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                View
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>