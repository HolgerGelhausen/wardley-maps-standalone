import React, { useRef, useEffect } from 'react';
import { WardleyMap, Component, Connection, Note } from '../types/WardleyMap';

interface WardleyMapCanvasProps {
  map: WardleyMap;
  width?: number;
  height?: number;
  onExport?: (canvas: HTMLCanvasElement) => void;
}

export const WardleyMapCanvas: React.FC<WardleyMapCanvasProps> = ({
  map,
  width = 1400,
  height = 1000,
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getComponentColor = (component: Component): string => {
    // Prioritize custom color first
    if (component.color) {
      console.log(`Component ${component.name} has custom color: ${component.color}`);
      return component.color;
    }
    
    // Fallback to category colors
    if (component.category === 'build') return '#4A90E2';
    if (component.category === 'buy') return '#7ED321';
    if (component.category === 'outsource') return '#F5A623';
    console.log(`Component ${component.name} using default color`);
    return '#000000';
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
    
    // Evolution label
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
    
    // Value Chain labels
    ctx.save();
    ctx.translate(25, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Value Chain', 0, 0);
    ctx.restore();
    
    // Top label (Visible/Customer)
    ctx.fillText('Visible', 25, 70);
    
    // Bottom label (Invisible/Infrastructure)  
    ctx.fillText('Invisible', 25, height - 60);
  };

  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component) => {
    const x = 50 + component.x * (width - 100);  // X-Achse (Evolution) -> horizontal
    const y = 50 + (1 - component.y) * (height - 100);  // Y-Achse (Value Chain) -> vertikal, invertiert
    
    ctx.fillStyle = getComponentColor(component);
    ctx.strokeStyle = getComponentColor(component);
    
    if (component.inertia) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
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
    
    const fromX = 50 + fromComponent.x * (width - 100);
    const fromY = 50 + (1 - fromComponent.y) * (height - 100);
    const toX = 50 + toComponent.x * (width - 100);
    const toY = 50 + (1 - toComponent.y) * (height - 100);
    
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
    const x = 50 + note.x * (width - 100);
    const y = 50 + (1 - note.y) * (height - 100);
    
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    drawTitle(ctx);
    drawEvolutionAxis(ctx);
    drawValueChainAxis(ctx);
    
    map.connections.forEach(connection => drawConnection(ctx, connection));
    map.components.forEach(component => drawComponent(ctx, component));
    map.notes.forEach(note => drawNote(ctx, note));
    
    // Expose canvas for export
    if (onExport && canvas) {
      onExport(canvas);
    }
    
  }, [map, width, height, onExport]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ border: '1px solid #ccc', backgroundColor: 'white' }}
    />
  );
};