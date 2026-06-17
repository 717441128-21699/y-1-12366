import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Post('broadcast/:role')
  broadcastToRole(
    @Param('role') role: UserRole,
    @Body() createNotificationDto: Omit<CreateNotificationDto, 'userId'>,
  ) {
    return this.notificationService.broadcastToRole(role, createNotificationDto);
  }

  @Get('user/:userId')
  findAll(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() paginationDto: PaginationDto & { isRead?: string },
  ) {
    const isRead =
      paginationDto.isRead !== undefined
        ? paginationDto.isRead === 'true'
        : undefined;
    return this.notificationService.findAll(userId, { ...paginationDto, isRead });
  }

  @Get('user/:userId/unread-count')
  getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId', ParseIntPipe) userId: number) {
    return this.notificationService.markAllAsRead(userId);
  }
}
