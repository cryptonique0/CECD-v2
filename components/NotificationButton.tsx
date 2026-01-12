import React, { useState } from 'react';
import NotificationCenter from './NotificationCenter';

interface NotificationButtonProps {
  userId: string;
  unreadCount: number;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ userId, unreadCount }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      {/* Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2.5 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white group"
        title="Notifications"
      >
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
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
            <NotificationCenter userId={userId} onClose={() => setShowDropdown(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationButton;
