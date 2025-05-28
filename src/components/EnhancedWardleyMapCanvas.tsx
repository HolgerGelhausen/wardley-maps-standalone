import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WardleyMap, Component, Connection, Note, TextOverlay, IconOverlay, ImageOverlay, ShapeOverlay, ShapeType, DrawingPath } from '../types/WardleyMap';
import { Tool } from './ToolPanel';

interface EnhancedWardleyMapCanvasProps {
  map: WardleyMap;
  width?: number;
  height?: number;
  selectedTool: Tool;
  shapeProperties?: {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    opacity: number;
    filled: boolean;
  };
  textProperties?: {
    color: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    opacity: number;
  };
  drawingProperties?: {
    color: string;
    strokeWidth: number;
    opacity: number;
  };
  onExport?: (canvas: HTMLCanvasElement) => void;
  onComponentMove?: (componentName: string, newX: number, newY: number) => void;
  onTextAdd?: (text: TextOverlay) => void;
  onIconAdd?: (icon: IconOverlay) => void;
  onImageAdd?: (image: ImageOverlay) => void;
  onShapeAdd?: (shape: ShapeOverlay) => void;
  onDrawingAdd?: (drawing: DrawingPath) => void;
  onDrawingUpdate?: (id: string, points: { x: number; y: number }[]) => void;
  onOverlayMove?: (type: 'text' | 'icon' | 'image' | 'shape', id: string, newX: number, newY: number) => void;
  onOverlayDelete?: (type: 'text' | 'icon' | 'image' | 'shape' | 'drawing', id: string) => void;
  onShapeResize?: (id: string, shape: Partial<ShapeOverlay>) => void;
  onTextResize?: (id: string, text: Partial<TextOverlay>) => void;
  onTextSelect?: (id: string | null) => void;
}

export const EnhancedWardleyMapCanvas: React.FC<EnhancedWardleyMapCanvasProps> = ({
  map,
  width = 1400,
  height = 1000,
  selectedTool,
  shapeProperties = {
    strokeColor: '#000000',
    fillColor: '#000000',
    strokeWidth: 2,
    opacity: 100,
    filled: false
  },
  textProperties = {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'normal',
    opacity: 100
  },
  drawingProperties = {
    color: '#000000',
    strokeWidth: 2,
    opacity: 100
  },
  onExport,
  onComponentMove,
  onTextAdd,
  onIconAdd,
  onImageAdd,
  onShapeAdd,
  onDrawingAdd,
  onDrawingUpdate,
  onOverlayMove,
  onOverlayDelete,
  onShapeResize,
  onTextResize,
  onTextSelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{type: 'component' | 'text' | 'icon' | 'image' | 'shape' | 'drawing', id: string} | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [textInputState, setTextInputState] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [textInputValue, setTextInputValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const getComponentColor = (component: Component): string => {
    if (component.color) return component.color;
    if (component.category === 'build') return '#4A90E2';
    if (component.category === 'buy') return '#7ED321';
    if (component.category === 'outsource') return '#F5A623';
    return '#000000';
  };

  const coordsToCanvas = (x: number, y: number) => ({
    canvasX: 50 + x * (width - 100),
    canvasY: 50 + (1 - y) * (height - 100)
  });

  const canvasToCoords = (canvasX: number, canvasY: number) => ({
    x: Math.max(0, Math.min(1, (canvasX - 50) / (width - 100))),
    y: Math.max(0, Math.min(1, 1 - (canvasY - 50) / (height - 100)))
  });

  const getItemAt = (canvasX: number, canvasY: number): {type: 'component' | 'text' | 'icon' | 'image' | 'shape' | 'drawing', item: any} | null => {
    // Check shapes first (top layer)
    for (const shape of (map.shapeOverlays || []).slice().reverse()) {
      const { canvasX: shapeX, canvasY: shapeY } = coordsToCanvas(shape.x, shape.y);
      
      if (shape.type === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
        const { canvasX: endX, canvasY: endY } = coordsToCanvas(shape.endX, shape.endY);
        const dist = distanceToLine(canvasX, canvasY, shapeX, shapeY, endX, endY);
        if (dist < 5) return { type: 'shape', item: shape };
      } else if (shape.type === 'rectangle' && shape.width && shape.height) {
        const pixelWidth = shape.width * (width - 100);
        const pixelHeight = shape.height * (height - 100);
        
        if (canvasX >= shapeX && canvasX <= shapeX + pixelWidth &&
            canvasY >= shapeY && canvasY <= shapeY + pixelHeight) {
          return { type: 'shape', item: shape };
        }
      } else if (shape.type === 'circle' && shape.radius) {
        const pixelRadius = shape.radius * Math.min(width - 100, height - 100);
        const dist = Math.sqrt((canvasX - shapeX) ** 2 + (canvasY - shapeY) ** 2);
        if (dist <= pixelRadius) return { type: 'shape', item: shape };
      } else if (shape.type === 'triangle' && shape.width && shape.height) {
        const pixelWidth = shape.width * (width - 100);
        const pixelHeight = shape.height * (height - 100);
        
        if (isPointInTriangle(canvasX, canvasY, shapeX, shapeY, pixelWidth, pixelHeight)) {
          return { type: 'shape', item: shape };
        }
      }
    }

    // Check drawing paths
    for (const drawing of (map.drawingPaths || []).slice().reverse()) {
      for (let i = 0; i < drawing.points.length - 1; i++) {
        const point1 = drawing.points[i];
        const point2 = drawing.points[i + 1];
        const { canvasX: x1, canvasY: y1 } = coordsToCanvas(point1.x, point1.y);
        const { canvasX: x2, canvasY: y2 } = coordsToCanvas(point2.x, point2.y);
        const dist = distanceToLine(canvasX, canvasY, x1, y1, x2, y2);
        if (dist < 5) return { type: 'drawing', item: drawing };
      }
    }

    // Rest of the existing checks...
    // Check text overlays with proper hit detection
    const ctx = canvasRef.current?.getContext('2d');
    for (const textOverlay of map.textOverlays || []) {
      const { canvasX: textX, canvasY: textY } = coordsToCanvas(textOverlay.x, textOverlay.y);
      
      if (ctx) {
        // Set font to measure text accurately
        ctx.font = `${textOverlay.fontWeight || 'normal'} ${textOverlay.fontSize}px Arial`;
        const metrics = ctx.measureText(textOverlay.text);
        const textWidth = metrics.width;
        const textHeight = textOverlay.fontSize;
        
        // Check if click is within text bounds (with some padding)
        const padding = 5;
        if (canvasX >= textX - padding && 
            canvasX <= textX + textWidth + padding &&
            canvasY >= textY - textHeight - padding && 
            canvasY <= textY + padding) {
          return { type: 'text', item: textOverlay };
        }
      } else {
        // Fallback to fixed size if no canvas context
        if (Math.abs(canvasX - textX) < 50 && Math.abs(canvasY - textY) < 20) {
          return { type: 'text', item: textOverlay };
        }
      }
    }

    for (const iconOverlay of map.iconOverlays || []) {
      const { canvasX: iconX, canvasY: iconY } = coordsToCanvas(iconOverlay.x, iconOverlay.y);
      if (Math.abs(canvasX - iconX) < iconOverlay.size && Math.abs(canvasY - iconY) < iconOverlay.size) {
        return { type: 'icon', item: iconOverlay };
      }
    }

    for (const imageOverlay of map.imageOverlays || []) {
      const { canvasX: imgX, canvasY: imgY } = coordsToCanvas(imageOverlay.x, imageOverlay.y);
      if (canvasX >= imgX && canvasX <= imgX + imageOverlay.width &&
          canvasY >= imgY && canvasY <= imgY + imageOverlay.height) {
        return { type: 'image', item: imageOverlay };
      }
    }

    for (const component of map.components) {
      const { canvasX: compX, canvasY: compY } = coordsToCanvas(component.x, component.y);
      const distance = Math.sqrt((canvasX - compX) ** 2 + (canvasY - compY) ** 2);
      if (distance <= 12) {
        return { type: 'component', item: component };
      }
    }

    return null;
  };

  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointInTriangle = (px: number, py: number, tx: number, ty: number, width: number, height: number): boolean => {
    const x1 = tx + width / 2;
    const y1 = ty;
    const x2 = tx;
    const y2 = ty + height;
    const x3 = tx + width;
    const y3 = ty + height;
    
    const sign = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) => {
      return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
    };
    
    const d1 = sign(px, py, x1, y1, x2, y2);
    const d2 = sign(px, py, x2, y2, x3, y3);
    const d3 = sign(px, py, x3, y3, x1, y1);
    
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    
    return !(hasNeg && hasPos);
  };

  const getTextResizeHandle = (text: TextOverlay, canvasX: number, canvasY: number, ctx: CanvasRenderingContext2D): string | null => {
    const { canvasX: textX, canvasY: textY } = coordsToCanvas(text.x, text.y);
    const handleSize = 8;
    
    // Measure text dimensions
    ctx.font = `${text.fontWeight || 'normal'} ${text.fontSize}px Arial`;
    const metrics = ctx.measureText(text.text);
    const textWidth = metrics.width;
    const textHeight = text.fontSize; // Approximate height
    
    // Check corners for resize handles
    const corners = [
      { name: 'se', x: textX + textWidth, y: textY }, // Bottom-right for font size
      { name: 'e', x: textX + textWidth, y: textY - textHeight/2 }, // Right for width
    ];
    
    for (const corner of corners) {
      if (Math.abs(canvasX - corner.x) < handleSize && Math.abs(canvasY - corner.y) < handleSize) {
        return corner.name;
      }
    }
    
    return null;
  };

  const getResizeHandle = (shape: ShapeOverlay, canvasX: number, canvasY: number): string | null => {
    const { canvasX: shapeX, canvasY: shapeY } = coordsToCanvas(shape.x, shape.y);
    const handleSize = 8;
    
    if (shape.type === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
      const { canvasX: endX, canvasY: endY } = coordsToCanvas(shape.endX, shape.endY);
      
      if (Math.abs(canvasX - shapeX) < handleSize && Math.abs(canvasY - shapeY) < handleSize) {
        return 'start';
      }
      if (Math.abs(canvasX - endX) < handleSize && Math.abs(canvasY - endY) < handleSize) {
        return 'end';
      }
    } else if (shape.type === 'rectangle' && shape.width && shape.height) {
      const pixelWidth = shape.width * (width - 100);
      const pixelHeight = shape.height * (height - 100);
      
      const corners = [
        { name: 'nw', x: shapeX, y: shapeY },
        { name: 'ne', x: shapeX + pixelWidth, y: shapeY },
        { name: 'sw', x: shapeX, y: shapeY + pixelHeight },
        { name: 'se', x: shapeX + pixelWidth, y: shapeY + pixelHeight }
      ];
      
      for (const corner of corners) {
        if (Math.abs(canvasX - corner.x) < handleSize && Math.abs(canvasY - corner.y) < handleSize) {
          return corner.name;
        }
      }
    } else if (shape.type === 'circle' && shape.radius) {
      const pixelRadius = shape.radius * Math.min(width - 100, height - 100);
      const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
      const names = ['e', 's', 'w', 'n'];
      
      for (let i = 0; i < angles.length; i++) {
        const handleX = shapeX + pixelRadius * Math.cos(angles[i]);
        const handleY = shapeY + pixelRadius * Math.sin(angles[i]);
        
        if (Math.abs(canvasX - handleX) < handleSize && Math.abs(canvasY - handleY) < handleSize) {
          return names[i];
        }
      }
    }
    
    return null;
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: ShapeOverlay) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(shape.x, shape.y);
    
    // Apply opacity
    const opacity = shape.opacity / 100;
    ctx.globalAlpha = opacity;
    
    ctx.strokeStyle = shape.strokeColor;
    ctx.fillStyle = shape.fillColor;
    ctx.lineWidth = shape.strokeWidth;
    
    if (shape.type === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
      const { canvasX: endX, canvasY: endY } = coordsToCanvas(shape.endX, shape.endY);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (shape.type === 'rectangle' && shape.width && shape.height) {
      // Convert normalized dimensions to canvas pixels
      const pixelWidth = shape.width * (ctx.canvas.width - 100);
      const pixelHeight = shape.height * (ctx.canvas.height - 100);
      
      if (shape.filled) {
        ctx.fillRect(x, y, pixelWidth, pixelHeight);
      } else {
        ctx.strokeRect(x, y, pixelWidth, pixelHeight);
      }
    } else if (shape.type === 'circle' && shape.radius) {
      // Convert normalized radius to canvas pixels
      const pixelRadius = shape.radius * Math.min(ctx.canvas.width - 100, ctx.canvas.height - 100);
      
      ctx.beginPath();
      ctx.arc(x, y, pixelRadius, 0, 2 * Math.PI);
      if (shape.filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (shape.type === 'triangle' && shape.width && shape.height) {
      // Convert normalized dimensions to canvas pixels
      const pixelWidth = shape.width * (ctx.canvas.width - 100);
      const pixelHeight = shape.height * (ctx.canvas.height - 100);
      
      ctx.beginPath();
      ctx.moveTo(x + pixelWidth / 2, y);
      ctx.lineTo(x, y + pixelHeight);
      ctx.lineTo(x + pixelWidth, y + pixelHeight);
      ctx.closePath();
      if (shape.filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
    
    // Draw resize handles if selected
    if (shape.isSelected) {
      ctx.fillStyle = '#4A90E2';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      
      if (shape.type === 'line' && shape.endX !== undefined && shape.endY !== undefined) {
        const { canvasX: endX, canvasY: endY } = coordsToCanvas(shape.endX, shape.endY);
        // Start handle
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        // End handle
        ctx.beginPath();
        ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (shape.type === 'rectangle' && shape.width && shape.height) {
        const pixelWidth = shape.width * (ctx.canvas.width - 100);
        const pixelHeight = shape.height * (ctx.canvas.height - 100);
        
        const handles = [
          { x: x, y: y },
          { x: x + pixelWidth, y: y },
          { x: x, y: y + pixelHeight },
          { x: x + pixelWidth, y: y + pixelHeight }
        ];
        handles.forEach(handle => {
          ctx.beginPath();
          ctx.rect(handle.x - 4, handle.y - 4, 8, 8);
          ctx.fill();
          ctx.stroke();
        });
      } else if (shape.type === 'circle' && shape.radius) {
        const pixelRadius = shape.radius * Math.min(ctx.canvas.width - 100, ctx.canvas.height - 100);
        
        const handles = [
          { x: x + pixelRadius, y: y },
          { x: x, y: y + pixelRadius },
          { x: x - pixelRadius, y: y },
          { x: x, y: y - pixelRadius }
        ];
        handles.forEach(handle => {
          ctx.beginPath();
          ctx.rect(handle.x - 4, handle.y - 4, 8, 8);
          ctx.fill();
          ctx.stroke();
        });
      }
    }
  };

  const drawPath = (ctx: CanvasRenderingContext2D, path: DrawingPath) => {
    if (path.points.length < 2) return;
    
    // Apply opacity
    const opacity = path.opacity / 100;
    ctx.globalAlpha = opacity;
    
    ctx.strokeStyle = path.strokeColor;
    ctx.lineWidth = path.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    const firstPoint = path.points[0];
    const { canvasX: startX, canvasY: startY } = coordsToCanvas(firstPoint.x, firstPoint.y);
    ctx.moveTo(startX, startY);
    
    for (let i = 1; i < path.points.length; i++) {
      const point = path.points[i];
      const { canvasX, canvasY } = coordsToCanvas(point.x, point.y);
      ctx.lineTo(canvasX, canvasY);
    }
    
    ctx.stroke();
    
    // Reset opacity
    ctx.globalAlpha = 1;
  };

  // Continue with all the existing drawing functions...
  const drawEvolutionAxis = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 50, height - 50);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    const stages = ['Genesis', 'Custom Built', 'Product', 'Commodity'];
    const stageWidth = (width - 100) / (stages.length - 1);
    
    stages.forEach((stage, index) => {
      const x = 50 + index * stageWidth;
      ctx.fillText(stage, x, height - 25);
      
      ctx.beginPath();
      ctx.moveTo(x, height - 50);
      ctx.lineTo(x, height - 45);
      ctx.stroke();
    });
    
    ctx.fillText('Evolution', width / 2, height - 5);
  };

  const drawValueChainAxis = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, height - 50);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    ctx.save();
    ctx.translate(25, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Value Chain', 0, 0);
    ctx.restore();
    
    ctx.fillText('Visible', 25, 70);
    ctx.fillText('Invisible', 25, height - 60);
  };

  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(component.x, component.y);
    
    ctx.fillStyle = getComponentColor(component);
    ctx.strokeStyle = getComponentColor(component);
    
    if (component.inertia) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    
    if (draggedItem?.type === 'component' && draggedItem.id === component.name) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3;
    } else {
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.fillStyle = getComponentColor(component);
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    
    let labelX = x + 12;
    let labelY = y - 12;
    
    if (component.label) {
      labelX = x + component.label.x;
      labelY = y + component.label.y;
    }
    
    ctx.fillText(component.name, labelX, labelY);
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: Connection) => {
    const fromComponent = map.components.find(c => c.name === connection.from);
    const toComponent = map.components.find(c => c.name === connection.to);
    
    if (!fromComponent || !toComponent) return;
    
    const { canvasX: fromX, canvasY: fromY } = coordsToCanvas(fromComponent.x, fromComponent.y);
    const { canvasX: toX, canvasY: toY } = coordsToCanvas(toComponent.x, toComponent.y);
    
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 8;
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const drawNote = (ctx: CanvasRenderingContext2D, note: Note) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(note.x, note.y);
    
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(note.text, x, y);
  };

  const drawTextOverlay = (ctx: CanvasRenderingContext2D, textOverlay: TextOverlay) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(textOverlay.x, textOverlay.y);
    
    // Apply opacity
    const opacity = (textOverlay.opacity || 100) / 100;
    ctx.globalAlpha = opacity;
    
    ctx.fillStyle = textOverlay.color;
    ctx.font = `${textOverlay.fontWeight || 'normal'} ${textOverlay.fontSize}px Arial`;
    ctx.textAlign = 'left';
    
    if (draggedItem?.type === 'text' && draggedItem.id === textOverlay.id) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
    } else {
      ctx.shadowBlur = 0;
    }
    
    ctx.fillText(textOverlay.text, x, y);
    ctx.shadowBlur = 0;
    
    // Draw resize handles if selected
    if (textOverlay.isSelected) {
      const metrics = ctx.measureText(textOverlay.text);
      const textWidth = metrics.width;
      const textHeight = textOverlay.fontSize;
      
      // Draw selection border
      ctx.strokeStyle = '#4A90E2';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x - 2, y - textHeight, textWidth + 4, textHeight + 4);
      ctx.setLineDash([]);
      
      // Draw resize handles
      ctx.fillStyle = '#4A90E2';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      
      // Bottom-right handle (for font size)
      ctx.beginPath();
      ctx.rect(x + textWidth - 4, y - 4, 8, 8);
      ctx.fill();
      ctx.stroke();
      
      // Right-middle handle (for width - future feature)
      ctx.beginPath();
      ctx.rect(x + textWidth - 4, y - textHeight/2 - 4, 8, 8);
      ctx.fill();
      ctx.stroke();
    }
    
    // Reset opacity
    ctx.globalAlpha = 1;
  };

  const drawIconOverlay = (ctx: CanvasRenderingContext2D, iconOverlay: IconOverlay) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(iconOverlay.x, iconOverlay.y);
    
    ctx.font = `${iconOverlay.size}px Arial`;
    ctx.textAlign = 'center';
    
    if (draggedItem?.type === 'icon' && draggedItem.id === iconOverlay.id) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
    } else {
      ctx.shadowBlur = 0;
    }
    
    ctx.fillText(iconOverlay.icon, x, y);
    ctx.shadowBlur = 0;
  };

  const drawImageOverlay = (ctx: CanvasRenderingContext2D, imageOverlay: ImageOverlay) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(imageOverlay.x, imageOverlay.y);
    
    const img = new Image();
    img.onload = () => {
      if (draggedItem?.type === 'image' && draggedItem.id === imageOverlay.id) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.drawImage(img, x, y, imageOverlay.width, imageOverlay.height);
      ctx.shadowBlur = 0;
    };
    img.src = imageOverlay.src;
  };

  const drawTitle = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(map.title, width / 2, 35);
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    drawTitle(ctx);
    drawEvolutionAxis(ctx);
    drawValueChainAxis(ctx);
    
    map.connections.forEach(connection => drawConnection(ctx, connection));
    map.components.forEach(component => drawComponent(ctx, component));
    map.notes.forEach(note => drawNote(ctx, note));
    
    // Draw paths first (below shapes)
    (map.drawingPaths || []).forEach(path => drawPath(ctx, path));
    
    // Draw shapes (below other overlays)
    (map.shapeOverlays || []).forEach(shape => drawShape(ctx, shape));
    
    // Draw other overlays
    (map.textOverlays || []).forEach(textOverlay => drawTextOverlay(ctx, textOverlay));
    (map.iconOverlays || []).forEach(iconOverlay => drawIconOverlay(ctx, iconOverlay));
    (map.imageOverlays || []).forEach(imageOverlay => drawImageOverlay(ctx, imageOverlay));
    
  }, [map, width, height, draggedItem, selectedShape, selectedText, drawPath]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (onExport && canvasRef.current) {
      onExport(canvasRef.current);
    }
  }, [onExport]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Check for resize handles first
    if (selectedShape) {
      const shape = (map.shapeOverlays || []).find(s => s.id === selectedShape);
      if (shape) {
        const handle = getResizeHandle(shape, canvasX, canvasY);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          return;
        }
      }
    }
    
    // Check for text resize handles
    if (selectedText && canvas) {
      const text = (map.textOverlays || []).find(t => t.id === selectedText);
      const ctx = canvas.getContext('2d');
      if (text && ctx) {
        const handle = getTextResizeHandle(text, canvasX, canvasY, ctx);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          return;
        }
      }
    }

    if (selectedTool === 'move') {
      const itemAt = getItemAt(canvasX, canvasY);
      if (itemAt) {
        setIsDragging(true);
        setDraggedItem({ type: itemAt.type, id: itemAt.type === 'component' ? itemAt.item.name : itemAt.item.id });
        
        // Select shape if clicked
        if (itemAt.type === 'shape') {
          setSelectedShape(itemAt.item.id);
          setSelectedText(null);
          // Notify parent about text deselection
          if (onTextSelect) {
            onTextSelect(null);
          }
          // Update shape selection in map
          if (onShapeResize) {
            (map.shapeOverlays || []).forEach(shape => {
              onShapeResize(shape.id, { isSelected: shape.id === itemAt.item.id });
            });
          }
          // Deselect all texts
          if (onTextResize) {
            (map.textOverlays || []).forEach(text => {
              onTextResize(text.id, { isSelected: false });
            });
          }
        } else if (itemAt.type === 'text') {
          setSelectedText(itemAt.item.id);
          setSelectedShape(null);
          // Notify parent about text selection
          if (onTextSelect) {
            onTextSelect(itemAt.item.id);
          }
          // Update text selection in map
          if (onTextResize) {
            (map.textOverlays || []).forEach(text => {
              onTextResize(text.id, { isSelected: text.id === itemAt.item.id });
            });
          }
          // Deselect all shapes
          if (onShapeResize) {
            (map.shapeOverlays || []).forEach(shape => {
              onShapeResize(shape.id, { isSelected: false });
            });
          }
        } else {
          setSelectedShape(null);
          setSelectedText(null);
          // Notify parent about text deselection
          if (onTextSelect) {
            onTextSelect(null);
          }
          // Deselect all shapes
          if (onShapeResize) {
            (map.shapeOverlays || []).forEach(shape => {
              onShapeResize(shape.id, { isSelected: false });
            });
          }
          // Deselect all texts
          if (onTextResize) {
            (map.textOverlays || []).forEach(text => {
              onTextResize(text.id, { isSelected: false });
            });
          }
        }
        
        const { canvasX: itemX, canvasY: itemY } = coordsToCanvas(itemAt.item.x, itemAt.item.y);
        setMouseOffset({
          x: canvasX - itemX,
          y: canvasY - itemY
        });
        
        canvas.style.cursor = 'grabbing';
      } else {
        // Deselect shapes and texts when clicking empty space
        setSelectedShape(null);
        setSelectedText(null);
        if (onTextSelect) {
          onTextSelect(null);
        }
        if (onShapeResize) {
          (map.shapeOverlays || []).forEach(shape => {
            onShapeResize(shape.id, { isSelected: false });
          });
        }
        if (onTextResize) {
          (map.textOverlays || []).forEach(text => {
            onTextResize(text.id, { isSelected: false });
          });
        }
      }
    } else if (['line', 'rectangle', 'circle', 'triangle'].includes(selectedTool)) {
      setIsDrawing(true);
      const { x, y } = canvasToCoords(canvasX, canvasY);
      setDrawStart({ x: canvasX, y: canvasY });
      
      // Create shape immediately for all types
      const newShape: ShapeOverlay = {
        id: Date.now().toString(),
        type: selectedTool as any,
        x,
        y,
        strokeColor: shapeProperties.strokeColor,
        fillColor: shapeProperties.fillColor,
        strokeWidth: shapeProperties.strokeWidth,
        opacity: shapeProperties.opacity,
        filled: selectedTool === 'line' ? false : shapeProperties.filled
      };
      
      if (selectedTool === 'line') {
        newShape.endX = x;
        newShape.endY = y;
      } else if (selectedTool === 'rectangle' || selectedTool === 'triangle') {
        newShape.width = 0;
        newShape.height = 0;
      } else if (selectedTool === 'circle') {
        newShape.radius = 0;
      }
      
      onShapeAdd?.(newShape);
    } else if (selectedTool === 'pen') {
      setIsDrawingPath(true);
      const { x, y } = canvasToCoords(canvasX, canvasY);
      
      // Create new drawing path
      const newPath: DrawingPath = {
        id: Date.now().toString(),
        points: [{ x, y }],
        strokeColor: drawingProperties.color,
        strokeWidth: drawingProperties.strokeWidth,
        opacity: drawingProperties.opacity
      };
      
      setCurrentPathId(newPath.id);
      onDrawingAdd?.(newPath);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (isResizing && selectedText && resizeHandle && onTextResize && canvas) {
      const text = (map.textOverlays || []).find(t => t.id === selectedText);
      const ctx = canvas.getContext('2d');
      if (text && ctx) {
        const { canvasX: textX, canvasY: textY } = coordsToCanvas(text.x, text.y);
        
        if (resizeHandle === 'se') {
          // Resize font size based on distance from text position
          const distance = Math.sqrt((canvasX - textX) ** 2 + (canvasY - textY) ** 2);
          const newFontSize = Math.max(8, Math.min(72, distance / 5)); // Clamp between 8 and 72
          onTextResize(text.id, { fontSize: Math.round(newFontSize) });
        } else if (resizeHandle === 'e') {
          // Future: could implement text width scaling here
        }
      }
    } else if (isResizing && selectedShape && resizeHandle && onShapeResize) {
      const shape = (map.shapeOverlays || []).find(s => s.id === selectedShape);
      if (shape) {
        const { x, y } = canvasToCoords(canvasX, canvasY);
        
        if (shape.type === 'line') {
          if (resizeHandle === 'start') {
            onShapeResize(shape.id, { x, y });
          } else if (resizeHandle === 'end') {
            onShapeResize(shape.id, { endX: x, endY: y });
          }
        } else if (shape.type === 'rectangle') {
          const { canvasX: shapeX, canvasY: shapeY } = coordsToCanvas(shape.x, shape.y);
          const pixelWidth = (shape.width || 0) * (canvas.width - 100);
          const pixelHeight = (shape.height || 0) * (canvas.height - 100);
          
          if (resizeHandle === 'nw') {
            const newWidth = shapeX + pixelWidth - canvasX;
            const newHeight = shapeY + pixelHeight - canvasY;
            onShapeResize(shape.id, { 
              x, 
              y, 
              width: newWidth / (canvas.width - 100), 
              height: newHeight / (canvas.height - 100) 
            });
          } else if (resizeHandle === 'ne') {
            const newWidth = canvasX - shapeX;
            const newHeight = shapeY + pixelHeight - canvasY;
            onShapeResize(shape.id, { 
              y, 
              width: newWidth / (canvas.width - 100), 
              height: newHeight / (canvas.height - 100) 
            });
          } else if (resizeHandle === 'sw') {
            const newWidth = shapeX + pixelWidth - canvasX;
            const newHeight = canvasY - shapeY;
            onShapeResize(shape.id, { 
              x, 
              width: newWidth / (canvas.width - 100), 
              height: newHeight / (canvas.height - 100) 
            });
          } else if (resizeHandle === 'se') {
            const newWidth = canvasX - shapeX;
            const newHeight = canvasY - shapeY;
            onShapeResize(shape.id, { 
              width: newWidth / (canvas.width - 100), 
              height: newHeight / (canvas.height - 100) 
            });
          }
        } else if (shape.type === 'circle') {
          const { canvasX: centerX, canvasY: centerY } = coordsToCanvas(shape.x, shape.y);
          const newRadius = Math.sqrt((canvasX - centerX) ** 2 + (canvasY - centerY) ** 2);
          const normalizedRadius = newRadius / Math.min(canvas.width - 100, canvas.height - 100);
          onShapeResize(shape.id, { radius: normalizedRadius });
        }
      }
    } else if (isDrawing && onShapeAdd) {
      const { x, y } = canvasToCoords(canvasX, canvasY);
      const startCoords = canvasToCoords(drawStart.x, drawStart.y);
      
      const shapes = map.shapeOverlays || [];
      const currentShape = shapes[shapes.length - 1];
      
      if (currentShape && onShapeResize) {
        if (selectedTool === 'line') {
          onShapeResize(currentShape.id, { endX: x, endY: y });
        } else if (selectedTool === 'rectangle' || selectedTool === 'triangle') {
          const width = canvasX - drawStart.x;
          const height = canvasY - drawStart.y;
          
          // Calculate normalized dimensions
          const normalizedWidth = Math.abs(width) / (canvas.width - 100);
          const normalizedHeight = Math.abs(height) / (canvas.height - 100);
          
          onShapeResize(currentShape.id, { 
            x: width < 0 ? x : startCoords.x,
            y: height < 0 ? y : startCoords.y,
            width: normalizedWidth, 
            height: normalizedHeight 
          });
        } else if (selectedTool === 'circle') {
          const radius = Math.sqrt((canvasX - drawStart.x) ** 2 + (canvasY - drawStart.y) ** 2);
          // Normalize radius based on canvas size
          const normalizedRadius = radius / Math.min(canvas.width - 100, canvas.height - 100);
          onShapeResize(currentShape.id, { radius: normalizedRadius });
        }
      }
    } else if (isDrawingPath && currentPathId && onDrawingUpdate) {
      const { x, y } = canvasToCoords(canvasX, canvasY);
      const paths = map.drawingPaths || [];
      const currentPath = paths.find(p => p.id === currentPathId);
      
      if (currentPath) {
        const newPoints = [...currentPath.points, { x, y }];
        onDrawingUpdate(currentPathId, newPoints);
      }
    } else if (isDragging && draggedItem) {
      const newCanvasX = canvasX - mouseOffset.x;
      const newCanvasY = canvasY - mouseOffset.y;
      const { x, y } = canvasToCoords(newCanvasX, newCanvasY);
      
      if (draggedItem.type === 'component' && onComponentMove) {
        onComponentMove(draggedItem.id, x, y);
      } else if (draggedItem.type === 'drawing' && onOverlayMove) {
        // For drawings, we need to move all points
        const drawing = (map.drawingPaths || []).find(d => d.id === draggedItem.id);
        if (drawing) {
          const deltaX = x - drawing.points[0].x;
          const deltaY = y - drawing.points[0].y;
          const newPoints = drawing.points.map(point => ({
            x: point.x + deltaX,
            y: point.y + deltaY
          }));
          onDrawingUpdate?.(draggedItem.id, newPoints);
        }
      } else if (onOverlayMove) {
        onOverlayMove(draggedItem.type as any, draggedItem.id, x, y);
      }
    } else if (selectedTool === 'move') {
      const itemAt = getItemAt(canvasX, canvasY);
      
      // Check for resize handles
      if (selectedShape) {
        const shape = (map.shapeOverlays || []).find(s => s.id === selectedShape);
        if (shape) {
          const handle = getResizeHandle(shape, canvasX, canvasY);
          if (handle) {
            canvas.style.cursor = 'nwse-resize';
            return;
          }
        }
      }
      
      // Check for text resize handles
      if (selectedText && canvas) {
        const text = (map.textOverlays || []).find(t => t.id === selectedText);
        const ctx = canvas.getContext('2d');
        if (text && ctx) {
          const handle = getTextResizeHandle(text, canvasX, canvasY, ctx);
          if (handle) {
            canvas.style.cursor = 'nwse-resize';
            return;
          }
        }
      }
      
      canvas.style.cursor = itemAt ? 'grab' : 'default';
    } else if (selectedTool === 'pen') {
      canvas.style.cursor = 'crosshair';
    } else {
      // Check if hovering over any deletable item
      const itemAt = getItemAt(canvasX, canvasY);
      if (itemAt && itemAt.type !== 'component') {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = selectedTool === 'move' ? 'default' : 'crosshair';
    }
    
    if (isDrawing && selectedTool !== 'line') {
      const shapes = map.shapeOverlays || [];
      const currentShape = shapes[shapes.length - 1];
      
      if (currentShape && !currentShape.width && !currentShape.height && !currentShape.radius) {
        // Create default shape if no dragging occurred
        if (onShapeAdd && canvas) {
          if (selectedTool === 'rectangle' || selectedTool === 'triangle') {
            // Convert default pixel dimensions to normalized
            const normalizedWidth = 100 / (canvas.width - 100);
            const normalizedHeight = 80 / (canvas.height - 100);
            onShapeResize?.(currentShape.id, { width: normalizedWidth, height: normalizedHeight });
          } else if (selectedTool === 'circle') {
            // Convert default pixel radius to normalized
            const normalizedRadius = 50 / Math.min(canvas.width - 100, canvas.height - 100);
            onShapeResize?.(currentShape.id, { radius: normalizedRadius });
          }
        }
      }
    }
    
    setIsDragging(false);
    setIsDrawing(false);
    setIsResizing(false);
    setIsDrawingPath(false);
    setCurrentPathId(null);
    setDraggedItem(null);
    setMouseOffset({ x: 0, y: 0 });
    setResizeHandle(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging || isDrawing || isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const { x, y } = canvasToCoords(canvasX, canvasY);

    if (selectedTool === 'text' && onTextAdd) {
      const rect = canvas.getBoundingClientRect();
      setTextInputState({ 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top, 
        visible: true 
      });
      setTextInputValue('');
    } else if (selectedTool === 'icon' && onIconAdd) {
      const icon = window.prompt('Icon/Emoji eingeben:');
      if (icon) {
        const iconOverlay: IconOverlay = {
          id: Date.now().toString(),
          icon,
          x,
          y,
          size: 24
        };
        onIconAdd(iconOverlay);
      }
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    const itemAt = getItemAt(canvasX, canvasY);
    if (itemAt && onOverlayDelete) {
      // Don't allow deleting components (they're part of the map definition)
      if (itemAt.type === 'component') {
        alert('Komponenten können nicht gelöscht werden. Bearbeiten Sie die Map-Definition.');
        return;
      }
      
      const typeNames = {
        text: 'Text',
        icon: 'Icon',
        image: 'Bild',
        shape: 'Form',
        drawing: 'Zeichnung'
      };
      
      const typeName = typeNames[itemAt.type] || 'Element';
      
      if (window.confirm(`${typeName} löschen?`)) {
        onOverlayDelete(itemAt.type as any, itemAt.item.id);
      }
    }
  };

  const handleTextSubmit = () => {
    if (textInputValue.trim() && onTextAdd) {
      const { x, y } = canvasToCoords(textInputState.x, textInputState.y);
      const textOverlay: TextOverlay = {
        id: Date.now().toString(),
        text: textInputValue,
        x,
        y,
        fontSize: textProperties.fontSize,
        color: textProperties.color,
        fontWeight: textProperties.fontWeight,
        opacity: textProperties.opacity
      };
      onTextAdd(textOverlay);
      setTextInputState({ x: 0, y: 0, visible: false });
      setTextInputValue('');
      
      // Make the text immediately draggable
      setDraggedItem({ type: 'text', id: textOverlay.id });
      setIsDragging(true);
      setMouseOffset({ x: 0, y: 0 });
    }
  };

  const handleTextCancel = () => {
    setTextInputState({ x: 0, y: 0, visible: false });
    setTextInputValue('');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          border: isDragOver ? '2px solid #4A90E2' : '1px solid #ccc', 
          backgroundColor: isDragOver ? '#f0f8ff' : 'white' 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          setIsDragOver(true);
        }}
        onDragLeave={() => {
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          
          const icon = e.dataTransfer.getData('icon');
          if (icon && onIconAdd) {
            const rect = canvasRef.current!.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;
            const { x, y } = canvasToCoords(canvasX, canvasY);
            
            const iconOverlay: IconOverlay = {
              id: Date.now().toString(),
              icon,
              x,
              y,
              size: 20  // Default icon size
            };
            onIconAdd(iconOverlay);
          }
        }}
      />
      
      {textInputState.visible && (
        <div style={{
          position: 'absolute',
          left: textInputState.x,
          top: textInputState.y,
          backgroundColor: 'white',
          border: '2px solid #4A90E2',
          borderRadius: '4px',
          padding: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <input
            type="text"
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit();
              } else if (e.key === 'Escape') {
                handleTextCancel();
              }
            }}
            onBlur={handleTextSubmit}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: `${textProperties.fontSize}px`,
              color: textProperties.color,
              fontWeight: textProperties.fontWeight,
              backgroundColor: 'transparent',
              minWidth: '100px'
            }}
            autoFocus
            placeholder="Text eingeben..."
          />
        </div>
      )}
    </div>
  );
};