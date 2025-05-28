export interface Component {
  name: string;
  x: number;
  y: number;
  label?: {
    x: number;
    y: number;
  };
  category?: 'build' | 'buy' | 'outsource';
  inertia?: boolean;
  color?: string; // Hex color like #FF0000
}

export interface Connection {
  from: string;
  to: string;
}

export interface Note {
  text: string;
  x: number;
  y: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight?: 'normal' | 'bold';
  opacity?: number; // 0-100, default 100
  isSelected?: boolean;
  width?: number; // For bounding box
  height?: number; // For bounding box
}

export interface IconOverlay {
  id: string;
  icon: string; // Unicode emoji or symbol
  x: number;
  y: number;
  size: number;
}

export interface ImageOverlay {
  id: string;
  src: string; // Base64 data URL
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ShapeType = 'line' | 'rectangle' | 'circle' | 'triangle';

export interface ShapeOverlay {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number; // For lines
  endY?: number; // For lines
  radius?: number; // For circles
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  filled: boolean;
  opacity: number; // 0-100
  isSelected?: boolean;
}

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[]; // Normalized coordinates
  strokeColor: string;
  strokeWidth: number;
  opacity: number; // 0-100
}

export interface AnimationSequenceItem {
  type: 'component' | 'connection' | 'text' | 'icon' | 'image' | 'shape' | 'drawing' | 'note';
  id: string; // For components use name, for connections use "from->to"
  order: number;
}

export interface AnimationSequence {
  items: AnimationSequenceItem[];
  isRecording: boolean;
}

export interface WardleyMap {
  title: string;
  components: Component[];
  connections: Connection[];
  notes: Note[];
  evolution?: string[];
  style?: string;
  textOverlays?: TextOverlay[];
  iconOverlays?: IconOverlay[];
  imageOverlays?: ImageOverlay[];
  shapeOverlays?: ShapeOverlay[];
  drawingPaths?: DrawingPath[];
  animationSequence?: AnimationSequence;
}

export interface ProjectData {
  name: string;
  mapText: string;
  map: WardleyMap;
  createdAt: string;
  updatedAt: string;
}