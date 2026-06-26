import { Text, Section, Row, Column } from '@react-email/components';
import * as React from 'react';
import { BaseLayout } from './BaseLayout';

interface LowStockAlertEmailProps {
  productName: string;
  sku: string;
  currentQuantity: number;
  threshold: number;
}

export const LowStockAlertEmail = ({
  productName,
  sku,
  currentQuantity,
  threshold,
}: LowStockAlertEmailProps) => {
  return (
    <BaseLayout previewText={`Low Stock Alert: ${productName}`}>
      <Text style={text}>Hello,</Text>
      <Text style={text}>
        This is an automated alert. The stock level for <strong>{productName}</strong> has fallen below your defined threshold.
      </Text>
      
      <Section style={{...detailsContainer, borderLeft: `4px solid #f59e0b`}}>
        <Row style={row}>
          <Column style={label}>Product:</Column>
          <Column style={value}>{productName}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>SKU:</Column>
          <Column style={value}>{sku}</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>Current Stock:</Column>
          <Column style={{...value, color: '#ef4444', fontWeight: 'bold'}}>{currentQuantity} units</Column>
        </Row>
        <Row style={row}>
          <Column style={label}>Alert Threshold:</Column>
          <Column style={value}>{threshold} units</Column>
        </Row>
      </Section>

      <Text style={text}>
        Please review your inventory and consider placing a new purchase order soon.
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
