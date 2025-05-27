export interface Material {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  status: string;
  vendors: Vendor[];  // Changed from vendorIds to vendors
}

export interface Vendor {
  id: string;
  name: string;
}

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export interface Toast {
  message: string;
  type: "success" | "error";
  visible: boolean;
}
