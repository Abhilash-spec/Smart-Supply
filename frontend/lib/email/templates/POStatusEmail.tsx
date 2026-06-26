import { Text, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface POStatusEmailProps {
  poNumber: string;
  vendorName: string;
  status: string;
}

export const POStatusEmail = ({
  poNumber,
  vendorName,
  status,
}: POStatusEmailProps) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'approved':
        return 'has been approved and is being prepared for shipment.';
      case 'sent':
        return 'has been shipped and is on its way to your warehouse.';
      case 'rejected':
        return 'has been rejected by the vendor.';
      default:
        return `status has been updated to: ${status}.`;
    }
  };

  const statusColor = status === 'rejected' ? '#ef4444' : '#10b981';

  return (
    <BaseLayout previewText={`Update on Purchase Order ${poNumber}`}>
      <Text style={text}>Hello,</Text>
      <Text style={text}>
        Your Purchase Order <strong>{poNumber}</strong> placed with <strong>{vendorName}</strong> {getStatusMessage()}
      </Text>
      
      <Section style={{...detailsContainer, borderLeft: `4px solid ${statusColor}`}}>
        <Row style={row}>
          <Column style={label}>Order Number:</Column>
          <Column style={value}>{poNumber}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>New Status:</Column>
          <Column style={{...value, color: statusColor, fontWeight: 'bold'}}>{status.toUpperCase()}</Column>
        </Row>
      </Section>

      <Text style={text}>
        You can track the details in your shop dashboard.
      </Text>
    </BaseLayout>
  );
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
};

const detailsContainer = {
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '8px',
  margin: '24px 0',
};

const row = {
  marginBottom: '8px',
};

const label = {
  color: '#64748b',
  width: '120px',
  fontWeight: 'bold',
};

const value = {
  color: '#0f172a',
};
