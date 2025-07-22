import { asyncHandler } from "../utils/asyncHandler";
import { db } from "../../drizzle/db";
import { UserTable } from "./usermodel";
import { and, eq, like, or } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";



export const getUser = asyncHandler(async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const user = await db.select().from(UserTable).where(eq(UserTable.id, Number(id)));
        return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    }
    catch(error){
        console.error('Error fetching user:', error);
        throw new ApiError(500, "Failed to fetch user");
    }
});


export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    try{
    const { id } = req.params;


    const { id: _id, password: _password, ...updateData } = req.body;

    const user = await db
        .update(UserTable)
        .set(updateData)
        .where(eq(UserTable.id, Number(id)))
        .returning();

    // Remove password from each user object
    const usersWithoutPassword = user.map(({ password, ...user }) => user);

    return res.status(200).json(new ApiResponse(200, usersWithoutPassword, "All users fetched successfully"));
    }
    catch(error){
        console.error('Error updating user:', error);
        throw new ApiError(500, "Failed to update user");
    }
});


export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const user = await db.delete(UserTable).where(eq(UserTable.id, Number(id)));
        return res.status(200).json(new ApiResponse(200, user, "User deleted successfully"));
    }
    catch(error){
        console.error('Error deleting user:', error);
        throw new ApiError(500, "Failed to delete user");
    }
});



export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
        const users = await db.select().from(UserTable);

        // Remove password from each user object
        const usersWithoutPassword = users.map(({ password, ...user }) => user);

        return res.status(200).json(new ApiResponse(200, usersWithoutPassword, "All users fetched successfully"));
    } catch (error) {
        console.error('Error fetching all users:', error);
        throw new ApiError(500, "Failed to fetch users");
    }
});

export const searchUser = asyncHandler(async (req: Request, res: Response) => {
    try{
        const { search } = req.body;
        
        if (!search) {
            throw new ApiError(400, "Search term is required");
        }
        
        console.log('Search term:', search, 'Type:', typeof search);
        
        // Convert search term to number for numeric comparisons
        const searchNumber = Number(search);
        const searchPincode = Number(search);
        

        
        // Build search conditions
        const searchConditions = [
            like(UserTable.name, `%${search}%`),
            like(UserTable.email, `%${search}%`),
            like(UserTable.aadharNumber, `%${search}%`),
            like(UserTable.dlNumber, `%${search}%`),
            like(UserTable.passportNumber, `%${search}%`),
            like(UserTable.locality, `%${search}%`),
            like(UserTable.city, `%${search}%`),
            like(UserTable.state, `%${search}%`),
            like(UserTable.country, `%${search}%`)
        ];
        
        // Add numeric conditions only if search term is a valid number
        if (!isNaN(searchNumber)) {
            searchConditions.push(eq(UserTable.number, searchNumber));
          
        }
        
        if (!isNaN(searchPincode)) {
            searchConditions.push(eq(UserTable.pincode, searchPincode));
           
        }
        
        
        
        const user = await db.select().from(UserTable).where(or(...searchConditions));
        
       
        
       // Remove password from each user object
       const usersWithoutPassword = user.map(({ password, ...user }) => user);

       return res.status(200).json(new ApiResponse(200, usersWithoutPassword, "All users fetched successfully"));
    }
    catch(error){
       
        throw new ApiError(500, "Failed to search user");
    }
});


export const getUserbyrole = asyncHandler(async (req: Request, res: Response) => {
    try{
        const { role } = req.body;
        const user = await db.select().from(UserTable).where(eq(UserTable.role, role));
        // Remove password from each user object
       const usersWithoutPassword = user.map(({ password, ...user }) => user);

       return res.status(200).json(new ApiResponse(200, usersWithoutPassword, "All users fetched successfully"));
    }
    catch(error){
        console.error('Error fetching user by role:', error);
        throw new ApiError(500, "Failed to fetch user by role");
    }
});


export const addParkingIncharge = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try{
     if((req as any).user.role === "admin"){
        const user = await db.insert(UserTable).values({...req.body, role : "parkingincharge"});
        return res.status(200).json(new ApiResponse(200, user, "Parking incharge added successfully"));
     }
     else{
        throw new ApiError(403, "You are not authorized to add parking incharge");
     }
    }
    catch(error){
        console.error('Error adding parking incharge:', error);
        throw new ApiError(500, "Failed to add parking incharge");
    }
});

export const getusersbyvendor = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try{
        if((req as any).user && (req as any).user.role === "admin" || (req as any).user.role === "parkingincharge"){
        const users = await db.select().from(UserTable).where(eq(UserTable.role, "vendor"));
        return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
    }
    else{
        throw new ApiError(403, "You are not authorized to fetch users by vendor");
    }
    }
    catch(error){
        console.error('Error fetching users by vendor:', error);
        throw new ApiError(500, "Failed to fetch users by vendor");
    }
});

export const addvendor = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try{
     
      
        const user = await db.insert(UserTable).values(req.body);
        return res.status(200).json(new ApiResponse(200, user, "Vendor added successfully"));
    }
    catch(error){
        console.error('Error adding vendor:', error);
        throw new ApiError(500, "Failed to add vendor");
    }
});

export const getParkingInchargeByNumber = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try{
        if((req as any).user.role === "admin" ){
            const user = await db.select().from(UserTable).where(and(eq(UserTable.number, req.body.number), eq(UserTable.role, "parkingincharge")));
            return res.status(200).json(new ApiResponse(200, user, "Parking incharge fetched successfully"));
        }
        else{
            throw new ApiError(403, "You are not authorized to fetch parking incharge by number");
        }
    }
    catch(error){
        console.error('Error fetching parking incharge by number:', error);
        throw new ApiError(500, "Failed to fetch parking incharge by number");
    }
});

export const assignParkingIncharge = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try{
        if((req as any).user.role === "admin" ){
            const user = await db.update(UserTable).set({role: "parkingincharge", parkingid: req.body.parkingid}).where(eq(UserTable.id, req.body.id)).returning();
            return res.status(200).json(new ApiResponse(200, user, "Parking incharge assigned successfully"));
        }
        else{
            throw new ApiError(403, "You are not authorized to assign parking incharge");
        }
    }
    catch(error){
        console.error('Error assigning parking incharge:', error);
        throw new ApiError(500, "Failed to assign parking incharge");
    }
});

export const getParkingInchargeByParkingId = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try{
        if((req as any).user.role === "admin" ){
            const user = await db.select().from(UserTable).where(eq(UserTable.parkingid, Number(req.params.parkingid)));
            return res.status(200).json(new ApiResponse(200, user, "Parking incharge fetched successfully"));
        }
        else{
            throw new ApiError(403, "You are not authorized to fetch parking incharge by parking id");
        }
    }
    catch(error){
        console.error('Error fetching parking incharge by parking id:', error);
        throw new ApiError(500, "Failed to fetch parking incharge by parking id");
    }
});