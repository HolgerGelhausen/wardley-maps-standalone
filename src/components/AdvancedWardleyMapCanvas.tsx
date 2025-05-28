import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WardleyMap, Component, Connection, Note, TextOverlay, IconOverlay, ImageOverlay } from '../types/WardleyMap';
import { Tool } from './ToolPanel';

interface AdvancedWardleyMapCanvasProps {
  map: WardleyMap;
  width?: number;
  height?: number;
  selectedTool: Tool;
  onExport?: (canvas: HTMLCanvasElement) => void;
  onComponentMove?: (componentName: string, newX: number, newY: number) => void;
  onTextAdd?: (text: TextOverlay) => void;
  onIconAdd?: (icon: IconOverlay) => void;
  onImageAdd?: (image: ImageOverlay) => void;
  onOverlayMove?: (type: 'text' | 'icon' | 'image', id: string, newX: number, newY: number) => void;
  onOverlayDelete?: (type: 'text' | 'icon' | 'image', id: string) => void;
}

export const AdvancedWardleyMapCanvas: React.FC<AdvancedWardleyMapCanvasProps> = ({
  map,
  width = 1400,
  height = 1000,
  selectedTool,
  onExport,
  onComponentMove,
  onTextAdd,
  onIconAdd,
  onImageAdd,
  onOverlayMove,
  onOverlayDelete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{type: 'component' | 'text' | 'icon' | 'image', id: string} | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [pendingIcon, setPendingIcon] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

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

  const getItemAt = (canvasX: number, canvasY: number): {type: 'component' | 'text' | 'icon' | 'image', item: any} | null => {
    // Check text overlays first (smallest targets)
    for (const textOverlay of map.textOverlays || []) {
      const { canvasX: textX, canvasY: textY } = coordsToCanvas(textOverlay.x, textOverlay.y);
      if (Math.abs(canvasX - textX) < 30 && Math.abs(canvasY - textY) < 15) {
        return { type: 'text', item: textOverlay };
      }
    }

    // Check icon overlays
    for (const iconOverlay of map.iconOverlays || []) {
      const { canvasX: iconX, canvasY: iconY } = coordsToCanvas(iconOverlay.x, iconOverlay.y);
      if (Math.abs(canvasX - iconX) < iconOverlay.size && Math.abs(canvasY - iconY) < iconOverlay.size) {
        return { type: 'icon', item: iconOverlay };
      }
    }

    // Check image overlays
    for (const imageOverlay of map.imageOverlays || []) {
      const { canvasX: imgX, canvasY: imgY } = coordsToCanvas(imageOverlay.x, imageOverlay.y);
      if (canvasX >= imgX && canvasX <= imgX + imageOverlay.width &&
          canvasY >= imgY && canvasY <= imgY + imageOverlay.height) {
        return { type: 'image', item: imageOverlay };
      }
    }

    // Check components last
    for (const component of map.components) {
      const { canvasX: compX, canvasY: compY } = coordsToCanvas(component.x, component.y);
      const distance = Math.sqrt((canvasX - compX) ** 2 + (canvasY - compY) ** 2);
      if (distance <= 12) {
        return { type: 'component', item: component };
      }
    }

    return null;
  };

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
    
    // Draw overlays
    (map.textOverlays || []).forEach(textOverlay => drawTextOverlay(ctx, textOverlay));
    (map.iconOverlays || []).forEach(iconOverlay => drawIconOverlay(ctx, iconOverlay));
    (map.imageOverlays || []).forEach(imageOverlay => drawImageOverlay(ctx, imageOverlay));
    
    if (onExport && canvas) {
      onExport(canvas);
    }
  }, [map, width, height, onExport, draggedItem]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (selectedTool === 'move') {
      const itemAt = getItemAt(canvasX, canvasY);
      if (itemAt) {
        setIsDragging(true);
        setDraggedItem({ type: itemAt.type, id: itemAt.type === 'component' ? itemAt.item.name : itemAt.item.id });
        
        const { canvasX: itemX, canvasY: itemY } = coordsToCanvas(itemAt.item.x, itemAt.item.y);
        setMouseOffset({
          x: canvasX - itemX,
          y: canvasY - itemY
        });
        
        canvas.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (isDragging && draggedItem) {
      const newCanvasX = canvasX - mouseOffset.x;
      const newCanvasY = canvasY - mouseOffset.y;
      const { x, y } = canvasToCoords(newCanvasX, newCanvasY);
      
      if (draggedItem.type === 'component' && onComponentMove) {
        onComponentMove(draggedItem.id, x, y);
      } else if (onOverlayMove) {
        onOverlayMove(draggedItem.type as 'text' | 'icon' | 'image', draggedItem.id, x, y);
      }
    } else if (selectedTool === 'move') {
      const itemAt = getItemAt(canvasX, canvasY);
      canvas.style.cursor = itemAt ? 'grab' : 'default';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = selectedTool === 'move' ? 'default' : 'crosshair';
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setMouseOffset({ x: 0, y: 0 });
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const { x, y } = canvasToCoords(canvasX, canvasY);

    if (selectedTool === 'text' && onTextAdd) {
      const text = window.prompt('Text eingeben:');
      if (text) {
        const textOverlay: TextOverlay = {
          id: Date.now().toString(),
          text,
          x,
          y,
          fontSize: 16,
          color: '#000000',
          fontWeight: 'normal'
        };
        onTextAdd(textOverlay);
      }
    } else if (selectedTool === 'icon' && onIconAdd) {
      const icon = pendingIcon || window.prompt('Icon/Emoji eingeben:');
      if (icon) {
        const iconOverlay: IconOverlay = {
          id: Date.now().toString(),
          icon,
          x,
          y,
          size: 24
        };
        onIconAdd(iconOverlay);
        setPendingIcon(null);
      }
    } else if (selectedTool === 'image' && uploadedImage && onImageAdd) {
      const imageOverlay: ImageOverlay = {
        id: Date.now().toString(),
        src: uploadedImage,
        x,
        y,
        width: 100,
        height: 100
      };
      onImageAdd(imageOverlay);
      setUploadedImage(null);
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
    if (itemAt && itemAt.type !== 'component' && onOverlayDelete) {
      if (window.confirm('Overlay löschen?')) {
        onOverlayDelete(itemAt.type as 'text' | 'icon' | 'image', itemAt.item.id);
      }
    }
  };

  // Handle uploaded image
  useEffect(() => {
    if (uploadedImage) {
      // Image is ready to be placed
    }
  }, [uploadedImage]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #ccc', backgroundColor: 'white' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    />
  );
};