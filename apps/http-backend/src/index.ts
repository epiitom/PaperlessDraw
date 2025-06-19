import express from "express" 
import {UserSchema} from "./types"
import jwt from "jsonwebtoken"

const JWT_SECERT = "12344"
const app = express();
app.use(express.json())

app.post("/signup" , (req,res) => {
       const createPayload = req.body
       const parsedPayload = UserSchema.safeParse(createPayload)
     
       
      

})

app.listen(3001)