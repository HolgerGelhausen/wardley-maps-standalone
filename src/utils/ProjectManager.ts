import { ProjectData, WardleyMap } from '../types/WardleyMap';

export class ProjectManager {
  private static readonly STORAGE_KEY = 'wardley-maps-projects';

  static saveProject(name: string, mapText: string, map: WardleyMap): void {
    const projects = this.getProjects();
    const now = new Date().toISOString();
    
    const projectData: ProjectData = {
      name,
      mapText,
      map,
      createdAt: projects[name]?.createdAt || now,
      updatedAt: now
    };

    projects[name] = projectData;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    console.log('💾 Projekt gespeichert in localStorage:', name);
  }

  static getProjects(): Record<string, ProjectData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading projects:', error);
      return {};
    }
  }

  static loadProject(name: string): ProjectData | null {
    const projects = this.getProjects();
    return projects[name] || null;
  }

  static deleteProject(name: string): void {
    const projects = this.getProjects();
    delete projects[name];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    console.log('🗑️ Projekt gelöscht aus localStorage:', name);
  }

  static getProjectNames(): string[] {
    return Object.keys(this.getProjects()).sort();
  }

  static exportProject(name: string): string {
    const project = this.loadProject(name);
    if (!project) throw new Error('Project not found');
    
    return JSON.stringify(project, null, 2);
  }

  static importProject(jsonData: string): ProjectData {
    try {
      const project = JSON.parse(jsonData) as ProjectData;
      
      // Validate required fields
      if (!project.name || !project.mapText || !project.map) {
        throw new Error('Invalid project format');
      }
      
      this.saveProject(project.name, project.mapText, project.map);
      return project;
    } catch (error) {
      throw new Error('Failed to import project: ' + (error as Error).message);
    }
  }

  static generateProjectName(): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
    return `WardleyMap_${timestamp}`;
  }
}