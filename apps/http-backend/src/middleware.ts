import {NextFunction, Request , Response} from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function middleware(req: Request, res: Response, next: NextFunction): void {
    try {
        // Get token from Authorization header
        const authHeader = req.headers["authorization"];
        
        if (!authHeader) {
            res.status(401).json({
                message: "No authorization header provided"
            });
            return;
        }

        // Extract token (handle both "Bearer token" and "token" formats)
        let token: string;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Remove "Bearer " prefix
        } else {
            token = authHeader;
        }

        if (!token) {
            res.status(401).json({
                message: "No token provided"
            });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        if (!decoded || !decoded.userId) {
            res.status(403).json({
                message: "Invalid token structure"
            });
            return;
        }

        // Attach userId to request object
        //@ts-ignore
        req.userId = decoded.userId;
        next();
        
    } catch (error) {
        console.error("JWT verification error:", error);
        
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(403).json({
                message: "Invalid token"
            });
            return;
        }
        
        if (error instanceof jwt.TokenExpiredError) {
            res.status(403).json({
                message: "Token expired"
            });
            return;
        }
        
        res.status(500).json({
            message: "Token verification failed"
        });
        return;
    }
}