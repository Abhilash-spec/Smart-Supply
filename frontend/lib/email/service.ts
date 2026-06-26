import { Resend } from 'resend';
import React from 'react';

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;
export const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL || 'onboarding@resend.dev';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!resend) {
    console.warn("RESEND_API_KEY is not set. Email not sent.", options);
    return { success: false, error: 'RESEND_API_KEY is not set' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || defaultFromEmail,
      to: options.to,
      subject: options.subject,
      react: options.react,
      replyTo: options.replyTo,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Exception sending email:", error);
    return { success: false, error: error.message };
  }
}
