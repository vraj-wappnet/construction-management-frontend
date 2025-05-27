```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { materialService, vendorService } from "../../services/api";

interface Material {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  status: string;
  vendorIds: string[];
}

interface Vendor {
  id: string;
  name: string;
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
const route = useRoute();
const router = useRouter();

const projectId = route.params.projectId as string;
const materialId = route.params.id as string;
const material = ref<Material | null>(null);
const vendors = ref<Vendor[]>([]);
const loading = ref(true);
const toast = ref<Toast>({ message: "", type: "success", visible: false });

const fetchMaterial = async () => {
  if (!authStore.isAuthenticated) {
    router.push("/login");
    return;
  }
  try {
    loading.value = true;
    const response = await materialService.getMaterial(projectId, materialId);
    material.value = response.data;
    console.log("Material fetched:", material.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to load material details", "error");
  } finally {
    loading.value = false;
  }
};

const fetchVendors = async () => {
  try {
    const response = await vendorService.getVendors();
    vendors.value = response.data;
    console.log("Vendors fetched:", vendors.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(apiError.response?.data?.message || "Failed to load vendors", "error");
  }
};

const getVendorNames = (vendorIds: string[]) => {
  return vendorIds
    .map((id) => vendors.value.find((v) => v.id === id)?.name || "Unknown")
    .join(", ");
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

onMounted(() => {
  fetchMaterial();
  fetchVendors();
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Material Details</h1>
    <div v-if="toast.visible" :class="[
      'fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300',
      toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
    ]">
      {{ toast.message }}
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
    <div v-else-if="!material" class="bg-white rounded-lg shadow p-6 text-center">
      <p class="text-red-600">Unable to load material details.</p>
    </div>
    <div v-else class="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <p class="mt-1 text-sm text-gray-900">{{ material.name }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <p class="mt-1 text-sm text-gray-900">{{ material.description || "N/A" }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Quantity</label>
          <p class="mt-1 text-sm text-gray-900">{{ material.quantity }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Unit</label>
          <p class="mt-1 text-sm text-gray-900">{{ material.unit }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <p class="mt-1 text-sm text-gray-900">{{ material.status }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Vendors</label>
          <p class="mt-1 text-sm text-gray-900">{{ getVendorNames(material.vendorIds) || "None" }}</p>
        </div>
        <div class="flex justify-end">
          <router-link
            :to="`/projects/${projectId}/materials`"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            Back
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
