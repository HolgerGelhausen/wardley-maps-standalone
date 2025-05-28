// File System Access API utility for modern browsers
// Currently supported in Chrome, Edge, and other Chromium-based browsers

export class FileSystemManager {
  private static directoryHandle: FileSystemDirectoryHandle | null = null;

  // Check if File System Access API is supported
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  // Let user select a directory for saving files
  static async selectDirectory(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Ordner-Auswahl wird nur in Chrome/Edge unterstützt. Dateien werden in Downloads gespeichert.');
      return false;
    }

    try {
      this.directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      console.log('📁 Ordner ausgewählt:', this.directoryHandle?.name || 'Unbekannt');
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Fehler bei Ordner-Auswahl:', error);
      }
      return false;
    }
  }

  // Save a file to the selected directory
  static async saveFile(filename: string, content: string, contentType: string = 'text/plain'): Promise<boolean> {
    if (!this.directoryHandle) {
      console.log('Kein Ordner ausgewählt, verwende Standard-Download');
      return false;
    }

    try {
      // Create or get the file handle
      const fileHandle = await this.directoryHandle.getFileHandle(filename, {
        create: true
      });

      // Create a writable stream
      const writable = await fileHandle.createWritable();
      
      // Write the content
      await writable.write(content);
      await writable.close();

      console.log('💾 Datei gespeichert in ausgewähltem Ordner:', filename);
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern in den ausgewählten Ordner. Verwende Standard-Download.');
      return false;
    }
  }

  // Save canvas as PNG to selected directory
  static async savePNGFile(filename: string, canvas: HTMLCanvasElement): Promise<boolean> {
    if (!this.directoryHandle) {
      console.log('Kein Ordner ausgewählt, verwende Standard-Download');
      return false;
    }

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Create or get the file handle
      const fileHandle = await this.directoryHandle.getFileHandle(filename, {
        create: true
      });

      // Create a writable stream
      const writable = await fileHandle.createWritable();
      
      // Write the blob
      await writable.write(blob);
      await writable.close();

      console.log('🖼️ PNG gespeichert in ausgewähltem Ordner:', filename);
      return true;
    } catch (error) {
      console.error('Fehler beim PNG-Speichern:', error);
      alert('Fehler beim Speichern in den ausgewählten Ordner. Verwende Standard-Download.');
      return false;
    }
  }

  // Get current directory name (for UI display)
  static getDirectoryName(): string | null {
    return this.directoryHandle?.name || null;
  }

  // Clear selected directory
  static clearDirectory(): void {
    this.directoryHandle = null;
    console.log('📁 Ordner-Auswahl zurückgesetzt');
  }

  // Fallback: traditional download for unsupported browsers
  static downloadFile(filename: string, content: string, contentType: string = 'application/json'): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('📁 Standard-Download:', filename);
  }

  // Fallback: traditional PNG download
  static downloadPNG(filename: string, canvas: HTMLCanvasElement): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    console.log('🖼️ Standard PNG-Download:', filename);
  }
}