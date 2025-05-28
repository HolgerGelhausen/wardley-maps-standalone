import React from 'react';

interface TextPropertiesPanelProps {
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  opacity: number;
  onTextColorChange: (color: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: 'normal' | 'bold') => void;
  onOpacityChange: (opacity: number) => void;
  isEditingSelected?: boolean;
}

export const TextPropertiesPanel: React.FC<TextPropertiesPanelProps> = ({
  textColor,
  fontSize,
  fontWeight,
  opacity,
  onTextColorChange,
  onFontSizeChange,
  onFontWeightChange,
  onOpacityChange,
  isEditingSelected = false
}) => {
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#008080', '#000080'
  ];

  const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

  return (
    <div style={{
      backgroundColor: '#fff8dc',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px'
    }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
        📝 Text-Eigenschaften {isEditingSelected && <span style={{ color: '#4A90E2' }}>(Ausgewählter Text)</span>}
      </h4>
      
      {/* Text Color */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Textfarbe:
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            style={{ width: '40px', height: '30px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
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

      {/* Font Size */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Schriftgröße: {fontSize}px
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="range"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <select
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            style={{
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>
      </div>

      {/* Font Weight */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Schriftgewicht:
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onFontWeightChange('normal')}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: fontWeight === 'normal' ? '#4A90E2' : '#fff',
              color: fontWeight === 'normal' ? '#fff' : '#000',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Normal
          </button>
          <button
            onClick={() => onFontWeightChange('bold')}
            style={{
              flex: 1,
              padding: '6px',
              backgroundColor: fontWeight === 'bold' ? '#4A90E2' : '#fff',
              color: fontWeight === 'bold' ? '#fff' : '#000',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            Fett
          </button>
        </div>
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
            padding: '2px 8px',
            backgroundColor: textColor,
            color: textColor === '#000000' ? '#fff' : '#000',
            opacity: opacity / 100,
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: fontSize + 'px',
            fontWeight: fontWeight
          }}>
            Aa
          </div>
        </div>
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
              onClick={() => onTextColorChange(color)}
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

      {/* Preview */}
      <div style={{ 
        marginTop: '12px', 
        padding: '12px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px',
        textAlign: 'center'
      }}>
        <div 
          style={{ 
            color: textColor, 
            fontSize: fontSize + 'px', 
            fontWeight: fontWeight,
            opacity: opacity / 100
          }}
        >
          Beispieltext
        </div>
      </div>
    </div>
  );
};