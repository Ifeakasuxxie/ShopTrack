import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

// POST - Add stock to a product
export async function POST(request, { params }) {
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
    const { amount } = body;

    if (!amount || amount <= 0) {
      return Response.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    // Update stock by adding the amount
    const result = await sql`
      UPDATE products
      SET stock_quantity = stock_quantity + ${parseInt(amount)}
      WHERE id = ${id} AND user_id = ${user.user_id}
      RETURNING id, name, stock_quantity
    `;

    if (result.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: result[0] });
  } catch (error) {
    console.error("Error restocking product:", error);
    return Response.json(
      { error: "Failed to restock product" },
      { status: 500 },
    );
  }
}
