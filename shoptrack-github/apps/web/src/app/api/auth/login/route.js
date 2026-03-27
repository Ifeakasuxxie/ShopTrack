import sql from "@/app/api/utils/sql";
import argon2 from "argon2";
import { randomBytes } from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user
    const userResult = await sql`
      SELECT id, email, password_hash, business_name, business_type, is_registered, country
      FROM users
      WHERE email = ${email}
    `;

    if (userResult.length === 0) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = userResult[0];

    // Verify password
    const isValidPassword = await argon2.verify(user.password_hash, password);

    if (!isValidPassword) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create new session token
    const token = randomBytes(32).toString("hex");
    await sql`
      INSERT INTO sessions (user_id, token)
      VALUES (${user.id}, ${token})
    `;

    // Remove password hash from response
    delete user.password_hash;

    return Response.json({
      user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Failed to log in" }, { status: 500 });
  }
}
