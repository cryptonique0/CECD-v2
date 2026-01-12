import React, { useState, useMemo } from 'react';
import { notificationCenterService, NotificationHistory } from '../services/notificationCenterService';

interface NotificationCenterProps {
  userId: string;
  onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onClose }) => {
  const [filterType, setFilterType] = useState<'all' | 'incident' | 'assignment' | 'alert' | 'message' | 'resource' | 'team'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);

  const notifications = useMemo(() => {
    let result = notificationCenterService.getNotifications(userId);
    if (filterType !== 'all') {
      result = result.filter(n => n.type === filterType);
    }
    if (searchQuery) {
      result = notificationCenterService.searchNotifications(userId, searchQuery);
    }
    return result;
  }, [userId, filterType, searchQuery]);

  const unreadCount = notificationCenterService.getUnreadNotifications(userId).length;
  const stats = notificationCenterService.getNotificationStats(userId);
  const prefs = notificationCenterService.getNotificationPreferences(userId);

  const handleMarkAsRead = (notificationId: string) => {
    notificationCenterService.markAsRead(userId, notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationCenterService.markAllAsRead(userId);
  };

  const handleDelete = (notificationId: string) => {
    notificationCenterService.deleteNotification(userId, notificationId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'from-red-600 to-red-500';
      case 'warning':
        return 'from-yellow-600 to-yellow-500';
      default:
        return 'from-blue-600 to-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return 'emergency_home';
      case 'assignment':
        return 'assignment';
      case 'alert':
        return 'warning';
      case 'message':
        return 'mail';
      case 'resource':
        return 'inventory_2';
      case 'team':
        return 'group';
      default:
        return 'notifications';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            <p className="text-xs text-white/50 mt-1">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1 text-xs bg-primary/20 text-primary rounded hover:bg-primary/30 transition-all"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'incident', 'assignment', 'alert', 'message', 'resource', 'team'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === type
                  ? 'bg-primary text-white'
                  : 'bg-slate-800 text-white/60 hover:text-white hover:bg-slate-700'
              }`}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mt-3 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60 p-6">
            <span className="material-symbols-outlined text-4xl mb-2 text-white/20">notifications_none</span>
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-white/5 transition-all cursor-pointer ${
                  !notification.read ? 'bg-primary/10' : ''
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className={`bg-gradient-to-br ${getSeverityColor(notification.severity)} p-2.5 rounded-lg flex-shrink-0`}>
                    <span className="material-symbols-outlined text-white text-lg">
                      {getTypeIcon(notification.type)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">{notification.title}</h3>
                        <p className="text-xs text-white/60 mt-1 line-clamp-2">{notification.message}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="text-white/30 hover:text-white hover:bg-white/10 p-1 rounded transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-white/40">{getTimeAgo(notification.timestamp)}</span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>

                    {notification.actionUrl && (
                      <button className="mt-2 text-[11px] text-primary hover:text-blue-300 font-semibold flex items-center gap-1">
                        {notification.actionLabel || 'View'}
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with Preferences */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-all text-sm text-white/70 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">settings</span>
            Preferences
          </span>
          <span className="material-symbols-outlined text-lg">{showPreferences ? 'expand_less' : 'expand_more'}</span>
        </button>

        {showPreferences && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
            <label className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={(e) =>
                  notificationCenterService.updatePreferences(userId, {
                    emailNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              Email Notifications
            </label>
            <label className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.smsNotifications}
                onChange={(e) =>
                  notificationCenterService.updatePreferences(userId, {
                    smsNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              SMS Notifications
            </label>
            <label className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.inAppNotifications}
                onChange={(e) =>
                  notificationCenterService.updatePreferences(userId, {
                    inAppNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              In-App Notifications
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
