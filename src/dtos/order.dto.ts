// Request DTOs
export interface AddItemToOrderDto {
  productId: number;
  quantity: number;
}

// Response DTOs
export interface OrderItemDto {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  product?: {
    id: number;
    name: string;
    price: number;
  };
}

export interface OrderDto {
  id: number;
  userId: number;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemDto[];
}

// API Response types
export interface CreateOrderResponse extends ApiResponse<OrderDto> {}
export interface GetOrderResponse extends ApiResponse<OrderDto> {}
export interface GetCurrentOrderResponse extends ApiResponse<OrderDto[]> {}
export interface CancelOrderResponse extends ApiResponse<OrderDto> {}
export interface AddItemResponse extends ApiResponse<OrderItemDto> {}
export interface DeleteItemResponse extends ApiResponse<never> {
  message: string;
}

// Base API Response (reusing from previous conversation)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}