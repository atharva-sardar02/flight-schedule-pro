/**
 * Frontend Notification Service
 * Handles API calls for notifications
 */

import api from './api';

export interface Notification {
  id: string;
  userId: string;
  bookingId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  sentAt: string;
  createdAt: string;
}

/**
 * Get all notifications for current user
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  // Backend returns array directly, but ensure it's an array
  return Array.isArray(response.data) ? response.data : [];
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications/unread');
  return response.data;
};

/**
 * Get unread count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread/count');
  return response.data.count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/read`);
};

/**
 * Mark all as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/read-all');
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

