import express from "express" 
import {UserSchema} from "./types"
import jwt from "jsonwebtoken"
import { JWT_SECERT }  from '@repo/backend-common/config';
import {middleware} from "./middleware"
import {CreateuserSchema , SiginSchema, CreateRoomSchema } from "@repo/common/types"
const app = express();
app.use(express.json()); 

app.post("/signup" , (req,res) => {
      const data = CreateuserSchema.safeParse(req.body);

      if(!data){
       res.json({
              message : "incorrect inputs"
       })
       return
      }
      res.json({
       userId: "123"
      })
    
})
app.post("/signin" , (req,res) => {
      
      const userId = 1;
      const token = jwt.sign({
        userId
       } , JWT_SECERT);
       res.json({
        token
       })
})

app.post("/room" ,middleware ,(req,res) => {
       // db call 

       res.json({
        roomId : 123
       })
    
})

app.listen(3001)