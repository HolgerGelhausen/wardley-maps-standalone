import React, { useState, useCallback, useEffect } from 'react';
import { WardleyMapCanvas } from './components/WardleyMapCanvas';
import { InteractiveWardleyMapCanvas } from './components/InteractiveWardleyMapCanvas';
import { EnhancedWardleyMapCanvas } from './components/EnhancedWardleyMapCanvas';
import { PresentationWardleyMapCanvas } from './components/PresentationWardleyMapCanvas';
import { ToolPanel, Tool } from './components/ToolPanel';
import { ProjectPanel } from './components/ProjectPanel';
import { WardleyMapParser } from './utils/WardleyMapParser';
import { FileSystemManager } from './utils/FileSystemManager';
import { useUndoRedo } from './hooks/useUndoRedo';
import { WardleyMap, TextOverlay, IconOverlay, ImageOverlay, ShapeOverlay, DrawingPath } from './types/WardleyMap';

const EXAMPLE_MAP = `title Content & KI für KMU - Geschäftsergebnisse im Fokus

component Sichtbarkeit [0.95, 0.75] color(#FF0000)
component Beziehungen aufbauen [0.93, 0.60] label [-49.31, -37.15] color(#00FF00)
component Reichweite erzeugen [0.92, 0.65] label [8.70, -40.85] color(#0000FF)
component Verbindungen schaffen [0.88, 0.52] label [-43.13, -38.38] color(#FF00FF)
component Conversions [0.90, 0.79] color(#FFA500)

component Wertvoller Content [0.75, 0.65] label [-24.62, -47.03] (build)
component Persönliche Ansprache [0.73, 0.55] label [27.22, -11.23] (build)
component Problemlösungen [0.71, 0.70] label [5.00, -28.51] (build)
component Regelmäßige Präsenz [0.69, 0.47] label [-35.73, -58.13] (build)
component Vertrauensaufbau [0.67, 0.75] label [-8.58, -26.04] (build)

component Blog-Artikel [0.55, 0.70] (buy)
component Social Media Posts [0.53, 0.60] (buy)
component E-Mail Newsletter [0.51, 0.75] (buy)
component Video-Content [0.50, 0.33] (buy)
component Webinare/Events [0.53, 0.52] label [5.00, -10.00] (buy)

component KI-Assistent [0.32, 0.29] (outsource)
component Content-Planung [0.33, 0.50] (outsource)
component Automatisierung [0.31, 0.60] label [2.53, -48.26] (outsource)
component Analytics [0.29, 0.65] (outsource)
component Website/CMS [0.27, 0.75] (outsource)

component Zielgruppenwissen [0.21, 0.55] label [-8.58, -51.96] inertia
component Zeitmanagement [0.16, 0.53] label [23.52, 27.03] inertia
component Budget-Kontrolle [0.10, 0.74] label [33.39, -6.30] inertia
component KI-Grundkenntnisse [0.09, 0.25] label [-36.96, -24.81] inertia
component Strategie [0.09, 0.37] inertia

Sichtbarkeit -> Wertvoller Content
Sichtbarkeit -> Regelmäßige Präsenz
Beziehungen aufbauen -> Persönliche Ansprache
Beziehungen aufbauen -> Vertrauensaufbau
Reichweite erzeugen -> Wertvoller Content
Reichweite erzeugen -> Regelmäßige Präsenz
Verbindungen schaffen -> Persönliche Ansprache
Verbindungen schaffen -> Vertrauensaufbau
Conversions -> Problemlösungen
Conversions -> Vertrauensaufbau

Wertvoller Content -> Blog-Artikel
Wertvoller Content -> Video-Content
Persönliche Ansprache -> E-Mail Newsletter
Persönliche Ansprache -> Social Media Posts
Problemlösungen -> Blog-Artikel
Problemlösungen -> Webinare/Events
Regelmäßige Präsenz -> Social Media Posts
Regelmäßige Präsenz -> E-Mail Newsletter
Vertrauensaufbau -> E-Mail Newsletter
Vertrauensaufbau -> Webinare/Events

Blog-Artikel -> KI-Assistent
Blog-Artikel -> Website/CMS
Social Media Posts -> KI-Assistent
Social Media Posts -> Content-Planung
Social Media Posts -> Automatisierung
E-Mail Newsletter -> Automatisierung
E-Mail Newsletter -> Analytics
Video-Content -> KI-Assistent
Webinare/Events -> Content-Planung

KI-Assistent -> KI-Grundkenntnisse
Content-Planung -> Strategie
Content-Planung -> Zeitmanagement
Automatisierung -> Budget-Kontrolle
Analytics -> Zielgruppenwissen
Analytics -> Strategie
Website/CMS -> Budget-Kontrolle

Zielgruppenwissen -> Strategie
Strategie -> Zeitmanagement
Zeitmanagement -> Budget-Kontrolle

evolution Genesis -> Custom Built -> Product -> Commodity
style wardley

note Geschäftsziele first! [0.99, 0.65]
note Start klein! [0.45, 0.45]
note FARBEN: Schwarz=Ziele, Blau=Kundenerlebnis, Grün=Content, Orange=Tools, Gestrichelt=Fundament [0.03, -0.01]`;

function App() {
  const [mapText, setMapText] = useState(EXAMPLE_MAP);
  
  const initialMap: WardleyMap = {
    ...WardleyMapParser.parse(EXAMPLE_MAP),
    textOverlays: [],
    iconOverlays: [],
    imageOverlays: [],
    shapeOverlays: [],
    drawingPaths: [],
    animationSequence: {
      items: [],
      isRecording: false
    }
  };
  
  const { state: parsedMap, pushState: pushUndoState, undo, redo, canUndo, canRedo } = useUndoRedo(initialMap);
  
  // Helper to update map and push to undo stack
  const updateMapWithUndo = useCallback((newMap: WardleyMap) => {
    pushUndoState(newMap);
  }, [pushUndoState]);
  
  // Helper to update map without adding to undo stack (for text changes)
  const updateMapWithoutUndo = useCallback((newMap: WardleyMap) => {
    pushUndoState(newMap, true);
  }, [pushUndoState]);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'static' | 'interactive' | 'advanced' | 'presentation'>('advanced');
  const [selectedTool, setSelectedTool] = useState<Tool>('move');
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [shapeProperties, setShapeProperties] = useState({
    strokeColor: '#000000',
    fillColor: '#000000',
    strokeWidth: 2,
    opacity: 100,
    filled: false
  });
  const [drawingProperties, setDrawingProperties] = useState({
    color: '#000000',
    strokeWidth: 2,
    opacity: 100
  });
  const [textProperties, setTextProperties] = useState({
    color: '#000000',
    fontSize: 16,
    fontWeight: 'normal' as 'normal' | 'bold',
    opacity: 100
  });
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isAutoplaying, setIsAutoplaying] = useState(false);
  const [autoplayDelay, setAutoplayDelay] = useState(2); // seconds between steps
  const [currentAutoplayStep, setCurrentAutoplayStep] = useState(0);
  const [presenterWindow, setPresenterWindow] = useState<Window | null>(null);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setMapText(newText);
    try {
      const newMap = WardleyMapParser.parse(newText);
      // Only update the base map components, keep all overlays from current state
      updateMapWithoutUndo({
        ...parsedMap,
        ...newMap,
        textOverlays: parsedMap.textOverlays,
        iconOverlays: parsedMap.iconOverlays,
        imageOverlays: parsedMap.imageOverlays,
        shapeOverlays: parsedMap.shapeOverlays,
        drawingPaths: parsedMap.drawingPaths,
        animationSequence: parsedMap.animationSequence
      });
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  const handleExportPNG = async () => {
    if (!canvasRef) {
      alert('Canvas nicht verfügbar. Bitte warten Sie, bis die Map geladen ist.');
      return;
    }

    // Generate filename from map title or use default
    const filename = parsedMap.title 
      ? `${parsedMap.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`
      : 'wardley-map.png';

    // Try to save to selected directory first
    const saved = await FileSystemManager.savePNGFile(filename, canvasRef);
    
    if (!saved) {
      // Fallback to traditional download
      FileSystemManager.downloadPNG(filename, canvasRef);
    }
  };

  const handleCanvasReady = (canvas: HTMLCanvasElement) => {
    setCanvasRef(canvas);
  };

  const handleComponentMove = (componentName: string, newX: number, newY: number) => {
    const updatedMap = {
      ...parsedMap,
      components: parsedMap.components.map(comp => 
        comp.name === componentName 
          ? { ...comp, x: newX, y: newY }
          : comp
      )
    };
    updateMapWithUndo(updatedMap);

    const updatedText = mapText.replace(
      new RegExp(`(component\\s+${componentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\[)[^\\]]+`),
      `$1${newY.toFixed(2)}, ${newX.toFixed(2)}`
    );
    setMapText(updatedText);
  };

  const handleTextAdd = (textOverlay: TextOverlay) => {
    updateMapWithUndo({
      ...parsedMap,
      textOverlays: [...(parsedMap.textOverlays || []), textOverlay]
    });
  };

  const handleIconAdd = (iconOverlay: IconOverlay) => {
    updateMapWithUndo({
      ...parsedMap,
      iconOverlays: [...(parsedMap.iconOverlays || []), iconOverlay]
    });
  };

  const handleImageAdd = (imageOverlay: ImageOverlay) => {
    updateMapWithUndo({
      ...parsedMap,
      imageOverlays: [...(parsedMap.imageOverlays || []), imageOverlay]
    });
  };

  const handleOverlayMove = (type: 'text' | 'icon' | 'image' | 'shape', id: string, newX: number, newY: number) => {
    if (type === 'text') {
      updateMapWithUndo({
        ...parsedMap,
        textOverlays: (parsedMap.textOverlays || []).map(overlay =>
          overlay.id === id ? { ...overlay, x: newX, y: newY } : overlay
        )
      });
    } else if (type === 'icon') {
      updateMapWithUndo({
        ...parsedMap,
        iconOverlays: (parsedMap.iconOverlays || []).map(overlay =>
          overlay.id === id ? { ...overlay, x: newX, y: newY } : overlay
        )
      });
    } else if (type === 'image') {
      updateMapWithUndo({
        ...parsedMap,
        imageOverlays: (parsedMap.imageOverlays || []).map(overlay =>
          overlay.id === id ? { ...overlay, x: newX, y: newY } : overlay
        )
      });
    } else if (type === 'shape') {
      updateMapWithUndo({
        ...parsedMap,
        shapeOverlays: (parsedMap.shapeOverlays || []).map(overlay =>
          overlay.id === id ? { ...overlay, x: newX, y: newY } : overlay
        )
      });
    }
  };

  const handleOverlayDelete = (type: 'text' | 'icon' | 'image' | 'shape' | 'drawing', id: string) => {
    if (type === 'text') {
      updateMapWithUndo({
        ...parsedMap,
        textOverlays: (parsedMap.textOverlays || []).filter(overlay => overlay.id !== id)
      });
    } else if (type === 'icon') {
      updateMapWithUndo({
        ...parsedMap,
        iconOverlays: (parsedMap.iconOverlays || []).filter(overlay => overlay.id !== id)
      });
    } else if (type === 'image') {
      updateMapWithUndo({
        ...parsedMap,
        imageOverlays: (parsedMap.imageOverlays || []).filter(overlay => overlay.id !== id)
      });
    } else if (type === 'shape') {
      updateMapWithUndo({
        ...parsedMap,
        shapeOverlays: (parsedMap.shapeOverlays || []).filter(overlay => overlay.id !== id)
      });
    } else if (type === 'drawing') {
      updateMapWithUndo({
        ...parsedMap,
        drawingPaths: (parsedMap.drawingPaths || []).filter(path => path.id !== id)
      });
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Just switch to image tool when file is loaded
      setSelectedTool('image');
    };
    reader.readAsDataURL(file);
  };

  const handleProjectLoad = (name: string, newMapText: string, newMap: WardleyMap) => {
    setCurrentProjectName(name);
    setMapText(newMapText);
    updateMapWithUndo(newMap);
  };

  const handleShapeAdd = (shape: ShapeOverlay) => {
    updateMapWithUndo({
      ...parsedMap,
      shapeOverlays: [...(parsedMap.shapeOverlays || []), shape]
    });
  };

  const handleShapeResize = (id: string, updates: Partial<ShapeOverlay>) => {
    updateMapWithUndo({
      ...parsedMap,
      shapeOverlays: (parsedMap.shapeOverlays || []).map(shape =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    });
  };

  const handleTextResize = (id: string, updates: Partial<TextOverlay>) => {
    updateMapWithUndo({
      ...parsedMap,
      textOverlays: (parsedMap.textOverlays || []).map(text =>
        text.id === id ? { ...text, ...updates } : text
      )
    });
  };

  const handleShapePropertiesChange = (properties: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    filled?: boolean;
  }) => {
    setShapeProperties({
      ...shapeProperties,
      ...properties
    });
  };

  const handleDrawingAdd = (drawing: DrawingPath) => {
    updateMapWithUndo({
      ...parsedMap,
      drawingPaths: [...(parsedMap.drawingPaths || []), drawing]
    });
  };

  const handleDrawingUpdate = (id: string, points: { x: number; y: number }[]) => {
    updateMapWithUndo({
      ...parsedMap,
      drawingPaths: (parsedMap.drawingPaths || []).map(path =>
        path.id === id ? { ...path, points } : path
      )
    });
  };

  const handleDrawingPropertiesChange = (properties: {
    color?: string;
    strokeWidth?: number;
    opacity?: number;
  }) => {
    setDrawingProperties({
      ...drawingProperties,
      ...properties
    });
  };

  const handleTextPropertiesChange = (properties: {
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    opacity?: number;
  }) => {
    setTextProperties({
      ...textProperties,
      ...properties
    });
    
    // Update selected text if one is selected
    if (selectedTextId) {
      updateMapWithUndo({
        ...parsedMap,
        textOverlays: (parsedMap.textOverlays || []).map(text =>
          text.id === selectedTextId 
            ? { 
                ...text, 
                color: properties.color || text.color,
                fontSize: properties.fontSize || text.fontSize,
                fontWeight: properties.fontWeight || text.fontWeight,
                opacity: properties.opacity !== undefined ? properties.opacity : text.opacity
              } 
            : text
        )
      });
    }
  };

  const handleTextSelect = (textId: string | null) => {
    setSelectedTextId(textId);
    
    // Update text properties to match selected text
    if (textId) {
      const selectedText = (parsedMap.textOverlays || []).find(t => t.id === textId);
      if (selectedText) {
        setTextProperties({
          color: selectedText.color,
          fontSize: selectedText.fontSize,
          fontWeight: selectedText.fontWeight || 'normal',
          opacity: selectedText.opacity || 100
        });
      }
    }
  };

  const handleAnimationItemClick = (type: string, id: string) => {
    if (type === 'stop') {
      updateMapWithUndo({
        ...parsedMap,
        animationSequence: {
          ...parsedMap.animationSequence!,
          isRecording: false
        }
      });
      return;
    }
    
    if (!parsedMap.animationSequence?.isRecording) return;
    
    // Handle removal
    if (type === 'remove-component' || type === 'remove-connection') {
      const actualType = type === 'remove-component' ? 'component' : 'connection';
      const filteredItems = parsedMap.animationSequence.items.filter(
        item => !(item.type === actualType && item.id === id)
      );
      
      // Re-order the remaining items
      const reorderedItems = filteredItems.map((item, index) => ({
        ...item,
        order: index + 1
      }));
      
      updateMapWithUndo({
        ...parsedMap,
        animationSequence: {
          ...parsedMap.animationSequence,
          items: reorderedItems
        }
      });
      return;
    }
    
    // Check if item already exists in sequence
    const existingIndex = parsedMap.animationSequence.items.findIndex(
      item => item.type === type && item.id === id
    );
    
    if (existingIndex === -1) {
      const newItem = {
        type: type as any,
        id,
        order: parsedMap.animationSequence.items.length + 1
      };
      
      updateMapWithUndo({
        ...parsedMap,
        animationSequence: {
          ...parsedMap.animationSequence,
          items: [...parsedMap.animationSequence.items, newItem]
        }
      });
    }
  };

  const toggleAnimationRecording = () => {
    updateMapWithUndo({
      ...parsedMap,
      animationSequence: {
        items: parsedMap.animationSequence?.isRecording ? parsedMap.animationSequence.items : [],
        isRecording: !parsedMap.animationSequence?.isRecording
      }
    });
  };

  const clearAnimationSequence = () => {
    updateMapWithUndo({
      ...parsedMap,
      animationSequence: {
        items: [],
        isRecording: false
      }
    });
    setIsAutoplaying(false);
    setCurrentAutoplayStep(0);
  };

  const startAutoplay = () => {
    if (parsedMap.animationSequence?.items.length) {
      setIsAutoplaying(true);
      // Don't reset to 0, continue from current step
      // setCurrentAutoplayStep(0);
    }
  };

  const stopAutoplay = () => {
    setIsAutoplaying(false);
  };

  // Autoplay effect
  useEffect(() => {
    if (isAutoplaying && parsedMap.animationSequence?.items.length) {
      const totalSteps = parsedMap.animationSequence.items.length;
      
      if (currentAutoplayStep >= totalSteps) {
        // Animation complete
        setIsAutoplaying(false);
        setCurrentAutoplayStep(0);
        return;
      }

      const timer = setTimeout(() => {
        setCurrentAutoplayStep(prev => prev + 1);
      }, autoplayDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isAutoplaying, currentAutoplayStep, autoplayDelay, parsedMap.animationSequence]);

  // Open presenter window
  const openPresenterView = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width - width - 50;
    const top = 50;
    
    const presenterWin = window.open(
      '/?presenter=true',
      'wardley-presenter',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    setPresenterWindow(presenterWin);
  };

  // Presenter communication
  useEffect(() => {
    const channel = new BroadcastChannel('wardley-presenter');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'presenter-ready') {
        // Send initial state
        channel.postMessage({
          type: 'presenter-update',
          state: {
            currentStep: currentAutoplayStep,
            isPlaying: isAutoplaying,
            map: parsedMap
          }
        });
      } else if (event.data.type === 'presenter-command') {
        switch (event.data.command) {
          case 'play':
            startAutoplay();
            break;
          case 'pause':
            stopAutoplay();
            break;
          case 'next':
            setCurrentAutoplayStep(prev => 
              Math.min(prev + 1, parsedMap.animationSequence?.items.length || 0)
            );
            break;
          case 'previous':
            setCurrentAutoplayStep(prev => Math.max(prev - 1, 0));
            break;
        }
      }
    };
    
    channel.addEventListener('message', handleMessage);
    
    // Send updates when state changes
    channel.postMessage({
      type: 'presenter-update',
      state: {
        currentStep: currentAutoplayStep,
        isPlaying: isAutoplaying,
        map: parsedMap
      }
    });
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [currentAutoplayStep, isAutoplaying, parsedMap, startAutoplay, stopAutoplay]);

  // Close presenter window on unmount
  useEffect(() => {
    return () => {
      if (presenterWindow && !presenterWindow.closed) {
        presenterWindow.close();
      }
    };
  }, [presenterWindow]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Left Panel - Editor */}
      <div style={{ 
        width: '400px', 
        padding: '20px', 
        borderRight: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        overflowY: 'auto'
      }}>
        <h2>Wardley Map Editor V3</h2>
        
        {/* Project Management */}
        <ProjectPanel
          currentProjectName={currentProjectName}
          mapText={mapText}
          map={parsedMap}
          onProjectLoad={handleProjectLoad}
          onProjectNameChange={setCurrentProjectName}
        />
        
        {/* Undo/Redo Buttons */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Rückgängig (Cmd+Z)"
              style={{
                padding: '8px 12px',
                backgroundColor: canUndo ? '#2196F3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: canUndo ? 'pointer' : 'not-allowed',
                fontSize: '12px'
              }}
            >
              ↶ Rückgängig
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Wiederholen (Cmd+Shift+Z)"
              style={{
                padding: '8px 12px',
                backgroundColor: canRedo ? '#2196F3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: canRedo ? 'pointer' : 'not-allowed',
                fontSize: '12px'
              }}
            >
              ↷ Wiederholen
            </button>
          </div>
        </div>
        
        {/* Mode Selection */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Modus:</h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setMode('static')}
              style={{
                padding: '8px 12px',
                backgroundColor: mode === 'static' ? '#4A90E2' : '#ddd',
                color: mode === 'static' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📄 Statisch
            </button>
            <button
              onClick={() => setMode('interactive')}
              style={{
                padding: '8px 12px',
                backgroundColor: mode === 'interactive' ? '#4A90E2' : '#ddd',
                color: mode === 'interactive' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🖱️ Interaktiv
            </button>
            <button
              onClick={() => setMode('advanced')}
              style={{
                padding: '8px 12px',
                backgroundColor: mode === 'advanced' ? '#4A90E2' : '#ddd',
                color: mode === 'advanced' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🎨 Erweitert
            </button>
            <button
              onClick={() => setMode('presentation')}
              style={{
                padding: '8px 12px',
                backgroundColor: mode === 'presentation' ? '#4A90E2' : '#ddd',
                color: mode === 'presentation' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🎭 Präsentation
            </button>
          </div>
        </div>

        {/* Animation Controls */}
        {mode === 'presentation' && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f3e5f5',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🎭 Präsentations-Sequenz</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <button
                onClick={toggleAnimationRecording}
                style={{
                  padding: '8px 16px',
                  backgroundColor: parsedMap.animationSequence?.isRecording ? '#f44336' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  fontSize: '12px'
                }}
              >
                {parsedMap.animationSequence?.isRecording ? '⏹ Aufnahme stoppen' : '⏺ Aufnahme starten'}
              </button>
              
              <button
                onClick={clearAnimationSequence}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🗑️ Sequenz löschen
              </button>
            </div>
            
            <div style={{ fontSize: '12px', color: '#666' }}>
              <p>Schritte: {parsedMap.animationSequence?.items.length || 0}</p>
              {parsedMap.animationSequence?.isRecording && (
                <p style={{ color: '#f44336', fontWeight: 'bold' }}>
                  Klicken Sie auf Komponenten und dann auf die Verbindungen zwischen ihnen!
                </p>
              )}
            </div>
            
            {/* Autoplay Controls */}
            {parsedMap.animationSequence && parsedMap.animationSequence.items.length > 0 && !parsedMap.animationSequence.isRecording && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                marginBottom: '10px'
              }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '12px' }}>▶️ Automatische Wiedergabe</strong>
                  <button
                    onClick={openPresenterView}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#673AB7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                    title="Öffnet ein separates Fenster mit Presenter-Ansicht"
                  >
                    👁️ Presenter
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <button
                    onClick={isAutoplaying ? stopAutoplay : startAutoplay}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isAutoplaying ? '#f44336' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {isAutoplaying ? '⏸ Pause' : '▶️ Fortsetzen'}
                  </button>
                  
                  <div style={{ fontSize: '11px' }}>
                    <label>
                      Verzögerung: 
                      <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={autoplayDelay}
                        onChange={(e) => setAutoplayDelay(Number(e.target.value))}
                        disabled={isAutoplaying}
                        style={{
                          width: '50px',
                          marginLeft: '5px',
                          marginRight: '5px',
                          padding: '2px 4px',
                          fontSize: '11px'
                        }}
                      />
                      Sek.
                    </label>
                  </div>
                </div>
                
                {isAutoplaying && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Schritt {currentAutoplayStep} von {parsedMap.animationSequence.items.length}
                  </div>
                )}
              </div>
            )}
            
            {parsedMap.animationSequence && parsedMap.animationSequence.items.length > 0 && (
              <div style={{
                marginTop: '10px',
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '5px',
                fontSize: '11px'
              }}>
                <strong>Sequenz:</strong>
                {parsedMap.animationSequence.items.map((item, index) => (
                  <div key={index} style={{ 
                    padding: '2px 0',
                    color: item.type === 'component' ? '#4A90E2' : '#666'
                  }}>
                    {index + 1}. {item.type === 'component' ? '🔵' : '➡️'} {item.id}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExportPNG}
          style={{
            width: '100%',
            backgroundColor: '#4A90E2',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '15px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📥 PNG Export
        </button>

        {/* Syntax Help */}
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
          <p><strong>Syntax:</strong></p>
          <p>• component Name [y, x] color(#FF0000)</p>
          <p>• component Name [y, x] (build|buy|outsource)</p>
          <p>• component Name [y, x] inertia</p>
          <p>• Name -&gt; Other Component</p>
        </div>

        {/* Text Editor */}
        <textarea
          value={mapText}
          onChange={handleTextChange}
          style={{
            width: '100%',
            height: '300px',
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #ccc',
            padding: '10px',
            resize: 'vertical'
          }}
          placeholder="Geben Sie hier Ihre Wardley Map Definition ein..."
        />
      </div>

      {/* Center Panel - Canvas */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '20px'
      }}>
        {mode === 'static' && (
          <WardleyMapCanvas map={parsedMap} onExport={handleCanvasReady} />
        )}
        {mode === 'interactive' && (
          <InteractiveWardleyMapCanvas 
            map={parsedMap} 
            onExport={handleCanvasReady}
            onComponentMove={handleComponentMove}
          />
        )}
        {mode === 'advanced' && (
          <EnhancedWardleyMapCanvas
            map={parsedMap}
            selectedTool={selectedTool}
            shapeProperties={shapeProperties}
            textProperties={textProperties}
            drawingProperties={drawingProperties}
            onExport={handleCanvasReady}
            onComponentMove={handleComponentMove}
            onTextAdd={handleTextAdd}
            onIconAdd={handleIconAdd}
            onImageAdd={handleImageAdd}
            onShapeAdd={handleShapeAdd}
            onDrawingAdd={handleDrawingAdd}
            onDrawingUpdate={handleDrawingUpdate}
            onOverlayMove={handleOverlayMove}
            onOverlayDelete={handleOverlayDelete}
            onShapeResize={handleShapeResize}
            onTextResize={handleTextResize}
            onTextSelect={handleTextSelect}
          />
        )}
        {mode === 'presentation' && (
          <PresentationWardleyMapCanvas
            map={parsedMap}
            onAnimationItemClick={handleAnimationItemClick}
            onExport={handleCanvasReady}
            autoplayStep={isAutoplaying ? currentAutoplayStep : undefined}
            onStepChange={(step) => {
              setCurrentAutoplayStep(step);
              // Stop autoplay if user manually changes step
              if (isAutoplaying) {
                setIsAutoplaying(false);
              }
            }}
          />
        )}
      </div>

      {/* Right Panel - Tools (only in advanced mode) */}
      {mode === 'advanced' && (
        <ToolPanel
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          onImageUpload={handleImageUpload}
          selectedTextId={selectedTextId}
          shapeProperties={shapeProperties}
          onShapePropertiesChange={handleShapePropertiesChange}
          textProperties={textProperties}
          onTextPropertiesChange={handleTextPropertiesChange}
          drawingProperties={drawingProperties}
          onDrawingPropertiesChange={handleDrawingPropertiesChange}
        />
      )}
    </div>
  );
}

export default App;