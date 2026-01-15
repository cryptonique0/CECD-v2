import { Notification } from '../types';
import { loggerService } from './loggerService';

type Subscriber = (notifications: Notification[]) => void;

interface NotificationQueue {
  pending: Notification[];
  processing: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private subscribers: Subscriber[] = [];
  private queue: NotificationQueue = { pending: [], processing: false };
  private notificationTimeout = new Map<string, NodeJS.Timeout>();
  private maxNotifications = 50;

  async sendNotification(params: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    // Validate required fields
    if (!params.title || !params.message) {
      loggerService.warn('NotificationService', 'Notification missing title or message');
      return null;
    }

    const newNotification: Notification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      ...params
    };

    // Add to queue
    this.queue.pending.push(newNotification);
    this.processQueue();

    return newNotification;
  }

  private async processQueue() {
    if (this.queue.processing || this.queue.pending.length === 0) return;

    this.queue.processing = true;

    while (this.queue.pending.length > 0) {
      const notification = this.queue.pending.shift();
      if (!notification) continue;

      try {
        // Add to notifications list
        this.notifications.unshift(notification);

        // Keep only latest notifications
        if (this.notifications.length > this.maxNotifications) {
          this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        this.emit();

        // Send desktop notification
        await this.sendDesktopNotification(notification);

        // Route by severity
        this.routeBySeverity(notification);

        // Auto-dismiss non-critical notifications
        if (notification.severity !== 'critical') {
          this.setAutoTimeout(notification.id, 8000);
        }

        loggerService.debug('NotificationService', `Notification sent: ${notification.id}`);
      } catch (error) {
        loggerService.error('NotificationService', 'Failed to process notification', error as Error);
      }
    }

    this.queue.processing = false;
  }

  private async sendDesktopNotification(notification: Notification) {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && (window as any).Notification.permission === 'granted') {
        const n = new window.Notification(notification.title, {
          body: notification.message,
          tag: notification.id,
          badge: '🚨'
        });

        // Auto-close after 8 seconds
        setTimeout(() => n.close(), 8000);
      }
    } catch (error) {
      loggerService.warn('NotificationService', 'Desktop notification failed', { error: (error as Error).message });
    }
  }

  private routeBySeverity(notification: Notification) {
    switch (notification.severity) {
      case 'critical':
        loggerService.error('NotificationService', `[CRITICAL] ${notification.title}`);
        console.log(`[PUSH/SMS SENT] Critical Alert: ${notification.title}`);
        break;
      case 'warning':
        loggerService.warn('NotificationService', `[WARNING] ${notification.title}`);
        console.log(`[EMAIL SENT] Warning: ${notification.title}`);
        break;
      case 'info':
        loggerService.info('NotificationService', `[INFO] ${notification.title}`);
        break;
    }
  }

  private setAutoTimeout(notificationId: string, delay: number) {
    // Clear existing timeout if any
    if (this.notificationTimeout.has(notificationId)) {
      clearTimeout(this.notificationTimeout.get(notificationId)!);
    }

    const timeout = setTimeout(() => {
      this.remove(notificationId);
      this.notificationTimeout.delete(notificationId);
    }, delay);

    this.notificationTimeout.set(notificationId, timeout);
  }

  subscribe(cb: Subscriber) {
    this.subscribers.push(cb);
    // Immediately send current list
    cb(this.notifications.slice());
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private emit() {
    this.subscribers.forEach(s => {
      try {
        s(this.notifications.slice());
      } catch (error) {
        loggerService.warn('NotificationService', 'Subscriber error', { error: (error as Error).message });
      }
    });
  }

  getNotifications() {
    return this.notifications.slice();
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markRead(id: string) {
    const n = this.notifications.find(x => x.id === id);
    if (n) {
      n.read = true;
      this.emit();
      loggerService.debug('NotificationService', `Notification marked as read: ${id}`);
    }
  }

  markAllRead() {
    this.notifications.forEach(n => (n.read = true));
    this.emit();
    loggerService.info('NotificationService', 'All notifications marked as read');
  }

  remove(id: string) {
    const beforeLen = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);

    if (beforeLen !== this.notifications.length) {
      this.emit();
      loggerService.debug('NotificationService', `Notification removed: ${id}`);
    }
  }

  clear() {
    this.notifications = [];
    this.notificationTimeout.forEach(timeout => clearTimeout(timeout));
    this.notificationTimeout.clear();
    this.emit();
    loggerService.info('NotificationService', 'All notifications cleared');
  }

  requestPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if ((window as any).Notification.permission === 'default') {
        (window as any).Notification.requestPermission().then((permission: string) => {
          loggerService.info('NotificationService', `Notification permission: ${permission}`);
        });
      }
    }
  }
}

export const notificationService = new NotificationService();

// Request permission on load
if (typeof window !== 'undefined') {
  notificationService.requestPermission();
}
