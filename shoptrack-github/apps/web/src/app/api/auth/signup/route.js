import sql from "@/app/api/utils/sql";
import argon2 from "argon2";
import { randomBytes } from "crypto";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      business_name,
      business_type,
      is_registered,
      country,
    } = body;

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return Response.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user
    const userResult = await sql`
      INSERT INTO users (email, password_hash, business_name, business_type, is_registered, country)
      VALUES (
        ${email},
        ${passwordHash},
        ${business_name || null},
        ${business_type || null},
        ${is_registered || false},
        ${country || "Nigeria"}
      )
      RETURNING id, email, business_name, business_type, is_registered, country
    `;

    const user = userResult[0];

    // Create session token
    const token = randomBytes(32).toString("hex");
    await sql`
      INSERT INTO sessions (user_id, token)
      VALUES (${user.id}, ${token})
    `;

    return Response.json(
      {
        user,
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
