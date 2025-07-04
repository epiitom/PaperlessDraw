import { z }  from "zod";

export const CreateuserSchema = z.object({
    username : z.string().min(3).max(50),
    password: z.string(),
    name : z.string()
})

export const SiginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string(),
})
export const CreateRoomSchema = z.object({
    name : z.string().min(3).max(20)
})