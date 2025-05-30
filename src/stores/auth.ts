// import { defineStore } from "pinia";
// import { jwtDecode } from "jwt-decode";
// import router from "../router";
// import { apiClient } from "../services/api";

// interface User {
//   id: string;
//   email: string;
//   role: string;
//   firstName: string;
//   lastName: string;
//   phone: string;
//   company: string;
//   isActive: boolean;
//   profilePicture?: string | null; // Add profilePicture field
// }

// interface LoginCredentials {
//   email: string;
//   password: string;
//   rememberMe?: boolean;
// }

// interface RegisterData {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   role: string;
//   phone: string;
//   company: string;
// }

// interface ForgotPasswordData {
//   email: string;
// }

// interface VerifyOtpData {
//   email: string;
//   otp: string;
// }

// interface ResetPasswordData {
//   email: string;
//   otp: string;
//   password: string;
// }

// interface AuthState {
//   user: User | null;
//   token: string | null;
//   loading: boolean;
//   error: string | null;
//   isVerifiedOtp: boolean;
//   verifiedEmail: string | null;
// }

// export const useAuthStore = defineStore("auth", {
//   state: (): AuthState => ({
//     user: localStorage.getItem("user")
//       ? JSON.parse(localStorage.getItem("user")!)
//       : null,
//     token: localStorage.getItem("token"),
//     loading: false,
//     error: null,
//     isVerifiedOtp: false,
//     verifiedEmail: null,
//   }),

//   getters: {
//     isAuthenticated: (state): boolean => !!state.token && !!state.user,
//     userRole: (state): string => state.user?.role || "",
//   },

//   actions: {
//     async login(credentials: LoginCredentials) {
//       this.loading = true;
//       this.error = null;

//       try {
//         const response = await apiClient.post("/auth/login", {
//           email: credentials.email,
//           password: credentials.password,
//           rememberMe: credentials.rememberMe,
//         });
//         const { access_token, user } = response.data;
//         this.setToken(access_token);
//         this.setUser(user);
//         router.push({ name: "Dashboard" });
//       } catch (error: any) {
//         this.error = error.response?.data?.message || "Login failed";
//         this.clearAuthState();
//       } finally {
//         this.loading = false;
//       }
//     },

//     async register(data: RegisterData) {
//       this.loading = true;
//       this.error = null;

//       try {
//         const response = await apiClient.post("/users", data);
//         const { access_token, user } = response.data;
//         this.setToken(access_token);
//         this.setUser(user);
//         router.push({ name: "Dashboard" });
//       } catch (error: any) {
//         this.error = error.response?.data?.message || "Registration failed";
//       } finally {
//         this.loading = false;
//       }
//     },

//     async forgotPassword(data: ForgotPasswordData) {
//       this.loading = true;
//       this.error = null;

//       try {
//         await apiClient.post("/auth/forgot-password", data);
//         this.verifiedEmail = data.email;
//         router.push({ name: "ResetPassword" });
//       } catch (error: any) {
//         this.error =
//           error.response?.data?.message || "Failed to send reset instructions";
//       } finally {
//         this.loading = false;
//       }
//     },

//     async verifyOtp(data: VerifyOtpData) {
//       this.loading = true;
//       this.error = null;

//       try {
//         await apiClient.post("/auth/verify-otp", data);
//         this.isVerifiedOtp = true;
//         this.verifiedEmail = data.email;
//       } catch (error: any) {
//         this.error = error.response?.data?.message || "OTP verification failed";
//         this.isVerifiedOtp = false;
//       } finally {
//         this.loading = false;
//       }
//     },

//     async resetPassword(data: ResetPasswordData) {
//       this.loading = true;
//       this.error = null;

//       try {
//         await apiClient.post("/auth/reset-password", data);
//         this.isVerifiedOtp = false;
//         this.verifiedEmail = null;
//         router.push({ name: "Login" });
//       } catch (error: any) {
//         this.error = error.response?.data?.message || "Password reset failed";
//       } finally {
//         this.loading = false;
//       }
//     },

//     setToken(token: string) {
//       this.token = token;
//       localStorage.setItem("token", token);
//       apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//     },

//     setUser(user: User) {
//       this.user = user;
//       localStorage.setItem("user", JSON.stringify(user));
//     },

//     async checkAuth() {
//       this.loading = true;
//       const token = localStorage.getItem("token");

//       if (!token) {
//         this.clearAuthState();
//         this.loading = false;
//         return false;
//       }

//       try {
//         const decodedToken: any = jwtDecode(token);
//         const currentTime = Date.now() / 1000;

//         if (decodedToken.exp < currentTime) {
//           this.clearAuthState();
//           this.loading = false;
//           return false;
//         }

//         this.token = token;
//         apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

//         // Fetch latest user data to ensure profilePicture is up-to-date
//         const response = await apiClient.get("/users/me");
//         this.setUser(response.data);

//         this.loading = false;
//         return true;
//       } catch (error) {
//         this.clearAuthState();
//         this.loading = false;
//         return false;
//       }
//     },

//     clearAuthState() {
//       this.user = null;
//       this.token = null;
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       delete apiClient.defaults.headers.common["Authorization"];
//     },

//     logout() {
//       this.clearAuthState();
//       if (
//         router.currentRoute.value.name !== "Login" &&
//         router.currentRoute.value.name !== "Home" &&
//         router.currentRoute.value.name !== "Register" &&
//         router.currentRoute.value.name !== "ForgotPassword" &&
//         router.currentRoute.value.name !== "ResetPassword"
//       ) {
//         router.push({ name: "Home" });
//       }
//     },
//   },
// });

import { defineStore } from "pinia";
import { jwtDecode } from "jwt-decode";
import router from "../router";
import { apiClient } from "../services/api";

interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  isActive: boolean;
  profilePicture?: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  company: string;
}

interface ForgotPasswordData {
  email: string;
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

interface ResetPasswordData {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isVerifiedOtp: boolean;
  verifiedEmail: string | null;
  successMessage: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null,
    token: localStorage.getItem("token"),
    loading: false,
    error: null,
    isVerifiedOtp: false,
    verifiedEmail: null,
    successMessage: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token && !!state.user,
    userRole: (state): string => state.user?.role || "",
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.loading = true;
      this.error = null;

      try {
        const response = await apiClient.post("/auth/login", {
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
        });
        const { access_token, user } = response.data;
        this.setToken(access_token);
        this.setUser(user);
        router.push({ name: "Dashboard" });
      } catch (error: any) {
        this.error = error.response?.data?.message || "Login failed";
        this.clearAuthState();
      } finally {
        this.loading = false;
      }
    },

    async register(data: RegisterData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await apiClient.post("/users", data);
        const { access_token, user } = response.data;
        this.setToken(access_token);
        this.setUser(user);
        router.push({ name: "Dashboard" });
      } catch (error: any) {
        this.error = error.response?.data?.message || "Registration failed";
      } finally {
        this.loading = false;
      }
    },

    async forgotPassword(data: ForgotPasswordData) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        await apiClient.post("/auth/forgot-password", data);
        this.verifiedEmail = data.email;
        this.successMessage = `OTP has been sent to ${data.email}`;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Failed to send reset instructions";
        this.verifiedEmail = null;
      } finally {
        this.loading = false;
      }
    },

    async verifyOtp(data: VerifyOtpData) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        await apiClient.post("/auth/verify-otp", data);
        this.isVerifiedOtp = true;
        this.verifiedEmail = data.email;
        this.successMessage = "OTP verified successfully";
      } catch (error: any) {
        this.error = error.response?.data?.message || "OTP verification failed";
        this.isVerifiedOtp = false;
      } finally {
        this.loading = false;
      }
    },

    async resetPassword(data: ResetPasswordData) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        await apiClient.post("/auth/reset-password", data);
        this.successMessage = "Password reset successfully. You can now login with your new password.";
        this.clearResetState();
        setTimeout(() => {
          router.push({ name: "Login" });
        }, 2000);
      } catch (error: any) {
        this.error = error.response?.data?.message || "Password reset failed";
      } finally {
        this.loading = false;
      }
    },

    setToken(token: string) {
      this.token = token;
      localStorage.setItem("token", token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },

    setUser(user: User) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
    },

    clearResetState() {
      this.isVerifiedOtp = false;
      this.verifiedEmail = null;
    },

    clearAuthState() {
      this.user = null;
      this.token = null;
      this.error = null;
      this.successMessage = null;
      this.clearResetState();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete apiClient.defaults.headers.common["Authorization"];
    },

    clearMessages() {
      this.error = null;
      this.successMessage = null;
    },

    async checkAuth() {
      this.loading = true;
      const token = localStorage.getItem("token");

      if (!token) {
        this.clearAuthState();
        this.loading = false;
        return false;
      }

      try {
        const decodedToken: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          this.clearAuthState();
          this.loading = false;
          return false;
        }

        this.token = token;
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const response = await apiClient.get("/users/me");
        this.setUser(response.data);

        this.loading = false;
        return true;
      } catch (error) {
        this.clearAuthState();
        this.loading = false;
        return false;
      }
    },

    logout() {
      this.clearAuthState();
      if (
        router.currentRoute.value.name !== "Login" &&
        router.currentRoute.value.name !== "Home" &&
        router.currentRoute.value.name !== "Register" &&
        router.currentRoute.value.name !== "ForgotPassword" &&
        router.currentRoute.value.name !== "ResetPassword"
      ) {
        router.push({ name: "Home" });
      }
    },
  },
});