export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  categories: Record<string, boolean>;
  severityThreshold: 'all' | 'high' | 'critical';
  quietHours?: { start: number; end: number };
}

export interface NotificationHistory {
  id: string;
  userId: string;
  type: 'incident' | 'assignment' | 'alert' | 'message' | 'resource' | 'team';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  read: boolean;
  readAt?: number;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterService {
  sendNotification(userId: string, notification: Omit<NotificationHistory, 'id' | 'timestamp' | 'read' | 'readAt'>): NotificationHistory;
  getNotifications(userId: string, limit?: number, offset?: number): NotificationHistory[];
  getUnreadNotifications(userId: string): NotificationHistory[];
  markAsRead(userId: string, notificationId: string): void;
  markAllAsRead(userId: string): void;
  getNotificationPreferences(userId: string): NotificationPreferences;
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void;
  deleteNotification(userId: string, notificationId: string): boolean;
  clearOldNotifications(userId: string, olderThanDays: number): number;
  getNotificationStats(userId: string): { total: number; unread: number; byType: Record<string, number> };
  searchNotifications(userId: string, query: string): NotificationHistory[];
}

class NotificationCenterServiceImpl implements NotificationCenterService {
  private notifications: Map<string, NotificationHistory[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();

  sendNotification(userId: string, notification: Omit<NotificationHistory, 'id' | 'timestamp' | 'read' | 'readAt'>): NotificationHistory {
    const fullNotification: NotificationHistory = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: Date.now(),
      read: false,
      ...notification,
    };

    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId)!.push(fullNotification);

    // Trigger actual notifications (email, SMS) based on preferences
    this.triggerExternalNotifications(userId, fullNotification);

    return fullNotification;
  }

  private triggerExternalNotifications(userId: string, notification: NotificationHistory): void {
    const prefs = this.getNotificationPreferences(userId);

    // Check if within quiet hours
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let inQuietHours = false;
    if (prefs.quietHours) {
      inQuietHours = currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end;
    }

    if (inQuietHours && notification.severity === 'info') return;

    // In a real app, you'd send actual emails/SMS here
    console.log(`[NOTIFICATION] ${userId}: ${notification.title} - ${notification.message}`);
  }

  getNotifications(userId: string, limit: number = 50, offset: number = 0): NotificationHistory[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  }

  getUnreadNotifications(userId: string): NotificationHistory[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.read).sort((a, b) => b.timestamp - a.timestamp);
  }

  markAsRead(userId: string, notificationId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = Date.now();
    }
  }

  markAllAsRead(userId: string): void {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return;

    userNotifications.forEach(n => {
      n.read = true;
      n.readAt = Date.now();
    });
  }

  getNotificationPreferences(userId: string): NotificationPreferences {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, {
        userId,
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        categories: {
          incident: true,
          assignment: true,
          alert: true,
          message: true,
          resource: false,
          team: true,
        },
        severityThreshold: 'all',
      });
    }
    return this.preferences.get(userId)!;
  }

  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getNotificationPreferences(userId);
    const updated = { ...current, ...preferences };
    this.preferences.set(userId, updated);
  }

  deleteNotification(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const idx = userNotifications.findIndex(n => n.id === notificationId);
    if (idx !== -1) {
      userNotifications.splice(idx, 1);
      return true;
    }
    return false;
  }

  clearOldNotifications(userId: string, olderThanDays: number): number {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return 0;

    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const initialLength = userNotifications.length;
    this.notifications.set(
      userId,
      userNotifications.filter(n => n.timestamp > cutoffTime)
    );
    return initialLength - (userNotifications.length || 0);
  }

  getNotificationStats(userId: string): { total: number; unread: number; byType: Record<string, number> } {
    const userNotifications = this.notifications.get(userId) || [];
    const byType: Record<string, number> = {};

    userNotifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      total: userNotifications.length,
      unread: userNotifications.filter(n => !n.read).length,
      byType,
    };
  }

  searchNotifications(userId: string, query: string): NotificationHistory[] {
    const userNotifications = this.notifications.get(userId) || [];
    const lowerQuery = query.toLowerCase();

    return userNotifications.filter(n =>
      n.title.toLowerCase().includes(lowerQuery) ||
      n.message.toLowerCase().includes(lowerQuery) ||
      n.type.toLowerCase().includes(lowerQuery)
    );
  }
}

export const notificationCenterService = new NotificationCenterServiceImpl();
