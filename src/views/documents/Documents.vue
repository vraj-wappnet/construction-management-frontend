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

onMounted(fetchDocuments);
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Project Documents</h1>
    <div
      v-if="toast.visible"
      :class="[
        'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300',
        toast.type === 'success'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800',
      ]"
    >
      {{ toast.message }}
    </div>
    <!-- Create Document Form: visible only to admins, site engineers, and contractors -->
    <div v-if="canCreateDocument" class="mb-6 bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-medium mb-4">Create New Document</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input
            v-model="nameInput"
            type="text"
            placeholder="e.g., Project Blueprint"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Type</label>
          <input
            v-model="typeInput"
            type="text"
            placeholder="e.g., blueprint"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">File</label>
          <input
            type="file"
            @change="handleFileChange"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-sm font-medium text-gray-700"
            >Notes (Optional)</label
          >
          <textarea
            v-model="notesInput"
            placeholder="Notes about this document"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          @click="createDocument"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-all duration-300"
        >
          Create Document
        </button>
      </div>
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
    <div
      v-else-if="documents.length === 0"
      class="bg-white rounded-lg shadow p-6 text-center"
    >
      <p class="text-gray-500">No documents found.</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="document in documents"
        :key="document.id"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">
              {{ document.name }}
            </h3>
            <span class="px-2 py-1 text-xs rounded-full bg-blue-500 text-white">
              {{ document.type }}
            </span>
          </div>
          <div class="mt-4">
            <p class="text-xs font-medium text-gray-500">File</p>
            <a
              :href="document.filePath"
              target="_blank"
              class="text-sm text-blue-600 hover:underline"
            >
              View File
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

