import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail, SendEmailOptions } from '../email/service';
import { render } from '@react-email/render';
import React from 'react';

export interface NotifyOptions {
  tenantId: string;
  userId: string;
  channel?: 'in_app' | 'email' | 'both';
  title: string;
  body: string;
  actionUrl?: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  email?: {
    to: string;
    subject?: string;
    react: React.ReactElement;
  };
}

export async function notify({
  tenantId,
  userId,
  channel = 'both',
  title,
  body,
  actionUrl,
  data = {},
  priority = 'normal',
  email,
}: NotifyOptions) {
  try {
    let notificationId: string | undefined;

    // 1. In-App Notification (Database)
    if (channel === 'in_app' || channel === 'both') {
      const { data: notifData, error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          channel: 'in_app',
          title,
          body,
          action_url: actionUrl,
          data,
          priority,
        })
        .select('id')
        .single();

      if (notifError) {
        console.error('Error inserting notification to DB:', notifError);
      } else {
        notificationId = notifData?.id;
      }
    }

    // 2. Email Notification
    if ((channel === 'email' || channel === 'both') && email) {
      const emailRes = await sendEmail({
        to: email.to,
        subject: email.subject || title,
        react: email.react,
      });

      // 3. Delivery Log (if we saved a notification to the DB)
      if (notificationId) {
        await supabaseAdmin.from('notification_delivery_log').insert({
          notification_id: notificationId,
          channel: 'email',
          status: emailRes.success ? 'sent' : 'failed',
          provider: 'resend',
          provider_message_id: emailRes.success ? emailRes.data?.id : null,
          error_message: emailRes.error || null,
          sent_at: emailRes.success ? new Date().toISOString() : null,
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    // We catch all errors so that notifications don't break core business flows
    console.error('Unhandled error in notify service:', err);
    return { success: false, error: err.message };
  }
}
