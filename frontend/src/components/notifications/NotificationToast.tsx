/**
 * Notification Toast Component
 * Displays popup notifications for new messages
 */

import React, { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export function NotificationToast() {
  const { unreadCount, fetchNotifications, markAsRead } = useNotifications();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications().then(setNotifications);

    // Poll for new notifications every 10 seconds
    const interval = setInterval(async () => {
      const newNotifications = await fetchNotifications();
      setNotifications((prev) => {
        // Check if there are new unread notifications
        const newUnread = newNotifications.filter(
          (n) => !n.read && !prev.find((p) => p.id === n.id)
        );
        
        if (newUnread.length > 0 && !showToast) {
          // Show the most recent unread notification
          setCurrentNotification(newUnread[0]);
          setShowToast(true);
        }
        
        return newNotifications;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [fetchNotifications, showToast]);

  const handleClose = async () => {
    if (currentNotification) {
      await markAsRead(currentNotification.id);
    }
    setShowToast(false);
    setCurrentNotification(null);
  };

  const handleClick = async () => {
    if (currentNotification) {
      await markAsRead(currentNotification.id);
      
      // Navigate to reschedule page if it's a reschedule notification
      if (currentNotification.bookingId && currentNotification.type === 'OPTIONS_AVAILABLE') {
        navigate(`/reschedule/${currentNotification.bookingId}`);
      }
    }
    setShowToast(false);
    setCurrentNotification(null);
  };

  if (!showToast || !currentNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {currentNotification.title}
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2">
            {currentNotification.message}
          </p>
          {currentNotification.bookingId && (
            <button
              onClick={handleClick}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View Details →
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

