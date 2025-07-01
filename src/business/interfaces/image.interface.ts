export interface ImageDto {
  order?: number;
  url?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: BigInt;
  folder?: string;
}