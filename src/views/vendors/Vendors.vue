<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { vendorService } from "../../services/api";

interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  isActive: boolean;
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

const vendors = ref<Vendor[]>([]);
const loading = ref(true);
const toast = ref<Toast>({ message: "", type: "success", visible: false });
const showCreateModal = ref(false);
const showUpdateModal = ref(false);
const showViewModal = ref(false);
const selectedVendor = ref<Vendor | null>(null);

const createForm = ref({
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  isActive: true,
});

const updateForm = ref({
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  isActive: true,
});

const canManageVendors = computed(() => authStore.userRole === "admin");

const fetchVendors = async () => {
  if (!authStore.isAuthenticated) {
    router.push("/login");
    return;
  }
  try {
    loading.value = true;
    const response = await vendorService.getVendors();
    vendors.value = response.data;
    console.log("Vendors fetched:", vendors.value);
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load vendors",
      "error"
    );
  } finally {
    loading.value = false;
  }
};

const createVendor = async () => {
  if (!canManageVendors.value) {
    showToast("You are not authorized to create vendors", "error");
    return;
  }
  if (
    !createForm.value.name ||
    !createForm.value.email ||
    !createForm.value.taxId
  ) {
    showToast("Name, email, and tax ID are required", "error");
    return;
  }
  try {
    const vendorData = {
      name: createForm.value.name,
      contactPerson: createForm.value.contactPerson,
      email: createForm.value.email,
      phone: createForm.value.phone,
      address: createForm.value.address,
      taxId: createForm.value.taxId,
      isActive: createForm.value.isActive,
    };
    await vendorService.createVendor(vendorData);
    await fetchVendors();
    showCreateModal.value = false;
    createForm.value = {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      isActive: true,
    };
    showToast("Vendor created successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to create vendor",
      "error"
    );
  }
};

const viewVendor = async (id: string) => {
  try {
    const response = await vendorService.getVendor(id);
    selectedVendor.value = response.data;
    showViewModal.value = true;
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to load vendor details",
      "error"
    );
  }
};

const editVendor = async (vendor: Vendor) => {
  if (!canManageVendors.value) {
    showToast("You are not authorized to edit vendors", "error");
    return;
  }
  selectedVendor.value = vendor;
  updateForm.value = {
    name: vendor.name,
    contactPerson: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    taxId: vendor.taxId,
    isActive: vendor.isActive,
  };
  showUpdateModal.value = true;
};

const updateVendor = async () => {
  if (!canManageVendors.value || !selectedVendor.value) {
    showToast("You are not authorized to update vendors", "error");
    return;
  }
  if (
    !updateForm.value.name ||
    !updateForm.value.email ||
    !updateForm.value.taxId
  ) {
    showToast("Name, email, and tax ID are required", "error");
    return;
  }
  try {
    const vendorData = {
      name: updateForm.value.name,
      contactPerson: updateForm.value.contactPerson,
      email: updateForm.value.email,
      phone: updateForm.value.phone,
      address: updateForm.value.address,
      taxId: updateForm.value.taxId,
      isActive: updateForm.value.isActive,
    };
    await vendorService.updateVendor(selectedVendor.value.id, vendorData);
    await fetchVendors();
    showUpdateModal.value = false;
    selectedVendor.value = null;
    showToast("Vendor updated successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to update vendor",
      "error"
    );
  }
};

const deleteVendor = async (id: string) => {
  if (!canManageVendors.value) {
    showToast("You are not authorized to delete vendors", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete this vendor?")) return;
  try {
    await vendorService.deleteVendor(id);
    await fetchVendors();
    showToast("Vendor deleted successfully", "success");
  } catch (err: unknown) {
    const apiError = err as ApiError;
    showToast(
      apiError.response?.data?.message || "Failed to delete vendor",
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

onMounted(fetchVendors);
</script>

<template>
  <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Vendors</h1>
      <button
        v-if="canManageVendors"
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors duration-200"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Vendor
      </button>
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

    <!-- No Vendors Found -->
    <div
      v-else-if="vendors.length === 0"
      class="bg-white rounded-lg shadow p-6 text-center"
    >
      <p class="text-gray-500 text-lg">No vendors found.</p>
      <button
        v-if="canManageVendors"
        @click="showCreateModal = true"
        class="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors duration-200"
      >
        Create Vendor
      </button>
    </div>

    <!-- Vendors List -->
    <div v-else>
      <!-- Desktop Table View -->
      <div class="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Contact Person
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Phone
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                Status
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
              v-for="vendor in vendors"
              :key="vendor.id"
              class="hover:bg-gray-50 transition-colors duration-150"
            >
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
              >
                {{ vendor.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vendor.contactPerson || "N/A" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vendor.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ vendor.phone || "N/A" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    vendor.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                  ]"
                >
                  {{ vendor.isActive ? "Active" : "Inactive" }}
                </span>
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2"
              >
                <button
                  @click="viewVendor(vendor.id)"
                  class="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View
                </button>
                <button
                  v-if="canManageVendors"
                  @click="editVendor(vendor)"
                  class="text-yellow-600 hover:text-yellow-800 font-semibold"
                >
                  Edit
                </button>
                <button
                  v-if="canManageVendors"
                  @click="deleteVendor(vendor.id)"
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
          v-for="vendor in vendors"
          :key="vendor.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ vendor.name }}
            </h3>
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                vendor.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800',
              ]"
            >
              {{ vendor.isActive ? "Active" : "Inactive" }}
            </span>
          </div>
          <div class="mt-2 space-y-1">
            <p class="text-sm text-gray-600">
              <span class="font-medium">Contact:</span>
              {{ vendor.contactPerson || "N/A" }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">Email:</span> {{ vendor.email }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">Phone:</span>
              {{ vendor.phone || "N/A" }}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">Tax ID:</span> {{ vendor.taxId }}
            </p>
          </div>
          <div class="mt-4 flex space-x-2">
            <button
              @click="viewVendor(vendor.id)"
              class="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
            >
              View
            </button>
            <button
              v-if="canManageVendors"
              @click="editVendor(vendor)"
              class="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
            >
              Edit
            </button>
            <button
              v-if="canManageVendors"
              @click="deleteVendor(vendor.id)"
              class="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Vendor Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-lg transform transition-all duration-300 scale-100"
      >
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Create Vendor</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="createForm.name"
              type="text"
              required
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Contact Person</label
            >
            <input
              v-model="createForm.contactPerson"
              type="text"
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="createForm.email"
              type="email"
              required
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input
              v-model="createForm.phone"
              type="text"
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Address</label
            >
            <textarea
              v-model="createForm.address"
              rows="3"
              class="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Tax ID</label
            >
            <input
              v-model="createForm.taxId"
              type="text"
              required
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div class="flex items-center">
            <input
              v-model="createForm.isActive"
              type="checkbox"
              class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label class="ml-2 block text-sm font-medium text-gray-700"
              >Active</label
            >
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="createVendor"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Vendor Modal -->
    <div
      v-if="showUpdateModal"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-lg transform transition-all duration-300 scale-100"
      >
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Update Vendor</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="updateForm.name"
              type="text"
              required
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Contact Person</label
            >
            <input
              v-model="updateForm.contactPerson"
              type="text"
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="updateForm.email"
              type="email"
              required
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <input
              v-model="updateForm.phone"
              type="text"
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Address</label
            >
            <textarea
              v-model="updateForm.address"
              rows="3"
              class="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Tax ID</label
            >
            <input
              v-model="updateForm.taxId"
              type="text"
              required
              class="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
            />
          </div>
          <div class="flex items-center">
            <input
              type="checkbox"
              class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label class="ml-2 block text-sm font-medium text-gray-700"
              >Active</label
            >
          </div>
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="showUpdateModal = false"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="updateVendor"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Vendor Modal -->
    <div
      v-if="showViewModal && selectedVendor"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
    >
      <div
        class="bg-white rounded-lg p-6 w-full max-w-lg transform transition-all duration-300 scale-100"
      >
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Vendor Details</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Name</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedVendor.name }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Contact Person</label
            >
            <p class="mt-1 text-sm text-gray-900">
              {{ selectedVendor.contactPerson || "N/A" }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <p class="mt-1 text-sm text-gray-900">{{ selectedVendor.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Phone</label>
            <p class="mt-1 text-sm text-gray-900">
              {{ selectedVendor.phone || "N/A" }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Address</label
            >
            <p class="mt-1 text-sm text-gray-900">
              {{ selectedVendor.address || "N/A" }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Tax ID</label
            >
            <p class="mt-1 text-sm text-gray-900">{{ selectedVendor.taxId }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Status</label
            >
            <p
              :class="[
                'mt-1 text-sm font-semibold',
                selectedVendor.isActive ? 'text-green-600' : 'text-red-600',
              ]"
            >
              {{ selectedVendor.isActive ? "Active" : "Inactive" }}
            </p>
          </div>
          <div class="flex justify-end">
            <button
              @click="showViewModal = false"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Close
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
