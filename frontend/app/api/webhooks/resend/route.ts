import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend webhook events look like:
    // { type: 'email.bounced', data: { email_id: 're_1234' } }
    
    if (payload.type && payload.data?.email_id) {
      const emailId = payload.data.email_id;
      let status = 'pending';
      
      switch (payload.type) {
        case 'email.delivered':
          status = 'delivered';
          break;
        case 'email.bounced':
          status = 'bounced';
          break;
        case 'email.complained':
        case 'email.delivery_delayed':
          status = 'failed';
          break;
        default:
          return NextResponse.json({ received: true });
      }

      const updateData: any = { status };
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
      if (status === 'bounced') updateData.error_message = 'Email bounced';
      
      await supabaseAdmin
        .from('notification_delivery_log')
        .update(updateData)
        .eq('provider_message_id', emailId);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Exception in Resend Webhook:', err);
    // Still return 200 so Resend doesn't keep retrying if our DB fails
    return NextResponse.json({ error: 'Internal server error' }, { status: 200 });
  }
}
