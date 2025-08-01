import { Request, Response } from "express";
import { UserTable } from "../user/usermodel";
import { db } from "../../drizzle/db";
import { and, eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const loginuser = asyncHandler(async (req: Request, res: Response) => {
    const { number, otp } = req.body;
    
    // Validate required fields
    if (!number) {
        throw new ApiError(400, "Number is required");
    }
    
    
    try {
        const existingUsers = await db.select().from(UserTable).where(and(eq(UserTable.number, number), eq(UserTable.role, 'user')));
    } catch (dbError) {
        console.error('Database error:', dbError);
        throw new ApiError(500, "Database operation failed");
    }

    
    let existingUsers;
    try {
        existingUsers = await db.select().from(UserTable).where(and(eq(UserTable.number, number), eq(UserTable.role, 'user')));
    } catch (dbError) {
        console.error('Database error:', dbError);
        throw new ApiError(500, "Database operation failed");
    }

    if (existingUsers.length === 0) {
        // User doesn't exist, create new user
        let newUser;
        try {
            newUser = await db.insert(UserTable).values({
                number: number,
                role: 'user',
            }).returning();
        } catch (dbError) {
            console.error('Database error:', dbError);
            throw new ApiError(500, "Database operation failed");
        }
        
        return res.status(200).json({message: "User created successfully", user: newUser[0]});
    }
    
    // User exists, check OTP
    const user = existingUsers[0];

    if (user.password !== otp && user.role === 'user') {
        throw new ApiError(401, "Invalid OTP");
    }
    const accessToken = jwt.sign(
        {
            _id: user.id,
            number: user.number,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn: "1d" // Token expires in 1 day
        }
    );

    // Exclude password from user object before sending response
    const { password: _password, ...userWithoutPassword } = user;
    return res.status(200).json(new ApiResponse(200, {
        user: userWithoutPassword,
        accessToken
    }, "user login successful"));
});



export const registerAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { number, password, role } = req.body;
    
    // Validate required fields
    if (!number || !password || !role) {
        throw new ApiError(400, "Number, password, and role are required");
    }
    
    let existingUsers;
    try {
        existingUsers = await db.select().from(UserTable).where(and(eq(UserTable.number, number), eq(UserTable.role, role)));
    } catch (dbError) {
        console.error('Database error:', dbError);
        throw new ApiError(500, "Database operation failed");
    }
    
    if (existingUsers.length > 0) {
        throw new ApiError(400, "Admin already exists");
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    let newUser;
    try {
        newUser = await db.insert(UserTable).values({
            number: number,
            password: hashedPassword,
            role: role,
        }).returning();
    } catch (dbError) {
        console.error('Database error:', dbError);
        throw new ApiError(500, "Database operation failed");
    }
    
    return res.status(201).json(new ApiResponse(201, newUser[0], "Admin created successfully"));
});


export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { number, password } = req.body;
    
    if (!number || !password) {
        return res.status(400).json(new ApiResponse(400, null, "Number and password are required"));
    }
    
    let existingUsers;
    try {
        existingUsers = await db.select().from(UserTable).where(eq(UserTable.number, number));
    } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json(new ApiResponse(500, null, "Database operation failed"));
    }
    
    if (existingUsers.length === 0) {
        return res.status(401).json(new ApiResponse(401, null, "Invalid pnone number"));
    }
    
    const user = existingUsers[0];
    
    // Check if user has a password
    if (!user.password) {
        return res.status(401).json(new ApiResponse(401, null, "Please pass a password"));
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
        return res.status(401).json(new ApiResponse(401, null, "Invalid password"));
    }

    // Generate JWT token
    if (!process.env.ACCESS_TOKEN_SECRET) {
        return res.status(500).json(new ApiResponse(500, null, "Server misconfiguration: missing ACCESS_TOKEN_SECRET"));
    }
    
    const accessToken = jwt.sign(
        {
            _id: user.id,
            number: user.number,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "1d" // Token expires in 1 day
        }
    );

    // Exclude password from user object before sending response
    const { password: _password, ...userWithoutPassword } = user;

    return res.status(200).json(new ApiResponse(200, {
        user: userWithoutPassword,
        accessToken
    }, "Admin login successful"));
    
});