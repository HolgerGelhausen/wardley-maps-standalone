import { WardleyMap, Component, Connection, Note } from '../types/WardleyMap';

export class WardleyMapParser {
  static parse(text: string): WardleyMap {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    
    const map: WardleyMap = {
      title: '',
      components: [],
      connections: [],
      notes: [],
      evolution: [],
      style: 'wardley'
    };

    for (const line of lines) {
      if (line.startsWith('title ')) {
        map.title = line.substring(6);
      } else if (line.startsWith('component ')) {
        const component = this.parseComponent(line);
        if (component) map.components.push(component);
      } else if (line.includes(' -> ')) {
        const connection = this.parseConnection(line);
        if (connection) map.connections.push(connection);
      } else if (line.startsWith('note ')) {
        const note = this.parseNote(line);
        if (note) map.notes.push(note);
      } else if (line.startsWith('evolution ')) {
        map.evolution = line.substring(10).split(' -> ').map(s => s.trim());
      } else if (line.startsWith('style ')) {
        map.style = line.substring(6);
      }
    }

    return map;
  }

  private static parseComponent(line: string): Component | null {
    const match = line.match(/component\s+([^[]+)\s*\[([^,]+),\s*([^\]]+)\](.*)$/);
    if (!match) return null;

    const name = match[1].trim();
    const y = parseFloat(match[2]); // First value is Y (Value Chain) 
    const x = parseFloat(match[3]); // Second value is X (Evolution)
    const rest = match[4];

    const component: Component = { name, x, y };

    const labelMatch = rest.match(/label\s*\[([^,]+),\s*([^\]]+)\]/);
    if (labelMatch) {
      component.label = {
        x: parseFloat(labelMatch[1]),
        y: parseFloat(labelMatch[2])
      };
    }

    if (rest.includes('(build)')) component.category = 'build';
    else if (rest.includes('(buy)')) component.category = 'buy';
    else if (rest.includes('(outsource)')) component.category = 'outsource';

    if (rest.includes('inertia')) component.inertia = true;

    // Parse hex color like color(#FF0000) or color(red)
    const colorMatch = rest.match(/color\(([^)]+)\)/);
    if (colorMatch) {
      component.color = colorMatch[1];
    }

    return component;
  }

  private static parseConnection(line: string): Connection | null {
    const match = line.match(/^(.+?)\s*->\s*(.+)$/);
    if (!match) return null;

    return {
      from: match[1].trim(),
      to: match[2].trim()
    };
  }

  private static parseNote(line: string): Note | null {
    const match = line.match(/note\s+(.+?)\s*\[([^,]+),\s*([^\]]+)\]/);
    if (!match) return null;

    return {
      text: match[1].trim(),
      y: parseFloat(match[2]), // First value is Y (Value Chain)
      x: parseFloat(match[3])  // Second value is X (Evolution)
    };
  }
}