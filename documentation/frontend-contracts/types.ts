export enum OrderStatus { CART = 'cart', PREPARING = 'preparing', COMPLETED = 'completed' }
export enum DiscountType { FIXED = 'fixed', PERCENT = 'percent' }

export interface User { id: string; name: string; isAdmin: boolean; }
export interface AuthResponse { user: User; token: string; }
export interface TokenPayload { id: string; name: string; iat: number; exp: number; }
export interface Product { id: number; name: string; price: number; description?: string; code?: string; stock: number; category: string; image: string; deletedAt?: Date | null; discountedPrice?: number; }
export interface ProductFilterDto { id?: number; name?: string; description?: string; code?: string; price?: number; minPrice?: number; maxPrice?: number; stock?: number; minStock?: number; maxStock?: number; category?: string; sortBy?: 'id' | 'name' | 'price' | 'description' | 'code' | 'stock'; sortOrder?: 'ASC' | 'DESC'; limit?: number; offset?: number; includeDeleted?: boolean; }
export interface CreateProductDto { name: string; price: number; category: string; image: string; description?: string; code?: string; stock?: number; }
export interface UpdateProductDto { name?: string; price?: number; description?: string; code?: string; stock?: number; category?: string; image?: string; }
export interface ProductFilterResult { products: Product[]; total: number; count: number; appliedFilters: ProductFilterDto; }
export interface OrderItem { id: number; productId: number; quantity: number; price: number; total: number; discountedPrice?: number; product?: { id: number; name: string; price: number; discountedPrice?: number; image: string; category: string; description?: string; }; }
export interface Order { id: number; userId: string; status: OrderStatus; total: number; createdAt: string; updatedAt?: string; items?: OrderItem[]; }
export interface OrderDto { id: number; userId: string; status: OrderStatus; total: number; createdAt: string; updatedAt?: string; items?: OrderItem[]; }
export interface AddItemToOrderDto { productId: number; quantity: number; }
export interface UpdateItemQuantityDto { quantity: number; }
export interface OrderResponse extends Response<OrderDto> {}
export interface OrderListResponse extends Response<OrderDto[]> {}
export interface OrderItemResponse extends Response<OrderItem> {}
export interface Discount { id: number; userId: string; value: number; type: DiscountType; description?: string; usesLeft?: number | null; deletedAt?: Date | null; }
export interface CreateDiscountDto { userId: string; value: number; type: DiscountType; description?: string; usesLeft?: number | null; }
export interface UpdateDiscountDto { value?: number; type?: DiscountType; description?: string; usesLeft?: number | null; }
export interface DiscountResponse extends Response<Discount> {}
export interface DiscountListResponse extends Response<Discount[]> {}
export interface PaginationParams { limit?: number; offset?: number; }
export interface FilteredResponse<T> { data: T[]; total: number; count: number; meta?: Record<string, any>; }
export interface CategoryListResponse extends Response<string[]> {}
export interface ProductListResponse extends Response<Product[]> {}
export interface ProductFilterResponse extends Response<{ products: Product[]; meta: { total: number; count: number; appliedFilters: ProductFilterDto; }; }> {}
export type ApiResult<T> = SuccessResponse<T> | FailureResponse;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]>; };
