import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
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
} | {
    type: "pencil";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | { 
    type: "eraser"; 
    x: number;
    y: number; 
    width: number;
    height: number;
};

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
          
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)
    }
     
    setTool(tool: "circle" | "pencil" | "rect" | "eraser") {
        this.selectedTool = tool;
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        console.log(this.existingShapes);
        this.clearCanvas();
    }
    
    initHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            } else if (message.type == "erase") {
                // Handle erase from other clients
                this.existingShapes = this.existingShapes.filter(shape => {
                    return !this.isPointInShape(message.x, message.y, shape);
                });
                this.clearCanvas();
            }
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "rgba(0, 0, 0)"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.existingShapes.map((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            } else if (shape.type === "circle") {
                console.log(shape);
                this.ctx.strokeStyle = "rgba(255, 255, 255)"
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (shape.type === "pencil") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.beginPath();
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        })
    }


    
    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        
        // For eraser, start erasing immediately
        if (this.selectedTool === "eraser") {
            this.eraseShapeAt(this.startX, this.startY);
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false;
        const rect = this.canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        const width = endX - this.startX;
        const height = endY - this.startY;
        
        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        
        if (selectedTool === "rect") {
            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + width / 2,
                centerY: this.startY + height / 2,
            }
        } else if (selectedTool === "pencil") {
            shape = {
                type: "pencil",
                startX: this.startX,
                startY: this.startY,
                endX: endX,
                endY: endY
            }
        }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);

        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId: this.roomId
        }))
    }

    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            const width = currentX - this.startX;
            const height = currentY - this.startY;
            
            const selectedTool = this.selectedTool;
            
            if (selectedTool === "eraser") {
                // Continue erasing as mouse moves
                this.eraseShapeAt(currentX, currentY);
                return;
            }
            
            this.clearCanvas();
            this.ctx.strokeStyle = "rgba(255, 255, 255)";
            
            if (selectedTool === "rect") {
                this.ctx.strokeRect(this.startX, this.startY, width, height);   
            } else if (selectedTool === "circle") {
                const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                const centerX = this.startX + width / 2;
                const centerY = this.startY + height / 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();                
            } else if (selectedTool === "pencil") {
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    // Erase entire shapes that contain the point
    private eraseShapeAt(x: number, y: number) {
        const initialCount = this.existingShapes.length;
        
        this.existingShapes = this.existingShapes.filter(shape => {
            return !this.isPointInShape(x, y, shape);
        });
        
        // If we removed something, redraw and notify others
        if (this.existingShapes.length < initialCount) {
            this.clearCanvas();
            
            // Send update to other clients
            this.socket.send(JSON.stringify({
                type: "erase",
                x: x,
                y: y,
                roomId: this.roomId
            }));
        }
    }

    // Check if point is inside a shape
    private isPointInShape(x: number, y: number, shape: Shape): boolean {
        switch (shape.type) {
            case "rect":
                return x >= shape.x && x <= shape.x + shape.width &&
                       y >= shape.y && y <= shape.y + shape.height;
            case "circle":
                const distance = Math.sqrt(
                    Math.pow(x - shape.centerX, 2) + Math.pow(y - shape.centerY, 2)
                );
                return distance <= shape.radius;
            case "pencil":
                // Check if point is close to the line
                const A = shape.endY - shape.startY;
                const B = shape.startX - shape.endX;
                const C = shape.endX * shape.startY - shape.startX * shape.endY;
                const distance2 = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
                return distance2 <= 5; // 5px tolerance for lines
            default:
                return false;
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);    
    }
}