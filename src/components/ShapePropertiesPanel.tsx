import React from 'react';

interface ShapePropertiesPanelProps {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  filled: boolean;
  onStrokeColorChange: (color: string) => void;
  onFillColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onFilledChange: (filled: boolean) => void;
}

export const ShapePropertiesPanel: React.FC<ShapePropertiesPanelProps> = ({
  strokeColor,
  fillColor,
  strokeWidth,
  opacity,
  filled,
  onStrokeColorChange,
  onFillColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onFilledChange
}) => {
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#008080', '#000080'
  ];

  return (
    <div style={{
      backgroundColor: '#f0f0ff',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px'
    }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>🎨 Form-Eigenschaften</h4>
      
      {/* Stroke Color */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Linienfarbe:
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
            style={{ width: '40px', height: '30px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="text"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '4px 8px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontSize: '12px'
            }}
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Fill Color */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          <input
            type="checkbox"
            checked={filled}
            onChange={(e) => onFilledChange(e.target.checked)}
            style={{ marginRight: '4px' }}
          />
          Füllung:
        </label>
        {filled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              style={{ width: '40px', height: '30px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="text"
              value={fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              style={{ 
                flex: 1, 
                padding: '4px 8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                fontSize: '12px'
              }}
              placeholder="#000000"
            />
          </div>
        )}
      </div>

      {/* Opacity */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Transparenz: {opacity}%
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => onOpacityChange(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <div style={{
            width: '40px',
            height: '20px',
            backgroundColor: fillColor,
            opacity: opacity / 100,
            border: '1px solid #ccc',
            borderRadius: '4px'
          }} />
        </div>
      </div>

      {/* Stroke Width */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Linienstärke: {strokeWidth}px
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Preset Colors */}
      <div>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Schnellfarben:
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)', 
          gap: '4px' 
        }}>
          {presetColors.map(color => (
            <button
              key={color}
              onClick={() => {
                onStrokeColorChange(color);
                if (filled) onFillColorChange(color);
              }}
              style={{
                width: '100%',
                height: '24px',
                backgroundColor: color,
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};