import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const directUrl = 'postgresql://postgres.fonsbumfimsnuykxiwaq:Anudeep%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB directly on 6543');
    
    const sqlPath = path.join(__dirname, '..', 'database', '006_pos_and_customers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    await client.query(sql);
    console.log('Migration 006 applied successfully');
  } catch (err) {
    console.error('Failed to run migration:', err);
    try {
        const directUrl5432 = 'postgresql://postgres.fonsbumfimsnuykxiwaq:Anudeep%40123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
        const client5432 = new Client({
            connectionString: directUrl5432,
            ssl: { rejectUnauthorized: false }
        });
        await client5432.connect();
        console.log('Connected to DB directly on 5432');
        const sqlPath = path.join(__dirname, '..', 'database', '006_pos_and_customers.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        await client5432.query(sql);
        console.log('Migration 006 applied successfully');
    } catch(err2) {
        console.error('Failed on 5432 too:', err2);
    }
  } finally {
    await client.end();
  }
}

main();
