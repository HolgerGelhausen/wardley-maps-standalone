import { useState, useCallback, useEffect } from 'react';
import { WardleyMap } from '../types/WardleyMap';

interface UndoRedoState {
  past: WardleyMap[];
  present: WardleyMap;
  future: WardleyMap[];
}

export const useUndoRedo = (initialState: WardleyMap) => {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    present: initialState,
    future: []
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const pushState = useCallback((newState: WardleyMap, skipUndo: boolean = false) => {
    if (skipUndo) {
      // Just update present without adding to history
      setState(prevState => ({
        ...prevState,
        present: newState
      }));
    } else {
      setState(prevState => ({
        past: [...prevState.past, prevState.present].slice(-50), // Keep last 50 states
        present: newState,
        future: [] // Clear future when new state is pushed
      }));
    }
  }, []);

  const undo = useCallback(() => {
    setState(prevState => {
      if (prevState.past.length === 0) return prevState;

      const previous = prevState.past[prevState.past.length - 1];
      const newPast = prevState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [prevState.present, ...prevState.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prevState => {
      if (prevState.future.length === 0) return prevState;

      const next = prevState.future[0];
      const newFuture = prevState.future.slice(1);

      return {
        past: [...prevState.past, prevState.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Z (Mac) or Ctrl+Z (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      }
      // Cmd+Shift+Z (Mac) or Ctrl+Shift+Z (Windows/Linux) or Cmd+Y / Ctrl+Y
      else if (((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) || 
               ((e.metaKey || e.ctrlKey) && e.key === 'y')) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return {
    state: state.present,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo
  };
};