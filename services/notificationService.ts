
import { Notification } from '../types';

export const notificationService = {
  notifications: [] as Notification[],
  
  async sendNotification(params: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      id: `NOTIF-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
      ...params
    };
    
    this.notifications.unshift(newNotification);
    
    // Simulate Severity-based Routing
    if (params.severity === 'critical') {
      console.log(`[PUSH/SMS SENT] Critical Alert: ${params.title}`);
    } else if (params.severity === 'warning') {
      console.log(`[EMAIL SENT] Warning: ${params.title}`);
    }
    
    return newNotification;
  },

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  },

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
  }
};
