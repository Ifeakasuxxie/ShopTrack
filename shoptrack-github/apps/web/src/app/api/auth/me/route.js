import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "No authorization token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    // Find session and user
    const sessionResult = await sql`
      SELECT s.id as session_id, s.user_id, u.email, u.business_name, u.business_type, u.is_registered, u.country
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token}
    `;

    if (sessionResult.length === 0) {
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const session = sessionResult[0];

    return Response.json({
      user: {
        id: session.user_id,
        email: session.email,
        business_name: session.business_name,
        business_type: session.business_type,
        is_registered: session.is_registered,
        country: session.country,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return Response.json({ error: "Failed to get user info" }, { status: 500 });
  }
}
