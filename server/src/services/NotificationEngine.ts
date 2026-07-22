import { pool } from '../db.js';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin (with placeholders for production keys via env)
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace literal \n with actual newline for the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin is NOT initialized. Missing FIREBASE_* environment variables.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export interface CreateNotificationParams {
  type: 'announcement' | 'assignment' | 'lead_campaign' | 'other';
  title: string;
  message?: string;
  priority?: 'critical' | 'normal';
  recipients: number[]; // Array of student_ids
  actionUrl?: string;
  attachmentUrl?: string;
  createdBy?: number | null | undefined; // user_id of admin/trainer
}

export const NotificationEngine = {
  /**
   * Centralized method to create and dispatch notifications.
   * Saves to database and dispatches Firebase Push Notifications if critical.
   */
  async createNotification(params: CreateNotificationParams) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insert into notifications table
      const notifQuery = `
        INSERT INTO notifications (type, title, message, priority, action_url, attachment_url, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      const notifRes = await client.query(notifQuery, [
        params.type,
        params.title,
        params.message,
        params.priority,
        params.actionUrl || null,
        params.attachmentUrl || null,
        params.createdBy || null
      ]);
      const notificationId = notifRes.rows[0].id;

      // 2. Insert into notification_recipients table
      if (params.recipients && params.recipients.length > 0) {
        // Bulk insert
        const values: any[] = [];
        const placeholders: string[] = [];
        let placeholderIndex = 1;

        params.recipients.forEach(studentId => {
          placeholders.push(`($${placeholderIndex++}, $${placeholderIndex++})`);
          values.push(notificationId, studentId);
        });

        const recQuery = `
          INSERT INTO notification_recipients (notification_id, student_id)
          VALUES ${placeholders.join(', ')}
        `;
        await client.query(recQuery, values);
      }

      await client.query('COMMIT');

      // 3. Dispatch Firebase Push Notifications for 'critical' priorities
      if (params.priority === 'critical' && params.recipients && params.recipients.length > 0) {
        await this.dispatchPushNotifications(notificationId, params);
      }

      return notificationId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('NotificationEngine Error:', err);
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Helper function to dispatch FCM
   */
  async dispatchPushNotifications(notificationId: number, params: CreateNotificationParams) {
    if (!getApps().length) return; // Skip if Firebase is not initialized

    try {
      // Find FCM tokens for these students
      const tokenQuery = `
        SELECT t.token
        FROM user_fcm_tokens t
        JOIN students s ON s.user_id = t.user_id
        WHERE s.id = ANY($1)
      `;
      const { rows } = await pool.query(tokenQuery, [params.recipients]);

      const tokens = rows.map(r => r.token);

      if (tokens.length === 0) return;

      const message = {
        notification: {
          title: params.title,
          body: params.message || '',
        },
        data: {
          notificationId: String(notificationId),
          type: params.type,
          actionUrl: params.actionUrl || '',
        },
        tokens: tokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);
      console.log(`Successfully sent FCM messages: ${response.successCount} successes, ${response.failureCount} failures.`);
    } catch (err) {
      console.error('Error sending FCM push notifications:', err);
    }
  },

  /**
   * Log notification actions (e.g. read, clicked)
   */
  async logAction(notificationId: number, studentId: number, action: string, ipAddress: string, userAgent: string) {
    try {
      await pool.query(
        `INSERT INTO notification_logs (notification_id, student_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [notificationId, studentId, action, ipAddress, userAgent]
      );
    } catch (err) {
      console.error('Error logging notification action:', err);
    }
  }
};
