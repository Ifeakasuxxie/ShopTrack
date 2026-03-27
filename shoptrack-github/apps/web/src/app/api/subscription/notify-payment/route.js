import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update subscription status to pending
    await sql`
      UPDATE users
      SET subscription_status = 'pending'
      WHERE id = ${user.user_id}
    `;

    return Response.json({
      success: true,
      message:
        "Payment notification received. We'll activate your account within 24 hours.",
    });
  } catch (error) {
    console.error("Error notifying payment:", error);
    return Response.json(
      { error: "Failed to process payment notification" },
      { status: 500 },
    );
  }
}
