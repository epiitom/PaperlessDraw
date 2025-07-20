import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from "@repo/db/client";

const WS_PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 8181;
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket backend listening on port ${WS_PORT}`);

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch(e) {
    return null;
  }
  return null;
}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close()
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('message', async function message(data) {
    try {
      let parsedData;
      if (typeof data !== "string") {
        parsedData = JSON.parse(data.toString());
      } else {
        parsedData = JSON.parse(data);
      }

      if (parsedData.type === "join_room") {
        const roomIdString = parsedData.roomId;
        
        // Handle "new" room case
        if (roomIdString === "new") {
          console.log("User attempting to join 'new' room - this should be handled by frontend");
          ws.send(JSON.stringify({
            type: "error",
            message: "Cannot join 'new' room. Please create a room first."
          }));
          return;
        }
        
        const user = users.find(x => x.ws === ws);
        if (user && !user.rooms.includes(roomIdString)) {
          user.rooms.push(roomIdString);
          console.log(`User ${userId} joined room ${roomIdString}`);
        }
      }

      if (parsedData.type === "leave_room") {
        const user = users.find(x => x.ws === ws);
        if (!user) {
          return;
        }
        user.rooms = user?.rooms.filter(x => x !== parsedData.roomId);
      }

      console.log("message received")
      console.log(parsedData);

      if (parsedData.type === "chat") {
        const roomIdString = parsedData.roomId;
        const message = parsedData.message;

        // Handle "new" room case
        if (roomIdString === "new") {
          console.log("Cannot send chat to 'new' room");
          ws.send(JSON.stringify({
            type: "error",
            message: "Cannot send messages to 'new' room. Please create a room first."
          }));
          return;
        }

        // Extract numeric part from "room2" -> 2 OR handle direct numeric roomId
        let roomId: number;
        
        if (roomIdString.startsWith('room')) {
          // Format: "room2"
          const roomIdMatch = roomIdString.match(/^room(\d+)$/);
          if (!roomIdMatch) {
            console.error("Invalid roomId format:", roomIdString);
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid room ID format. Expected format: room{number}"
            }));
            return;
          }
          roomId = parseInt(roomIdMatch[1]);
        } else {
          // Direct numeric format: "123"
          roomId = parseInt(roomIdString);
          if (isNaN(roomId)) {
            console.error("Invalid roomId format:", roomIdString);
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid room ID format. Expected a number or room{number}"
            }));
            return;
          }
        }

        try {
          // Check if room exists first
          const existingRoom = await prismaClient.room.findUnique({
            where: { id: Number(roomId) }
          });

          if (!existingRoom) {
            console.error("Room does not exist:", roomId);
            ws.send(JSON.stringify({
              type: "error",
              message: "Room does not exist. Please join a valid room first."
            }));
            return;
          }

          // Create the chat message
        const createdMessage =  await prismaClient.chat.create({
            data: {
              roomId: Number(roomId),
              message,
              userId
            }
          });

          // Broadcast to users in the room
          users.forEach(user => {
            if (user.rooms.includes(roomIdString)) {
              user.ws.send(JSON.stringify({
                type: "chats",
                message: message,
                roomId: roomIdString,
                userId,
                   messageId: createdMessage.id
              }))
            }
          });

        } catch (dbError) {
          console.error("Database error:", dbError);
          ws.send(JSON.stringify({
            type: "error",
            message: "Failed to save message"
          }));
        }
      }
      if (parsedData.type === "deleteShape") {
        let messageId = parsedData.messageId;
        let roomIdString = parsedData.roomId;
        console.log("[deleteShape] Incoming:", { messageId, roomIdString, type_messageId: typeof messageId });

        // Normalize messageId to number
        messageId = Number(messageId);
        if (isNaN(messageId)) {
          console.error("[deleteShape] Invalid messageId:", parsedData.messageId);
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid messageId for deletion"
          }));
          return;
        }

        // Normalize roomIdString (use same logic as chat handler)
        let roomId;
        if (roomIdString.startsWith('room')) {
          const roomIdMatch = roomIdString.match(/^room(\d+)$/);
          if (!roomIdMatch) {
            console.error("[deleteShape] Invalid roomId format:", roomIdString);
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid room ID format. Expected format: room{number}"
            }));
            return;
          }
          roomId = parseInt(roomIdMatch[1]);
        } else {
          roomId = parseInt(roomIdString);
          if (isNaN(roomId)) {
            console.error("[deleteShape] Invalid roomId format:", roomIdString);
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid room ID format. Expected a number or room{number}"
            }));
            return;
          }
        }
        // For broadcast, use the original roomIdString
        try {
          // Delete from DB
          await prismaClient.chat.delete({
            where: { id: messageId }
          });

          // Debug: print all user rooms
          users.forEach(user => {
            console.log(`[deleteShape] User ${user.userId} rooms:`, user.rooms);
          });

          // Broadcast deletion to the room
          users.forEach(user => {
            if (user.rooms.includes(roomIdString)) {
              user.ws.send(JSON.stringify({
                type: "shapeDeleted",
                messageId: messageId,
                roomId: roomIdString
              }));
            }
          });
        } catch (e) {
          console.error("[deleteShape] Delete failed:", e);
          ws.send(JSON.stringify({
            type: "error",
            message: "Failed to delete shape"
          }));
        }
      }

      

    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
    }
    
    
  });
  
  

  // Handle client disconnect
  ws.on('close', () => {
    const userIndex = users.findIndex(user => user.ws === ws);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
});