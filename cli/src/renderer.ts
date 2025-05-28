import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { WardleyMap, Component, Connection, Note } from './types';

export class WardleyMapRenderer {
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(width: number = 1400, height: number = 1000) {
    this.width = width;
    this.height = height;
    this.canvas = createCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
  }

  private getComponentColor(component: Component): string {
    // Prioritize custom color first
    if (component.color) return component.color;
    
    // Fallback to category colors
    if (component.category === 'build') return '#4A90E2';
    if (component.category === 'buy') return '#7ED321';
    if (component.category === 'outsource') return '#F5A623';
    return '#000000';
  }

  private drawEvolutionAxis() {
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    
    this.ctx.beginPath();
    this.ctx.moveTo(50, this.height - 50);
    this.ctx.lineTo(this.width - 50, this.height - 50);
    this.ctx.stroke();

    this.ctx.fillStyle = '#666';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    
    const stages = ['Genesis', 'Custom Built', 'Product', 'Commodity'];
    const stageWidth = (this.width - 100) / (stages.length - 1);
    
    stages.forEach((stage, index) => {
      const x = 50 + index * stageWidth;
      this.ctx.fillText(stage, x, this.height - 25);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.height - 50);
      this.ctx.lineTo(x, this.height - 45);
      this.ctx.stroke();
    });
    
    // Evolution label
    this.ctx.fillText('Evolution', this.width / 2, this.height - 5);
  }

  private drawValueChainAxis() {
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    
    this.ctx.beginPath();
    this.ctx.moveTo(50, 50);
    this.ctx.lineTo(50, this.height - 50);
    this.ctx.stroke();

    this.ctx.fillStyle = '#666';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    
    // Value Chain labels
    this.ctx.save();
    this.ctx.translate(25, this.height / 2);
    this.ctx.rotate(-Math.PI / 2);
    this.ctx.fillText('Value Chain', 0, 0);
    this.ctx.restore();
    
    // Top label (Visible/Customer)
    this.ctx.fillText('Visible', 25, 70);
    
    // Bottom label (Invisible/Infrastructure)  
    this.ctx.fillText('Invisible', 25, this.height - 60);
  }

  private drawComponent(component: Component) {
    const x = 50 + component.x * (this.width - 100);  // X-Achse (Evolution) -> horizontal
    const y = 50 + (1 - component.y) * (this.height - 100);  // Y-Achse (Value Chain) -> vertikal, invertiert
    
    this.ctx.fillStyle = this.getComponentColor(component);
    this.ctx.strokeStyle = this.getComponentColor(component);
    
    if (component.inertia) {
      this.ctx.setLineDash([5, 5]);
    } else {
      this.ctx.setLineDash([]);
    }
    
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = this.getComponentColor(component);
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    
    let labelX = x + 12;
    let labelY = y - 12;
    
    if (component.label) {
      labelX = x + component.label.x;
      labelY = y + component.label.y;
    }
    
    this.ctx.fillText(component.name, labelX, labelY);
  }

  private drawConnection(connection: Connection, map: WardleyMap) {
    const fromComponent = map.components.find(c => c.name === connection.from);
    const toComponent = map.components.find(c => c.name === connection.to);
    
    if (!fromComponent || !toComponent) return;
    
    const fromX = 50 + fromComponent.x * (this.width - 100);
    const fromY = 50 + (1 - fromComponent.y) * (this.height - 100);
    const toX = 50 + toComponent.x * (this.width - 100);
    const toY = 50 + (1 - toComponent.y) * (this.height - 100);
    
    this.ctx.strokeStyle = '#999';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 8;
    
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowLength * Math.cos(angle - Math.PI / 6),
      toY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - arrowLength * Math.cos(angle + Math.PI / 6),
      toY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  private drawNote(note: Note) {
    const x = 50 + note.x * (this.width - 100);
    const y = 50 + (1 - note.y) * (this.height - 100);
    
    this.ctx.fillStyle = '#333';
    this.ctx.font = '11px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(note.text, x, y);
  }

  private drawTitle(map: WardleyMap) {
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(map.title, this.width / 2, 35);
  }

  render(map: WardleyMap): Buffer {
    // Clear canvas with white background
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.drawTitle(map);
    this.drawEvolutionAxis();
    this.drawValueChainAxis();
    
    map.connections.forEach(connection => this.drawConnection(connection, map));
    map.components.forEach(component => this.drawComponent(component));
    map.notes.forEach(note => this.drawNote(note));
    
    return this.canvas.toBuffer('image/png');
  }
}