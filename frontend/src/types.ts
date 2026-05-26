/**
 * Domain types for production-grade Tecno Stock Manager
 */

export type ProductCategory = 'Phones' | 'Watches' | 'Accessories';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type UserRole = 'admin' | 'staff';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  sku: string;
  quantity: number;
  unitPrice: number;
  stockStatus: StockStatus;
  createdAt: any; // Timestamp or ISO string
  updatedAt: any; // Timestamp or ISO string
  updatedBy: string; // User email / displayName or UID
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
  lastLogin: any;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  operatorId: string;
  operatorEmail: string;
  action: 'create' | 'update' | 'delete' | 'adjust_increment' | 'adjust_decrement' | 'seed';
  preQuantity: number;
  postQuantity: number;
  timestamp: any;
}

export interface ProductInput {
  name: string;
  brand: string;
  category: ProductCategory;
  sku: string;
  quantity: number;
  unitPrice: number;
}
