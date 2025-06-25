import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8181 });

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
        parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
      }

      if (parsedData.type === "join_room") {
        const user = users.find(x => x.ws === ws);
        if (user && !user.rooms.includes(parsedData.roomId)) {
          user.rooms.push(parsedData.roomId);
        }
      }

      if (parsedData.type === "leave_room") {
        const user = users.find(x => x.ws === ws);
        if (!user) {
          return;
        }
        user.rooms = user?.rooms.filter(x => x !== parsedData.roomId); // Fixed: was parsedData.room
      }

      console.log("message received")
      console.log(parsedData);

      if (parsedData.type === "chat") {
        const roomId = parsedData.roomId;
        const message = parsedData.message;

        // Validate roomId
        if (!roomId || isNaN(Number(roomId))) {
          console.error("Invalid roomId:", roomId);
          ws.send(JSON.stringify({
            type: "error",
            message: "Invalid room ID"
          }));
          return;
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

          // Create the chat message - this should work now since room exists
          await prismaClient.chat.create({
            data: {
              roomId: Number(roomId),
              message,
              userId
            }
          });

          // Broadcast to users in the room
          users.forEach(user => {
            if (user.rooms.includes(roomId)) {
              user.ws.send(JSON.stringify({
                type: "chat",
                message: message,
                roomId,
                userId
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