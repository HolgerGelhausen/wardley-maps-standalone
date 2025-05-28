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
  color?: string;
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

export interface WardleyMap {
  title: string;
  components: Component[];
  connections: Connection[];
  notes: Note[];
  evolution?: string[];
  style?: string;
}