import express from "express" 
import jwt from "jsonwebtoken"
import { JWT_SECRET }  from '@repo/backend-common/config';
import {middleware} from "./middleware"
import {CreateuserSchema , SiginSchema, CreateRoomSchema } from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
import { Request, Response } from "express";
import cors from "cors"

const app = express();
app.use(express.json()); 
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true
}))

interface DeleteByPointBody {
    x: number;
    y: number;
}

// Fixed routes with proper leading slash
app.post("/v1/signup", async(req, res) => {
    console.log("Received body:", req.body);
    console.log("Body keys:", Object.keys(req.body));
    console.log("Body values:", Object.values(req.body));

    const parsedData = CreateuserSchema.safeParse(req.body);
    if(!parsedData.success){
        console.log("❌ VALIDATION ERRORS:", parsedData.error.issues);
        res.json({
            message: "incorrect inputs",
            details: parsedData.error.issues
        })
        return
    }
    
    try{
        const user = await prismaClient.users.create({
            data:{
                email: parsedData.data?.username,
                password: parsedData.data?.password,
                name: parsedData.data.name
            }   
        })
        res.json({
            userId: user.id
        })
    }catch(e){
        res.status(411).json({
            message:"User already exists with this username"
        })
    } 
})

app.post("/v1/signin", async (req, res) => {
    const parsedData = SiginSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"incorrect inputs"
        })
        return
    }   
    
    const user = await prismaClient.users.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })

    if(!user){
        res.status(403).json({
            message: "Not authorized"
        })
        return;
    }
    
    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);
    
    res.json({
        token
    })
})
// Simplified version that works with your current schema
app.post("/v1/auth/google", async (req: Request, res: Response) => {
    const { code } = req.body;
    
    if (!code) {
        res.status(400).json({
            message: "Google auth code required"
        });
        return;
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            }),
        });

        const tokens = await tokenResponse.json() as any;
        
        if (!tokenResponse.ok) {
            throw new Error('Failed to get Google tokens');
        }

        // Get user info from Google
        const userResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
        );
        
        const googleUser = await userResponse.json() as any;
        
        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const { email, name, picture } = googleUser;

        // Check if user exists
        let user = await prismaClient.users.findUnique({
            where: { email }
        });

        if (!user) {
            // Create new user with your existing schema
            user = await prismaClient.users.create({
                data: {
                    email,
                    name,
                    photo: picture,
                    password: 'GOOGLE_AUTH' // Placeholder for Google users
                }
            });
        }

        // Generate JWT token (same as your signin route)
        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET);

        res.json({
            token,
            userId: user.id
        });
        return;

    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            message: "Google authentication failed"
        });
        return;
    }
});

app.post("/v1/room", middleware, async(req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message:"incorrect inputs"
        })
        return
    }  
    
    //@ts-ignore
    const userId = req.userId;
    try{
        const room = await prismaClient.room.create({
            data:{
                slug: parsedData.data.name,
                adminId: userId
            }
        })
        res.json({
            roomId: room.id,
            slug: room.slug
        })
        return
    } catch (e: any) {
        console.log('Full Database error:', JSON.stringify(e, null, 2));
        console.log('Error code:', e.code);
        console.log('Error message:', e.message);
        console.log('Error meta:', e.meta);
        
        // Check if it's a unique constraint violation
        if (e.code === 'P2002' && e.meta?.target?.includes('slug')) {
            res.status(409).json({
                message: "Room already exists with this name"
            });
            return;
        }
        
        // Check if it's a foreign key constraint violation (invalid userId)
        if (e.code === 'P2003') {
            res.status(400).json({
                message: "Invalid user ID"
            });
            return;
        }
        
        // Generic database error - include actual error for debugging
        res.status(500).json({
            message: "Failed to create room. Please try again.",
            error: e.message,
            code: e.code
        });
        return;
    }
})

app.get("/v1/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
})

app.get("/v1/room/:slug", async(req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        },
    })
    res.json({
        room
    })
})

// Minimal DELETE endpoint for deleting a chat message (shape) by id
app.delete("/v1/chats/:messageId", async (req, res) => {
    try {
        const messageId = Number(req.params.messageId);
        await prismaClient.chat.delete({
            where: { id: messageId }
        });
        res.json({ success: true });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        res.status(500).json({ success: false, error: errorMessage });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`HTTP backend listening on port ${PORT}`);
});