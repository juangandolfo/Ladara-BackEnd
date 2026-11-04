export interface AddItemToOrderDto {
  productId: number;
  quantity: number;
}

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
    stock: number;
    discountedPrice?: number;
    image: string;
    category: string;
    description?: string;
  };
}

export interface CouponValidationData {
  valid: boolean;
  code: string;
  discountAmount: number;
  message?: string;
}

export interface CheckoutValidationRejectedItem {
  itemId: number | string;
  reason: string;
  message: string;
}

export interface CheckoutValidationData {
  valid: boolean;
  rejectedItems: CheckoutValidationRejectedItem[];
}

export interface OrderDto {
  id: number;
  userId: number;
  status: string;
  total: number;
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
  billingAddress?: {
    fullName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod?: string;
  checkoutAt?: string;
  items?: OrderItemDto[];
}

export interface CreateOrderResponse extends ApiResponse<OrderDto> {}
export interface GetOrderResponse extends ApiResponse<OrderDto> {}
export interface GetCurrentOrderResponse extends ApiResponse<OrderDto[]> {}
export interface CancelOrderResponse extends ApiResponse<OrderDto> {}
export interface AddItemResponse extends ApiResponse<OrderItemDto> {}
export interface CouponValidationResponse extends ApiResponse<CouponValidationData> {}
export interface CheckoutValidationResponse extends ApiResponse<CheckoutValidationData> {}
export interface DeleteItemResponse extends ApiResponse<never> {
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}