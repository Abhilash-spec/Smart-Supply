import { Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface StaffInviteEmailProps {
  firstName: string;
  shopName: string;
  role: string;
  loginUrl: string;
}

export const StaffInviteEmail = ({
  firstName,
  shopName,
  role,
  loginUrl,
}: StaffInviteEmailProps) => {
  return (
    <BaseLayout previewText={`You have been invited to join ${shopName}`}>
      <Text style={text}>Hi {firstName},</Text>
      <Text style={text}>
        You have been invited to join <strong>{shopName}</strong> as a <strong>{role}</strong> on SmartSupply.
      </Text>
      
      <Section style={btnContainer}>
        <Button style={button} href={loginUrl}>
          Accept Invitation
        </Button>
      </Section>

      <Text style={text}>
        If you have any questions, please contact your shop administrator.
      </Text>
    </BaseLayout>
  );
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};
