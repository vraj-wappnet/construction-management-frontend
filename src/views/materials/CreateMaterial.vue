<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { materialService, vendorService } from "../../services/api";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const projectId = computed(() => route.params.projectId as string);
const vendors = ref<Vendor[]>([]);
const toast = ref<Toast>({ message: "", type: "success", visible: false });

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

const createForm = ref({
  name: "",
  description: "",
  quantity: 0,
  unit: "",
  status: "Requested",
  vendorIds: [] as string[],
});

const canManageMaterials = computed(() =>
  ["contractor", "site_engineer"].includes(authStore.userRole)
);

const fetchVendors = async () => {
  try {
    const response = await vendorService.getVendors();
    vendors.value = response.data;
    console.log("Vendors fetched:", vendors.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load vendors",
      "error"
    );
  }
};

const createMaterial = async () => {
  if (!canManageMaterials.value) {
    showToast("You are not authorized to create materials", "error");
    return;
  }
  if (
    !createForm.value.name ||
    !createForm.value.quantity ||
    !createForm.value.unit
  ) {
    showToast("Name, quantity, and unit are required", "error");
    return;
  }
  try {
    const materialData = {
      name: createForm.value.name,
      description: createForm.value.description,
      quantity: Number(createForm.value.quantity),
      unit: createForm.value.unit,
      status: createForm.value.status,
      vendorIds: createForm.value.vendorIds,
    };
    await materialService.createMaterial(projectId.value, materialData);
    showToast("Material created successfully", "success");
    router.push(`/projects/${projectId.value}/materials`);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to create material",
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

fetchVendors();
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Create Material</h1>
      <router-link
        :to="`/projects/${projectId}/materials`"
        class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
      >
        Back to Materials
      </router-link>
    </div>
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
    <div
      v-if="!canManageMaterials"
      class="bg-white rounded-lg shadow p-6 text-center"
    >
      <p class="text-red-600">You are not authorized to create materials.</p>
    </div>
    <div v-else class="bg-white rounded-lg shadow p-6 max-w-lg mx-auto">
      <form @submit.prevent="createMaterial" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input
            v-model="createForm.name"
            type="text"
            required
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Description</label
          >
          <textarea
            v-model="createForm.description"
            rows="3"
            class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Quantity</label
          >
          <input
            v-model.number="createForm.quantity"
            type="number"
            min="0"
            required
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <input
            v-model="createForm.unit"
            type="text"
            required
            class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Vendors</label>
          <select
            v-model="createForm.vendorIds"
            multiple
            class="mt-1 w-full h-20 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option
              v-for="vendor in vendors"
              :key="vendor.id"
              :value="vendor.id"
            >
              {{ vendor.name }}
            </option>
          </select>
        </div>
        <div class="flex justify-end space-x-4">
          <button
            type="button"
            @click="router.push(`/projects/${projectId}/materials`)"
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
