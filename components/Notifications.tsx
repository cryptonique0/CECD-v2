import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { Notification as NotificationType } from '../types';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = notificationService.subscribe((list) => setNotifications(list));
    return unsub;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // request permission proactively when component mounts (soft)
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && (window as any).Notification.permission !== 'granted') {
        (window as any).Notification.requestPermission && (window as any).Notification.requestPermission();
      }
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-card-dark border border-border-dark hover:border-primary/40"
        title="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full px-1.5">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card-dark border border-border-dark rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-border-dark">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <h4 className="text-sm font-bold text-white">Notifications</h4>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => notificationService.markAllRead()} className="text-[12px] text-text-secondary hover:text-white">Mark all</button>
              <button onClick={() => { notificationService.clear(); setOpen(false); }} className="text-[12px] text-red-400 hover:text-red-300">Clear</button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border-dark">
            {notifications.length === 0 && (
              <div className="p-4 text-center text-text-secondary">No notifications</div>
            )}
            {notifications.map(n => (
              <div key={n.id} className={`p-3 hover:bg-white/5 transition-colors flex items-start gap-3 ${n.read ? 'opacity-70' : ''}`}>
                <div className={`p-2 rounded-lg ${n.severity === 'critical' ? 'bg-red-500/20' : n.severity === 'error' ? 'bg-red-400/10' : n.severity === 'warning' ? 'bg-orange-400/10' : 'bg-white/5'}`}>
                  <span className="material-symbols-outlined text-sm">{n.type === 'incident' ? 'add_alert' : 'info'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                    <div className="flex items-center gap-2">
                      {!n.read && <button onClick={() => notificationService.markRead(n.id)} className="text-[11px] text-primary">Read</button>}
                      <button onClick={() => notificationService.remove(n.id)} className="text-[11px] text-text-secondary">Dismiss</button>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{n.message}</p>
                  <p className="text-[10px] text-text-secondary/60 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
