import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

// Get sales history with optional date filtering
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.subscription_expired) {
      return Response.json(
        { error: "Subscription expired. Please subscribe to continue." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let query;
    let results;

    if (startDate && endDate) {
      query = `
        SELECT s.id, s.total_amount, s.created_at,
               json_agg(
                 json_build_object(
                   'product_id', si.product_id,
                   'product_name', p.name,
                   'quantity', si.quantity,
                   'price', si.price,
                   'cost_price', p.cost_price
                 )
               ) as items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.user_id = $1 AND s.created_at >= $2 AND s.created_at <= $3
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
      results = await sql(query, [user.user_id, startDate, endDate]);
    } else {
      query = `
        SELECT s.id, s.total_amount, s.created_at,
               json_agg(
                 json_build_object(
                   'product_id', si.product_id,
                   'product_name', p.name,
                   'quantity', si.quantity,
                   'price', si.price,
                   'cost_price', p.cost_price
                 )
               ) as items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.user_id = $1
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT 100
      `;
      results = await sql(query, [user.user_id]);
    }

    return Response.json({ sales: results });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return Response.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

// Create a new sale (checkout)
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.subscription_expired) {
      return Response.json(
        { error: "Subscription expired. Please subscribe to continue." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { items } = body; // items: [{ product_id, quantity, price }]

    if (!items || items.length === 0) {
      return Response.json({ error: "No items in cart" }, { status: 400 });
    }

    // Calculate total
    const total_amount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create sale
    const createSaleQuery = `
      INSERT INTO sales (total_amount, user_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const saleResult = await sql(createSaleQuery, [total_amount, user.user_id]);
    const sale = saleResult[0];

    // Insert sale items and update stock for each item
    for (const item of items) {
      // Insert sale item
      const insertItemQuery = `
        INSERT INTO sale_items (sale_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `;
      await sql(insertItemQuery, [
        sale.id,
        item.product_id,
        item.quantity,
        item.price,
      ]);

      // Update stock
      const updateStockQuery = `
        UPDATE products
        SET stock_quantity = stock_quantity - $1
        WHERE id = $2 AND user_id = $3
      `;
      await sql(updateStockQuery, [
        item.quantity,
        item.product_id,
        user.user_id,
      ]);
    }

    return Response.json({ sale });
  } catch (error) {
    console.error("Error creating sale:", error);
    return Response.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
