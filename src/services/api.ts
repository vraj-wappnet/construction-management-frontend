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
      localStorage.removeItem("token");
      // Redirect to login page if needed
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
    return await apiClient.post(`/projects/${projectId}/assign-site-engineer/${siteEngineerId}`);
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
  getDocuments(projectId: string) {
    return apiClient.get(`/projects/${projectId}/documents`);
  },
  getDocumentVersions(projectId: string, id: string) {
    return apiClient.get(`/projects/${projectId}/documents/${id}/versions`);
  },
  getLatestVersion(projectId: string, id: string) {
    return apiClient.get(`/projects/${projectId}/documents/${id}/latest`);
  },
  createDocument(projectId: string, document: any) {
    return apiClient.post(`/projects/${projectId}/documents`, document);
  },
  addDocumentVersion(projectId: string, id: string, version: any) {
    return apiClient.post(
      `/projects/${projectId}/documents/${id}/versions`,
      version
    );
  },
};

// Invoice service
export const invoiceService = {
  getInvoices(projectId: string) {
    return apiClient.get(`/projects/${projectId}/invoices`);
  },
  createInvoice(projectId: string, invoice: any) {
    return apiClient.post(`/projects/${projectId}/invoices`, invoice);
  },
  markAsPaid(projectId: string, id: string) {
    return apiClient.patch(`/projects/${projectId}/invoices/${id}/pay`);
  },
  deleteInvoice(projectId: string, id: string) {
    return apiClient.delete(`/projects/${projectId}/invoices/${id}`);
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
    return apiClient.delete(`/users/${id}`);
  },
};


export const profileService = {
  getUserProfile() {
    return apiClient.get("/users/me");
  },
  updateProfile(data: any) {
    return apiClient.patch("/users/me", data);
  },
}