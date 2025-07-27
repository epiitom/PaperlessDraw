/* eslint-disable @typescript-eslint/no-explicit-any */
import {HTTP_BACKEND} from "@/config"
import axios from "axios";

export async function getExistingShapes(roomId: string): Promise<any[]> {
    try {
        // Handle "new" room case - return empty array since it's a new room
        if (roomId === "new" || !roomId) {
            console.log('New room detected, returning empty shapes array');
            return [];
        }

        // Convert string to number for backend
        const roomIdNumber = parseInt(roomId, 10);
        
        // Validate the conversion
        if (isNaN(roomIdNumber)) {
            console.error('Invalid roomId provided:', roomId);
            return [];
        }
        
        console.log('Fetching shapes for room:', roomIdNumber);
        const res = await axios.get(`${HTTP_BACKEND}/v1/chats/${roomIdNumber}`);
        const messages = res.data.messages;

        if (!messages || messages.length === 0) {
            return [];
        }

        // Always return { id, shape }
        const shapes = messages.map((x: { id: number; message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                return { id: x.id, shape: messageData.shape };
            } catch (error) {
                console.error('Error parsing message:', x.message, error);
                return null;
            }
        }).filter((shape: any) => shape !== null);

        return shapes;
    } catch (error) {
        console.error('Error fetching existing shapes:', error);
        return [];
    }
}