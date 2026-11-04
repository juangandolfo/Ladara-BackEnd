export interface BillingInformationInput {
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

export interface BillingInformationDto extends BillingInformationInput {
    id: number;
    userId: string;
    createdAt: string;
}