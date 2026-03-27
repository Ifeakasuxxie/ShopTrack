import sql from "@/app/api/utils/sql";

export async function getUserFromRequest(request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);

    // Find session and user
    const sessionResult = await sql`
      SELECT s.id as session_id, s.user_id, u.email, u.business_name, u.trial_ends_at, u.is_subscribed
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token}
    `;

    if (sessionResult.length === 0) {
      return null;
    }

    const session = sessionResult[0];

    // Check if trial expired and not subscribed
    const trialEnded = new Date(session.trial_ends_at) < new Date();
    if (trialEnded && !session.is_subscribed) {
      return {
        user_id: session.user_id,
        email: session.email,
        business_name: session.business_name,
        subscription_expired: true,
      };
    }

    return {
      user_id: session.user_id,
      email: session.email,
      business_name: session.business_name,
      subscription_expired: false,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}
