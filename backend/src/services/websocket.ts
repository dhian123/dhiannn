import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/middleware/auth';
import { CacheService } from '@/config/redis';
import { logger } from '@/utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

interface NotificationData {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

interface RealTimeUpdate {
  event: string;
  data: any;
  timestamp: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const cleanToken = token.replace('Bearer ', '');
        const payload = verifyToken(cleanToken);
        
        socket.userId = payload.userId;
        socket.userRole = payload.role;
        socket.userEmail = payload.email;
        
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          socketId: socket.id,
        });
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const key = `ws_rate_limit:${socket.userId || socket.ip}`;
        const count = await CacheService.incrementRateLimit(key, 60); // 1 minute window
        
        if (count > 100) { // 100 events per minute
          return next(new Error('Rate limit exceeded'));
        }
        
        next();
      } catch (error) {
        logger.error('WebSocket rate limiting error', { error });
        next();
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;
    const userRole = socket.userRole!;
    
    // Store connected user
    this.connectedUsers.set(userId, socket);
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-specific room
    socket.join(`role:${userRole}`);
    
    // Join general room
    socket.join('general');
    
    logger.info('WebSocket client connected', {
      socketId: socket.id,
      userId,
      userRole,
      userEmail: socket.userEmail,
      totalConnections: this.connectedUsers.size,
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        userId,
        error: error.message,
      });
    });

    // Handle custom events
    this.setupCustomEventHandlers(socket);
  }

  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    const userId = socket.userId!;
    
    // Remove from connected users
    this.connectedUsers.delete(userId);
    
    logger.info('WebSocket client disconnected', {
      socketId: socket.id,
      userId,
      reason,
      totalConnections: this.connectedUsers.size,
    });
  }

  private setupCustomEventHandlers(socket: AuthenticatedSocket): void {
    // Handle typing indicators
    socket.on('typing:start', (data) => {
      socket.broadcast.to(`user:${data.recipientId}`).emit('typing:start', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('typing:stop', (data) => {
      socket.broadcast.to(`user:${data.recipientId}`).emit('typing:stop', {
        userId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle presence updates
    socket.on('presence:update', (data) => {
      const presenceData = {
        userId: socket.userId,
        status: data.status, // online, away, busy, offline
        lastSeen: new Date().toISOString(),
      };
      
      // Broadcast to relevant users
      socket.broadcast.to(`user:${socket.userId}`).emit('presence:update', presenceData);
      
      // Store presence in Redis
      CacheService.set(`presence:${socket.userId}`, JSON.stringify(presenceData), 300); // 5 minutes
    });

    // Handle real-time data requests
    socket.on('data:request', async (data) => {
      try {
        const { type, params } = data;
        
        switch (type) {
          case 'pocket_money_balance':
            await this.handlePocketMoneyBalanceRequest(socket, params);
            break;
          case 'attendance_status':
            await this.handleAttendanceStatusRequest(socket, params);
            break;
          case 'payment_status':
            await this.handlePaymentStatusRequest(socket, params);
            break;
          default:
            socket.emit('data:error', {
              message: 'Unknown data type requested',
              type,
            });
        }
      } catch (error) {
        logger.error('Data request error', {
          socketId: socket.id,
          userId: socket.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        socket.emit('data:error', {
          message: 'Failed to fetch data',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Handle feedback
    socket.on('feedback:submit', (data) => {
      logger.info('Feedback submitted via WebSocket', {
        userId: socket.userId,
        feedback: data,
      });
      
      // Broadcast to admin users
      this.io.to('role:admin').to('role:super_admin').emit('feedback:new', {
        ...data,
        userId: socket.userId,
        userEmail: socket.userEmail,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Send notification to specific user
  public sendNotification(userId: string, notification: NotificationData): void {
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.emit('notification', notification);
      logger.info('Notification sent via WebSocket', {
        userId,
        notificationType: notification.type,
        title: notification.title,
      });
    } else {
      // Store notification for offline users
      this.storeOfflineNotification(userId, notification);
    }
  }

  // Send notification to all users with specific role
  public sendNotificationToRole(role: string, notification: NotificationData): void {
    this.io.to(`role:${role}`).emit('notification', notification);
    
    logger.info('Role-based notification sent', {
      role,
      notificationType: notification.type,
      title: notification.title,
    });
  }

  // Send notification to all connected users
  public broadcastNotification(notification: NotificationData): void {
    this.io.emit('notification', notification);
    
    logger.info('Broadcast notification sent', {
      notificationType: notification.type,
      title: notification.title,
    });
  }

  // Send real-time update
  public sendRealTimeUpdate(userId: string, update: RealTimeUpdate): void {
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.emit('realtime:update', update);
    }
  }

  // Send real-time update to role
  public sendRealTimeUpdateToRole(role: string, update: RealTimeUpdate): void {
    this.io.to(`role:${role}`).emit('realtime:update', update);
  }

  // Handle pocket money balance request
  private async handlePocketMoneyBalanceRequest(socket: AuthenticatedSocket, params: any): Promise<void> {
    // This would typically fetch from database
    // For now, return mock data
    const balance = {
      current: 50000,
      currency: 'IDR',
      lastUpdated: new Date().toISOString(),
    };
    
    socket.emit('data:response', {
      type: 'pocket_money_balance',
      data: balance,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle attendance status request
  private async handleAttendanceStatusRequest(socket: AuthenticatedSocket, params: any): Promise<void> {
    const attendance = {
      status: 'present',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString(),
    };
    
    socket.emit('data:response', {
      type: 'attendance_status',
      data: attendance,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle payment status request
  private async handlePaymentStatusRequest(socket: AuthenticatedSocket, params: any): Promise<void> {
    const payment = {
      status: 'pending',
      amount: 100000,
      currency: 'IDR',
      transactionId: 'TXN123456',
      timestamp: new Date().toISOString(),
    };
    
    socket.emit('data:response', {
      type: 'payment_status',
      data: payment,
      timestamp: new Date().toISOString(),
    });
  }

  // Store notification for offline users
  private async storeOfflineNotification(userId: string, notification: NotificationData): Promise<void> {
    const key = `offline_notifications:${userId}`;
    const existing = await CacheService.get(key);
    
    let notifications = [];
    if (existing) {
      notifications = JSON.parse(existing);
    }
    
    notifications.push(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications = notifications.slice(-50);
    }
    
    await CacheService.set(key, JSON.stringify(notifications), 86400); // 24 hours
    
    logger.info('Offline notification stored', {
      userId,
      notificationType: notification.type,
      totalOfflineNotifications: notifications.length,
    });
  }

  // Get offline notifications for user
  public async getOfflineNotifications(userId: string): Promise<NotificationData[]> {
    const key = `offline_notifications:${userId}`;
    const data = await CacheService.get(key);
    
    if (data) {
      const notifications = JSON.parse(data);
      // Clear offline notifications after sending
      await CacheService.del(key);
      
      logger.info('Offline notifications retrieved', {
        userId,
        count: notifications.length,
      });
      
      return notifications;
    }
    
    return [];
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users by role
  public getConnectedUsersByRole(role: string): AuthenticatedSocket[] {
    return Array.from(this.connectedUsers.values()).filter(
      socket => socket.userRole === role
    );
  }

  // Force disconnect user
  public disconnectUser(userId: string, reason: string = 'Admin disconnect'): void {
    const socket = this.connectedUsers.get(userId);
    
    if (socket) {
      socket.disconnect(true);
      logger.info('User forcefully disconnected', {
        userId,
        reason,
      });
    }
  }
}

// Export setup function
export function setupWebSocket(io: SocketIOServer): WebSocketService {
  return new WebSocketService(io);
}