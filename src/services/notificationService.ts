import { ref, push, set, serverTimestamp } from "firebase/database";
import { db } from "@/firebaseConfig";

interface NotificationPayload {
  type: 'service-due' | 'battery-return' | 'task-reminder' | 'repair-completed' | 'service-overdue' | 'new-task' | 'invoice-created' | 'invoice-updated' | 'invoice-paid';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  read?: boolean;
  hasIndicator?: boolean;
}

export const createNotification = async (
  userId: string,
  notification: NotificationPayload
): Promise<void> => {
  try {
    const dbInstance = db();
    const notificationsRef = ref(dbInstance, `notifications/${userId}`);
    const newNotificationRef = push(notificationsRef);

    await set(newNotificationRef, {
      ...notification,
      createdAt: Date.now(),
      read: notification.read ?? false,
      hasIndicator: notification.hasIndicator ?? false,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

export const createInvoiceNotification = async (
  userId: string,
  action: 'created' | 'updated' | 'paid',
  invoiceId: string,
  companyName: string
): Promise<void> => {
  const notificationMap = {
    created: {
      type: 'invoice-created' as const,
      title: 'Invoice Created',
      message: `Invoice ${invoiceId} for ${companyName} has been created successfully.`,
      priority: 'medium' as const,
    },
    updated: {
      type: 'invoice-updated' as const,
      title: 'Invoice Updated',
      message: `Invoice ${invoiceId} for ${companyName} has been updated.`,
      priority: 'medium' as const,
    },
    paid: {
      type: 'invoice-paid' as const,
      title: 'Invoice Paid',
      message: `Invoice ${invoiceId} for ${companyName} has been marked as paid.`,
      priority: 'high' as const,
    },
  };

  await createNotification(userId, notificationMap[action]);
};

export const notifyMultipleUsers = async (
  userIds: string[],
  notification: NotificationPayload
): Promise<void> => {
  const promises = userIds.map(userId => createNotification(userId, notification));
  await Promise.all(promises);
};
