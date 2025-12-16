export interface CompanyDeliveryWithPrice {
    idCompany: string;
    name: string;
    phone: string;
    price: number | null;
    priceMessage: string | undefined;
}