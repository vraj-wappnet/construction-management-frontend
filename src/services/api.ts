import axios from "axios";

interface CreateProjectData {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  status?: string;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

// Create an API client instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Fallback for development
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add a request interceptor for JWT auth
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`No token found for request to ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error(
        `401 Unauthorized for ${error.config.url}:`,
        error.response.data
      );
      // Do not remove token immediately; let the component decide
      // Optionally log additional details
      console.log("Request headers:", error.config.headers);
    }
    return Promise.reject(error);
  }
);

export { apiClient };

export const projectService = {
  async getProjects() {
    return await apiClient.get("/projects");
  },

  async getMyProjects() {
    return await apiClient.get("/projects/my-projects");
  },

  async getProject(id: number) {
    return await apiClient.get(`/projects/${id}`);
  },

  async getSiteEngineers() {
    return await apiClient.get(`/users/site-engineers`);
  },
  async createProject(data: CreateProjectData) {
    return await apiClient.post("/projects", data);
  },

  async updateProject(id: number, data: UpdateProjectData) {
    return await apiClient.patch(`/projects/${id}`, data);
  },

  async deleteProject(id: number) {
    return await apiClient.delete(`/projects/${id}`);
  },

  async acceptProject(id: number) {
    return await apiClient.post(`/projects/${id}/accept`);
  },

  async assignSiteEngineer(projectId: number, siteEngineerId: number) {
    return await apiClient.post(
      `/projects/${projectId}/assign-site-engineer/${siteEngineerId}`
    );
  },

  async createPayment(data: {
    amount: number;
    currency: string;
    payeeId: number;
    projectId: number;
    description: string;
  }) {
    return await apiClient.post("/payments", data);
  },

  async confirmPayment(data: { paymentIntentId: string }) {
    return await apiClient.post("/payments/confirm", data);
  },

  // Add getPaymentHistory method
  async getPaymentHistory() {
    return await apiClient.get("/payments");
  },
};

// Task service
export const taskService = {
  getTasks(projectId: string) {
    return apiClient.get(`/projects/${projectId}/tasks`);
  },
  getTask(projectId: string, id: string) {
    return apiClient.get(`/projects/${projectId}/tasks/${id}`);
  },
  createTask(projectId: string, task: any) {
    return apiClient.post(`/projects/${projectId}/tasks`, task);
  },
  updateTask(projectId: string, id: string, task: any) {
    return apiClient.patch(`/projects/${projectId}/tasks/${id}`, task);
  },
  addDependency(projectId: string, taskId: string, dependencyId: string) {
    return apiClient.post(
      `/projects/${projectId}/tasks/${taskId}/dependencies`,
      { dependencyId }
    );
  },
  deleteTask(projectId: string, id: string) {
    return apiClient.delete(`/projects/${projectId}/tasks/${id}`);
  },
};

// Material service
export const materialService = {
  getMaterials(projectId: string) {
    return apiClient.get(`/projects/${projectId}/materials`);
  },
  getMaterial(projectId: string, id: string) {
    return apiClient.get(`/projects/${projectId}/materials/${id}`);
  },
  createMaterial(projectId: string, material: any) {
    return apiClient.post(`/projects/${projectId}/materials`, material);
  },
  updateMaterialStatus(projectId: string, id: string, status: string) {
    return apiClient.patch(`/projects/${projectId}/materials/${id}/status`, {
      status,
    });
  },
  deleteMaterial(projectId: string, id: string) {
    return apiClient.delete(`/projects/${projectId}/materials/${id}`);
  },
};

// Document service
export const documentService = {
  async getDocuments(projectId: string) {
    return await apiClient.get(`/projects/${projectId}/documents`);
  },

  async createDocument(projectId: string, formData: FormData) {
    return await apiClient.post(`/projects/${projectId}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Vendor service
export const vendorService = {
  getVendors() {
    return apiClient.get("/vendors");
  },
  getVendor(id: string) {
    return apiClient.get(`/vendors/${id}`);
  },
  createVendor(vendor: any) {
    return apiClient.post("/vendors", vendor);
  },
  updateVendor(id: string, vendor: any) {
    return apiClient.patch(`/vendors/${id}`, vendor);
  },
  deleteVendor(id: string) {
    return apiClient.delete(`/vendors/${id}`);
  },
};

// User service
export const userService = {
  getUsers() {
    return apiClient.get("/users");
  },
  deleteUser(id: string) {
    return apiClient.delete(`/users\/${id}`);
  },
};

export const profileService = {
  getUserProfile() {
    return apiClient.get("/users/me");
  },
  async updateProfile(data: any) {
    return await apiClient.patch("/users/me", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
