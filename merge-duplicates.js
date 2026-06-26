const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fonsbumfimsnuykxiwaq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbnNidW1maW1zbnV5a3hpd2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTU5NTI0MiwiZXhwIjoyMDk3MTcxMjQyfQ.RegRiWDEylRIy62CZinHk5Tq-5gFjb9DcRgsv52eGaY'
);

async function mergeDuplicates() {
  console.log("Fetching all products...");
  const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error("Error fetching products:", error);
    return;
  }

  const nameMap = new Map();
  let mergedCount = 0;

  for (const product of products) {
    const key = product.name.toLowerCase().trim();
    if (nameMap.has(key)) {
      const originalProduct = nameMap.get(key);
      console.log(`Duplicate found: ${product.name} (ID: ${product.id}). Original: ${originalProduct.id}`);

      // 1. Move all batches from duplicate to original
      const { error: batchError } = await supabase
        .from('batches')
        .update({ product_id: originalProduct.id })
        .eq('product_id', product.id);

      if (batchError) {
        console.error("Error updating batches:", batchError);
        continue;
      }

      // 2. Move all PO items (if they have product_id)
      const { error: poError } = await supabase
        .from('purchase_order_items')
        .update({ product_id: originalProduct.id })
        .eq('product_id', product.id);

      if (poError) {
        console.error("Error updating po items:", poError);
      }

      // 3. Delete duplicate product
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (deleteError) {
        console.error("Error deleting product:", deleteError);
      } else {
        console.log(`Successfully merged and deleted ${product.id}`);
        mergedCount++;
      }
    } else {
      nameMap.set(key, product);
    }
  }

  console.log(`Finished merging ${mergedCount} duplicate products.`);
}

mergeDuplicates().catch(console.error);
