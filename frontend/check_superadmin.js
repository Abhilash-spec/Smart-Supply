const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://fonsbumfimsnuykxiwaq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbnNidW1maW1zbnV5a3hpd2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU5NTI0MiwiZXhwIjoyMDk3MTcxMjQyfQ.RegRiWDEylRIy62CZinHk5Tq-5gFjb9DcRgsv52eGaY');

async function main() {
  const { data: users, error } = await supabase.from('users').select('*');
  console.log('All public.users:', users, error);
  
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log('All auth.users:', authUsers.users.map(u => ({ id: u.id, email: u.email })));
}
main();
