import React, { useState, useEffect } from 'react';
import NotificationCenter from './NotificationCenter';
import { notificationCenterService } from '../services/notificationCenterService';

interface NotificationButtonProps {
  userId: string;
  onNavigate?: () => void;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ userId, onNavigate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get unread count from service
  useEffect(() => {
    const notifications = notificationCenterService.getUnreadNotifications(userId);
    setUnreadCount(notifications.length);
  }, [userId]);

  const handleClose = () => {
    setShowDropdown(false);
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="relative">
      {/* Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white group"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Notification Center Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-96 z-50 rounded-lg shadow-2xl overflow-hidden">
            <NotificationCenter userId={userId} onClose={handleClose} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationButton;
