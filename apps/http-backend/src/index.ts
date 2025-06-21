import express from "express" 
import jwt from "jsonwebtoken"
import { JWT_SECRET }  from '@repo/backend-common/config';
import {middleware} from "./middleware"
import {CreateuserSchema , SiginSchema, CreateRoomSchema } from "@repo/common/types"
import {prismaClient} from "@repo/db/client"
const app = express();
app.use(express.json()); 

app.post("/signup" , async(req,res) => {
      const parsedData = CreateuserSchema.safeParse(req.body);
       
      if(!parsedData.success){
       res.json({
              message : "incorrect inputs"
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
        roomId : room.id
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
app.get("/chats/:roomId", async(req,res) => {
       const roomId = Number(req.params.roomId);
       const messages = await prismaClient.chat.findMany({
              where: {
                     roomId: roomId
              },
             orderBy: {
              id:"desc"
             },
             take: 50 // this are latest 50 chats
       })
       res.json({
              messages
       })
})

app.listen(3001)