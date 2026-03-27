import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

// List all products with optional search
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
    const search = searchParams.get("search") || "";

    let query;
    let results;

    if (search) {
      query = `
        SELECT * FROM products 
        WHERE user_id = $1 
        AND (LOWER(name) LIKE LOWER($2) OR barcode LIKE $3)
        ORDER BY name ASC
      `;
      results = await sql(query, [user.user_id, `%${search}%`, `%${search}%`]);
    } else {
      query = `SELECT * FROM products WHERE user_id = $1 ORDER BY name ASC`;
      results = await sql(query, [user.user_id]);
    }

    return Response.json({ products: results });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// Create a new product
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
    const {
      name,
      barcode,
      cost_price,
      selling_price,
      stock_quantity,
      category,
    } = body;

    if (!name || !cost_price || !selling_price) {
      return Response.json(
        { error: "Name, cost price, and selling price are required" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO products (name, barcode, cost_price, selling_price, stock_quantity, category, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const results = await sql(query, [
      name,
      barcode || null,
      parseFloat(cost_price),
      parseFloat(selling_price),
      parseInt(stock_quantity) || 0,
      category || "Uncategorized",
      user.user_id,
    ]);

    return Response.json({ product: results[0] });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error.message.includes("unique constraint")) {
      return Response.json(
        { error: "Barcode already exists" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
