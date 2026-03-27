import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

// Get a single product
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const query = `SELECT * FROM products WHERE id = $1 AND user_id = $2`;
    const results = await sql(query, [id, user.user_id]);

    if (results.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: results[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// Update a product
export async function PUT(request, { params }) {
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

    const { id } = params;
    const body = await request.json();
    const {
      name,
      barcode,
      cost_price,
      selling_price,
      stock_quantity,
      category,
    } = body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (barcode !== undefined) {
      updates.push(`barcode = $${paramCount++}`);
      values.push(barcode || null);
    }
    if (cost_price !== undefined) {
      updates.push(`cost_price = $${paramCount++}`);
      values.push(parseFloat(cost_price));
    }
    if (selling_price !== undefined) {
      updates.push(`selling_price = $${paramCount++}`);
      values.push(parseFloat(selling_price));
    }
    if (stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramCount++}`);
      values.push(parseInt(stock_quantity));
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category || "Uncategorized");
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    values.push(user.user_id);
    const query = `
      UPDATE products 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const results = await sql(query, values);

    if (results.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: results[0] });
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.message.includes("unique constraint")) {
      return Response.json(
        { error: "Barcode already exists" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// Delete a product
export async function DELETE(request, { params }) {
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

    const { id } = params;

    const query = `DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING *`;
    const results = await sql(query, [id, user.user_id]);

    if (results.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return Response.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
