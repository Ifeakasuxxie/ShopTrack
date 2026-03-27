import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

// Get a product by barcode
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { barcode } = params;

    const query = `SELECT * FROM products WHERE barcode = $1 AND user_id = $2`;
    const results = await sql(query, [barcode, user.user_id]);

    if (results.length === 0) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json({ product: results[0] });
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
