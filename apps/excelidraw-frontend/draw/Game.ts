/* eslint-disable @typescript-eslint/no-explicit-any */
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
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "pencil";
    points: { x: number; y: number }[];
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
    private existingShapes: Shape[] = [];
    private roomId: string;
    private isDrawing: boolean = false;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private currentPencilPoints: { x: number; y: number }[] = [];
    private lastX = 0;
    private lastY = 0;
    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roomId = roomId;
        this.socket = socket;
        
        // Set canvas style
        this.canvas.style.cursor = "crosshair";
        this.canvas.style.display = "block";
        
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
          
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("mouseleave", this.mouseLeaveHandler);
    }
     
    setTool(tool: Tool) {
        this.selectedTool = tool;
        console.log("Tool changed to:", tool);
        
        // Update cursor based on tool
        switch (tool) {
            case "pencil":
                this.canvas.style.cursor = "crosshair";
                break;
            case "eraser":
                this.canvas.style.cursor = "grab";
                break;
            default:
                this.canvas.style.cursor = "crosshair";
        }
    }

    async init() {
        try {
            const shapes = await getExistingShapes(this.roomId);
            this.existingShapes = this.validateAndNormalizeShapes(shapes);
            console.log("Loaded shapes:", this.existingShapes);
            this.clearCanvas();
        } catch (error) {
            console.error("Failed to load existing shapes:", error);
            this.existingShapes = [];
            this.clearCanvas();
        }
    }

    private validateAndNormalizeShapes(shapes: any): Shape[] {
        if (!shapes || !Array.isArray(shapes)) {
            console.warn("Invalid shapes data, using empty array");
            return [];
        }

        return shapes.map(shape => this.validateShape(shape)).filter(shape => shape !== null) as Shape[];
    }

    private validateShape(shape: any): Shape | null {
        if (!shape || typeof shape !== 'object' || !shape.type) {
            console.warn("Invalid shape object:", shape);
            return null;
        }

        try {
            switch (shape.type) {
                case "rect":
                    if (typeof shape.x === 'number' && typeof shape.y === 'number' && 
                        typeof shape.width === 'number' && typeof shape.height === 'number') {
                        return {
                            type: "rect",
                            x: shape.x,
                            y: shape.y,
                            width: shape.width,
                            height: shape.height
                        };
                    }
                    break;
                
                case "circle":
                    if (typeof shape.centerX === 'number' && typeof shape.centerY === 'number' && 
                        typeof shape.radius === 'number') {
                        return {
                            type: "circle",
                            centerX: shape.centerX,
                            centerY: shape.centerY,
                            radius: shape.radius
                        };
                    }
                    break;
                
                case "line":
                    if (typeof shape.startX === 'number' && typeof shape.startY === 'number' && 
                        typeof shape.endX === 'number' && typeof shape.endY === 'number') {
                        return {
                            type: "line",
                            startX: shape.startX,
                            startY: shape.startY,
                            endX: shape.endX,
                            endY: shape.endY
                        };
                    }
                    break;
                
                case "pencil":
                    if (shape.points && Array.isArray(shape.points)) {
                        const validPoints = shape.points.filter((point: any) => 
                            point && typeof point.x === 'number' && typeof point.y === 'number'
                        );
                        if (validPoints.length > 0) {
                            return {
                                type: "pencil",
                                points: validPoints
                            };
                        }
                    }
                    break;
                
                case "eraser":
                    if (typeof shape.x === 'number' && typeof shape.y === 'number' && 
                        typeof shape.width === 'number' && typeof shape.height === 'number') {
                        return {
                            type: "eraser",
                            x: shape.x,
                            y: shape.y,
                            width: shape.width,
                            height: shape.height
                        };
                    }
                    break;
            }
        } catch (error) {
            console.error("Error validating shape:", error, shape);
        }

        console.warn("Invalid shape format:", shape);
        return null;
    }
    
    initHandlers() {
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type == "chat") {
                    try {
                        const parsedShape = JSON.parse(message.message);
                        if (parsedShape && parsedShape.shape) {
                            const validatedShape = this.validateShape(parsedShape.shape);
                            if (validatedShape) {
                                this.existingShapes.push(validatedShape);
                                this.clearCanvas();
                            }
                        }
                    } catch (parseError) {
                        console.error("Error parsing shape message:", parseError);
                    }
                } else if (message.type == "erase") {
                    if (typeof message.x === 'number' && typeof message.y === 'number') {
                        this.existingShapes = this.existingShapes.filter(shape => {
                            return !this.isPointInShape(message.x, message.y, shape);
                        });
                        this.clearCanvas();
                    }
                }
            } catch (error) {
                console.error("Error handling WebSocket message:", error);
            }
        }
    }

    clearCanvas() {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#18181b"; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (!Array.isArray(this.existingShapes)) {
                console.warn("existingShapes is not an array, resetting to empty array");
                this.existingShapes = [];
                return;
            }

            this.existingShapes.forEach((shape, index) => {
                try {
                    if (!shape || !shape.type) {
                        console.warn(`Invalid shape at index ${index}:`, shape);
                        return;
                    }
                    
                    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                    this.ctx.lineWidth = 2;
                    
                    switch (shape.type) {
                        case "rect":
                            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                            break;
                            
                        case "circle":
                            this.ctx.beginPath();
                            this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                            this.ctx.stroke();
                            this.ctx.closePath();
                            break;
                            
                        case "line":
                            this.ctx.save();
                            this.ctx.beginPath();
                            this.ctx.lineWidth = 4;
                            this.ctx.lineCap = "round";
                            this.ctx.moveTo(shape.startX, shape.startY);
                            this.ctx.lineTo(shape.endX, shape.endY);
                            this.ctx.stroke();
                            this.ctx.restore();
                            break;
                            
                        case "pencil":
                            if (shape.points && Array.isArray(shape.points) && shape.points.length > 1) {
                                this.drawSmoothPencilStroke(shape.points);
                            }
                            break;
                            
                        default:
                            console.warn(`Unknown shape type: ${shape.type}`);
                    }
                } catch (drawError) {
                    console.error(`Error drawing shape at index ${index}:`, drawError, shape);
                }
            });
        } catch (error) {
            console.error("Error in clearCanvas:", error);
        }
    }

    // Smooth pencil stroke rendering
    private drawSmoothPencilStroke(points: { x: number; y: number }[]) {
        if (points.length < 2) return;

        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        
        this.ctx.beginPath();
        
        if (points.length === 2) {
            // For just two points, draw a straight line
            this.ctx.moveTo(points[0].x, points[0].y);
            this.ctx.lineTo(points[1].x, points[1].y);
        } else {
            // For multiple points, use smoother curves
            this.ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length - 1; i++) {
                const currentPoint = points[i];
                const nextPoint = points[i + 1];
                
                const controlX = currentPoint.x;
                const controlY = currentPoint.y;
                const endX = (currentPoint.x + nextPoint.x) / 2;
                const endY = (currentPoint.y + nextPoint.y) / 2;
                
                this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
            }
            
            // Draw the last point
            const lastPoint = points[points.length - 1];
            this.ctx.lineTo(lastPoint.x, lastPoint.y);
        }
        
        this.ctx.stroke();
    }

    private getMousePos(e: MouseEvent): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    mouseDownHandler = (e: MouseEvent) => {
        try {
            const pos = this.getMousePos(e);
            this.isDrawing = true;
            this.startX = pos.x;
            this.startY = pos.y;
            this.lastX = pos.x;
            this.lastY = pos.y;
            
            if (this.selectedTool === "eraser") {
                this.eraseShapeAt(pos.x, pos.y);
            } else if (this.selectedTool === "pencil") {
                this.currentPencilPoints = [{ x: pos.x, y: pos.y }];
            }
        } catch (error) {
            console.error("Error in mouseDownHandler:", error);
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        try {
            if (!this.isDrawing) return;
            
            const pos = this.getMousePos(e);
            this.isDrawing = false;
            
            const width = pos.x - this.startX;
            const height = pos.y - this.startY;
            
            let shape: Shape | null = null;
            
            switch (this.selectedTool) {
                case "rect":
                    shape = {
                        type: "rect",
                        x: this.startX,
                        y: this.startY,
                        width: width,
                        height: height
                    };
                    break;
                    
                case "circle":
                    const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                    shape = {
                        type: "circle",
                        centerX: this.startX + width / 2,
                        centerY: this.startY + height / 2,
                        radius: radius
                    };
                    break;
                    
                case "line":
                    if (this.startX !== pos.x || this.startY !== pos.y) {
                        shape = {
                            type: "line",
                            startX: this.startX,
                            startY: this.startY,
                            endX: pos.x,
                            endY: pos.y
                        };
                        console.log("Line shape created:", shape);
                    } else {
                        console.log("Line not created: start and end points are the same");
                    }
                    break;
                
                case "pencil":
                    if (this.currentPencilPoints.length > 1) {
                        shape = {
                            type: "pencil",
                            points: [...this.currentPencilPoints]
                        };
                    }
                    this.currentPencilPoints = [];
                    break;
            }

            if (shape) {
                this.existingShapes.push(shape);
                this.clearCanvas();
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape }),
                    roomId: this.roomId
                }));
            }
        } catch (error) {
            console.error("Error in mouseUpHandler:", error);
        }
    }

    mouseMoveHandler = (e: MouseEvent) => {
        try {
            if (!this.isDrawing) return;
            
            const pos = this.getMousePos(e);
            
            if (this.selectedTool === "eraser") {
                this.eraseShapeAt(pos.x, pos.y);
                return;
            }
            
            if (this.selectedTool === "pencil") {
                // Add point only if it's far enough from the last point for smoother drawing
                const distance = Math.sqrt(
                    Math.pow(pos.x - this.lastX, 2) + Math.pow(pos.y - this.lastY, 2)
                );
                
                if (distance > 1) { // Reduced threshold for smoother drawing
                    this.currentPencilPoints.push({ x: pos.x, y: pos.y });
                    this.lastX = pos.x;
                    this.lastY = pos.y;
                    
                    // Redraw everything including current stroke
                    this.clearCanvas();
                    
                    // Draw current pencil stroke in progress
                    if (this.currentPencilPoints.length > 1) {
                        this.drawSmoothPencilStroke(this.currentPencilPoints);
                    }
                }
                return;
            }
            
            // For other tools, show preview
            const width = pos.x - this.startX;
            const height = pos.y - this.startY;
            
            this.clearCanvas();
            
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
            this.ctx.lineWidth = 2;
            
            switch (this.selectedTool) {
                case "rect":
                    this.ctx.strokeRect(this.startX, this.startY, width, height);
                    break;
                    
                case "circle":
                    const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                    const centerX = this.startX + width / 2;
                    const centerY = this.startY + height / 2;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.closePath();
                    break;
                    
                case "line":
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.lineWidth = 4;
                    this.ctx.lineCap = "round";
                    this.ctx.moveTo(this.startX, this.startY);
                    this.ctx.lineTo(pos.x, pos.y);
                    this.ctx.stroke();
                    this.ctx.restore();
                    break;
            }
        } catch (error) {
            console.error("Error in mouseMoveHandler:", error);
        }
    }

    mouseLeaveHandler = (e: MouseEvent) => {
        // End drawing when mouse leaves canvas
        if (this.isDrawing) {
            this.mouseUpHandler(e);
        }
    }

    private eraseShapeAt(x: number, y: number) {
        try {
            const initialCount = this.existingShapes.length;
            
            this.existingShapes = this.existingShapes.filter(shape => {
                return !this.isPointInShape(x, y, shape);
            });
            
            if (this.existingShapes.length < initialCount) {
                this.clearCanvas();
                this.socket.send(JSON.stringify({
                    type: "erase",
                    x: x,
                    y: y,
                    roomId: this.roomId
                }));
            }
        } catch (error) {
            console.error("Error in eraseShapeAt:", error);
        }
    }

    private isPointInShape(x: number, y: number, shape: Shape): boolean {
        try {
            if (!shape || !shape.type) return false;
            
            switch (shape.type) {
                case "rect":
                    return x >= shape.x && x <= shape.x + shape.width &&
                           y >= shape.y && y <= shape.y + shape.height;
                           
                case "circle":
                    const distance = Math.sqrt(
                        Math.pow(x - shape.centerX, 2) + Math.pow(y - shape.centerY, 2)
                    );
                    return distance <= shape.radius;
                    
                case "line":
                    const A = shape.endY - shape.startY;
                    const B = shape.startX - shape.endX;
                    const C = shape.endX * shape.startY - shape.startX * shape.endY;
                    const lineDistance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
                    return lineDistance <= 5;
                    
                case "pencil":
                    if (!shape.points || !Array.isArray(shape.points)) return false;
                    for (let i = 0; i < shape.points.length - 1; i++) {
                        const p1 = shape.points[i];
                        const p2 = shape.points[i + 1];
                        
                        if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p1.y !== 'number' || 
                            typeof p2.x !== 'number' || typeof p2.y !== 'number') {
                            continue;
                        }
                        
                        const A = p2.y - p1.y;
                        const B = p1.x - p2.x;
                        const C = p2.x * p1.y - p1.x * p2.y;
                        const segmentDistance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
                        
                        const minX = Math.min(p1.x, p2.x) - 5;
                        const maxX = Math.max(p1.x, p2.x) + 5;
                        const minY = Math.min(p1.y, p2.y) - 5;
                        const maxY = Math.max(p1.y, p2.y) + 5;
                        
                        if (segmentDistance <= 5 && x >= minX && x <= maxX && y >= minY && y <= maxY) {
                            return true;
                        }
                    }
                    return false;
                    
                default:
                    return false;
            }
        } catch (error) {
            console.error("Error in isPointInShape:", error);
            return false;
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("mouseleave", this.mouseLeaveHandler);
        this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    }
}