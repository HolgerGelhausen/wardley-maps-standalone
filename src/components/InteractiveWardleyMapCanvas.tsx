import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WardleyMap, Component, Connection, Note } from '../types/WardleyMap';

interface InteractiveWardleyMapCanvasProps {
  map: WardleyMap;
  width?: number;
  height?: number;
  onExport?: (canvas: HTMLCanvasElement) => void;
  onComponentMove?: (componentName: string, newX: number, newY: number) => void;
}

export const InteractiveWardleyMapCanvas: React.FC<InteractiveWardleyMapCanvasProps> = ({
  map,
  width = 1400,
  height = 1000,
  onExport,
  onComponentMove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

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

  const getComponentAt = (canvasX: number, canvasY: number): Component | null => {
    for (const component of map.components) {
      const { canvasX: compX, canvasY: compY } = coordsToCanvas(component.x, component.y);
      const distance = Math.sqrt((canvasX - compX) ** 2 + (canvasY - compY) ** 2);
      if (distance <= 12) { // 8px radius + 4px margin
        return component;
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
    
    // Highlight if being dragged
    if (draggedComponent === component.name) {
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
    
    if (onExport && canvas) {
      onExport(canvas);
    }
  }, [map, width, height, onExport, draggedComponent]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const component = getComponentAt(canvasX, canvasY);
    if (component) {
      setIsDragging(true);
      setDraggedComponent(component.name);
      
      const { canvasX: compX, canvasY: compY } = coordsToCanvas(component.x, component.y);
      setMouseOffset({
        x: canvasX - compX,
        y: canvasY - compY
      });
      
      canvas.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (isDragging && draggedComponent) {
      const newCanvasX = canvasX - mouseOffset.x;
      const newCanvasY = canvasY - mouseOffset.y;
      const { x, y } = canvasToCoords(newCanvasX, newCanvasY);
      
      if (onComponentMove) {
        onComponentMove(draggedComponent, x, y);
      }
    } else {
      // Update cursor based on hover
      const component = getComponentAt(canvasX, canvasY);
      canvas.style.cursor = component ? 'grab' : 'default';
    }
  };

  const handleMouseUp = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    
    setIsDragging(false);
    setDraggedComponent(null);
    setMouseOffset({ x: 0, y: 0 });
  };

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
    />
  );
};