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
    color?: string;
    strokeWidth?: number;
    fillColor?: string;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    color?: string;
    strokeWidth?: number;
    fillColor?: string;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
    strokeWidth?: number;
} | {
    type: "pencil";
    points: { x: number; y: number }[];
    color?: string;
    strokeWidth?: number;
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
    color?: string;
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
    
    // Enhanced drawing properties
    private currentColor: string = "#ffffff";
    private currentStrokeWidth: number = 2;
    private currentFillColor: string = "transparent";
    private smoothingEnabled: boolean = true;
    
    // Text tool properties
    private textInput: HTMLInputElement | null = null;
    private isEditingText: boolean = false;
    private textEditPosition: { x: number; y: number } | null = null;

    // UI Controls
    private zoomControls: HTMLDivElement | null = null;
    private toolPanel: HTMLDivElement | null = null;
    private onZoomChange?: (zoom: number) => void;

    // Smoothing properties for shape creation
    private previewShape: Shape | null = null;
    private animationId: number | null = null;

    // Undo/Redo functionality
    private undoStack: ShapeWithId[][] = [];
    private redoStack: ShapeWithId[][] = [];
    private maxUndoSteps = 50;

    // Mouse event handlers as class properties
    private mouseDownHandler!: (e: MouseEvent) => void;
    private mouseUpHandler!: (e: MouseEvent) => void;
    private mouseMoveHandler!: (e: MouseEvent) => void;
    private mouseLeaveHandler!: () => void;
    private wheelHandler!: (e: WheelEvent) => void;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.roomId = roomId;
        this.socket = socket;
        
        const context = canvas.getContext("2d");
        if (!context) {
            throw new Error("Could not get 2D context from canvas");
        }
        this.ctx = context;
        
        // Set canvas style
        this.canvas.style.cursor = "crosshair";
        this.canvas.style.display = "block";
        this.canvas.style.background = "#18181b";
        
        // Initialize mouse handlers first
        this.initMouseHandlers();
        
        this.init();
        this.initSocketHandlers();
        this.createZoomControls();
        this.createToolPanel();
        this.startRenderLoop();
    }

    // Enhanced tool panel with color and stroke width controls
    private createToolPanel() {
        this.toolPanel = document.createElement("div");
        this.toolPanel.style.cssText = `
            position: fixed;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            gap: 16px;
            z-index: 1000;
            min-width: 200px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        // Color picker section
        const colorSection = document.createElement("div");
        colorSection.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Stroke Color
            </div>
        `;

        const colorPalette = document.createElement("div");
        colorPalette.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
        `;

        const colors = [
            "#ffffff", "#000000", "#ef4444", "#f97316",
            "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
            "#ec4899", "#06b6d4", "#64748b", "#f59e0b"
        ];

        colors.forEach(color => {
            const colorBtn = document.createElement("button");
            colorBtn.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 8px;
                border: 2px solid ${color === this.currentColor ? '#3b82f6' : '#e5e7eb'};
                background-color: ${color};
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            
            if (color === "#ffffff" || color === "#eab308") {
                colorBtn.style.border = `2px solid ${color === this.currentColor ? '#3b82f6' : '#d1d5db'}`;
            }

            colorBtn.onclick = () => {
                this.currentColor = color;
                this.updateColorPalette();
            };

            colorPalette.appendChild(colorBtn);
        });

        colorSection.appendChild(colorPalette);

        // Fill color section
        const fillSection = document.createElement("div");
        fillSection.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Fill Color
            </div>
        `;

        const fillPalette = document.createElement("div");
        fillPalette.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
        `;

        const fillColors = [
            "transparent", "#ffffff", "#000000", "#ef444420",
            "#f9731620", "#eab30820", "#22c55e20", "#3b82f620",
            "#8b5cf620", "#ec489920", "#06b6d420", "#64748b20"
        ];

        fillColors.forEach((color) => {
            const fillBtn = document.createElement("button");
            fillBtn.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 8px;
                border: 2px solid ${color === this.currentFillColor ? '#3b82f6' : '#e5e7eb'};
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            `;

            if (color === "transparent") {
                fillBtn.style.background = `
                    linear-gradient(45deg, #f3f4f6 25%, transparent 25%), 
                    linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #f3f4f6 75%), 
                    linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)
                `;
                fillBtn.style.backgroundSize = "8px 8px";
                fillBtn.style.backgroundPosition = "0 0, 0 4px, 4px -4px, -4px 0px";
            } else {
                fillBtn.style.backgroundColor = color;
            }

            fillBtn.onclick = () => {
                this.currentFillColor = color;
                this.updateFillPalette();
            };

            fillPalette.appendChild(fillBtn);
        });

        fillSection.appendChild(fillPalette);

        // Stroke width section
        const strokeSection = document.createElement("div");
        strokeSection.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Stroke Width
            </div>
        `;

        const strokeSlider = document.createElement("input");
        strokeSlider.type = "range";
        strokeSlider.min = "1";
        strokeSlider.max = "20";
        strokeSlider.value = this.currentStrokeWidth.toString();
        strokeSlider.style.cssText = `
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #e5e7eb;
            outline: none;
            -webkit-appearance: none;
        `;

        const strokeValue = document.createElement("div");
        strokeValue.style.cssText = `
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-top: 8px;
        `;
        strokeValue.textContent = `${this.currentStrokeWidth}px`;

        strokeSlider.oninput = (e) => {
            const target = e.target as HTMLInputElement;
            this.currentStrokeWidth = parseInt(target.value);
            strokeValue.textContent = `${this.currentStrokeWidth}px`;
        };

        strokeSection.appendChild(strokeSlider);
        strokeSection.appendChild(strokeValue);

        // Enhanced eraser size section
        const eraserSection = document.createElement("div");
        eraserSection.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Eraser Size
            </div>
        `;

        const eraserSlider = document.createElement("input");
        eraserSlider.type = "range";
        eraserSlider.min = "10";
        eraserSlider.max = "100";
        eraserSlider.value = "20";
        eraserSlider.style.cssText = `
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #e5e7eb;
            outline: none;
            -webkit-appearance: none;
        `;

        const eraserValue = document.createElement("div");
        eraserValue.style.cssText = `
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-top: 8px;
        `;
        eraserValue.textContent = "20px";

        eraserSlider.oninput = (e) => {
            const target = e.target as HTMLInputElement;
            eraserValue.textContent = `${target.value}px`;
        };

        eraserSection.appendChild(eraserSlider);
        eraserSection.appendChild(eraserValue);

        this.toolPanel.appendChild(colorSection);
        this.toolPanel.appendChild(fillSection);
        this.toolPanel.appendChild(strokeSection);
        this.toolPanel.appendChild(eraserSection);

        document.body.appendChild(this.toolPanel);
    }

    private updateColorPalette() {
        const colorButtons = this.toolPanel?.querySelectorAll('div:first-child button');
        colorButtons?.forEach((btn, index) => {
            const button = btn as HTMLButtonElement;
            const colors = [
                "#ffffff", "#000000", "#ef4444", "#f97316",
                "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
                "#ec4899", "#06b6d4", "#64748b", "#f59e0b"
            ];
            const color = colors[index];
            button.style.border = `2px solid ${color === this.currentColor ? '#3b82f6' : (color === "#ffffff" || color === "#eab308" ? '#d1d5db' : '#e5e7eb')}`;
        });
    }

    private updateFillPalette() {
        const fillButtons = this.toolPanel?.querySelectorAll('div:nth-child(2) button');
        fillButtons?.forEach((btn, index) => {
            const button = btn as HTMLButtonElement;
            const fillColors = [
                "transparent", "#ffffff", "#000000", "#ef444420",
                "#f9731620", "#eab30820", "#22c55e20", "#3b82f620",
                "#8b5cf620", "#ec489920", "#06b6d420", "#64748b20"
            ];
            const color = fillColors[index];
            button.style.border = `2px solid ${color === this.currentFillColor ? '#3b82f6' : '#e5e7eb'}`;
        });
    }

    // Render loop for smooth animations
    private startRenderLoop() {
        const render = () => {
            this.renderFrame();
            this.animationId = requestAnimationFrame(render);
        };
        render();
    }

    private renderFrame() {
        // Only redraw if there are changes
        if (this.previewShape || this.multiSelectRect) {
            this.clearCanvas();
        }
    }

    // Simplified zoom controls
    private createZoomControls() {
        this.zoomControls = document.createElement("div");
        this.zoomControls.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            font-size: 14px;
        `;

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

        const zoomDisplay = document.createElement("div");
        zoomDisplay.style.cssText = `
            color: #495057;
            font-size: 13px;
            min-width: 45px;
            text-align: center;
        `;
        zoomDisplay.id = "zoom-display";
        zoomDisplay.textContent = `${Math.round(this.scale * 100)}%`;

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
        // Remove event listeners
        if (this.mouseDownHandler) {
            this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        }
        if (this.mouseUpHandler) {
            this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        }
        if (this.mouseMoveHandler) {
            this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
        }
        if (this.mouseLeaveHandler) {
            this.canvas.removeEventListener("mouseleave", this.mouseLeaveHandler);
        }
        if (this.wheelHandler) {
            this.canvas.removeEventListener("wheel", this.wheelHandler);
        }
        
        this.cleanupTextInput();
        
        if (this.zoomControls?.parentNode) {
            this.zoomControls.parentNode.removeChild(this.zoomControls);
        }
        
        if (this.toolPanel?.parentNode) {
            this.toolPanel.parentNode.removeChild(this.toolPanel);
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Close WebSocket connection
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }
    }
     
    setTool(tool: Tool) {
        this.selectedTool = tool;
        console.log("Tool changed to:", tool);
        
        if (tool !== "text") {
            this.cleanupTextInput();
        }
        
        // Enhanced cursor based on tool
        switch (tool) {
            case "pencil":
                this.canvas.style.cursor = "crosshair";
                break;
            case "eraser":
                // Custom eraser cursor
                this.canvas.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23ef4444\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m7 21-4.3-4.3c-1-1-1-2.6 0-3.6l9.6-9.6c1-1 2.6-1 3.6 0l5.6 5.6c1 1 1 2.6 0 3.6L13 21\"/><path d=\"M22 21H7\"/><path d=\"m5 11 9 9\"/></svg>') 12 12, crosshair";
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
            this.existingShapes = shapes || [];
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
                            height: shape.height,
                            color: shape.color || "#ffffff",
                            strokeWidth: shape.strokeWidth || 2,
                            fillColor: shape.fillColor || "transparent"
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
                            radius: shape.radius,
                            color: shape.color || "#ffffff",
                            strokeWidth: shape.strokeWidth || 2,
                            fillColor: shape.fillColor || "transparent"
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
                            endY: shape.endY,
                            color: shape.color || "#ffffff",
                            strokeWidth: shape.strokeWidth || 2
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
                                points: validPoints,
                                color: shape.color || "#ffffff",
                                strokeWidth: shape.strokeWidth || 2
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
                            fontFamily: typeof shape.fontFamily === 'string' ? shape.fontFamily : 'Arial',
                            color: shape.color || "#ffffff"
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
    
    private initSocketHandlers() {
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === "chat" || message.type === "chats") {
                    try {
                        const parsedShape = JSON.parse(message.message);
                        if (parsedShape && parsedShape.shape) {
                            const validatedShape = this.validateShape(parsedShape.shape);
                            if (validatedShape) {
                                if (message.messageId) {
                                    this.existingShapes.push({ id: message.messageId, shape: validatedShape });
                                } else {
                                    this.existingShapes.push({ id: Date.now(), shape: validatedShape });
                                }
                                this.clearCanvas();
                            }
                        }
                    } catch (parseError) {
                        console.error("Error parsing shape message:", parseError);
                    }
                } else if (message.type === "shapeDeleted") {
                    this.existingShapes = this.existingShapes.filter(item => item.id !== message.messageId);
                    this.selectedShapeIds.delete(message.messageId);
                    this.clearCanvas();
                } else if (message.type === "deleteShape") {
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

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
        };
    }

    clearCanvas() {
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = "#18181b"; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
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
                    
                    const isSelected = this.selectedShapeIds.has(shape.id);
                    this.drawShape(shape.shape, isSelected);
                    
                } catch (drawError) {
                    console.error(`Error drawing shape at index ${index}:`, drawError, shape);
                }
            });

            // Draw preview shape with smooth animation
            if (this.previewShape) {
                this.drawShape(this.previewShape, false, true);
            }

            // Draw multi-select rectangle
            if (this.multiSelectRect) {
                this.ctx.strokeStyle = "#00bfff";
                this.ctx.setLineDash([5, 5]);
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    this.multiSelectRect.x,
                    this.multiSelectRect.y,
                    this.multiSelectRect.width,
                    this.multiSelectRect.height
                );
                this.ctx.setLineDash([]);
            }
            
            this.ctx.restore();
        } catch (error) {
            console.error("Error in clearCanvas:", error);
            this.ctx.restore();
        }
    }

    // Enhanced shape drawing with color and stroke width support
    private drawShape(shape: Shape, isSelected: boolean = false, isPreview: boolean = false) {
        this.ctx.save();
        
        let baseColor: string;
        let strokeWidth: number;

        if (
            shape.type === "rect" ||
            shape.type === "circle" ||
            shape.type === "line" ||
            shape.type === "pencil" ||
            shape.type === "text"
        ) {
            baseColor = shape.color || this.currentColor;
            strokeWidth = (shape.type !== "text" && shape.strokeWidth !== undefined)
                ? shape.strokeWidth
                : this.currentStrokeWidth;
        } else if (shape.type === "eraser") {
            baseColor = "#ef4444";
            strokeWidth = 2;
        } else {
            baseColor = this.currentColor;
            strokeWidth = this.currentStrokeWidth;
        }
        
        if (isSelected) {
            this.ctx.strokeStyle = "#00bfff";
            this.ctx.lineWidth = strokeWidth + 1;
            this.ctx.shadowColor = "#00bfff";
            this.ctx.shadowBlur = 4;
        } else if (isPreview) {
            this.ctx.strokeStyle = `${baseColor}80`; // Semi-transparent
            this.ctx.lineWidth = strokeWidth;
            this.ctx.setLineDash([5, 5]);
        } else {
            this.ctx.strokeStyle = baseColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.shadowBlur = 0;
        }
        
        switch (shape.type) {
            case "rect":
                this.ctx.beginPath();
                this.ctx.rect(shape.x, shape.y, shape.width, shape.height);
                // Fill if specified
                if (shape.fillColor && shape.fillColor !== "transparent") {
                    this.ctx.fillStyle = isSelected ? "#00bfff20" : shape.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                this.ctx.closePath();
                break;
                
            case "circle":
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
                // Fill if specified
                if (shape.fillColor && shape.fillColor !== "transparent") {
                    this.ctx.fillStyle = isSelected ? "#00bfff20" : shape.fillColor;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                this.ctx.closePath();
                break;
                
            case "line":
                this.ctx.beginPath();
                this.ctx.lineCap = "round";
                this.ctx.moveTo(shape.startX, shape.startY);
                this.ctx.lineTo(shape.endX, shape.endY);
                this.ctx.stroke();
                break;
                
            case "pencil":
                if (shape.points && Array.isArray(shape.points) && shape.points.length > 1) {
                    this.drawSmoothPencilStroke(shape.points, isSelected, isPreview);
                }
                break;
                
            case "text":
                this.drawText(shape, isSelected);
                break;
                
            default:
                console.warn(`Unknown shape type: ${(shape as any).type}`);
        }
        
        this.ctx.restore();
    }

    // Enhanced smooth pencil stroke rendering
    private drawSmoothPencilStroke(points: { x: number; y: number }[], isSelected: boolean = false, isPreview: boolean = false) {
        if (points.length < 2) return;

        this.ctx.save();
        
        const baseColor = this.currentColor;
        const strokeWidth = this.currentStrokeWidth;
        
        if (isSelected) {
            this.ctx.strokeStyle = "#00bfff";
            this.ctx.lineWidth = strokeWidth + 1;
        } else if (isPreview) {
            this.ctx.strokeStyle = `${baseColor}80`;
            this.ctx.lineWidth = strokeWidth;
        } else {
            this.ctx.strokeStyle = baseColor;
            this.ctx.lineWidth = strokeWidth;
        }
        
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        
        this.ctx.beginPath();
        
        if (points.length === 2) {
            this.ctx.moveTo(points[0].x, points[0].y);
            this.ctx.lineTo(points[1].x, points[1].y);
        } else {
            // Enhanced smooth curve drawing
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
        this.ctx.restore();
    }

    // Enhanced text drawing with color support
    private drawText(textShape: Extract<Shape, { type: "text" }>, isSelected: boolean = false) {
        this.ctx.save();
        
        const fontSize = textShape.fontSize || 20;
        const fontFamily = textShape.fontFamily || "Arial";
        const color = textShape.color || this.currentColor;
        
        this.ctx.fillStyle = isSelected ? "#00bfff" : color;
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textBaseline = "top";
        this.ctx.fillText(textShape.content, textShape.x, textShape.y);
        
        this.ctx.restore();
    }

    // Create and position text input
    private createTextInput(x: number, y: number) {
        this.cleanupTextInput();
        
        this.textInput = document.createElement("input");
        this.textInput.type = "text";
        this.textInput.placeholder = "Type here...";
        
        this.textInput.style.cssText = `
            position: absolute;
            background-color: rgba(0, 0, 0, 0.8);
            color: ${this.currentColor};
            border: 2px solid #00bfff;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 20px;
            font-family: Arial;
            z-index: 1000;
            outline: none;
            min-width: 100px;
        `;
        
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
                fontFamily: "Arial",
                color: this.currentColor
            };
            
            this.saveStateForUndo();
            
            const shapeWithId: ShapeWithId = {
                id: Date.now(),
                shape: textShape
            };
            
            this.existingShapes.push(shapeWithId);
            this.clearCanvas();
            
            this.sendShapeToServer(textShape);
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
        this.mouseDownHandler = (e: MouseEvent) => {
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
        };

        this.mouseMoveHandler = (e: MouseEvent) => {
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
                    this.clearCanvas();
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
                this.previewShape = {
                    type: "pencil",
                    points: [...this.currentPencilPoints],
                    color: this.currentColor,
                    strokeWidth: this.currentStrokeWidth
                };
            } else {
                // Create smooth preview shapes
                this.createPreviewShape(worldX, worldY);
            }
        };

        this.mouseUpHandler = (e: MouseEvent) => {
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
            this.previewShape = null;
        };

        this.mouseLeaveHandler = () => {
            if (this.isDrawing && this.selectedTool === "pencil" && this.currentPencilPoints.length > 1) {
                this.finishPencilDrawing();
            }
            this.isDrawing = false;
            this.isDragging = false;
            this.isDraggingSelection = false;
            this.isMovingSelection = false;
            this.previewShape = null;
        };

        this.wheelHandler = (e: WheelEvent) => {
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
        };

        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
        this.canvas.addEventListener("mouseleave", this.mouseLeaveHandler);
        this.canvas.addEventListener("wheel", this.wheelHandler, { passive: false });
    }

    // Create smooth preview shape
    private createPreviewShape(currentX: number, currentY: number) {
        switch (this.selectedTool) {
            case "rect":
                const width = currentX - this.startX;
                const height = currentY - this.startY;
                if (Math.abs(width) > 1 && Math.abs(height) > 1) {
                    this.previewShape = {
                        type: "rect",
                        x: Math.min(this.startX, currentX),
                        y: Math.min(this.startY, currentY),
                        width: Math.abs(width),
                        height: Math.abs(height),
                        color: this.currentColor,
                        strokeWidth: this.currentStrokeWidth,
                        fillColor: this.currentFillColor
                    };
                }
                break;
            
            case "circle":
                const radius = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
                if (radius > 1) {
                    this.previewShape = {
                        type: "circle",
                        centerX: this.startX,
                        centerY: this.startY,
                        radius: radius,
                        color: this.currentColor,
                        strokeWidth: this.currentStrokeWidth,
                        fillColor: this.currentFillColor
                    };
                }
                break;
            
            case "line":
                const distance = Math.sqrt(Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2));
                if (distance > 1) {
                    this.previewShape = {
                        type: "line",
                        startX: this.startX,
                        startY: this.startY,
                        endX: currentX,
                        endY: currentY,
                        color: this.currentColor,
                        strokeWidth: this.currentStrokeWidth
                    };
                }
                break;
            
            case "eraser":
                const eraserSize = this.getEraserSize();
                this.previewShape = {
                    type: "rect",
                    x: currentX - eraserSize/2,
                    y: currentY - eraserSize/2,
                    width: eraserSize,
                    height: eraserSize,
                    color: "#ef4444",
                    strokeWidth: 2,
                    fillColor: "#ef444420"
                };
                break;
        }
    }

    // Get eraser size from UI
    private getEraserSize(): number {
        const eraserSlider = this.toolPanel?.querySelector('input[type="range"]:last-of-type') as HTMLInputElement;
        return eraserSlider ? parseInt(eraserSlider.value) : 20;
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
                const textWidth = shape.content.length * (shape.fontSize || 20) * 0.6;
                const textHeight = shape.fontSize || 20;
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
                const textWidth = shape.content.length * (shape.fontSize || 20) * 0.6;
                return shape.x >= minX && shape.x + textWidth <= maxX &&
                       shape.y >= minY && shape.y + (shape.fontSize || 20) <= maxY;
            
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
                this.sendUpdateToServer(shapeItem.shape, id);
            }
        });
    }

    // Enhanced finish drawing with color and stroke width
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
                        height: Math.abs(height),
                        color: this.currentColor,
                        strokeWidth: this.currentStrokeWidth,
                        fillColor: this.currentFillColor
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
                        radius: radius,
                        color: this.currentColor,
                        strokeWidth: this.currentStrokeWidth,
                        fillColor: this.currentFillColor
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
                        endY: currentY,
                        color: this.currentColor,
                        strokeWidth: this.currentStrokeWidth
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
            this.saveStateForUndo();
            
            const shapeWithId: ShapeWithId = {
                id: Date.now(),
                shape: newShape
            };
            
            this.existingShapes.push(shapeWithId);
            this.clearCanvas();
            
            this.sendShapeToServer(newShape);
        }
    }

    // Enhanced finish pencil drawing
    private finishPencilDrawing() {
        if (this.currentPencilPoints.length > 1) {
            const pencilShape: Shape = {
                type: "pencil",
                points: [...this.currentPencilPoints],
                color: this.currentColor,
                strokeWidth: this.currentStrokeWidth
            };
            
            this.saveStateForUndo();
            
            const shapeWithId: ShapeWithId = {
                id: Date.now(),
                shape: pencilShape
            };
            
            this.existingShapes.push(shapeWithId);
            this.clearCanvas();
            
            this.sendShapeToServer(pencilShape);
        }
        
        this.currentPencilPoints = [];
    }

    // Enhanced erase operation
    private performErase(x: number, y: number) {
        const eraserSize = this.getEraserSize();
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
            this.saveStateForUndo();
            this.existingShapes = this.existingShapes.filter(item => !shapesToErase.includes(item.id));
            this.clearCanvas();
            
            shapesToErase.forEach(id => {
                this.sendDeleteToServer(id);
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
                const textWidth = shape.content.length * (shape.fontSize || 20) * 0.6;
                const textHeight = shape.fontSize || 20;
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

    // Undo functionality
    private saveStateForUndo() {
        // Remove oldest states if we exceed max steps
        if (this.undoStack.length >= this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // Save current state
        this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
    }

    public undo() {
        if (this.undoStack.length === 0) return;
        
        // Save current state to redo stack
        this.redoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        
        // Restore previous state
        const previousState = this.undoStack.pop()!;
        this.existingShapes = previousState;
        this.selectedShapeIds.clear();
        this.clearCanvas();
    }

    public redo() {
        if (this.redoStack.length === 0) return;
        
        // Save current state to undo stack
        this.undoStack.push(JSON.parse(JSON.stringify(this.existingShapes)));
        
        // Restore next state
        const nextState = this.redoStack.pop()!;
        this.existingShapes = nextState;
        this.selectedShapeIds.clear();
        this.clearCanvas();
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    // Server communication methods
    private sendShapeToServer(shape: Shape) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify({
                    type: "chat",
                    message: JSON.stringify({ shape: shape }),
                    roomId: this.roomId
                }));
            } catch (error) {
                console.error("Error sending shape to server:", error);
            }
        }
    }

    private sendUpdateToServer(shape: Shape, messageId: string | number) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify({
                    type: "updateShape",
                    message: JSON.stringify({ shape: shape }),
                    roomId: this.roomId,
                    messageId: messageId
                }));
            } catch (error) {
                console.error("Error sending update to server:", error);
            }
        }
    }

    private sendDeleteToServer(messageId: string | number) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify({
                    type: "deleteShape",
                    messageId: messageId,
                    roomId: this.roomId
                }));
            } catch (error) {
                console.error("Error sending delete to server:", error);
            }
        }
    }

    // Public methods for external control
    public deleteSelectedShapes() {
        if (this.selectedShapeIds.size === 0) return;
        
        this.saveStateForUndo();
        const idsToDelete = Array.from(this.selectedShapeIds);
        
        this.existingShapes = this.existingShapes.filter(item => !this.selectedShapeIds.has(item.id));
        this.selectedShapeIds.clear();
        this.clearCanvas();
        
        idsToDelete.forEach(id => {
            this.sendDeleteToServer(id);
        });
    }

    public selectAllShapes() {
        this.selectedShapeIds.clear();
        this.existingShapes.forEach(shapeWithId => {
            this.selectedShapeIds.add(shapeWithId.id);
        });
        this.clearCanvas();
    }

    public clearSelection() {
        this.selectedShapeIds.clear();
        this.clearCanvas();
    }

    public getZoomLevel(): number {
        return this.scale;
    }

    public getPanOffset(): { x: number; y: number } {
        return { x: this.offsetX, y: this.offsetY };
    }

    public setCurrentColor(color: string) {
        this.currentColor = color;
        this.updateColorPalette();
    }

    public getCurrentColor(): string {
        return this.currentColor;
    }

    public setCurrentStrokeWidth(width: number) {
        this.currentStrokeWidth = Math.max(1, Math.min(20, width));
    }

    public getCurrentStrokeWidth(): number {
        return this.currentStrokeWidth;
    }

    public setCurrentFillColor(color: string) {
        this.currentFillColor = color;
        this.updateFillPalette();
    }

    public getCurrentFillColor(): string {
        return this.currentFillColor;
    }

    public setSmoothingEnabled(enabled: boolean) {
        this.smoothingEnabled = enabled;
    }

    public isSmoothingEnabled(): boolean {
        return this.smoothingEnabled;
    }

    public setToolPanelVisible(visible: boolean) {
        if (this.toolPanel) {
            this.toolPanel.style.display = visible ? 'flex' : 'none';
        }
    }

    public resetCanvas() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.selectedShapeIds.clear();
        this.updateZoomDisplay();
        this.clearCanvas();
    }

    public getCanvasStats() {
        return {
            totalShapes: this.existingShapes.length,
            selectedShapes: this.selectedShapeIds.size,
            zoomLevel: this.scale,
            panOffset: { x: this.offsetX, y: this.offsetY },
            currentColor: this.currentColor,
            currentStrokeWidth: this.currentStrokeWidth,
            currentFillColor: this.currentFillColor
        };
    }

    public exportCanvasData() {
        return {
            shapes: this.existingShapes,
            settings: {
                color: this.currentColor,
                strokeWidth: this.currentStrokeWidth,
                fillColor: this.currentFillColor,
                zoom: this.scale,
                pan: { x: this.offsetX, y: this.offsetY }
            }
        };
    }

    public importCanvasData(data: any) {
        if (data.shapes && Array.isArray(data.shapes)) {
            this.existingShapes = data.shapes.map((item: any) => ({
                id: item.id,
                shape: this.validateShape(item.shape)
            })).filter((item: any) => item.shape !== null) as ShapeWithId[];
        }
        
        if (data.settings) {
            if (data.settings.color) this.currentColor = data.settings.color;
            if (data.settings.strokeWidth) this.currentStrokeWidth = data.settings.strokeWidth;
            if (data.settings.fillColor) this.currentFillColor = data.settings.fillColor;
            if (data.settings.zoom) this.setZoom(data.settings.zoom);
            if (data.settings.pan) {
                this.offsetX = data.settings.pan.x;
                this.offsetY = data.settings.pan.y;
            }
        }
        
        this.clearCanvas();
    }

    // Keyboard shortcuts handler
    public handleKeyPress(event: KeyboardEvent) {
        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case 'z':
                    event.preventDefault();
                    if (event.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'a':
                    event.preventDefault();
                    this.selectAllShapes();
                    break;
                case 'd':
                    event.preventDefault();
                    this.clearSelection();
                    break;
            }
        }
        
        // Delete selected shapes
        if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            this.deleteSelectedShapes();
        }
        
        // Escape key to clear selection or cancel current action
        if (event.key === 'Escape') {
            event.preventDefault();
            this.clearSelection();
            this.cleanupTextInput();
            this.isDrawing = false;
            this.previewShape = null;
        }
    }

    // Touch support for mobile devices
    private lastTouchDistance: number = 0;
    private lastTouchCenter: { x: number; y: number } = { x: 0, y: 0 };

    public enableTouchSupport() {
        let isDrawing = false;
        let lastTouch: { x: number; y: number } | null = null;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                // Convert to mouse event
                const mouseEvent = new MouseEvent('mousedown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    button: 0
                });
                
                this.mouseDownHandler(mouseEvent);
                isDrawing = true;
                lastTouch = { x, y };
            } else if (e.touches.length === 2) {
                // Handle pinch zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                this.lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) + 
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                this.lastTouchCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                };
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && isDrawing) {
                const touch = e.touches[0];
                
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                
                this.mouseMoveHandler(mouseEvent);
                
                const rect = this.canvas.getBoundingClientRect();
                lastTouch = {
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top
                };
            } else if (e.touches.length === 2) {
                // Handle pinch zoom
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                
                const currentDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) + 
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                const currentCenter = {
                    x: (touch1.clientX + touch2.clientX) / 2,
                    y: (touch1.clientY + touch2.clientY) / 2
                };
                
                if (this.lastTouchDistance > 0) {
                    const scaleChange = currentDistance / this.lastTouchDistance;
                    const rect = this.canvas.getBoundingClientRect();
                    
                    const mouseX = currentCenter.x - rect.left;
                    const mouseY = currentCenter.y - rect.top;
                    
                    const worldX = (mouseX - this.offsetX) / this.scale;
                    const worldY = (mouseY - this.offsetY) / this.scale;
                    
                    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * scaleChange));
                    this.scale = newScale;
                    
                    this.offsetX = mouseX - worldX * this.scale;
                    this.offsetY = mouseY - worldY * this.scale;
                    
                    this.updateZoomDisplay();
                    this.clearCanvas();
                }
                
                this.lastTouchDistance = currentDistance;
                this.lastTouchCenter = currentCenter;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            if (isDrawing && lastTouch) {
                const mouseEvent = new MouseEvent('mouseup', {
                    clientX: lastTouch.x + this.canvas.getBoundingClientRect().left,
                    clientY: lastTouch.y + this.canvas.getBoundingClientRect().top
                });
                
                this.mouseUpHandler(mouseEvent);
                isDrawing = false;
                lastTouch = null;
            }
            
            if (e.touches.length === 0) {
                this.lastTouchDistance = 0;
            }
        }, { passive: false });
    }

    // Performance optimization
    private lastRenderTime = 0;
    private readonly targetFPS = 60;
    private readonly frameTime = 1000 / this.targetFPS;

    private optimizedRenderFrame = () => {
        const now = performance.now();
        const deltaTime = now - this.lastRenderTime;
        
        if (deltaTime >= this.frameTime) {
            this.renderFrame();
            this.lastRenderTime = now;
        }
        
        this.animationId = requestAnimationFrame(this.optimizedRenderFrame);
    }

    // Error handling wrapper
    private safeExecute<T>(fn: () => T, errorMessage: string): T | null {
        try {
            return fn();
        } catch (error) {
            console.error(errorMessage, error);
            return null;
        }
    }

    // Cleanup method for complete resource deallocation
    public dispose() {
        this.destroy();
        
        // Clear all arrays and objects
        this.existingShapes = [];
        this.selectedShapeIds.clear();
        this.undoStack = [];
        this.redoStack = [];
        this.currentPencilPoints = [];
        
        // Reset state
        this.isDrawing = false;
        this.isDragging = false;
        this.isDraggingSelection = false;
        this.isMovingSelection = false;
        this.isEditingText = false;
        
        // Clear references
        this.previewShape = null;
        this.multiSelectRect = null;
        this.dragOffset = null;
        this.textEditPosition = null;
        this.onZoomChange = undefined;
    }
}