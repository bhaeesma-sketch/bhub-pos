import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseMarkdownTable(text: string) {
  const lines = text.split("\n");
  const products: { name: string; totalValue: number; stock: number }[] = [];

  for (const line of lines) {
    // Skip non-table lines, header lines, separator lines, empty rows, summary rows
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    if (cells[0] === "Product name" || cells[0].startsWith("-")) continue;
    
    const name = cells[0];
    if (!name || name.length === 0) continue;
    
    const totalValue = parseFloat(cells[1]) || 0;
    const stock = parseFloat(cells[2]) || 0;

    products.push({ name, totalValue, stock });
  }

  return products;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { markdown } = await req.json();

    if (!markdown) {
      return new Response(JSON.stringify({ error: "markdown field required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = parseMarkdownTable(markdown);
    
    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "No products parsed from markdown" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process in batches of 500
    const BATCH_SIZE = 500;
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      const rows = batch
        .filter(p => p.name && p.name.trim().length > 0)
        .map(p => {
          const stock = Math.max(0, Math.floor(p.stock));
          const cost = stock > 0 ? Math.round((p.totalValue / stock) * 1000) / 1000 : 0;
          const price = Math.round(cost * 1.3 * 1000) / 1000;

          return {
            name: p.name.trim().substring(0, 255),
            stock,
            cost,
            price: price > 0 ? price : 0,
            category: "General",
            unit: "Piece",
            min_stock: 5,
          };
        });

      if (rows.length === 0) continue;

      const { error } = await supabase.from("products").insert(rows);

      if (error) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE)} error:`, error);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: Failed to import products`);
        skipped += rows.length;
      } else {
        inserted += rows.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, parsed: products.length, inserted, skipped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[import-products] Internal error:", err);
    return new Response(JSON.stringify({ error: "Failed to import products. Please check your data format and try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
