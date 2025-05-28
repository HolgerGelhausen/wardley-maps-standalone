import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WardleyMap, Component, Connection, Note, TextOverlay, IconOverlay, ImageOverlay, ShapeOverlay, DrawingPath, AnimationSequenceItem } from '../types/WardleyMap';

interface PresentationWardleyMapCanvasProps {
  map: WardleyMap;
  width?: number;
  height?: number;
  onAnimationItemClick?: (type: string, id: string) => void;
  onExport?: (canvas: HTMLCanvasElement) => void;
  autoplayStep?: number;
  onStepChange?: (step: number) => void;
}

export const PresentationWardleyMapCanvas: React.FC<PresentationWardleyMapCanvasProps> = ({
  map,
  width = 1400,
  height = 1000,
  onAnimationItemClick,
  onExport,
  autoplayStep,
  onStepChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  
  // Use autoplayStep if provided, otherwise use local currentStep
  useEffect(() => {
    if (autoplayStep !== undefined) {
      setCurrentStep(autoplayStep);
      setIsPresenting(true);
    }
  }, [autoplayStep]);
  
  // Notify parent when step changes manually
  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    onStepChange?.(newStep);
  };

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

  const drawTitle = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(map.title, width / 2, 35);
  };

  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component, opacity: number = 1, isRecorded: boolean = false, sequenceNumber?: number) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(component.x, component.y);
    
    ctx.globalAlpha = opacity;
    
    // Use red color if recorded during recording mode
    if (isRecorded && map.animationSequence?.isRecording) {
      ctx.fillStyle = '#f44336';
      ctx.strokeStyle = '#f44336';
    } else {
      ctx.fillStyle = getComponentColor(component);
      ctx.strokeStyle = getComponentColor(component);
    }
    
    if (component.inertia) {
      ctx.setLineDash([5, 5]);
    } else {
      ctx.setLineDash([]);
    }
    
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Use the same color for text as the component
    if (isRecorded && map.animationSequence?.isRecording) {
      ctx.fillStyle = '#f44336';
    } else {
      ctx.fillStyle = getComponentColor(component);
    }
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelX = component.label?.x || 0;
    const labelY = component.label?.y || -20;
    ctx.fillText(component.name, x + labelX, y + labelY);
    
    // Show sequence number during recording
    if (isRecorded && map.animationSequence?.isRecording && sequenceNumber !== undefined) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 15, y - 15, 20, 20);
      ctx.fillStyle = '#f44336';
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 15, y - 15, 20, 20);
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sequenceNumber.toString(), x - 5, y - 5);
    }
    
    ctx.globalAlpha = 1;
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: Connection, opacity: number = 1, isRecorded: boolean = false, sequenceNumber?: number) => {
    const fromComponent = map.components.find(c => c.name === connection.from);
    const toComponent = map.components.find(c => c.name === connection.to);
    
    if (!fromComponent || !toComponent) return;
    
    const { canvasX: x1, canvasY: y1 } = coordsToCanvas(fromComponent.x, fromComponent.y);
    const { canvasX: x2, canvasY: y2 } = coordsToCanvas(toComponent.x, toComponent.y);
    
    ctx.globalAlpha = opacity;
    
    // Use red color if recorded during recording mode
    if (isRecorded && map.animationSequence?.isRecording) {
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
    }
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Show sequence number during recording
    if (isRecorded && map.animationSequence?.isRecording && sequenceNumber !== undefined) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.fillStyle = '#fff';
      ctx.fillRect(midX - 15, midY - 15, 20, 20);
      ctx.fillStyle = '#f44336';
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2;
      ctx.strokeRect(midX - 15, midY - 15, 20, 20);
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sequenceNumber.toString(), midX - 5, midY - 5);
    }
    
    ctx.globalAlpha = 1;
  };

  const drawNote = (ctx: CanvasRenderingContext2D, note: Note, opacity: number = 1) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(note.x, note.y);
    
    ctx.globalAlpha = opacity;
    // Remove background and border in presentation mode
    // ctx.fillStyle = '#FFF9C4';
    // ctx.strokeStyle = '#F9A825';
    // ctx.lineWidth = 1;
    
    // const width = 150;
    // const height = 60;
    
    // ctx.fillRect(x - width/2, y - height/2, width, height);
    // ctx.strokeRect(x - width/2, y - height/2, width, height);
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(note.text, x, y);
    
    ctx.globalAlpha = 1;
  };

  const drawTextOverlay = (ctx: CanvasRenderingContext2D, textOverlay: TextOverlay, opacity: number = 1) => {
    const { canvasX: x, canvasY: y } = coordsToCanvas(textOverlay.x, textOverlay.y);
    
    // Apply opacity
    ctx.globalAlpha = opacity * ((textOverlay.opacity || 100) / 100);
    
    // Use the text's own color
    ctx.fillStyle = textOverlay.color;
    ctx.font = `${textOverlay.fontWeight || 'normal'} ${textOverlay.fontSize}px Arial`;
    ctx.textAlign = 'left';
    
    ctx.fillText(textOverlay.text, x, y);
    ctx.globalAlpha = 1;
  };

  const getItemKey = (item: AnimationSequenceItem): string => {
    if (item.type === 'connection') {
      return `connection-${item.id}`;
    }
    return `${item.type}-${item.id}`;
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

    // In presentation mode, only draw items that are visible
    if (isPresenting && map.animationSequence) {
      const sequence = map.animationSequence.items;
      
      // Create sets for visible items
      const visibleComponents = new Set<string>();
      const visibleConnections = new Set<string>();
      
      // Process sequence up to current step
      sequence.slice(0, currentStep).forEach((item, index) => {
        if (item.type === 'component') {
          visibleComponents.add(item.id);
        } else if (item.type === 'connection') {
          visibleConnections.add(item.id);
        }
      });
      
      // Draw all visible items with appropriate opacity
      map.connections.forEach(connection => {
        const connId = `${connection.from}->${connection.to}`;
        if (visibleConnections.has(connId)) {
          const itemIndex = sequence.findIndex(item => 
            item.type === 'connection' && item.id === connId
          );
          const opacity = itemIndex === currentStep - 1 ? 0.7 : 1;
          drawConnection(ctx, connection, opacity, false);
        }
      });
      
      map.components.forEach(component => {
        if (visibleComponents.has(component.name)) {
          const itemIndex = sequence.findIndex(item => 
            item.type === 'component' && item.id === component.name
          );
          const opacity = itemIndex === currentStep - 1 ? 0.7 : 1;
          drawComponent(ctx, component, opacity, false);
        }
      });
      
      map.notes.forEach(note => {
        // Show notes if their component is visible
        const relatedComponent = map.components.find(c => 
          Math.abs(c.x - note.x) < 0.1 && Math.abs(c.y - note.y) < 0.1
        );
        if (relatedComponent && visibleComponents.has(relatedComponent.name)) {
          drawNote(ctx, note);
        }
      });
      
      // Draw text overlays - always visible in presentation mode
      if (map.textOverlays) {
        map.textOverlays.forEach(text => drawTextOverlay(ctx, text));
      }
    } else {
      // Normal mode - draw everything
      // Get recorded items for red highlighting during recording
      const recordedComponents = new Set(
        (map.animationSequence?.items || [])
          .filter(item => item.type === 'component')
          .map(item => item.id)
      );
      const recordedConnections = new Set(
        (map.animationSequence?.items || [])
          .filter(item => item.type === 'connection')
          .map(item => item.id)
      );
      
      map.connections.forEach(connection => {
        const connId = `${connection.from}->${connection.to}`;
        const isRecorded = recordedConnections.has(connId);
        // Find sequence number
        const sequenceItem = (map.animationSequence?.items || []).find(
          item => item.type === 'connection' && item.id === connId
        );
        drawConnection(ctx, connection, 1, isRecorded, sequenceItem?.order);
      });
      
      map.components.forEach(component => {
        const isRecorded = recordedComponents.has(component.name);
        // Find sequence number
        const sequenceItem = (map.animationSequence?.items || []).find(
          item => item.type === 'component' && item.id === component.name
        );
        drawComponent(ctx, component, 1, isRecorded, sequenceItem?.order);
      });
      
      map.notes.forEach(note => drawNote(ctx, note));
      
      // Draw text overlays
      if (map.textOverlays) {
        map.textOverlays.forEach(text => drawTextOverlay(ctx, text));
      }
    }
  }, [map, width, height, isPresenting, currentStep]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    if (onExport && canvasRef.current) {
      onExport(canvasRef.current);
    }
  }, [onExport]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // If in recording mode, track clicks
    if (map.animationSequence?.isRecording) {
      // Check what was clicked
      for (const component of map.components) {
        const { canvasX: compX, canvasY: compY } = coordsToCanvas(component.x, component.y);
        if (Math.sqrt((canvasX - compX) ** 2 + (canvasY - compY) ** 2) < 20) {
          
          // Check if component is already recorded
          const isAlreadyRecorded = map.animationSequence.items.some(
            item => item.type === 'component' && item.id === component.name
          );
          
          if (isAlreadyRecorded) {
            // Remove from animation sequence
            onAnimationItemClick?.('remove-component', component.name);
          } else {
            // Add to animation sequence
            onAnimationItemClick?.('component', component.name);
          }
          
          return;
        }
      }
      
      // Check for connection clicks
      for (const connection of map.connections) {
        const fromComp = map.components.find(c => c.name === connection.from);
        const toComp = map.components.find(c => c.name === connection.to);
        
        if (fromComp && toComp) {
          const { canvasX: x1, canvasY: y1 } = coordsToCanvas(fromComp.x, fromComp.y);
          const { canvasX: x2, canvasY: y2 } = coordsToCanvas(toComp.x, toComp.y);
          
          // Simple distance to line calculation
          const dist = distanceToLine(canvasX, canvasY, x1, y1, x2, y2);
          
          if (dist < 10) {
            const connectionId = `${connection.from}->${connection.to}`;
            
            // Check if connection is already recorded
            const isAlreadyRecorded = map.animationSequence.items.some(
              item => item.type === 'connection' && item.id === connectionId
            );
            
            if (isAlreadyRecorded) {
              // Remove from animation sequence
              onAnimationItemClick?.('remove-connection', connectionId);
            } else {
              // Add to animation sequence
              onAnimationItemClick?.('connection', connectionId);
            }
            
            return;
          }
        }
      }
    }

    // If in presentation mode, advance to next step
    if (isPresenting && map.animationSequence) {
      if (currentStep < map.animationSequence.items.length) {
        updateStep(currentStep + 1);
      } else {
        // Reset presentation
        updateStep(0);
        setIsPresenting(false);
      }
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isPresenting || !map.animationSequence) return;

    if (event.key === 'ArrowRight' || event.key === ' ') {
      if (currentStep < map.animationSequence.items.length) {
        updateStep(currentStep + 1);
      }
    } else if (event.key === 'ArrowLeft') {
      if (currentStep > 0) {
        updateStep(currentStep - 1);
      }
    } else if (event.key === 'Escape') {
      updateStep(0);
      setIsPresenting(false);
    }
  }, [isPresenting, currentStep, map.animationSequence, updateStep]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer' }}
        onClick={handleClick}
      />
      
      {/* Animation Controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        {map.animationSequence?.isRecording ? (
          <>
            <div style={{ color: 'red', fontWeight: 'bold' }}>
              ⏺ Aufnahme läuft... ({map.animationSequence.items.length} Schritte)
            </div>
            <button
              onClick={() => {
                onAnimationItemClick?.('stop', '');
              }}
              style={{
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Stopp
            </button>
          </>
        ) : (
          <>
            {isPresenting ? (
              <>
                <div>
                  Schritt {currentStep} von {map.animationSequence?.items.length || 0}
                </div>
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setIsPresenting(false);
                  }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Beenden
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setIsPresenting(true);
                  }}
                  disabled={!map.animationSequence || map.animationSequence.items.length === 0}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: (!map.animationSequence || map.animationSequence.items.length === 0) ? 0.5 : 1
                  }}
                >
                  ▶️ Präsentation starten
                </button>
                <div>
                  {map.animationSequence?.items.length || 0} Schritte
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};