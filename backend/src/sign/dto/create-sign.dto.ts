export class CreateSignDto {
  orderId: number;
  actualQuantity: number;
  signedBy?: string;
  signPhoto?: string;
  remark?: string;
}
