import { Text, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface PurchaseOrderEmailProps {
  poNumber: string;
  shopName: string;
  totalAmount: number;
  itemsCount: number;
  expectedDate: string;
}

export const PurchaseOrderEmail = ({
  poNumber,
  shopName,
  totalAmount,
  itemsCount,
  expectedDate,
}: PurchaseOrderEmailProps) => {
  return (
    <BaseLayout previewText={`New Purchase Order ${poNumber} from ${shopName}`}>
      <Text style={text}>Hello,</Text>
      <Text style={text}>
        You have received a new Purchase Order (<strong>{poNumber}</strong>) from <strong>{shopName}</strong>.
      </Text>
      
      <Section style={detailsContainer}>
        <Row style={row}>
          <Column style={label}>Order Number:</Column>
          <Column style={value}>{poNumber}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>Total Items:</Column>
          <Column style={value}>{itemsCount}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>Total Amount:</Column>
          <Column style={value}>₹{totalAmount.toFixed(2)}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>Expected Delivery:</Column>
          <Column style={value}>{expectedDate}</Column>
        </Row>
      </Section>

      <Text style={text}>
        Please log in to your vendor dashboard to review and approve this order.
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
