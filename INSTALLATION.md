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