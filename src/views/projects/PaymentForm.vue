<script setup lang="ts">
import { ref } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import { StripeElements, StripeElement } from "vue-stripe-js";
import { projectService } from "../../services/api";
import { useToastStore } from "../../stores/toast";
import type {
  StripeElementsOptionsMode,
  StripePaymentElementOptions,
} from "@stripe/stripe-js";

interface Props {
  projectId: number;
  payeeId: number;
}

interface Toast {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "payment-success"): void;
  (e: "payment-error", message: string): void;
  (e: "close"): void;
}>();

const toastStore = useToastStore();
const toast = ref<Toast>({
  message: "",
  type: "success",
  visible: false,
});

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;
console.log("Stripe key:", stripeKey);
if (!stripeKey) {
  throw new Error(
    "Stripe publishable key is not defined in environment variables"
  );
}

const stripeOptions = ref({
  // Additional Stripe.js options if needed
});
const elementsOptions = ref<StripeElementsOptionsMode>({
  mode: "payment",
  currency: "usd",
  amount: 1000,
  appearance: { theme: "flat" },
});
const paymentElementOptions = ref<StripePaymentElementOptions>({
  // Additional payment element options if needed
});
const stripeLoaded = ref(false);
const clientSecret = ref<string | null>(null);
const paymentId = ref(0);
const amount = ref(1000); // Default amount in cents ($10.00)
const loading = ref(false);
const error = ref<string | null>(null);
const showLoginPrompt = ref(false);

const elementsComponent = ref();
const paymentComponent = ref();

// Load Stripe.js on mount
(async () => {
  try {
    console.log("Loading Stripe with key:", stripeKey.substring(0, 10) + "...");
    const stripe = await loadStripe(stripeKey);
    if (!stripe) {
      throw new Error("Failed to load Stripe.js");
    }
    stripeLoaded.value = true;
    console.log("Stripe loaded successfully");
  } catch (err: unknown) {
    error.value = `Failed to load Stripe: ${err}`;
    console.error("Stripe load error:", err);
    emit("payment-error", error.value);
    toastStore.error(error.value, 7000); // Show error toast
  }
})();

async function handleSubmit() {
  if (!elementsComponent.value) {
    error.value = "Payment form not initialized";
    console.error("Payment form error:", error.value);
    emit("payment-error", error.value);
    toastStore.error(error.value, 7000); // Show error toast
    return;
  }

  if (loading.value) {
    console.log("Payment submission already in progress, ignoring");
    return;
  }

  if (!Number.isInteger(props.payeeId) || props.payeeId <= 0) {
    error.value = "Invalid payeeId: must be a positive integer";
    console.error("Payment form error:", error.value);
    emit("payment-error", error.value);
    toastStore.error(error.value, 7000); // Show error toast
    return;
  }

  if (!Number.isInteger(props.projectId) || props.projectId <= 0) {
    error.value = "Invalid projectId: must be a positive integer";
    console.error("Payment form error:", error.value);
    emit("payment-error", error.value);
    toastStore.error(error.value, 7000); // Show error toast
    return;
  }

  if (amount.value < 100) {
    error.value = "Amount must be at least $1.00";
    console.error("Payment form error:", error.value);
    emit("payment-error", error.value);
    toastStore.error(error.value, 7000); // Show error toast
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const stripeInstance = elementsComponent.value.instance;
    const elements = elementsComponent.value.elements;

    if (!stripeInstance || !elements) {
      throw new Error("Stripe instance or elements not initialized");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      error.value = "Authentication required. Please log in.";
      showLoginPrompt.value = true;
      emit("payment-error", error.value);
      toastStore.error(error.value, 7000); // Show error toast
      return;
    }
    console.log("Token for payment request:", token.substring(0, 20) + "...");

    console.log("Creating payment intent with:", {
      amount: amount.value,
      currency: "usd",
      payeeId: props.payeeId,
      projectId: props.projectId,
    });
    const response = await projectService.createPayment({
      amount: amount.value,
      currency: "usd",
      payeeId: props.payeeId,
      projectId: props.projectId,
      description: `Payment for project ${props.projectId}`,
    });

    console.log("createPayment response:", response.data);
    if (!response.data.clientSecret) {
      throw new Error("Client secret not received from backend");
    }
    clientSecret.value = response.data.clientSecret;
    paymentId.value = response.data.paymentId;

    toastStore.success("Payment created successfully!", 7000);
    if (!clientSecret.value) {
      throw new Error("Client secret is null");
    }
    elementsOptions.value.amount = amount.value;

    console.log("Submitting payment form elements");
    const { error: submitError } = await elements.submit();
    if (submitError) {
      throw new Error(submitError.message || "Failed to submit payment form");
    }

    console.log("Confirming payment with clientSecret:", clientSecret.value);
    const { error: stripeError } = await stripeInstance.confirmPayment({
      elements,
      clientSecret: clientSecret.value,
      confirmParams: {
        return_url: window.location.origin + "/projects",
      },
    });

    if (stripeError) {
      throw new Error(stripeError.message || "Payment failed");
    }

    console.log(
      "Confirming payment with paymentIntentId:",
      clientSecret.value.split("_secret_")[0]
    );
    await projectService.confirmPayment({
      paymentIntentId: clientSecret.value.split("_secret_")[0],
    });

    console.log(
      "Payment successful for project:",
      props.projectId,
      "payee:",
      props.payeeId
    );
    emit("payment-success");
    emit("close");
  } catch (err: unknown) {
    const apiError = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    console.error("Payment confirmation error:", apiError);
    if (apiError.response?.status === 401) {
      error.value = "Session expired. Please log in again.";
      showLoginPrompt.value = true;
    } else {
      error.value =
        apiError.response?.data?.message || `Payment failed: ${err}`;
    }
    console.error("Payment failed:", error.value);
    emit("payment-error", error.value);
    toastStore.error(error.value, 7000); // Show error toast
  } finally {
    loading.value = false;
  }
}

function redirectToLogin() {
  localStorage.removeItem("token");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}
</script>

<template>
  <div class="space-y-4 relative">
    <!-- Toast Notification -->
    <div
      v-if="toast.visible"
      :class="[
        'fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-1000',
        toast.type === 'success'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800',
      ]"
    >
      {{ toast.message }}
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-100 p-4 rounded-md">
      <div class="flex items-center">
        <svg
          class="h-5 w-5 text-red-600"
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
        <p class="ml-3 text-sm text-red-600">{{ error }}</p>
      </div>
    </div>

    <!-- Login Prompt -->
    <div v-if="showLoginPrompt" class="mt-4 bg-yellow-100 p-4 rounded-md">
      <p class="text-sm text-yellow-800">
        Your session has expired. Please log in again to continue.
      </p>
      <button
        @click="redirectToLogin"
        class="mt-2 inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
      >
        Log In
      </button>
    </div>

    <!-- Payment Form -->
    <form
      v-if="stripeLoaded && !showLoginPrompt"
      @submit.prevent="handleSubmit"
      class="space-y-4"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700"
          >Amount ($)</label
        >
        <input
          v-model.number="amount"
          type="number"
          min="100"
          step="1"
          class="mt-1 w-full h-10 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          @input="elementsOptions.amount = amount"
        />
      </div>
      <StripeElements
        :stripe-key="stripeKey"
        :instance-options="stripeOptions"
        :elements-options="elementsOptions"
        ref="elementsComponent"
      >
        <StripeElement
          type="payment"
          :options="paymentElementOptions"
          ref="paymentComponent"
        />
      </StripeElements>
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {{ loading ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}` }}
        </button>
      </div>
    </form>
    <!-- Loading State -->
    <div v-if="!stripeLoaded && !error && !showLoginPrompt" class="text-center">
      <svg
        class="animate-spin h-8 w-8 text-blue-600 mx-auto"
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
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p class="mt-2 text-sm text-gray-600">Loading payment form...</p>
    </div>
  </div>
</template>

<style scoped>
input,
select {
  padding-left: 8px;
  padding-right: 8px;
}

/* Darker border on focus */
input:focus,
select:focus {
  border-color: #1e40af; /* Darker blue */
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.2);
}
</style>
