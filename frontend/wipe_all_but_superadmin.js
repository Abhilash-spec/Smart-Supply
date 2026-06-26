const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fonsbumfimsnuykxiwaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbnNidW1maW1zbnV5a3hpd2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU5NTI0MiwiZXhwIjoyMDk3MTcxMjQyfQ.RegRiWDEylRIy62CZinHk5Tq-5gFjb9DcRgsv52eGaY';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SUPERADMIN_TENANT_ID = '3b6afd16-6f69-45dc-87bb-6db902f70b99';

async function main() {
  console.log('Clearing all transactional tables...');
  
  // Tables in order of dependencies (child first, then parent)
  const tablesToClear = [
    'notification_delivery_log', 'notifications',
    'invoices',
    'pos_order_items', 'pos_orders', 
    'purchase_order_items', 'purchase_orders',
    'sales_order_items', 'sales_orders',
    'inventory_transactions', 'inventory_items', 'batches',
    'product_variants', 'products', 'categories', 'brands',
    'customers', 'supplier_profiles', 
    'warehouses', 'organizations',
    'tenant_staff', 'branches'
  ];

  for (const table of tablesToClear) {
    console.log(`Clearing table: ${table}`);
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error && !error.message.includes('Could not find the table')) {
      console.error(`Error clearing ${table}:`, error.message);
    }
  }

  // Now delete other tenants
  console.log('Deleting other tenants...');
  const { error: tenantErr } = await supabase
    .from('tenants')
    .delete()
    .neq('id', SUPERADMIN_TENANT_ID);
  
  if (tenantErr) console.error('Error deleting tenants:', tenantErr.message);
  else console.log('Successfully deleted all non-superadmin tenants!');

  console.log('Done!');
}

main().catch(console.error);
