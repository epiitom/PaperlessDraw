import { HTTP_BACKEND } from "@/config";
import axios from "axios";

type Shape = {
    id: number; // This is important for delete
    shape: {
        type: "rect";
        x: number;
        y: number;
        width: number;
        height: number;
    } | {
        type: "circle";
        centerX: number;
        centerY: number;
        radius: number;
    }
};

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const existingShapes: Shape[] = await getExistingShapes(roomId);

    // Draw initial shapes
    clearCanvas(existingShapes, canvas, ctx);

    let clicked = false;
    let startX = 0;
    let startY = 0;

    // Handle incoming WebSocket messages
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "shapeCreated") {
            const newShape: Shape = {
                id: message.messageId,
                shape: JSON.parse(message.message).shape
            };
            existingShapes.push(newShape);
            clearCanvas(existingShapes, canvas, ctx);
        }

        if (message.type === "shapeDeleted") {
            const updatedShapes = existingShapes.filter(s => s.id !== message.messageId);
            existingShapes.length = 0;
            existingShapes.push(...updatedShapes);
            clearCanvas(existingShapes, canvas, ctx);
        }
    };

    // Mouse events
    canvas.addEventListener("mousedown", (e) => {
        clicked = true;
        startX = e.offsetX;
        startY = e.offsetY;
    });

    canvas.addEventListener("mouseup", (e) => {
        clicked = false;
        const width = e.offsetX - startX;
        const height = e.offsetY - startY;

        const shape = {
            type: "rect",
            x: startX,
            y: startY,
            width,
            height
        };

        socket.send(JSON.stringify({
            type: "chat",
            roomId: roomId,
            message: JSON.stringify({ shape })
        }));
    });

    canvas.addEventListener("mousemove", (e) => {
        if (clicked) {
            const width = e.offsetX - startX;
            const height = e.offsetY - startY;
            clearCanvas(existingShapes, canvas, ctx);
            ctx.strokeStyle = "rgba(255,255,255)";
            ctx.strokeRect(startX, startY, width, height);
        }
    });

    // Erase with right-click
    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const x = e.offsetX;
        const y = e.offsetY;

        // Find shape to delete
        for (const item of existingShapes) {
            if (isPointInShape(x, y, item.shape)) {
                socket.send(JSON.stringify({
                    type: "deleteShape",
                    messageId: item.id,
                    roomId: roomId
                }));
                break; // Delete only one shape at that point
            }
        }
    });
}

// Helper: Draw canvas
function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const item of existingShapes) {
        const shape = item.shape;
        ctx.strokeStyle = "rgba(255,255,255)";
        if (shape.type === "rect") {
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "circle") {
            ctx.beginPath();
            ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Helper: Check if point is inside shape
function isPointInShape(x: number, y: number, shape: Shape["shape"]): boolean {
    if (shape.type === "rect") {
        return (
            x >= shape.x &&
            x <= shape.x + shape.width &&
            y >= shape.y &&
            y <= shape.y + shape.height
        );
    } else if (shape.type === "circle") {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
    }
    return false;
}

// Fetch shapes from server
async function getExistingShapes(roomId: string): Promise<Shape[]> {
    const res = await axios.get(`${HTTP_BACKEND}/v1/chats/${roomId}`);
    const messages = res.data.messages;

    return messages.map((x: { id: number; message: string }) => {
        return {
            id: x.id, // Use message ID as shape ID
            shape: JSON.parse(x.message).shape
        };
    });
}
