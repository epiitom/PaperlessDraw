import {z} from "zod"

 export const UserSchema = z.object({
       username : z.string(),
       email : z.string().email("invaid email"),
       password : z.string()
})
