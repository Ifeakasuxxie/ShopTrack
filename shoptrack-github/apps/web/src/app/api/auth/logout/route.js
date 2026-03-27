import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        { error: "No authorization token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);

    // Delete session
    await sql`
      DELETE FROM sessions WHERE token = ${token}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return Response.json({ error: "Failed to log out" }, { status: 500 });
  }
}
