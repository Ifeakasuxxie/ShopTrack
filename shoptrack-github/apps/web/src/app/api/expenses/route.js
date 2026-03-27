import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

// GET - List all expenses
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

    const expenses = await sql`
      SELECT id, description, amount, category, created_at
      FROM expenses
      WHERE user_id = ${user.user_id}
      ORDER BY created_at DESC
    `;

    return Response.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return Response.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

// POST - Create new expense
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
    const { description, amount, category } = body;

    if (!description || !amount) {
      return Response.json(
        { error: "Description and amount are required" },
        { status: 400 },
      );
    }

    const result = await sql`
      INSERT INTO expenses (description, amount, category, user_id)
      VALUES (${description}, ${parseFloat(amount)}, ${category || "Other"}, ${user.user_id})
      RETURNING id, description, amount, category, created_at
    `;

    return Response.json({ expense: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return Response.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}
