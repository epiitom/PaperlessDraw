import express from "express" 
import jwt from "jsonwebtoken"
import { JWT_SECRET }  from '@repo/backend-common/config';
import {middleware} from "./middleware"
import {CreateuserSchema , SiginSchema, CreateRoomSchema } from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
import cors from "cors"
const app = express();
app.use(express.json()); 
app.use(cors(  {origin: true, // Allow all origins in development
  credentials: true}))
app.post("/signup" , async(req,res) => {
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
    const user =  await prismaClient.users.create({
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
app.post("/signin" ,async (req,res) => {
      const parsedData = SiginSchema.safeParse(req.body);
      if(!parsedData.success){
       res.json({
              message:"incorrect inputs"
       })
       return
      }   
        const  user = await prismaClient.users.findFirst({
              where: {
                     email:parsedData.data.username,
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
        userId:user?.id
       } , JWT_SECRET);
       res.json({
        token
       })
})

app.post("/room" ,middleware ,async(req,res) => {
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
              slug:parsedData.data.name,
              adminId:userId
           }
       })
       res.json({
        roomId : room.id,
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
app.get("/chats/:roomId", async (req, res) => {
    const roomId = req.params.roomId;
    
    // Handle both numeric and string roomIds
    let whereClause: any;
    if (isNaN(Number(roomId))) {
        // If roomId is not a number, treat it as a string
        whereClause = { roomId: roomId };
    } else {
        // If roomId is a number, convert it
        whereClause = { roomId: Number(roomId) };
    }
    
    try {
        const messages = await prismaClient.chat.findMany({
            where: whereClause,
            orderBy: {
                id: "desc"
            }
        });
        
        res.json({ messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
app.get("/room/:slug", async(req,res) => {
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

app.listen(3002)