<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useToastStore } from "../../stores/toast";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const phone = ref("");
const company = ref("");
const role = ref("Client"); // Default role
const loading = ref(false);
const passwordError = ref("");

// List of available roles
const roles = [
  { id: "client", name: "Client" },
  { id: "contractor", name: "Contractor" },
  { id: "site_engineer", name: "Site Engineer" },
];

const validatePasswords = () => {
  if (password.value !== confirmPassword.value) {
    passwordError.value = "Passwords do not match";
    return false;
  }

  if (password.value.length < 6) {
    passwordError.value = "Password must be at least 6 characters";
    return false;
  }

  passwordError.value = "";
  return true;
};

// const register = async () => {
//   // Validate required fields
//   if (
//     !firstName.value ||
//     !lastName.value ||
//     !email.value ||
//     !password.value ||
//     !confirmPassword.value ||
//     !phone.value ||
//     !company.value
//   ) {
//     passwordError.value = "All fields are required";
//     return;
//   }

//   if (!validatePasswords()) return;

//   loading.value = true;
//   try {
//     await authStore.register({
//       email: email.value,
//       password: password.value,
//       firstName: firstName.value,
//       lastName: lastName.value,
//       role: role.value.toLowerCase(), // Convert role to lowercase to match API expectation
//       phone: phone.value,
//       company: company.value,
//     });
//     router.push("/dashboard"); // Redirect to dashboard or desired route after successful registration
//   } catch (error) {
//     passwordError.value = "Registration failed. Please try again.";
//   } finally {
//     loading.value = false;
//   }
// };
// In your register component
const register = async () => {
  if (
    !firstName.value ||
    !lastName.value ||
    !email.value ||
    !password.value ||
    !confirmPassword.value ||
    !phone.value ||
    !company.value
  ) {
    toastStore.error("All fields are required");
    return;
  }

  if (!validatePasswords()) return;

  loading.value = true;
  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
      role: role.value.toLowerCase(),
      phone: phone.value,
      company: company.value,
    });
    toastStore.success("Registration successful! Redirecting to dashboard...");
    router.push("/dashboard");
  } catch (error) {
    toastStore.error("Registration failed. Please try again.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <h2 class="text-center text-2xl font-bold text-gray-700 mb-6">
      Create a new account
    </h2>

    <div
      v-if="authStore.error || passwordError"
      class="mb-4 bg-red-50 p-4 rounded-md"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            {{ authStore.error || passwordError }}
          </h3>
        </div>
      </div>
    </div>

    <form class="space-y-4" @submit.prevent="register">
      <div>
        <label for="firstName" class="block text-sm font-medium text-gray-700"
          >First name</label
        >
        <div class="mt-1">
          <input
            id="firstName"
            v-model="firstName"
            name="firstName"
            type="text"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="lastName" class="block text-sm font-medium text-gray-700"
          >Last name</label
        >
        <div class="mt-1">
          <input
            id="lastName"
            v-model="lastName"
            name="lastName"
            type="text"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700"
          >Email address</label
        >
        <div class="mt-1">
          <input
            id="email"
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700"
          >Password</label
        >
        <div class="mt-1">
          <input
            id="password"
            v-model="password"
            name="password"
            type="password"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label
          for="confirm-password"
          class="block text-sm font-medium text-gray-700"
          >Confirm password</label
        >
        <div class="mt-1">
          <input
            id="confirm-password"
            v-model="confirmPassword"
            name="confirm-password"
            type="password"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <p v-if="passwordError" class="mt-1 text-sm text-red-600">
          {{ passwordError }}
        </p>
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700"
          >Phone number</label
        >
        <div class="mt-1">
          <input
            id="phone"
            v-model="phone"
            name="phone"
            type="tel"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="company" class="block text-sm font-medium text-gray-700"
          >Company</label
        >
        <div class="mt-1">
          <input
            id="company"
            v-model="company"
            name="company"
            type="text"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label for="role" class="block text-sm font-medium text-gray-700"
          >Role</label
        >
        <select
          id="role"
          v-model="role"
          class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option
            v-for="roleOption in roles"
            :key="roleOption.id"
            :value="roleOption.id"
          >
            {{ roleOption.name }}
          </option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          :disabled="
            loading ||
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !phone ||
            !company
          "
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <svg
            v-if="loading"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          Register
        </button>
      </div>
    </form>

    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">
            Already have an account?
          </span>
        </div>
      </div>

      <div class="mt-6">
        <router-link
          to="/login"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50"
        >
          Sign in
        </router-link>
      </div>
    </div>
  </div>
</template>
