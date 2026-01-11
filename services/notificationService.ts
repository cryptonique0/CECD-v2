import { Notification } from '../types';

type Subscriber = (notifications: Notification[]) => void;

export const notificationService = {
  notifications: [] as Notification[],
  subscribers: [] as Subscriber[],

  async sendNotification(params: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
      ...params
    };

    this.notifications.unshift(newNotification);
    this.emit();

    // Desktop Notification (if allowed)
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if ((window as any).Notification.permission === 'granted') {
          new window.Notification(newNotification.title, { body: newNotification.message });
        }
      }
    } catch (e) {
      console.warn('Desktop notification failed', e);
    }

    // Simulate Severity-based Routing
    if (params.severity === 'critical') {
      console.log(`[PUSH/SMS SENT] Critical Alert: ${params.title}`);
    } else if (params.severity === 'warning') {
      console.log(`[EMAIL SENT] Warning: ${params.title}`);
    }

    return newNotification;
  },

  subscribe(cb: Subscriber) {
    this.subscribers.push(cb);
    // immediately send current list
    cb(this.notifications.slice());
    return () => { this.subscribers = this.subscribers.filter(s => s !== cb); };
  },

  emit() {
    this.subscribers.forEach(s => {
      try { s(this.notifications.slice()); } catch (e) { console.warn('subscriber error', e); }
    });
  },

  getNotifications() {
    return this.notifications.slice();
  },

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  },

  markRead(id: string) {
    const n = this.notifications.find(x => x.id === id);
    if (n) n.read = true;
    this.emit();
  },

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
    this.emit();
  },

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.emit();
  },

  clear() {
    this.notifications = [];
    this.emit();
  }
};
