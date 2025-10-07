export type ShopStatus = "active" | "suspended" | "maintenance";

export interface RawUserRecord {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  contactNumber?: string;
}

export interface OperatorOption {
  uid: string;
  name: string;
  email: string;
  contactNumber: string;
}

export interface RawShopRecord {
  id?: string;
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  contactNumber?: string;
  operatorId?: string;
  operatorName?: string;
  operatorEmail?: string;
  operatorContact?: string;
  status?: string;
  notes?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ManagedShop {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  district: string;
  contactNumber: string;
  operatorId: string;
  operatorName: string;
  operatorEmail?: string;
  operatorContact?: string;
  status: ShopStatus;
  notes: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ShopFormValues {
  name: string;
  code: string;
  address: string;
  city: string;
  district: string;
  contactNumber: string;
  operatorId: string;
  status: ShopStatus;
  notes: string;
}

export const emptyShopForm: ShopFormValues = {
  name: "",
  code: "",
  address: "",
  city: "",
  district: "",
  contactNumber: "",
  operatorId: "",
  status: "active",
  notes: "",
};
