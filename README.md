# Navimow Card

Eine Home Assistant Lovelace Karte zur Steuerung des Navimow Mähroboters – angelehnt an die Vacuum-Karte, aber ohne Karte.

## Funktionen

- Anzeige des aktuellen Status (Mäht, Pausiert, Kehrt zurück, Geparkt, Fehler)
- Schaltflächen: **Start**, **Pause**, **Zur Ladestation**
- Batteriestand mit Farb-Indikator und Fortschrittsbalken
- Animiertes Icon beim Mähen

## Installation

### Manuell

1. Datei `navimow-card.js` nach `/config/www/navimow-card.js` kopieren.
2. In Home Assistant unter **Einstellungen → Dashboards → Ressourcen** hinzufügen:
   - URL: `/local/navimow-card.js`
   - Typ: `JavaScript-Modul`
3. Seite neu laden.

### HACS

Repository als benutzerdefiniertes Repository in HACS hinzufügen.

## Konfiguration

```yaml
type: custom:navimow-card
entity: lawn_mower.navimow_mein_gaerter  # Pflichtfeld
name: Navimow                             # Optional – überschreibt den HA-Namen
battery_entity: sensor.navimow_battery   # Optional – wird sonst automatisch erkannt
```

## Konfigurationsoptionen

| Option           | Typ    | Pflicht | Beschreibung                                         |
|------------------|--------|---------|------------------------------------------------------|
| `entity`         | string | Ja      | Entity-ID der `lawn_mower`-Entität                   |
| `name`           | string | Nein    | Anzeigename (Standard: `friendly_name` der Entität)  |
| `battery_entity` | string | Nein    | Entity-ID des Batteriesensors                        |

## Unterstützte Zustände

| Zustand      | Anzeige         |
|--------------|-----------------|
| `mowing`     | Mäht            |
| `docked`     | Geparkt         |
| `paused`     | Pausiert        |
| `returning`  | Kehrt zurück    |
| `error`      | Fehler          |
| `idle`       | Bereit          |
