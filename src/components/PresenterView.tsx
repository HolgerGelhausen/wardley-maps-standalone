import React, { useEffect, useState, useRef } from 'react';
import { WardleyMap, AnimationSequenceItem } from '../types/WardleyMap';
import { WardleyMapCanvas } from './WardleyMapCanvas';

interface PresenterState {
  currentStep: number;
  isPlaying: boolean;
  map: WardleyMap | null;
}

export const PresenterView: React.FC = () => {
  const [state, setState] = useState<PresenterState>({
    currentStep: 0,
    isPlaying: false,
    map: null
  });
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Listen for updates from main window
  useEffect(() => {
    const channel = new BroadcastChannel('wardley-presenter');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'presenter-update') {
        setState(event.data.state);
      }
    };
    
    channel.addEventListener('message', handleMessage);
    
    // Request initial state
    channel.postMessage({ type: 'presenter-ready' });
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  // Send control commands back to main window
  const sendCommand = (command: string, data?: any) => {
    const channel = new BroadcastChannel('wardley-presenter');
    channel.postMessage({ type: 'presenter-command', command, data });
    channel.close();
  };

  // Draw next step indicator on overlay canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || !state.map) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get next item
    const nextItem = state.map.animationSequence?.items[state.currentStep];
    if (!nextItem) return;

    // Scale factor (0.5 because mini-map is scaled to 50%)
    const scale = 0.5;

    // Helper to convert coordinates
    const coordsToCanvas = (x: number, y: number) => ({
      canvasX: (50 + x * 1300) * scale,
      canvasY: (50 + (1 - y) * 900) * scale
    });

    if (nextItem.type === 'component') {
      // Find component
      const component = state.map.components.find(c => c.name === nextItem.id);
      if (component) {
        const { canvasX, canvasY } = coordsToCanvas(component.x, component.y);
        
        // Draw pulsing red circle
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 20, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Inner dot
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else if (nextItem.type === 'connection') {
      // Find connection endpoints
      const [fromName, toName] = nextItem.id.split('->');
      const fromComp = state.map.components.find(c => c.name === fromName);
      const toComp = state.map.components.find(c => c.name === toName);
      
      if (fromComp && toComp) {
        const from = coordsToCanvas(fromComp.x, fromComp.y);
        const to = coordsToCanvas(toComp.x, toComp.y);
        
        // Draw dashed line
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(from.canvasX, from.canvasY);
        ctx.lineTo(to.canvasX, to.canvasY);
        ctx.stroke();
        
        // Draw arrow at midpoint
        const midX = (from.canvasX + to.canvasX) / 2;
        const midY = (from.canvasY + to.canvasY) / 2;
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(midX, midY, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [state.map, state.currentStep]);

  if (!state.map) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <p>Warte auf Verbindung mit Hauptfenster...</p>
      </div>
    );
  }

  const currentItem = state.map.animationSequence?.items[state.currentStep - 1];
  const nextItem = state.map.animationSequence?.items[state.currentStep];
  const totalSteps = state.map.animationSequence?.items.length || 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1e1e1e',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Presenter View</h1>
        <p style={{ margin: '5px 0', color: '#888' }}>
          Dieses Fenster ist nur für Sie sichtbar
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        flex: 1,
        minHeight: 0
      }}>
        {/* Mini Map */}
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
            Vollständige Map
          </h2>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            width: '100%',
            aspectRatio: '1.4'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
              width: '200%',
              height: '200%'
            }}>
              <WardleyMapCanvas 
                map={state.map} 
                width={1400}
                height={1000}
              />
            </div>
            <canvas
              ref={overlayCanvasRef}
              width={700}
              height={500}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>

        {/* Info Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Progress */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
              Fortschritt
            </h3>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              {state.currentStep} / {totalSteps}
            </div>
            <div style={{
              backgroundColor: '#444',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#4CAF50',
                height: '100%',
                width: `${(state.currentStep / totalSteps) * 100}%`,
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Current & Next */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '15px',
            flex: 1
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
              Animation
            </h3>
            
            {currentItem && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#4CAF50' }}>
                  Aktuell:
                </h4>
                <div style={{ fontSize: '18px' }}>
                  {currentItem.type === 'component' ? '🔵' : '➡️'} {currentItem.id}
                </div>
              </div>
            )}

            {nextItem && (
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: '#888' }}>
                  Nächster Schritt:
                </h4>
                <div style={{ fontSize: '16px', color: '#ccc' }}>
                  {nextItem.type === 'component' ? '🔵' : '➡️'} {nextItem.id}
                </div>
              </div>
            )}

            {!nextItem && state.currentStep === totalSteps && (
              <div style={{ color: '#888', fontStyle: 'italic' }}>
                Ende der Präsentation
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginTop: '20px',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        padding: '15px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <button
          onClick={() => sendCommand('previous')}
          disabled={state.currentStep === 0}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: state.currentStep === 0 ? '#444' : '#555',
            color: state.currentStep === 0 ? '#888' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: state.currentStep === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ◀ Zurück
        </button>

        <button
          onClick={() => sendCommand(state.isPlaying ? 'pause' : 'play')}
          style={{
            padding: '10px 30px',
            fontSize: '16px',
            backgroundColor: state.isPlaying ? '#f44336' : '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {state.isPlaying ? '⏸ Pause' : '▶️ Abspielen'}
        </button>

        <button
          onClick={() => sendCommand('next')}
          disabled={state.currentStep >= totalSteps}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: state.currentStep >= totalSteps ? '#444' : '#555',
            color: state.currentStep >= totalSteps ? '#888' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: state.currentStep >= totalSteps ? 'not-allowed' : 'pointer'
          }}
        >
          Weiter ▶
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        Tastenkürzel: ← Zurück | Space Abspielen/Pause | → Weiter
      </div>
    </div>
  );
};