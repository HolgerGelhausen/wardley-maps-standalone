import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PresenterView } from './components/PresenterView';

// Check if this is the presenter window
const urlParams = new URLSearchParams(window.location.search);
const isPresenterView = urlParams.get('presenter') === 'true';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (isPresenterView) {
  // Render presenter view
  root.render(
    <React.StrictMode>
      <PresenterView />
    </React.StrictMode>
  );
} else {
  // Render main app
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}