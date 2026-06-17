import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: number;
  orderId?: number;
}
