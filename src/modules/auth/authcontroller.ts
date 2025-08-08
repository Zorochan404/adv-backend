import { Request, Response } from "express";
import { UserTable } from "../user/usermodel";
import { db } from "../../drizzle/db";
import { and, eq, or } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/responseHandler";
import { withDatabaseErrorHandling } from "../utils/dbErrorHandler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginuser = asyncHandler(async (req: Request, res: Response) => {
  const { number, otp } = req.body;

  // Validate required fields using the new error system
  if (!number) {
    throw ApiError.badRequest("Phone number is required");
  }

  if (!otp) {
    throw ApiError.badRequest("OTP is required");
  }

  // Validate phone number format
  if (!/^[0-9]{10}$/.test(number)) {
    throw ApiError.badRequest("Invalid phone number format. Must be 10 digits");
  }

  // Validate OTP format
  if (!/^[0-9]{4,6}$/.test(otp)) {
    throw ApiError.badRequest("Invalid OTP format");
  }

  const result = await withDatabaseErrorHandling(async () => {
    const existingUsers = await db
      .select()
      .from(UserTable)
      .where(
        and(
          eq(UserTable.number, number),
          or(eq(UserTable.role, "user"), eq(UserTable.role, "vendor"))
        )
      );

    if (existingUsers.length === 0) {
      // User doesn't exist, create new user
      const newUser = await db
        .insert(UserTable)
        .values({
          number: number,
          role: "user",
        })
        .returning();

      // Generate access token for new user
      const accessToken = jwt.sign(
        {
          _id: newUser[0].id,
          number: newUser[0].number,
          role: newUser[0].role,
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: "1d",
        }
      );

      // Exclude password from user object before sending response
      const { password: _password, ...userWithoutPassword } = newUser[0];

      return {
        user: userWithoutPassword,
        accessToken,
        isNewUser: true,
      };
    }

    // User exists, check OTP
    const user = existingUsers[0];

    if (user.role === "admin") {
      throw ApiError.forbidden("Admin cannot login as user");
    }

    if (user.password !== otp) {
      throw ApiError.unauthorized("Invalid OTP");
    }

    const accessToken = jwt.sign(
      {
        _id: user.id,
        number: user.number,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    // Exclude password from user object before sending response
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      isNewUser: false,
    };
  }, "loginuser");

  const message = result.isNewUser
    ? "User created and logged in successfully"
    : "User login successful";

  return sendSuccess(res, result, message, result.isNewUser ? 201 : 200);
});

export const registerAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      number,
      password,
      role,
      name,
      email,
      parkingid,
      locality,
      city,
      state,
      country,
      pincode,
      isverified,
      avatar,
      age,
      aadharNumber,
      aadharimg,
      dlNumber,
      dlimg,
      passportNumber,
      passportimg,
      lat,
      lng,
    } = req.body;

    // Validate required fields
    if (!number || !password || !role) {
      throw ApiError.badRequest("Number, password, and role are required");
    }

    // Validate phone number format
    if (!/^[0-9]{10}$/.test(number)) {
      throw ApiError.badRequest(
        "Invalid phone number format. Must be 10 digits"
      );
    }

    // Validate role
    const validRoles = ["admin", "user", "vendor", "parkingincharge"];
    if (!validRoles.includes(role)) {
      throw ApiError.badRequest(
        `Invalid role. Must be one of: ${validRoles.join(", ")}`
      );
    }

    const user = await withDatabaseErrorHandling(async () => {
      const existingUsers = await db
        .select()
        .from(UserTable)
        .where(and(eq(UserTable.number, number), eq(UserTable.role, role)));

      if (existingUsers.length > 0) {
        throw ApiError.conflict(
          "User with this number and role already exists"
        );
      }

      // Hash the password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = await db
        .insert(UserTable)
        .values({
          number: number,
          password: hashedPassword,
          role: role,
          name: name || null,
          email: email || null,
          parkingid: parkingid || null,
          locality: locality || null,
          city: city || null,
          state: state || null,
          country: country || null,
          pincode: pincode || null,
          isverified: isverified || false,
          avatar: avatar || null,
          age: age || null,
          aadharNumber: aadharNumber || null,
          aadharimg: aadharimg || null,
          dlNumber: dlNumber || null,
          dlimg: dlimg || null,
          passportNumber: passportNumber || null,
          passportimg: passportimg || null,
          lat: lat || null,
          lng: lng || null,
        })
        .returning();

      // Exclude password from user object before sending response
      const { password: _password, ...userWithoutPassword } = newUser[0];
      return userWithoutPassword;
    }, "registerAdmin");

    return sendCreated(res, user, "User created successfully");
  }
);

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { number, password } = req.body;

  // Validate required fields
  if (!number || !password) {
    throw ApiError.badRequest("Number and password are required");
  }

  // Validate phone number format
  if (!/^[0-9]{10}$/.test(number)) {
    throw ApiError.badRequest("Invalid phone number format. Must be 10 digits");
  }

  const result = await withDatabaseErrorHandling(async () => {
    const existingUsers = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.number, number));

    if (existingUsers.length === 0) {
      throw ApiError.unauthorized("Invalid phone number");
    }

    const user = existingUsers[0];

    // Check if user has a password
    if (!user.password) {
      throw ApiError.unauthorized("Please provide a password");
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid password");
    }

    // Generate JWT token
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw ApiError.internal(
        "Server misconfiguration: missing ACCESS_TOKEN_SECRET"
      );
    }

    const accessToken = jwt.sign(
      {
        _id: user.id,
        number: user.number,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // Exclude password from user object before sending response
    const { password: _password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }, "loginAdmin");

  return sendSuccess(res, result, "Admin login successful");
});
