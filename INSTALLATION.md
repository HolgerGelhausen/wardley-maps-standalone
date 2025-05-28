# Wardley Maps - Installation Guide for Mac, feel free to modify the code

## Requirements
- macOS 10.10 or higher
- Node.js and npm must be installed
- Check with: `node --version` and `npm --version` in the terminal
- If not installed: https://nodejs.org/de/download/

## Installation

### Option 1: Simple installation (recommended)

1. **Copy the entire folder** `WardleyMapsStandalone` to any location on your Mac
- Recommended: `/Users/[YourName]/Applications/` or to the desktop

2. **Start the app** by double-clicking on:
- `start-app.command` in the WardleyMapsStandalone folder

3. **When starting for the first time:**
- The terminal will open
- The app will automatically install all necessary components (takes 2-3 minutes)
- The browser will open automatically with the app

### Option 2: Installation as a macOS app

1. **Create the app** (once):
```bash
cd /path/to/WardleyMapsStandalone
./create-app.sh
```

2. **Move the app** to your Applications folder:
- You will find the created `WardleyMaps.app` in the folder
- Drag it to `/Applications`

3. **Start** via Launchpad or Spotlight search

## First steps

1. **Create a new map**: Click on “Advanced Map Editor”
2. **Add components**:
- Right-click on the canvas
- Or use the toolbar on the left
3. **Save**: File → Save Map (Cmd+S)

## Features

- **Drag & drop**: Components and connections
- **Presentation mode**: Animated step-by-step presentation
- **Export**: As PNG or text
- **Undo/Redo**: Cmd+Z / Cmd+Shift+Z

## Troubleshooting

**App won't start?**
- Make sure Node.js is installed
- Delete the `node_modules` folder and restart

**“Command not found” error?**
- Open Terminal
- Run: `chmod +x /path/to/WardleyMapsStandalone/start-app.command`

**Browser won't open?**
- Open manually: http://localhost:3000

## Support

If you have any questions or problems, please contact the developer.

---
Version 1.0 - May 2024


# Wardley Maps - Installationsanleitung

## Voraussetzungen
- macOS 10.10 oder höher
- Node.js und npm müssen installiert sein
  - Prüfen mit: `node --version` und `npm --version` im Terminal
  - Falls nicht installiert: https://nodejs.org/de/download/

## Installation

### Option 1: Einfache Installation (Empfohlen)

1. **Kopiere den gesamten Ordner** `WardleyMapsStandalone` an einen beliebigen Ort auf deinem Mac
   - Empfohlen: `/Users/[DeinName]/Applications/` oder auf den Desktop

2. **Starte die App** durch Doppelklick auf:
   - `start-app.command` im WardleyMapsStandalone Ordner

3. **Beim ersten Start:**
   - Das Terminal öffnet sich
   - Die App installiert automatisch alle benötigten Komponenten (dauert 2-3 Minuten)
   - Der Browser öffnet sich automatisch mit der App

### Option 2: Installation als macOS App

1. **Erstelle die App** (einmalig):
   ```bash
   cd /Pfad/zu/WardleyMapsStandalone
   ./create-app.sh
   ```

2. **Verschiebe die App** in deinen Programme-Ordner:
   - Die erstellte `WardleyMaps.app` findest du im Ordner
   - Ziehe sie in `/Applications`

3. **Starte** über Launchpad oder Spotlight-Suche

## Erste Schritte

1. **Neue Map erstellen**: Klicke auf "Advanced Map Editor"
2. **Komponenten hinzufügen**: 
   - Rechtsklick auf die Canvas
   - Oder nutze die Toolbar links
3. **Speichern**: Datei → Save Map (Cmd+S)

## Features

- **Drag & Drop**: Komponenten und Verbindungen
- **Präsentationsmodus**: Animierte Schritt-für-Schritt Präsentation
- **Export**: Als PNG oder Text
- **Undo/Redo**: Cmd+Z / Cmd+Shift+Z

## Fehlerbehebung

**App startet nicht?**
- Stelle sicher, dass Node.js installiert ist
- Lösche den `node_modules` Ordner und starte neu

**"Command not found" Fehler?**
- Öffne Terminal
- Führe aus: `chmod +x /Pfad/zu/WardleyMapsStandalone/start-app.command`

**Browser öffnet sich nicht?**
- Öffne manuell: http://localhost:3000

## Support

Bei Fragen oder Problemen wende dich an den Entwickler.

---
Version 1.0 - Mai 2024
