<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { materialService, vendorService } from "../../services/api";

interface Material {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  status: string;
  vendors: Vendor[];
}

interface Vendor {
  id: string;
  name: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

const authStore = useAuthStore();
const route = useRoute();

const projectId = computed(() => route.params.projectId as string);
const materials = ref<Material[]>([]);
const vendors = ref<Vendor[]>([]);
const loading = ref(true);
const toast = ref<Toast>({ message: "", type: "success", visible: false });

const canManageMaterials = computed(() =>
  ["contractor", "site_engineer"].includes(authStore.userRole)
);

const fetchMaterials = async () => {
  try {
    loading.value = true;
    const response = await materialService.getMaterials(projectId.value);
    materials.value = response.data || [];
    console.log("Materials data:", materials.value);
  } catch (err) {
    showToast("Failed to load materials", "error");
    console.error("Fetch materials error:", err);
  } finally {
    loading.value = false;
  }
};

const fetchVendors = async () => {
  try {
    const response = await vendorService.getVendors();
    vendors.value = response.data;
  } catch (err) {
    console.error("Fetch vendors error:", err);
  }
};

const deleteMaterial = async (id: string) => {
  if (!canManageMaterials.value) {
    showToast("You are not authorized to delete materials", "error");
    return;
  }

  if (!confirm("Are you sure you want to delete this material?")) return;

  try {
    await materialService.deleteMaterial(projectId.value, id);
    await fetchMaterials();
    showToast("Material deleted successfully", "success");
  } catch (err) {
    showToast("Failed to delete material", "error");
    console.error("Delete material error:", err);
  }
};

const getVendorNames = (vendors: Vendor[]) => {
  return vendors?.map((v) => v.name).join(", ") || "None";
};

const showToast = (message: string, type: "success" | "error") => {
  toast.value = { message, type, visible: true };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

// Watch for route changes
watch(
  () => [route.params.projectId, route.query.refresh],
  async () => {
    await fetchMaterials();
  },
  { immediate: true }
);

onMounted(async () => {
  await Promise.all([fetchMaterials(), fetchVendors()]);
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Project Materials</h1>

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

    <div
      v-else-if="materials.length === 0"
      class="bg-white rounded-lg shadow p-6 text-center"
    >
      <p class="text-gray-500">No materials found.</p>
      <router-link
        v-if="canManageMaterials"
        :to="`/projects/${projectId}/materials/create`"
        class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
      >
        Create Material
      </router-link>
    </div>

    <div v-else>
      <div v-if="canManageMaterials" class="mb-6 flex justify-end">
        <router-link
          :to="`/projects/${projectId}/materials/create`"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700"
        >
          Create Material
        </router-link>
      </div>

      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Quantity
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Unit
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Vendors
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="material in materials" :key="material.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ material.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ material.quantity }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ material.unit }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ material.status }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ getVendorNames(material.vendors) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <router-link
                  :to="`/projects/${projectId}/materials/${material.id}`"
                  class="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  View
                </router-link>
                <button
                  v-if="canManageMaterials"
                  @click="deleteMaterial(material.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
