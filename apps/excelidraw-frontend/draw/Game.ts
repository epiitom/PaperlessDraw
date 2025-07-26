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
} | {
    type: "text";
    x: number;
    y: number;
    content: string;
    fontSize: number;
    fontFamily: string;
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
    socket: WebSocket;
    private multiSelectRect: { x: number; y: number; width: number; height: number } | null = null;
    private selectedShapeIds: Set<string | number> = new Set();
    private isDraggingSelection: boolean = false;
    private isMovingSelection: boolean = false;
    private dragOffset: { x: number; y: number } | null = null;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private minScale: number = 0.1;
    private maxScale: number = 5;
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    
    // Text tool properties
    private textInput: HTMLInputElement | null = null;
    private isEditingText: boolean = false;
    private textEditPosition: { x: number; y: number } | null = null;

    // Zoom controls
    private zoomControls: HTMLDivElement | null = null;
    private onZoomChange?: (zoom: number) => void;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roomId = roomId;
        this.socket = socket;
        
        // Set canvas style
        this.canvas.style.cursor = "crosshair";
        this.canvas.style.display = "block";
        this.canvas.style.background = "#18181b"; // Keep original dark background
        
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
        this.createZoomControls();
    }

    // Simplified zoom controls - positioned on the bottom right
    private createZoomControls() {
        this.zoomControls = document.createElement("div");
        this.zoomControls.style.position = "fixed";
        this.zoomControls.style.bottom = "20px";
        this.zoomControls.style.right = "20px";
        this.zoomControls.style.display = "flex";
        this.zoomControls.style.alignItems = "center";
        this.zoomControls.style.gap = "8px";
        this.zoomControls.style.backgroundColor = "white";
        this.zoomControls.style.padding = "8px 12px";
        this.zoomControls.style.borderRadius = "8px";
        this.zoomControls.style.border = "1px solid #e9ecef";
        this.zoomControls.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
        this.zoomControls.style.zIndex = "1000";
        this.zoomControls.style.fontSize = "14px";

        // Zoom out button
        const zoomOutBtn = document.createElement("button");
        zoomOutBtn.textContent = "−";
        zoomOutBtn.style.cssText = `
            width: 28px; height: 28px;
            background: #f8f9fa; color: #495057;
            border: 1px solid #dee2e6; border-radius: 4px;
            cursor: pointer; font-size: 16px; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
        `;
        zoomOutBtn.onclick = () => this.zoomByPercent(80);

        // Zoom display
        const zoomDisplay = document.createElement("div");
        zoomDisplay.style.color = "#495057";
        zoomDisplay.style.fontSize = "13px";
        zoomDisplay.style.minWidth = "45px";
        zoomDisplay.style.textAlign = "center";
        zoomDisplay.id = "zoom-display";
        zoomDisplay.textContent = `${Math.round(this.scale * 100)}%`;

        // Zoom in button
        const zoomInBtn = document.createElement("button");
        zoomInBtn.textContent = "+";
        zoomInBtn.style.cssText = `
            width: 28px; height: 28px;
            background: #f8f9fa; color: #495057;
            border: 1px solid #dee2e6; border-radius: 4px;
            cursor: pointer; font-size: 16px; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
        `;
        zoomInBtn.onclick = () => this.zoomByPercent(125);

        // Reset zoom button
        const resetBtn = document.createElement("button");
        resetBtn.textContent = "100%";
        resetBtn.style.cssText = `
            padding: 4px 8px; background: #f8f9fa; color: #495057;
            border: 1px solid #dee2e6; border-radius: 4px;
            cursor: pointer; font-size: 12px;
        `;
        resetBtn.onclick = () => this.setZoomPercent(100);

        this.zoomControls.appendChild(zoomOutBtn);
        this.zoomControls.appendChild(zoomDisplay);
        this.zoomControls.appendChild(zoomInBtn);
        this.zoomControls.appendChild(resetBtn);

        document.body.appendChild(this.zoomControls);
    }

    private zoomByPercent(percentage: number) {
        const newScale = this.scale * (percentage / 100);
        this.setZoom(newScale);
    }

    public setZoomPercent(percentage: number) {
        const newScale = percentage / 100;
        this.setZoom(newScale);
    }

    private setZoom(newScale: number) {
        const clampedScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
        
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const worldX = (centerX - this.offsetX) / this.scale;
        const worldY = (centerY - this.offsetY) / this.scale;
        
        this.scale = clampedScale;
        
        this.offsetX = centerX - worldX * this.scale;
        this.offsetY = centerY - worldY * this.scale;
        
        this.updateZoomDisplay();
        this.clearCanvas();
        
        if (this.onZoomChange) {
            this.onZoomChange(this.scale);
        }
    }

    private updateZoomDisplay() {
        const display = document.getElementById("zoom-display");
        if (display) {
            display.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    public setOnZoomChange(callback: (zoom: number) => void) {
        this.onZoomChange = callback;
    }
          
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.removeEventListener("mouseleave", this.mouseLeaveHandler);
        this.canvas.removeEventListener("wheel", this.wheelHandler);
        
        this.cleanupTextInput();
        
        if (this.zoomControls && this.zoomControls.parentNode) {
            this.zoomControls.parentNode.removeChild(this.zoomControls);
        }
    }
     
    setTool(tool: Tool) {
        this.selectedTool = tool;
        console.log("Tool changed to:", tool);
        
        if (tool !== "text") {
            this.cleanupTextInput();
        }
        
        // Update cursor based on tool
        switch (tool) {
            case "pencil":
                this.canvas.style.cursor = "crosshair";
                break;
            case "eraser":
                this.canvas.style.cursor = "crosshair";
                break;
            case "multi-select":
                this.canvas.style.cursor = "default";
                break;
            case "text":
                this.canvas.style.cursor = "text";
                break;
            default:
                this.canvas.style.cursor = "crosshair";
        }
    }

    async init() {
        try {
            const shapes = await getExistingShapes(this.roomId);
            this.existingShapes = shapes;
            console.log("Loaded shapes:", this.existingShapes);
            this.clearCanvas();
        } catch (error) {
            console.error("Failed to load existing shapes:", error);
            this.existingShapes = [];
            this.clearCanvas();
        }
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
                
                case "text":
                    if (typeof shape.x === 'number' && typeof shape.y === 'number' && 
                        typeof shape.content === 'string') {
                        return {
                            type: "text",
                            x: shape.x,
                            y: shape.y,
                            content: shape.content,
                            fontSize: typeof shape.fontSize === 'number' ? shape.fontSize : 20,
                            fontFamily: typeof shape.fontFamily === 'string' ? shape.fontFamily : 'Arial'
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

                if (message.type === "chat" || message.type === "chats") {
                    try {
                        const parsedShape = JSON.parse(message.message);
                        if (parsedShape && parsedShape.shape) {
                            if (message.messageId) {
                                this.existingShapes.push({ id: message.messageId, shape: parsedShape.shape });
                            } else {
                                this.existingShapes.push({ id: Date.now(), shape: parsedShape.shape });
                            }
                            this.clearCanvas();
                        }
                    } catch (parseError) {
                        console.error("Error parsing shape message:", parseError);
                    }
                } else if (message.type === "shapeDeleted") {
                    // Handle shape deletion from server
                    this.existingShapes = this.existingShapes.filter(item => item.id !== message.messageId);
                    this.selectedShapeIds.delete(message.messageId);
                    this.clearCanvas();
                } else if (message.type === "deleteShape") {
                    // Alternative deletion message format
                    if (message.shapeId) {
                        this.existingShapes = this.existingShapes.filter(item => item.id !== message.shapeId);
                        this.selectedShapeIds.delete(message.shapeId);
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
            // Clear entire canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dark background (keep original)
            this.ctx.fillStyle = "#18181b"; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Apply transformations
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);

            if (!Array.isArray(this.existingShapes)) {
                console.warn("existingShapes is not an array, resetting to empty array");
                this.existingShapes = [];
                this.ctx.restore();
                return;
            }

            this.existingShapes.forEach((shape, index) => {
                try {
                    if (!shape || !shape.shape || !shape.shape.type) {
                        console.warn(`Invalid shape at index ${index}:`, shape);
                        return;
                    }
                    
                    // Set original white color and selection highlighting
                    const isSelected = this.selectedShapeIds.has(shape.id);
                    
                    this.ctx.strokeStyle = isSelected ? "#00bfff" : "rgba(255, 255, 255, 0.9)";
                    this.ctx.fillStyle = isSelected ? "#00bfff" : "rgba(255, 255, 255, 0.9)";
                    this.ctx.lineWidth = isSelected ? 3 : 2;
                    
                    if (isSelected) {
                        this.ctx.shadowColor = "#00bfff";
                        this.ctx.shadowBlur = 4;
                    } else {
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
                            this.ctx.beginPath();
                            this.ctx.lineWidth = isSelected ? 4 : 3;
                            this.ctx.lineCap = "round";
                            this.ctx.moveTo(shape.shape.startX, shape.shape.startY);
                            this.ctx.lineTo(shape.shape.endX, shape.shape.endY);
                            this.ctx.stroke();
                            break;
                        case "pencil":
                            if (shape.shape.points && Array.isArray(shape.shape.points) && shape.shape.points.length > 1) {
                                this.drawSmoothPencilStroke(shape.shape.points, isSelected);
                            }
                            break;
                        case "text":
                            this.drawText(shape.shape, isSelected);
                            break;
                        default:
                            console.warn(`Unknown shape type: ${shape.shape.type}`);
                    }
                } catch (drawError) {
                    console.error(`Error drawing shape at index ${index}:`, drawError, shape);
                }
            });
            
            this.ctx.restore();
        } catch (error) {
            console.error("Error in clearCanvas:", error);
            this.ctx.restore();
        }
    }

    // Draw text with proper scaling
    private drawText(textShape: Extract<Shape, { type: "text" }>, isSelected: boolean = false) {
        this.ctx.save();
        
        // Fixed font size regardless of zoom for better readability
        const fontSize = 20; // Fixed size
        this.ctx.fillStyle = isSelected ? "#00bfff" : "rgba(255, 255, 255, 0.9)";
        this.ctx.font = `${fontSize}px ${textShape.fontFamily}`;
        this.ctx.textBaseline = "top";
        this.ctx.fillText(textShape.content, textShape.x, textShape.y);
        
        this.ctx.restore();
    }

    // Smooth pencil stroke rendering
    private drawSmoothPencilStroke(points: { x: number; y: number }[], isSelected: boolean = false) {
        if (points.length < 2) return;

        this.ctx.strokeStyle = isSelected ? "#00bfff" : "rgba(255, 255, 255, 0.9)";
        this.ctx.lineWidth = isSelected ? 4 : 3;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        
        this.ctx.beginPath();
        
        if (points.length === 2) {
            this.ctx.moveTo(points[0].x, points[0].y);
            this.ctx.lineTo(points[1].x, points[1].y);
        } else {
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
            
            const lastPoint = points[points.length - 1];
            this.ctx.lineTo(lastPoint.x, lastPoint.y);
        }
        
        this.ctx.stroke();
    }

    // Create and position text input
    private createTextInput(x: number, y: number) {
        this.cleanupTextInput();
        
        this.textInput = document.createElement("input");
        this.textInput.type = "text";
        this.textInput.placeholder = "Type here...";
        
        // Style the input (keep original styling)
        this.textInput.style.position = "absolute";
        this.textInput.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.textInput.style.color = "white";
        this.textInput.style.border = "2px solid #00bfff";
        this.textInput.style.borderRadius = "4px";
        this.textInput.style.padding = "4px 8px";
        this.textInput.style.fontSize = "20px";
        this.textInput.style.fontFamily = "Arial";
        this.textInput.style.zIndex = "1000";
        this.textInput.style.outline = "none";
        this.textInput.style.minWidth = "100px";
        
        // Position the input
        const rect = this.canvas.getBoundingClientRect();
        const screenX = x * this.scale + this.offsetX + rect.left;
        const screenY = y * this.scale + this.offsetY + rect.top;
        
        this.textInput.style.left = `${screenX}px`;
        this.textInput.style.top = `${screenY}px`;
        
        document.body.appendChild(this.textInput);
        
        setTimeout(() => {
            this.textInput?.focus();
            this.textInput?.select();
        }, 0);
        
        this.textInput.addEventListener("keydown", this.handleTextInputKeydown);
        this.textInput.addEventListener("blur", this.handleTextInputBlur);
        
        this.isEditingText = true;
        this.textEditPosition = { x, y };
    }

    private handleTextInputKeydown = (e: KeyboardEvent) => {
        e.stopPropagation();
        
        if (e.key === "Enter") {
            e.preventDefault();
            this.finishTextInput();
        } else if (e.key === "Escape") {
            e.preventDefault();
            this.cleanupTextInput();
        }
    }

    private handleTextInputBlur = () => {
        setTimeout(() => {
            if (this.textInput && document.activeElement !== this.textInput) {
                this.finishTextInput();
            }
        }, 100);
    }

    private finishTextInput() {
        if (!this.textInput || !this.textEditPosition) return;
        
        const content = this.textInput.value.trim();
        if (content) {
            const textShape: Shape = {
                type: "text",
                x: this.textEditPosition.x,
                y: this.textEditPosition.y,
                content: content,
                fontSize: 20,
                fontFamily: "Arial"
            };
            
            const shapeWithId: ShapeWithId = {
                id: Date.now(),
                shape: textShape
            };
            
            this.existingShapes.push(shapeWithId);
            this.clearCanvas();
            
            // Send to server
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: textShape }),
                roomId: this.roomId
            }));
        }
        
        this.cleanupTextInput();
    }

    private cleanupTextInput() {
        if (this.textInput) {
            this.textInput.removeEventListener("keydown", this.handleTextInputKeydown);
            this.textInput.removeEventListener("blur", this.handleTextInputBlur);
            if (this.textInput.parentNode) {
                this.textInput.parentNode.removeChild(this.textInput);
            }
            this.textInput = null;
        }
        this.isEditingText = false;
        this.textEditPosition = null;
    }

    // Initialize mouse event handlers
    private initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("mouseleave", this.mouseLeaveHandler);
        this.canvas.addEventListener("wheel", this.wheelHandler);
    }

    // Mouse down handler
    private mouseDownHandler = (e: MouseEvent) => {
        if (this.isEditingText) return;

        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        const worldX = (clientX - this.offsetX) / this.scale;
        const worldY = (clientY - this.offsetY) / this.scale;

        // Space bar or middle mouse for panning
        if (e.button === 1 || e.shiftKey) {
            this.isDragging = true;
            this.lastMouseX = clientX;
            this.lastMouseY = clientY;
            this.canvas.style.cursor = "grabbing";
            e.preventDefault();
            return;
        }

        if (this.selectedTool === "text") {
            this.createTextInput(worldX, worldY);
            return;
        }

        if (this.selectedTool === "multi-select") {
            const clickedShapeId = this.getShapeAtPosition(worldX, worldY);
            
            if (clickedShapeId && this.selectedShapeIds.has(clickedShapeId)) {
                this.isDraggingSelection = true;
                this.isMovingSelection = true;
                this.dragOffset = { x: worldX, y: worldY };
                this.canvas.style.cursor = "grabbing";
            } else {
                this.multiSelectRect = { x: worldX, y: worldY, width: 0, height: 0 };
                this.isDraggingSelection = false;
                this.isMovingSelection = false;
                
                if (!e.shiftKey) {
                    this.selectedShapeIds.clear();
                }
            }
        } else {
            this.isDrawing = true;
            this.startX = worldX;
            this.startY = worldY;

            if (this.selectedTool === "pencil") {
                this.currentPencilPoints = [{ x: worldX, y: worldY }];
            }
        }
    }

    // Mouse move handler
    private mouseMoveHandler = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        const worldX = (clientX - this.offsetX) / this.scale;
        const worldY = (clientY - this.offsetY) / this.scale;

        if (this.isDragging) {
            const deltaX = clientX - this.lastMouseX;
            const deltaY = clientY - this.lastMouseY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastMouseX = clientX;
            this.lastMouseY = clientY;
            
            this.clearCanvas();
            return;
        }

        if (this.selectedTool === "multi-select") {
            if (this.multiSelectRect && !this.isMovingSelection) {
                this.multiSelectRect.width = worldX - this.multiSelectRect.x;
                this.multiSelectRect.height = worldY - this.multiSelectRect.y;
                this.drawMultiSelectPreview();
            } else if (this.isDraggingSelection && this.isMovingSelection && this.dragOffset) {
                const deltaX = worldX - this.dragOffset.x;
                const deltaY = worldY - this.dragOffset.y;
                
                this.moveSelectedShapes(deltaX, deltaY);
                this.dragOffset = { x: worldX, y: worldY };
            }
            return;
        }

        if (!this.isDrawing) return;

        if (this.selectedTool === "pencil") {
            this.currentPencilPoints.push({ x: worldX, y: worldY });
            this.drawPencilPreview();
        } else {
            this.drawPreview(worldX, worldY);
        }
    }

    // Mouse up handler
    private mouseUpHandler = (e: MouseEvent) => {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvas.style.cursor = this.selectedTool === "multi-select" ? "default" : "crosshair";
            return;
        }

        if (this.selectedTool === "multi-select") {
            if (this.multiSelectRect && !this.isMovingSelection) {
                this.finishMultiSelect();
            } else if (this.isDraggingSelection && this.isMovingSelection) {
                this.finishMoveSelection();
            }
            this.isDraggingSelection = false;
            this.isMovingSelection = false;
            this.canvas.style.cursor = "default";
            return;
        }

        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        const worldX = (clientX - this.offsetX) / this.scale;
        const worldY = (clientY - this.offsetY) / this.scale;

        this.finishDrawing(worldX, worldY);
        this.isDrawing = false;
    }

    // Mouse leave handler
    private mouseLeaveHandler = () => {
        if (this.isDrawing && this.selectedTool === "pencil" && this.currentPencilPoints.length > 1) {
            this.finishPencilDrawing();
        }
        this.isDrawing = false;
        this.isDragging = false;
        this.isDraggingSelection = false;
        this.isMovingSelection = false;
    }

    // Wheel handler for zooming
    private wheelHandler = (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) return;
        
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX - this.offsetX) / this.scale;
        const worldY = (mouseY - this.offsetY) / this.scale;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * zoomFactor));
        
        this.scale = newScale;
        
        this.offsetX = mouseX - worldX * this.scale;
        this.offsetY = mouseY - worldY * this.scale;
        
        this.updateZoomDisplay();
        this.clearCanvas();
    }

    // Get shape at position for selection
    private getShapeAtPosition(x: number, y: number): string | number | null {
        for (let i = this.existingShapes.length - 1; i >= 0; i--) {
            const shapeWithId = this.existingShapes[i];
            const shape = shapeWithId.shape;
            
            if (this.isPointInShape(x, y, shape)) {
                return shapeWithId.id;
            }
        }
        return null;
    }

    // Check if point is inside shape
    private isPointInShape(x: number, y: number, shape: Shape): boolean {
        const tolerance = 8;
        
        switch (shape.type) {
            case "rect":
                return x >= shape.x - tolerance && x <= shape.x + shape.width + tolerance &&
                       y >= shape.y - tolerance && y <= shape.y + shape.height + tolerance;
            
            case "circle":
                const distance = Math.sqrt(Math.pow(x - shape.centerX, 2) + Math.pow(y - shape.centerY, 2));
                return distance <= Math.abs(shape.radius) + tolerance;
            
            case "line":
                return this.distanceToLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY) <= tolerance;
            
            case "pencil":
                if (!shape.points || shape.points.length < 2) return false;
                for (let i = 0; i < shape.points.length - 1; i++) {
                    const p1 = shape.points[i];
                    const p2 = shape.points[i + 1];
                    if (this.distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y) <= tolerance) {
                        return true;
                    }
                }
                return false;
            
            case "text":
                const textWidth = shape.content.length * shape.fontSize * 0.6;
                const textHeight = shape.fontSize;
                return x >= shape.x - tolerance && x <= shape.x + textWidth + tolerance &&
                       y >= shape.y - tolerance && y <= shape.y + textHeight + tolerance;
            
            case "eraser":
                return x >= shape.x - tolerance && x <= shape.x + shape.width + tolerance &&
                       y >= shape.y - tolerance && y <= shape.y + shape.height + tolerance;
            
            default:
                return false;
        }
    }

    // Calculate distance from point to line segment
    private distanceToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }
        
        let param = dot / lenSq;
        
        if (param < 0) {
            param = 0;
        } else if (param > 1) {
            param = 1;
        }
        
        const xx = x1 + param * C;
        const yy = y1 + param * D;
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Finish multi-select
    private finishMultiSelect() {
        if (!this.multiSelectRect) return;
        
        const minX = Math.min(this.multiSelectRect.x, this.multiSelectRect.x + this.multiSelectRect.width);
        const maxX = Math.max(this.multiSelectRect.x, this.multiSelectRect.x + this.multiSelectRect.width);
        const minY = Math.min(this.multiSelectRect.y, this.multiSelectRect.y + this.multiSelectRect.height);
        const maxY = Math.max(this.multiSelectRect.y, this.multiSelectRect.y + this.multiSelectRect.height);
        
        this.existingShapes.forEach(shapeWithId => {
            if (this.isShapeInRect(shapeWithId.shape, minX, minY, maxX, maxY)) {
                this.selectedShapeIds.add(shapeWithId.id);
            }
        });
        
        this.multiSelectRect = null;
        this.clearCanvas();
    }

    // Check if shape is in rectangle
    private isShapeInRect(shape: Shape, minX: number, minY: number, maxX: number, maxY: number): boolean {
        switch (shape.type) {
            case "rect":
                return shape.x >= minX && shape.x + shape.width <= maxX &&
                       shape.y >= minY && shape.y + shape.height <= maxY;
            
            case "circle":
                return shape.centerX - Math.abs(shape.radius) >= minX && 
                       shape.centerX + Math.abs(shape.radius) <= maxX &&
                       shape.centerY - Math.abs(shape.radius) >= minY && 
                       shape.centerY + Math.abs(shape.radius) <= maxY;
            
            case "line":
                return Math.min(shape.startX, shape.endX) >= minX && 
                       Math.max(shape.startX, shape.endX) <= maxX &&
                       Math.min(shape.startY, shape.endY) >= minY && 
                       Math.max(shape.startY, shape.endY) <= maxY;
            
            case "text":
                const textWidth = shape.content.length * shape.fontSize * 0.6;
                return shape.x >= minX && shape.x + textWidth <= maxX &&
                       shape.y >= minY && shape.y + shape.fontSize <= maxY;
            
            default:
                return false;
        }
    }

    // Move selected shapes
    private moveSelectedShapes(deltaX: number, deltaY: number) {
        this.selectedShapeIds.forEach(id => {
            const shapeItem = this.existingShapes.find(item => item.id === id);
            if (!shapeItem) return;
            
            const shape = shapeItem.shape;
            
            switch (shape.type) {
                case "rect":
                case "eraser":
                    shape.x += deltaX;
                    shape.y += deltaY;
                    break;
                
                case "circle":
                    shape.centerX += deltaX;
                    shape.centerY += deltaY;
                    break;
                
                case "line":
                    shape.startX += deltaX;
                    shape.startY += deltaY;
                    shape.endX += deltaX;
                    shape.endY += deltaY;
                    break;
                
                case "pencil":
                    if (shape.points) {
                        shape.points.forEach(point => {
                            point.x += deltaX;
                            point.y += deltaY;
                        });
                    }
                    break;
                
                case "text":
                    shape.x += deltaX;
                    shape.y += deltaY;
                    break;
            }
        });
        
        this.clearCanvas();
    }

    // Finish moving selection
    private finishMoveSelection() {
        this.selectedShapeIds.forEach(id => {
            const shapeItem = this.existingShapes.find(item => item.id === id);
            if (shapeItem) {
                this.socket.send(JSON.stringify({
                    type: "updateShape",
                    message: JSON.stringify({ shape: shapeItem.shape }),
                    roomId: this.roomId,
                    messageId: id
                }));
            }
        });
    }

    // Draw multi-select preview
    private drawMultiSelectPreview() {
        this.clearCanvas();
        
        if (this.multiSelectRect) {
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);
            
            this.ctx.strokeStyle = "#00bfff";
            this.ctx.setLineDash([5, 5]);
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                this.multiSelectRect.x,
                this.multiSelectRect.y,
                this.multiSelectRect.width,
                this.multiSelectRect.height
            );
            
            this.ctx.restore();
        }
    }

    // Draw preview for current tool
    private drawPreview(currentX: number, currentY: number) {
        this.clearCanvas();
        
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        switch (this.selectedTool) {
            case "rect":
                const width = currentX - this.startX;
                const height = currentY - this.startY;
                this.ctx.strokeRect(this.startX, this.startY, width, height);
                break;
            
            case "circle":
                const radius = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
            
            case "line":
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.stroke();
                break;
            
            case "eraser":
                const eraserSize = 20;
                this.ctx.strokeRect(currentX - eraserSize/2, currentY - eraserSize/2, eraserSize, eraserSize);
                break;
        }
        
        this.ctx.restore();
    }

    // Draw pencil preview
    private drawPencilPreview() {
        this.clearCanvas();
        
        if (this.currentPencilPoints.length > 1) {
            this.ctx.save();
            this.ctx.translate(this.offsetX, this.offsetY);
            this.ctx.scale(this.scale, this.scale);
            
            this.drawSmoothPencilStroke(this.currentPencilPoints, false);
            
            this.ctx.restore();
        }
    }

    // Finish drawing current shape
    private finishDrawing(currentX: number, currentY: number) {
        let newShape: Shape | null = null;
        
        switch (this.selectedTool) {
            case "rect":
                const width = currentX - this.startX;
                const height = currentY - this.startY;
                if (Math.abs(width) > 1 && Math.abs(height) > 1) {
                    newShape = {
                        type: "rect",
                        x: Math.min(this.startX, currentX),
                        y: Math.min(this.startY, currentY),
                        width: Math.abs(width),
                        height: Math.abs(height)
                    };
                }
                break;
            
            case "circle":
                const radius = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
                if (radius > 1) {
                    newShape = {
                        type: "circle",
                        centerX: this.startX,
                        centerY: this.startY,
                        radius: radius
                    };
                }
                break;
            
            case "line":
                const distance = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
                if (distance > 1) {
                    newShape = {
                        type: "line",
                        startX: this.startX,
                        startY: this.startY,
                        endX: currentX,
                        endY: currentY
                    };
                }
                break;
            
            case "pencil":
                this.finishPencilDrawing();
                return;
            
            case "eraser":
                this.performErase(currentX, currentY);
                return;
        }
        
        if (newShape) {
            const shapeWithId: ShapeWithId = {
                id: Date.now(),
                shape: newShape
            };
            
            this.existingShapes.push(shapeWithId);
            this.clearCanvas();
            
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: newShape }),
                roomId: this.roomId
            }));
        }
    }

    // Finish pencil drawing
    private finishPencilDrawing() {
        if (this.currentPencilPoints.length > 1) {
            const pencilShape: Shape = {
                type: "pencil",
                points: [...this.currentPencilPoints]
            };
            
            const shapeWithId: ShapeWithId = {
                id: Date.now(),
                shape: pencilShape
            };
            
            this.existingShapes.push(shapeWithId);
            this.clearCanvas();
            
            this.socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify({ shape: pencilShape }),
                roomId: this.roomId
            }));
        }
        
        this.currentPencilPoints = [];
    }

    // Perform erase operation with proper database deletion
    private performErase(x: number, y: number) {
        const eraserSize = 20;
        const eraserRect = {
            x: x - eraserSize / 2,
            y: y - eraserSize / 2,
            width: eraserSize,
            height: eraserSize
        };
        
        const shapesToErase: (string | number)[] = [];
        
        this.existingShapes.forEach(shapeWithId => {
            if (this.shapeIntersectsRect(shapeWithId.shape, eraserRect)) {
                shapesToErase.push(shapeWithId.id);
            }
        });
        
        if (shapesToErase.length > 0) {
            // Remove from local state immediately for responsive UI
            this.existingShapes = this.existingShapes.filter(item => !shapesToErase.includes(item.id));
            this.clearCanvas();
            
            // Send proper deletion message to server for database removal
            shapesToErase.forEach(id => {
                this.socket.send(JSON.stringify({
                    type: "deleteShape",
                    messageId: id,
                    roomId: this.roomId
                }));
            });
        }
    }

    // Check if shape intersects with rectangle
    private shapeIntersectsRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
        switch (shape.type) {
            case "rect":
            case "eraser":
                return !(shape.x > rect.x + rect.width || 
                        shape.x + shape.width < rect.x || 
                        shape.y > rect.y + rect.height || 
                        shape.y + shape.height < rect.y);
            
            case "circle":
                const closestX = Math.max(rect.x, Math.min(shape.centerX, rect.x + rect.width));
                const closestY = Math.max(rect.y, Math.min(shape.centerY, rect.y + rect.height));
                const distance = Math.sqrt(Math.pow(shape.centerX - closestX, 2) + Math.pow(shape.centerY - closestY, 2));
                return distance <= Math.abs(shape.radius);
            
            case "line":
                return this.lineIntersectsRect(shape.startX, shape.startY, shape.endX, shape.endY, rect);
            
            case "pencil":
                if (!shape.points || shape.points.length < 2) return false;
                for (let i = 0; i < shape.points.length - 1; i++) {
                    const p1 = shape.points[i];
                    const p2 = shape.points[i + 1];
                    if (this.lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, rect)) {
                        return true;
                    }
                }
                return false;
            
            case "text":
                const textWidth = shape.content.length * shape.fontSize * 0.6;
                const textHeight = shape.fontSize;
                return !(shape.x > rect.x + rect.width || 
                        shape.x + textWidth < rect.x || 
                        shape.y > rect.y + rect.height || 
                        shape.y + textHeight < rect.y);
            
            default:
                return false;
        }
    }

    // Check if line intersects rectangle
    private lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rect: { x: number; y: number; width: number; height: number }): boolean {
        if ((x1 >= rect.x && x1 <= rect.x + rect.width && y1 >= rect.y && y1 <= rect.y + rect.height) ||
            (x2 >= rect.x && x2 <= rect.x + rect.width && y2 >= rect.y && y2 <= rect.y + rect.height)) {
            return true;
        }
        
        return this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y) ||
               this.lineIntersectsLine(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height) ||
               this.lineIntersectsLine(x1, y1, x2, y2, rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height) ||
               this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x, rect.y);
    }

    // Check if two lines intersect
    private lineIntersectsLine(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denom === 0) return false;
        
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    // Delete selected shapes with proper database deletion
    public deleteSelectedShapes() {
        if (this.selectedShapeIds.size === 0) return;
        
        const idsToDelete = Array.from(this.selectedShapeIds);
        
        // Remove from local state immediately
        this.existingShapes = this.existingShapes.filter(item => !this.selectedShapeIds.has(item.id));
        this.selectedShapeIds.clear();
        this.clearCanvas();
        
        // Send deletion to server for database removal
        idsToDelete.forEach(id => {
            this.socket.send(JSON.stringify({
                type: "deleteShape",
                messageId: id,
                roomId: this.roomId
            }));
        });
    }

    // Select all shapes
    public selectAllShapes() {
        this.selectedShapeIds.clear();
        this.existingShapes.forEach(shapeWithId => {
            this.selectedShapeIds.add(shapeWithId.id);
        });
        this.clearCanvas();
    }

    // Clear selection
    public clearSelection() {
        this.selectedShapeIds.clear();
        this.clearCanvas();
    }

    // Get current zoom level
    public getZoomLevel(): number {
        return this.scale;
    }

    // Get current pan offset
    public getPanOffset(): { x: number; y: number } {
        return { x: this.offsetX, y: this.offsetY };
    }
}