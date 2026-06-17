export class CreateSignDto {
  orderId: number;
  actualQuantity: number;
  signedBy?: number;
  signPhoto?: string;
  remark?: string;
}
