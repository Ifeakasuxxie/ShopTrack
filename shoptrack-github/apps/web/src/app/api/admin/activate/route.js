import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { user_id, admin_token } = await request.json();

    // Check admin token
    if (admin_token !== process.env.ADMIN_TOKEN) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Activate user
    await sql`
      UPDATE users
      SET subscription_status = 'active'
      WHERE id = ${user_id}
    `;

    return Response.json({
      success: true,
      message: "User subscription activated successfully",
    });
  } catch (error) {
    console.error("Error activating subscription:", error);
    return Response.json(
      { error: "Failed to activate subscription" },
      { status: 500 },
    );
  }
}
