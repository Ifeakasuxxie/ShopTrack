import sql from "@/app/api/utils/sql";
import { getUserFromRequest } from "@/app/api/utils/auth-middleware";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    //  Calculate days left
    const trialStart = new Date(user.trial_starts_at || Date.now());
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);

    const now = new Date();
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)),
    );

    const status = user.subscription_status || "trial";
    const isActive = status === "active" || daysLeft > 0;

    return Response.json({
      status,
      daysLeft,
      country: user.country || "Nigeria",
      isActive,
      trial_ends_at: trialEnd.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return Response.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}
