/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import axios from "axios";
import { HTTP_BACKEND } from "@/config";
 export type ShapeWithId = {
    id: string | number;
    shape: Shape;
}
 export type Shape = {
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
    private existingShapes: ShapeWithId[] = [];
    private roomId: string;
    private isDrawing: boolean = false;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private currentPencilPoints: { x: number; y: number }[] = [];
    private lastX = 0;
    private lastY = 0;
    socket: WebSocket;
    private multiSelectRect: { x: number; y: number; width: number; height: number } | null = null;
    private selectedShapeIds: Set<string | number> = new Set();
    private isDraggingSelection: boolean = false;
    private isMovingSelection: boolean = false;
    private dragOffset: { x: number; y: number } | null = null;
    private lastDragPos: { x: number; y: number } | null = null;

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
            case "multi-select":
                this.canvas.style.cursor = "crosshair";
                break;
            default:
                this.canvas.style.cursor = "crosshair";
        }
    }

    async init() {
        try {
            const shapes = await getExistingShapes(this.roomId);
            this.existingShapes = shapes; // shapes are now always { id, shape }
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
                            // Add with id if present
                            if (message.messageId) {
                                this.existingShapes.push({ id: message.messageId, shape: parsedShape.shape });
                            } else {
                                // fallback for legacy
                                this.existingShapes.push({ id: Date.now(), shape: parsedShape.shape });
                            }
                            this.clearCanvas();
                        }
                    } catch (parseError) {
                        console.error("Error parsing shape message:", parseError);
                    }
                } else if (message.type == "shapeDeleted") {
                    // Remove by id
                    this.existingShapes = this.existingShapes.filter(item => item.id !== message.messageId);
                    this.clearCanvas();
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
                    if (!shape || !shape.shape || !shape.shape.type) {
                        console.warn(`Invalid shape at index ${index}:`, shape);
                        return;
                    }
                    // Highlight if selected
                    if (this.selectedShapeIds.has(shape.id)) {
                        this.ctx.save();
                        this.ctx.strokeStyle = "#00bfff";
                        this.ctx.lineWidth = 4;
                        this.ctx.shadowColor = "#00bfff";
                        this.ctx.shadowBlur = 8;
                    } else {
                        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                        this.ctx.lineWidth = 2;
                        this.ctx.shadowBlur = 0;
                    }
                    
                    switch (shape.shape.type) {
                        case "rect":
                            this.ctx.strokeRect(shape.shape.x, shape.shape.y, shape.shape.width, shape.shape.height);
                            break;
                        case "circle":
                            this.ctx.beginPath();
                            this.ctx.arc(shape.shape.centerX, shape.shape.centerY, Math.abs(shape.shape.radius), 0, Math.PI * 2);
                            this.ctx.stroke();
                            this.ctx.closePath();
                            break;
                        case "line":
                            this.ctx.save();
                            this.ctx.beginPath();
                            this.ctx.lineWidth = 4;
                            this.ctx.lineCap = "round";
                            this.ctx.moveTo(shape.shape.startX, shape.shape.startY);
                            this.ctx.lineTo(shape.shape.endX, shape.shape.endY);
                            this.ctx.stroke();
                            this.ctx.restore();
                            break;
                        case "pencil":
                            if (shape.shape.points && Array.isArray(shape.shape.points) && shape.shape.points.length > 1) {
                                this.drawSmoothPencilStroke(shape.shape.points);
                            }
                            break;
                        default:
                            console.warn(`Unknown shape type: ${shape.shape.type}`);
                    }
                    if (this.selectedShapeIds.has(shape.id)) {
                        this.ctx.restore();
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
            } else if (this.selectedTool === "multi-select") {
                // If any selected shape is under the mouse, start moving
                let clickedSelectedShape = false;
                for (const item of this.existingShapes) {
                    if (this.selectedShapeIds.has(item.id) && this.isPointInShape(pos.x, pos.y, item.shape)) {
                        clickedSelectedShape = true;
                        break;
                    }
                }
                if (clickedSelectedShape && this.selectedShapeIds.size > 0) {
                    this.isMovingSelection = true;
                    this.isDraggingSelection = false;
                    this.dragOffset = { x: pos.x, y: pos.y };
                    this.lastDragPos = { x: pos.x, y: pos.y };
                } else {
                    // Start new selection
                    this.isDraggingSelection = true;
                    this.isMovingSelection = false;
                    this.multiSelectRect = { x: pos.x, y: pos.y, width: 0, height: 0 };
                    this.selectedShapeIds.clear();
                    this.clearCanvas();
                }
            }
        } catch (error) {
            console.error("Error in mouseDownHandler:", error);
        }
    }

    mouseUpHandler = (e: MouseEvent) => {
        try {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            const pos = this.getMousePos(e);
            if (this.selectedTool === "multi-select") {
                if (this.isDraggingSelection) {
                    // Finalize selection
                    this.clearCanvas();
                    this.multiSelectRect = this.multiSelectRect; // keep for moving
                    this.isDraggingSelection = false;
                } else if (this.isMovingSelection) {
                    // Finalize move
                    this.clearCanvas();
                    this.isMovingSelection = false;
                    this.dragOffset = null;
                    this.lastDragPos = null;
                }
                return;
            }
            
            const width = pos.x - this.startX;
            const height = pos.y - this.startY;
            
            let shape: ShapeWithId | null = null;
            
            switch (this.selectedTool) {
                case "rect":
                    shape = {
                        id: Date.now(), // Assign a new ID
                        shape: {
                            type: "rect",
                            x: this.startX,
                            y: this.startY,
                            width: width,
                            height: height
                        }
                    };
                    break;
                    
                case "circle":
                    const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
                    shape = {
                        id: Date.now(), // Assign a new ID
                        shape: {
                            type: "circle",
                            centerX: this.startX + width / 2,
                            centerY: this.startY + height / 2,
                            radius: radius
                        }
                    };
                    break;
                    
                case "line":
                    if (this.startX !== pos.x || this.startY !== pos.y) {
                        shape = {
                            id: Date.now(), // Assign a new ID
                            shape: {
                                type: "line",
                                startX: this.startX,
                                startY: this.startY,
                                endX: pos.x,
                                endY: pos.y
                            }
                        };
                        console.log("Line shape created:", shape);
                    } else {
                        console.log("Line not created: start and end points are the same");
                    }
                    break;
                
                case "pencil":
                    if (this.currentPencilPoints.length > 1) {
                        shape = {
                            id: Date.now(), // Assign a new ID
                            shape: {
                                type: "pencil",
                                points: [...this.currentPencilPoints]
                            }
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
                    message: JSON.stringify({ shape: shape.shape }),
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
            // Multi-select dragging selection rectangle
            if (this.selectedTool === "multi-select" && this.isDraggingSelection && this.multiSelectRect) {
                this.multiSelectRect.width = pos.x - this.startX;
                this.multiSelectRect.height = pos.y - this.startY;
                this.clearCanvas();
                // Draw selection rectangle
                this.ctx.save();
                this.ctx.strokeStyle = "#00bfff";
                this.ctx.setLineDash([6]);
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(this.multiSelectRect.x, this.multiSelectRect.y, this.multiSelectRect.width, this.multiSelectRect.height);
                this.ctx.restore();
                // Highlight shapes inside selection
                this.selectedShapeIds.clear();
                const rect = this.getNormalizedRect(this.multiSelectRect);
                for (const item of this.existingShapes) {
                    if (this.isShapeInRect(item.shape, rect)) {
                        this.selectedShapeIds.add(item.id);
                    }
                }
                return;
            }
            // Multi-select moving selected shapes
            if (this.selectedTool === "multi-select" && this.isMovingSelection && this.dragOffset && this.lastDragPos) {
                const dx = pos.x - this.lastDragPos.x;
                const dy = pos.y - this.lastDragPos.y;
                // Move all selected shapes
                for (const item of this.existingShapes) {
                    if (this.selectedShapeIds.has(item.id)) {
                        this.moveShape(item.shape, dx, dy);
                    }
                }
                // Move the selection rectangle as well
                if (this.multiSelectRect) {
                    this.multiSelectRect.x += dx;
                    this.multiSelectRect.y += dy;
                }
                this.lastDragPos = { x: pos.x, y: pos.y };
                this.clearCanvas();
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
        for (const item of this.existingShapes) {
            const shape = item.shape;
            if (this.isPointInShape(x, y, shape as Shape)) {
                if (item.id) {
                    console.log("Sending deleteShape for id", item.id);
                    this.socket.send(JSON.stringify({
                        type: "deleteShape",
                        messageId: Number(item.id),
                        roomId: this.roomId
                    }));
                }
                // Do not remove locally yet! Wait for 'shapeDeleted' event
                break; // Only delete one shape at that point
            }
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

    private getNormalizedRect(rect: { x: number; y: number; width: number; height: number }) {
        const x = rect.width < 0 ? rect.x + rect.width : rect.x;
        const y = rect.height < 0 ? rect.y + rect.height : rect.y;
        const width = Math.abs(rect.width);
        const height = Math.abs(rect.height);
        return { x, y, width, height };
    }

    private isShapeInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
        switch (shape.type) {
            case "rect":
                return (
                    shape.x >= rect.x &&
                    shape.x + shape.width <= rect.x + rect.width &&
                    shape.y >= rect.y &&
                    shape.y + shape.height <= rect.y + rect.height
                );
            case "circle":
                return (
                    shape.centerX - shape.radius >= rect.x &&
                    shape.centerX + shape.radius <= rect.x + rect.width &&
                    shape.centerY - shape.radius >= rect.y &&
                    shape.centerY + shape.radius <= rect.y + rect.height
                );
            case "line":
                return (
                    shape.startX >= rect.x && shape.startX <= rect.x + rect.width &&
                    shape.startY >= rect.y && shape.startY <= rect.y + rect.height &&
                    shape.endX >= rect.x && shape.endX <= rect.x + rect.width &&
                    shape.endY >= rect.y && shape.endY <= rect.y + rect.height
                );
            case "pencil":
                if (!shape.points || !Array.isArray(shape.points)) return false;
                return shape.points.every(point =>
                    point.x >= rect.x && point.x <= rect.x + rect.width &&
                    point.y >= rect.y && point.y <= rect.y + rect.height
                );
            default:
                return false;
        }
    }

    private isPointInRect(pos: { x: number; y: number }, rect: { x: number; y: number; width: number; height: number }) {
        return (
            pos.x >= rect.x &&
            pos.x <= rect.x + rect.width &&
            pos.y >= rect.y &&
            pos.y <= rect.y + rect.height
        );
    }

    private moveShape(shape: Shape, dx: number, dy: number) {
        switch (shape.type) {
            case "rect":
                shape.x += dx;
                shape.y += dy;
                break;
            case "circle":
                shape.centerX += dx;
                shape.centerY += dy;
                break;
            case "line":
                shape.startX += dx;
                shape.startY += dy;
                shape.endX += dx;
                shape.endY += dy;
                break;
            case "pencil":
                if (shape.points && Array.isArray(shape.points)) {
                    for (const pt of shape.points) {
                        pt.x += dx;
                        pt.y += dy;
                    }
                }
                break;
        }
    }
}