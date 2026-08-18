/**
 * Ladara Frontend Contracts - Shared Types
 * 
 * This file contains all TypeScript interfaces and enums
 * shared between backend and frontend.
 */

// ============================================
// ENUMS
// ============================================

export enum OrderStatus {
  CART = 'cart',
  PREPARING = 'preparing',
  COMPLETED = 'completed'
}

export enum DiscountType {
  FIXED = 'fixed',
  PERCENT = 'percent'
}

// ============================================
// API RESPONSE WRAPPER
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ============================================
// AUTH RELATED
// ============================================

export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenPayload {
  id: string;
  name: string;
  iat: number;
  exp: number;
}

// ============================================
// PRODUCT RELATED
// ============================================

export interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  code?: string;
  stock: number;
  category: string;
  image: string;
  deletedAt?: Date | null;
  discountedPrice?: number;
}

export interface ProductFilterDto {
  id?: number;
  name?: string;
  description?: string;
  code?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  category?: string;
  sortBy?: 'id' | 'name' | 'price' | 'description' | 'code' | 'stock';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface CreateProductDto {
  name: string;
  price: number;
  category: string;
  image: string;
  description?: string;
  code?: string;
  stock?: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  code?: string;
  stock?: number;
  category?: string;
  image?: string;
}

export interface ProductFilterResult {
  products: Product[];
  total: number;
  count: number;
  appliedFilters: ProductFilterDto;
}

// ============================================
// ORDER RELATED
// ============================================

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  discountedPrice?: number;
  product?: {
    id: number;
    name: string;
    price: number;
    discountedPrice?: number;
    image: string;
    category: string;
    description?: string;
  };
}

export interface Order {
  id: number;
  userId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface OrderDto {
  id: number;
  userId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
}

export interface AddItemToOrderDto {
  productId: number;
  quantity: number;
}

export interface UpdateItemQuantityDto {
  quantity: number;
}

export interface OrderResponse extends ApiResponse<OrderDto> {}
export interface OrderListResponse extends ApiResponse<OrderDto[]> {}
export interface OrderItemResponse extends ApiResponse<OrderItem> {}

// ============================================
// DISCOUNT RELATED
// ============================================

export interface Discount {
  id: number;
  userId: string;
  value: number;
  type: DiscountType;
  description?: string;
  usesLeft?: number | null;
  deletedAt?: Date | null;
}

export interface CreateDiscountDto {
  userId: string;
  value: number;
  type: DiscountType;
  description?: string;
  usesLeft?: number | null;
}

export interface UpdateDiscountDto {
  value?: number;
  type?: DiscountType;
  description?: string;
  usesLeft?: number | null;
}

export interface DiscountResponse extends ApiResponse<Discount> {}
export interface DiscountListResponse extends ApiResponse<Discount[]> {}

// ============================================
// ERROR TYPES
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: ValidationError[];
}

// ============================================
// PAGINATION & FILTERING
// ============================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface FilteredResponse<T> {
  data: T[];
  total: number;
  count: number;
  meta?: Record<string, any>;
}

// ============================================
// SEARCH & FILTER RESULTS
// ============================================

export interface CategoryListResponse extends ApiResponse<string[]> {}

export interface ProductListResponse extends ApiResponse<Product[]> {}

export interface ProductFilterResponse extends ApiResponse<{
  products: Product[];
  meta: {
    total: number;
    count: number;
    appliedFilters: ProductFilterDto;
  };
}> {}

// ============================================
// API REQUEST/RESPONSE GENERICS
// ============================================

export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type FailureResponse = {
  success: false;
  message: string;
  error: string;
};

export type ApiResult<T> = SuccessResponse<T> | FailureResponse;

// ============================================
// UTILITY TYPES
// ============================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
