import bcrypt from "bcrypt";
import { db } from "../../config/database.js";
import {
  createOrganization,
  createUser,
  findRoleByName,
  findUserByEmail,
} from "./auth.repository.js";
import { RegisterInput } from "./auth.types.js";
import jwt from "jsonwebtoken";

export async function registerUser(input: RegisterInput) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const slug = input.organizationName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    const organizationId = await createOrganization(
      connection,
      input.organizationName,
      slug
    );

    const role = await findRoleByName(
      connection,
      "organization_admin"
    );

    if (!role) {
      throw new Error("Organization admin role not found");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const userId = await createUser(
      connection,
      organizationId,
      role.id,
      input.name,
      input.email,
      input.phone,
      passwordHash
    );

    await connection.commit();

    return {
      userId,
      organizationId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function loginUser(
  email: string,
  password: string
) {
  const connection = await db.getConnection();

  try {
    const user = await findUserByEmail(connection, email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      throw new Error("User account is inactive");
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password");
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organization_id,
        roleId: user.role_id,
      },
      jwtSecret,
      {
        expiresIn: "1h",
      }
    );

    return {
      token,
      user: {
        id: user.id,
        organizationId: user.organization_id,
        roleId: user.role_id,
        name: user.name,
        email: user.email,
      },
    };
  } finally {
    connection.release();
  }
}