import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    if (userId) {
      this.addUserSocket(userId, client.id);
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromClient(client);
    if (userId) {
      this.removeUserSocket(userId, client.id);
    }
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, @MessageBody() data: { userId: number }) {
    const userId = data.userId;
    if (userId) {
      this.addUserSocket(userId, client.id);
      client.join(`user:${userId}`);
      return { success: true, message: `User ${userId} joined` };
    }
    return { success: false, message: 'userId is required' };
  }

  @SubscribeMessage('join-role')
  handleJoinRole(client: Socket, @MessageBody() data: { role: string }) {
    if (data.role) {
      client.join(`role:${data.role}`);
      return { success: true, message: `Joined role: ${data.role}` };
    }
    return { success: false, message: 'role is required' };
  }

  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  private getUserIdFromClient(client: Socket): number | null {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const parsed = parseInt(userId, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private addUserSocket(userId: number, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: number, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
