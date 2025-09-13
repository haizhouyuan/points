import { Request, Response } from 'express';
import { EventBus } from '@shared/events/event-bus';
import { Logger } from '@shared/utils/logger';
import { INotification } from '../models/notification.model';

export interface SSEConnection {
  id: string;
  userId: string;
  familyId: string;
  response: Response;
  lastPing: Date;
  connected: boolean;
}

export class SSEService {
  private connections: Map<string, SSEConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private familyConnections: Map<string, Set<string>> = new Map();
  private eventBus: EventBus;
  private logger: Logger;
  private pingInterval: NodeJS.Timeout;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
    this.logger = new Logger('SSEService');
    this.setupEventListeners();
    this.startPingService();
  }

  private setupEventListeners(): void {
    // Listen for notification events to broadcast
    this.eventBus.on('notification.created', this.handleNotificationCreated.bind(this));
    this.eventBus.on('task.completed', this.handleTaskCompleted.bind(this));
    this.eventBus.on('gamification.achievement_unlocked', this.handleAchievementUnlocked.bind(this));
    this.eventBus.on('gamification.level_up', this.handleLevelUp.bind(this));
    this.eventBus.on('social.post_created', this.handlePostCreated.bind(this));
    this.eventBus.on('social.challenge_created', this.handleChallengeCreated.bind(this));

    this.logger.info('SSE event listeners registered');
  }

  private startPingService(): void {
    // Send ping every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingAllConnections();
    }, 30000);

    // Clean up dead connections every 5 minutes
    setInterval(() => {
      this.cleanupDeadConnections();
    }, 300000);
  }

  public createConnection(
    userId: string,
    familyId: string,
    req: Request,
    res: Response
  ): string {
    const connectionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection event
    this.sendEvent(res, 'connected', { connectionId, timestamp: new Date().toISOString() });

    // Create connection record
    const connection: SSEConnection = {
      id: connectionId,
      userId,
      familyId,
      response: res,
      lastPing: new Date(),
      connected: true
    };

    // Store connection
    this.connections.set(connectionId, connection);

    // Index by user and family
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    if (!this.familyConnections.has(familyId)) {
      this.familyConnections.set(familyId, new Set());
    }
    this.familyConnections.get(familyId)!.add(connectionId);

    // Handle connection close
    req.on('close', () => {
      this.removeConnection(connectionId);
    });

    req.on('end', () => {
      this.removeConnection(connectionId);
    });

    this.logger.info('SSE connection established', { connectionId, userId, familyId });

    return connectionId;
  }

  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Mark as disconnected
    connection.connected = false;

    // Remove from indices
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    const familyConnections = this.familyConnections.get(connection.familyId);
    if (familyConnections) {
      familyConnections.delete(connectionId);
      if (familyConnections.size === 0) {
        this.familyConnections.delete(connection.familyId);
      }
    }

    // Remove from main connections map
    this.connections.delete(connectionId);

    this.logger.info('SSE connection removed', { 
      connectionId, 
      userId: connection.userId, 
      familyId: connection.familyId 
    });
  }

  private sendEvent(response: Response, event: string, data: any): void {
    try {
      if (response.destroyed || response.writableEnded) {
        return;
      }

      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      response.write(eventData);
    } catch (error) {
      this.logger.error('Failed to send SSE event', { error, event });
    }
  }

  public sendToUser(userId: string, event: string, data: any): void {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return;

    userConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.connected) {
        this.sendEvent(connection.response, event, data);
      }
    });
  }

  public sendToFamily(familyId: string, event: string, data: any): void {
    const familyConnections = this.familyConnections.get(familyId);
    if (!familyConnections) return;

    familyConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.connected) {
        this.sendEvent(connection.response, event, data);
      }
    });
  }

  public broadcastToAll(event: string, data: any): void {
    this.connections.forEach(connection => {
      if (connection.connected) {
        this.sendEvent(connection.response, event, data);
      }
    });
  }

  private pingAllConnections(): void {
    const now = new Date();
    
    this.connections.forEach((connection, connectionId) => {
      if (connection.connected) {
        try {
          this.sendEvent(connection.response, 'ping', { timestamp: now.toISOString() });
          connection.lastPing = now;
        } catch (error) {
          this.logger.warn('Failed to ping connection, marking as disconnected', { connectionId });
          this.removeConnection(connectionId);
        }
      }
    });
  }

  private cleanupDeadConnections(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deadConnections: string[] = [];

    this.connections.forEach((connection, connectionId) => {
      if (connection.lastPing < fiveMinutesAgo || !connection.connected) {
        deadConnections.push(connectionId);
      }
    });

    deadConnections.forEach(connectionId => {
      this.removeConnection(connectionId);
    });

    if (deadConnections.length > 0) {
      this.logger.info('Cleaned up dead connections', { count: deadConnections.length });
    }
  }

  // Event Handlers
  private async handleNotificationCreated(notificationData: INotification): Promise<void> {
    this.sendToUser(notificationData.userId, 'notification', {
      id: notificationData._id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      priority: notificationData.priority,
      data: notificationData.data,
      timestamp: notificationData.createdAt
    });
  }

  private async handleTaskCompleted(eventData: {
    taskId: string;
    userId: string;
    familyId: string;
    taskTitle: string;
    pointsEarned: number;
  }): Promise<void> {
    // Notify family members about task completion
    this.sendToFamily(eventData.familyId, 'task_completed', {
      userId: eventData.userId,
      taskTitle: eventData.taskTitle,
      pointsEarned: eventData.pointsEarned,
      timestamp: new Date().toISOString()
    });
  }

  private async handleAchievementUnlocked(eventData: {
    achievementId: string;
    userId: string;
    familyId: string;
    achievementName: string;
    rarity: string;
  }): Promise<void> {
    // Notify family about achievement
    this.sendToFamily(eventData.familyId, 'achievement_unlocked', {
      userId: eventData.userId,
      achievementName: eventData.achievementName,
      rarity: eventData.rarity,
      timestamp: new Date().toISOString()
    });
  }

  private async handleLevelUp(eventData: {
    userId: string;
    familyId: string;
    category: string;
    newLevel: number;
  }): Promise<void> {
    // Notify family about level up
    this.sendToFamily(eventData.familyId, 'level_up', {
      userId: eventData.userId,
      category: eventData.category,
      newLevel: eventData.newLevel,
      timestamp: new Date().toISOString()
    });
  }

  private async handlePostCreated(eventData: {
    postId: string;
    familyId: string;
    userId: string;
    type: string;
    content: any;
  }): Promise<void> {
    // Notify family about new post
    this.sendToFamily(eventData.familyId, 'post_created', {
      postId: eventData.postId,
      userId: eventData.userId,
      type: eventData.type,
      content: eventData.content,
      timestamp: new Date().toISOString()
    });
  }

  private async handleChallengeCreated(eventData: {
    challengeId: string;
    familyId: string;
    createdBy: string;
    title: string;
    type: string;
  }): Promise<void> {
    // Notify family about new challenge
    this.sendToFamily(eventData.familyId, 'challenge_created', {
      challengeId: eventData.challengeId,
      createdBy: eventData.createdBy,
      title: eventData.title,
      type: eventData.type,
      timestamp: new Date().toISOString()
    });
  }

  // Public API methods
  public getConnectionStats(): {
    totalConnections: number;
    userConnections: number;
    familyConnections: number;
    connectionsByFamily: Record<string, number>;
  } {
    const connectionsByFamily: Record<string, number> = {};
    
    this.familyConnections.forEach((connections, familyId) => {
      connectionsByFamily[familyId] = connections.size;
    });

    return {
      totalConnections: this.connections.size,
      userConnections: this.userConnections.size,
      familyConnections: this.familyConnections.size,
      connectionsByFamily
    };
  }

  public destroy(): void {
    // Close all connections
    this.connections.forEach((connection, connectionId) => {
      if (connection.connected && !connection.response.destroyed) {
        this.sendEvent(connection.response, 'disconnect', { reason: 'Server shutdown' });
        connection.response.end();
      }
    });

    // Clear intervals
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Clear maps
    this.connections.clear();
    this.userConnections.clear();
    this.familyConnections.clear();

    this.logger.info('SSE service destroyed');
  }
}