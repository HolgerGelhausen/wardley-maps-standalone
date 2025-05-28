import React from 'react';
import { ShapePropertiesPanel } from './ShapePropertiesPanel';
import { TextPropertiesPanel } from './TextPropertiesPanel';

export type Tool = 'move' | 'text' | 'icon' | 'image' | 'line' | 'rectangle' | 'circle' | 'triangle' | 'pen';

interface ToolPanelProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  onImageUpload: (file: File) => void;
  selectedTextId?: string | null;
  shapeProperties?: {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    opacity: number;
    filled: boolean;
  };
  onShapePropertiesChange?: (properties: {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    filled?: boolean;
  }) => void;
  textProperties?: {
    color: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    opacity: number;
  };
  onTextPropertiesChange?: (properties: {
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    opacity?: number;
  }) => void;
  drawingProperties?: {
    color: string;
    strokeWidth: number;
    opacity: number;
  };
  onDrawingPropertiesChange?: (properties: {
    color?: string;
    strokeWidth?: number;
    opacity?: number;
  }) => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  selectedTool,
  onToolChange,
  onImageUpload,
  selectedTextId,
  shapeProperties = {
    strokeColor: '#000000',
    fillColor: '#000000',
    strokeWidth: 2,
    opacity: 100,
    filled: false
  },
  onShapePropertiesChange,
  textProperties = {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'normal',
    opacity: 100
  },
  onTextPropertiesChange,
  drawingProperties = {
    color: '#000000',
    strokeWidth: 2,
    opacity: 100
  },
  onDrawingPropertiesChange
}) => {

  const tools = [
    { id: 'move' as Tool, label: '🖱️ Verschieben', description: 'Komponenten verschieben' },
    { id: 'text' as Tool, label: '📝 Text', description: 'Text hinzufügen' },
    { id: 'icon' as Tool, label: '😀 Icons', description: 'Symbole hinzufügen' },
    { id: 'image' as Tool, label: '🖼️ Bild', description: 'Bilder hochladen' },
    { id: 'pen' as Tool, label: '✏️ Stift', description: 'Frei zeichnen' },
    { id: 'line' as Tool, label: '📏 Linie', description: 'Linien zeichnen' },
    { id: 'rectangle' as Tool, label: '⬜ Rechteck', description: 'Rechtecke zeichnen' },
    { id: 'circle' as Tool, label: '⭕ Kreis', description: 'Kreise zeichnen' },
    { id: 'triangle' as Tool, label: '🔺 Dreieck', description: 'Dreiecke zeichnen' }
  ];

  const popularIcons = [
    '⭐', '❗', '❓', '💡', '🔥', '⚡', '🎯', '🚀',
    '📈', '📉', '💰', '🔒', '🔓', '⚠️', '✅', '❌',
    '🏆', '🎪', '🔔', '📊', '📋', '📌', '🔍', '⚙️'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#f8f9fa',
      borderLeft: '1px solid #ccc',
      padding: '20px',
      height: '100vh',
      overflowY: 'auto'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>🛠️ Werkzeuge</h3>
      
      {/* Tool Selection */}
      <div style={{ marginBottom: '20px' }}>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              margin: '5px 0',
              border: selectedTool === tool.id ? '2px solid #4A90E2' : '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: selectedTool === tool.id ? '#e3f2fd' : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{tool.label}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{tool.description}</div>
          </button>
        ))}
      </div>

      {/* Text Tool Options - Show when text tool is selected OR when a text is selected */}
      {(selectedTool === 'text' || selectedTextId) && onTextPropertiesChange && (
        <TextPropertiesPanel
          textColor={textProperties.color}
          fontSize={textProperties.fontSize}
          fontWeight={textProperties.fontWeight}
          opacity={textProperties.opacity}
          onTextColorChange={(color) => onTextPropertiesChange({ color })}
          onFontSizeChange={(fontSize) => onTextPropertiesChange({ fontSize })}
          onFontWeightChange={(fontWeight) => onTextPropertiesChange({ fontWeight })}
          onOpacityChange={(opacity) => onTextPropertiesChange({ opacity })}
          isEditingSelected={!!selectedTextId}
        />
      )}

      {/* Icon Tool Options */}
      {selectedTool === 'icon' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Beliebte Icons</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {popularIcons.map(icon => (
              <button
                key={icon}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('icon', icon);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  textAlign: 'center'
                }}
                onClick={() => {
                  // This will be handled by the click handler in the canvas
                  navigator.clipboard.writeText(icon);
                }}
                title={`${icon} ziehen oder kopieren`}
              >
                {icon}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', margin: 0 }}>
            Icons in die Map ziehen oder klicken zum Kopieren
          </p>
        </div>
      )}

      {/* Image Tool Options */}
      {selectedTool === 'image' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Bild hochladen</h4>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', margin: 0 }}>
            PNG, JPG, GIF unterstützt
          </p>
        </div>
      )}

      {/* Pen Tool Options */}
      {selectedTool === 'pen' && onDrawingPropertiesChange && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f3e5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Stift Eigenschaften</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Farbe
            </label>
            <input
              type="color"
              value={drawingProperties.color}
              onChange={(e) => onDrawingPropertiesChange({ color: e.target.value })}
              style={{ width: '100%', height: '30px', cursor: 'pointer' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Strichstärke: {drawingProperties.strokeWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={drawingProperties.strokeWidth}
              onChange={(e) => onDrawingPropertiesChange({ strokeWidth: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              Transparenz: {drawingProperties.opacity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={drawingProperties.opacity}
              onChange={(e) => onDrawingPropertiesChange({ opacity: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Shape Tool Options */}
      {(selectedTool === 'line' || selectedTool === 'rectangle' || 
        selectedTool === 'circle' || selectedTool === 'triangle') && onShapePropertiesChange && (
        <ShapePropertiesPanel
          strokeColor={shapeProperties.strokeColor}
          fillColor={shapeProperties.fillColor}
          strokeWidth={shapeProperties.strokeWidth}
          opacity={shapeProperties.opacity}
          filled={shapeProperties.filled}
          onStrokeColorChange={(color) => onShapePropertiesChange({ strokeColor: color })}
          onFillColorChange={(color) => onShapePropertiesChange({ fillColor: color })}
          onStrokeWidthChange={(width) => onShapePropertiesChange({ strokeWidth: width })}
          onOpacityChange={(opacity) => onShapePropertiesChange({ opacity })}
          onFilledChange={(filled) => onShapePropertiesChange({ filled })}
        />
      )}

      {/* Tips */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333' }}>💡 Tipps</h4>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>Rechtsklick zum Löschen</li>
          <li>Alle Elemente verschiebbar</li>
          <li>Formen: Ecken ziehen für Größe</li>
          <li>PNG-Export enthält alles</li>
        </ul>
      </div>
    </div>
  );
};