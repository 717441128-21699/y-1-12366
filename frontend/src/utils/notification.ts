import { io, Socket } from 'socket.io-client'
import type { Notification, NotificationType } from '@/types'

export type NotificationCallback = (notification: Notification) => void

export interface SocketNotification {
  id?: number
  type: NotificationType
  title: string
  content: string
  relatedId?: number
  createdAt?: string
}

class NotificationSocket {
  private static instance: NotificationSocket | null = null
  private socket: Socket | null = null
  private callbacks: Set<NotificationCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  public static getInstance(): NotificationSocket {
    if (!NotificationSocket.instance) {
      NotificationSocket.instance = new NotificationSocket()
    }
    return NotificationSocket.instance
  }

  private constructor() {
    this.connect()
  }

  private connect() {
    try {
      this.socket = io('ws://localhost:3000/notifications', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      })

      this.socket.on('connect', () => {
        console.log('[NotificationSocket] Connected')
        this.reconnectAttempts = 0
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[NotificationSocket] Disconnected:', reason)
      })

      this.socket.on('connect_error', (error) => {
        console.warn('[NotificationSocket] Connect error:', error.message)
        this.reconnectAttempts++
      })

      this.socket.on('notification', (data: SocketNotification) => {
        console.log('[NotificationSocket] Received notification:', data)
        const notification: Notification = {
          id: data.id ?? Date.now(),
          type: data.type,
          title: data.title,
          content: data.content,
          relatedId: data.relatedId,
          isRead: false,
          createdAt: data.createdAt ?? new Date().toISOString(),
        }
        this.callbacks.forEach(cb => {
          try {
            cb(notification)
          } catch (e) {
            console.error('[NotificationSocket] Callback error:', e)
          }
        })
      })

      this.socket.on('error', (error) => {
        console.error('[NotificationSocket] Socket error:', error)
      })
    } catch (e) {
      console.error('[NotificationSocket] Failed to initialize socket:', e)
    }
  }

  public onNotification(callback: NotificationCallback): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  public offNotification(callback: NotificationCallback): void {
    this.callbacks.delete(callback)
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  public close(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
    this.callbacks.clear()
    NotificationSocket.instance = null
  }

  public joinRoom(userId: number, role: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join', { userId })
      this.socket.emit('join-role', { role })
    }
  }

  public emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }
}

export const notificationSocket = NotificationSocket.getInstance()
export default NotificationSocket
