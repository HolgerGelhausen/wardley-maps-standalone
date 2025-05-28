import React, { useState, useEffect } from 'react';
import { ProjectManager } from '../utils/ProjectManager';
import { FileSystemManager } from '../utils/FileSystemManager';
import { WardleyMap } from '../types/WardleyMap';

interface ProjectPanelProps {
  currentProjectName: string;
  mapText: string;
  map: WardleyMap;
  onProjectLoad: (name: string, mapText: string, map: WardleyMap) => void;
  onProjectNameChange: (name: string) => void;
}

export const ProjectPanel: React.FC<ProjectPanelProps> = ({
  currentProjectName,
  mapText,
  map,
  onProjectLoad,
  onProjectNameChange
}) => {
  const [projects, setProjects] = useState<string[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  useEffect(() => {
    refreshProjects();
    setSelectedDirectory(FileSystemManager.getDirectoryName());
  }, []);

  const refreshProjects = () => {
    setProjects(ProjectManager.getProjectNames());
  };

  const handleSave = () => {
    const name = newProjectName || currentProjectName || ProjectManager.generateProjectName();
    try {
      ProjectManager.saveProject(name, mapText, map);
      console.log('💾 Projekt gespeichert:', name);
      onProjectNameChange(name);
      setShowSaveDialog(false);
      setNewProjectName('');
      refreshProjects();
      alert(`Projekt "${name}" gespeichert!`);
    } catch (error) {
      alert('Fehler beim Speichern: ' + (error as Error).message);
    }
  };

  const handleLoad = (projectName: string) => {
    try {
      const project = ProjectManager.loadProject(projectName);
      if (project) {
        onProjectLoad(project.name, project.mapText, project.map);
        setShowLoadDialog(false);
        alert(`Projekt "${projectName}" geladen!`);
      }
    } catch (error) {
      alert('Fehler beim Laden: ' + (error as Error).message);
    }
  };

  const handleDelete = (projectName: string) => {
    if (window.confirm(`Projekt "${projectName}" wirklich löschen?`)) {
      try {
        ProjectManager.deleteProject(projectName);
        refreshProjects();
        alert(`Projekt "${projectName}" gelöscht!`);
      } catch (error) {
        alert('Fehler beim Löschen: ' + (error as Error).message);
      }
    }
  };

  const handleExport = async (projectName: string) => {
    try {
      const jsonData = ProjectManager.exportProject(projectName);
      const filename = `${projectName}.json`;
      
      // Try to save to selected directory first
      const saved = await FileSystemManager.saveFile(filename, jsonData, 'application/json');
      
      if (!saved) {
        // Fallback to traditional download
        FileSystemManager.downloadFile(filename, jsonData, 'application/json');
      }
    } catch (error) {
      alert('Fehler beim Export: ' + (error as Error).message);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonData = event.target?.result as string;
            const project = ProjectManager.importProject(jsonData);
            refreshProjects();
            alert(`Projekt "${project.name}" importiert!`);
          } catch (error) {
            alert('Fehler beim Import: ' + (error as Error).message);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSelectDirectory = async () => {
    const selected = await FileSystemManager.selectDirectory();
    if (selected) {
      setSelectedDirectory(FileSystemManager.getDirectoryName());
    }
  };

  const handleClearDirectory = () => {
    FileSystemManager.clearDirectory();
    setSelectedDirectory(null);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Current Project Info */}
      <div style={{
        padding: '10px',
        backgroundColor: '#e8f5e8',
        borderRadius: '5px',
        marginBottom: '10px',
        fontSize: '14px'
      }}>
        <strong>📋 Aktuelles Projekt:</strong><br />
        {currentProjectName || 'Unbenannt'}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
        <button
          onClick={() => setShowSaveDialog(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          💾 Speichern
        </button>
        
        <button
          onClick={() => setShowLoadDialog(true)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📁 Laden
        </button>
        
        <button
          onClick={() => {
            const name = currentProjectName || ProjectManager.generateProjectName();
            // Save the project first if it hasn't been saved
            try {
              ProjectManager.saveProject(name, mapText, map);
              onProjectNameChange(name);
              refreshProjects();
              handleExport(name);
            } catch (error) {
              alert('Fehler beim Export: ' + (error as Error).message);
            }
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📤 Export JSON
        </button>
        
        <button
          onClick={handleImport}
          style={{
            padding: '8px 12px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          📥 Import
        </button>
      </div>

      {/* Directory Selection */}
      <div style={{
        padding: '10px',
        backgroundColor: '#f0f8ff',
        borderRadius: '5px',
        marginBottom: '10px',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>💾 Speicherort:</strong>
        </div>
        
        {selectedDirectory ? (
          <div style={{ marginBottom: '8px' }}>
            📁 <strong>{selectedDirectory}</strong>
            <button
              onClick={handleClearDirectory}
              style={{
                marginLeft: '8px',
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '8px', color: '#666' }}>
            Standard-Download (~/Downloads)
          </div>
        )}

        <button
          onClick={handleSelectDirectory}
          disabled={!FileSystemManager.isSupported()}
          style={{
            padding: '6px 10px',
            backgroundColor: FileSystemManager.isSupported() ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: FileSystemManager.isSupported() ? 'pointer' : 'not-allowed',
            fontSize: '11px'
          }}
        >
          {selectedDirectory ? '📁 Anderen Ordner wählen' : '📁 Ordner auswählen'}
        </button>
        
        {!FileSystemManager.isSupported() && (
          <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
            (Nur in Chrome/Edge verfügbar)
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          border: '2px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <h3>Projekt speichern</h3>
          <input
            type="text"
            placeholder={currentProjectName || 'Projektname...'}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            style={{
              width: '300px',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Speichern
            </button>
            <button onClick={() => setShowSaveDialog(false)} style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          border: '2px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h3>Projekt laden</h3>
          {projects.length === 0 ? (
            <p>Keine gespeicherten Projekte gefunden.</p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {projects.map(projectName => (
                <div key={projectName} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #eee',
                  marginBottom: '5px',
                  borderRadius: '4px'
                }}>
                  <span style={{ flex: 1 }}>{projectName}</span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => handleLoad(projectName)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Laden
                    </button>
                    <button
                      onClick={() => handleExport(projectName)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handleDelete(projectName)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowLoadDialog(false)} style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            Schließen
          </button>
        </div>
      )}

      {/* Backdrop for dialogs */}
      {(showSaveDialog || showLoadDialog) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }} />
      )}
    </div>
  );
};