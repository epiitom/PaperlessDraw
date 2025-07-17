
import {HTTP_BACKEND} from "@/config"
import axios from "axios";
export async function getExistingShapes(roomId: string): Promise<any[]> {
    try {
        const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
        const messages = res.data.messages;

        if (!messages || messages.length === 0) {
            return [];
        }

        const shapes = messages.map((x: { message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                return messageData.shape;  // Type: any
            } catch (error) {
                console.error('Error parsing message:', x.message, error);
                return null;
            }
        }).filter(shape => shape !== null);

        return shapes ;  // <-- Quick fix
    } catch (error) {
        console.error('Error fetching existing shapes:', error);
        return [];
    }
}
