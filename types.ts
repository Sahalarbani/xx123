export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface CartItem extends Product {
  qty: number;
}

export interface Customer {
  id: string;
  name: string;
  debt: number;
  phone: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  storeName: string;
  token: string;
}

export interface TokenData {
  token: string;
  storeName: string;
  expiry: string;
  isActive: boolean;
  deviceId: string;
}

export interface OrderData {
  orderId: string;
  date: string;
  storeName: string;
  whatsapp: string;
  plan: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  generatedToken: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'CASH' | 'DEBT';
  total: number;
  customer: string;
  items: { n: string; q: number; p: number }[];
}

export enum ViewState {
  LOGIN,
  ADMIN_LOGIN,
  ADMIN_DASHBOARD,
  POS,
  DEBT_MANAGER
}