export interface AddItemToOrderDto {
  productId: number;
  quantity: number;
}

export type OrderPaymentMethod = "bank_transfer" | "cash";
export type OrderPaymentStatus = "unpaid" | "paid";

export interface BillingAddressDto {
  fullName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CheckoutOrderDto {
  billingInformationId: number;
  paymentMethod: OrderPaymentMethod;
}

export interface OrderFulfillmentUpdateDto {
  paymentStatus?: OrderPaymentStatus;
  paymentReference?: string | null;
  invoiceIssued?: boolean;
  invoiceIdentifier?: string | null;
  isDelivered?: boolean;
  deliveryDocumentIdentifier?: string | null;
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
  userId: string;
  status: string;
  total: number;
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
  billingInformationId?: number;
  billingAddress?: BillingAddressDto;
  paymentMethod?: OrderPaymentMethod | string;
  checkoutAt?: string;
  paymentStatus: OrderPaymentStatus;
  paymentReference: string | null;
  paidAt: string | null;
  invoiceIdentifier: string | null;
  invoiceIssuedAt: string | null;
  isDelivered: boolean;
  deliveredAt: string | null;
  deliveryDocumentIdentifier: string | null;
  completedAt: string | null;
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