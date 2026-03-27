const VERSION = "1.0.0";

class NavimowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
  }

  static getConfigElement() {
    return document.createElement("navimow-card-editor");
  }

  static getStubConfig() {
    return { entity: "lawn_mower.navimow" };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Bitte eine lawn_mower-Entität angeben.");
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  _callService(action) {
    if (!this._hass || !this._config) return;
    this._hass.callService("lawn_mower", action, {
      entity_id: this._config.entity,
    });
  }

  _getBatteryLevel() {
    if (!this._hass || !this._config) return null;

    if (this._config.battery_entity) {
      const s = this._hass.states[this._config.battery_entity];
      if (s) return parseInt(s.state, 10);
    }

    const base = this._config.entity.replace("lawn_mower.", "");
    const candidates = [
      `sensor.${base}_battery`,
      `sensor.${base}_battery_level`,
      `sensor.${base}_akku`,
    ];
    for (const id of candidates) {
      const s = this._hass.states[id];
      if (s && !isNaN(parseInt(s.state, 10))) return parseInt(s.state, 10);
    }

    const mower = this._hass.states[this._config.entity];
    if (mower?.attributes.battery_level !== undefined) {
      return parseInt(mower.attributes.battery_level, 10);
    }
    return null;
  }

  _batteryIcon(level) {
    if (level === null) return this._icon("battery-unknown");
    if (level >= 90) return this._icon("battery");
    if (level >= 80) return this._icon("battery-90");
    if (level >= 70) return this._icon("battery-80");
    if (level >= 60) return this._icon("battery-70");
    if (level >= 50) return this._icon("battery-60");
    if (level >= 40) return this._icon("battery-50");
    if (level >= 30) return this._icon("battery-40");
    if (level >= 20) return this._icon("battery-30");
    if (level >= 10) return this._icon("battery-20");
    return this._icon("battery-alert");
  }

  _icon(name) {
    return `<ha-icon icon="mdi:${name}"></ha-icon>`;
  }

  _statusLabel(state) {
    return (
      {
        mowing: "Mäht",
        docked: "Geparkt",
        paused: "Pausiert",
        returning: "Kehrt zurück",
        error: "Fehler",
        idle: "Bereit",
      }[state] || state
    );
  }

  _statusColor(state) {
    return (
      {
        mowing: "var(--success-color, #4caf50)",
        docked: "var(--disabled-color, #9e9e9e)",
        paused: "var(--warning-color, #ff9800)",
        returning: "var(--info-color, #2196f3)",
        error: "var(--error-color, #f44336)",
        idle: "var(--disabled-color, #9e9e9e)",
      }[state] || "var(--secondary-text-color)"
    );
  }

  _batteryColor(level) {
    if (level === null) return "var(--secondary-text-color)";
    if (level > 50) return "var(--success-color, #4caf50)";
    if (level > 20) return "var(--warning-color, #ff9800)";
    return "var(--error-color, #f44336)";
  }

  _render() {
    if (!this._config || !this._hass) return;

    const entityId = this._config.entity;
    const stateObj = this._hass.states[entityId];

    if (!stateObj) {
      this.shadowRoot.innerHTML = `
        <ha-card><div style="padding:16px;color:var(--error-color)">
          Entität <b>${entityId}</b> nicht gefunden.
        </div></ha-card>`;
      return;
    }

    const state = stateObj.state;
    const name =
      this._config.name ||
      stateObj.attributes.friendly_name ||
      "Navimow";
    const battery = this._getBatteryLevel();
    const battColor = this._batteryColor(battery);
    const stateColor = this._statusColor(state);
    const isMowing = state === "mowing";
    const isPaused = state === "paused";
    const isDocked = state === "docked" || state === "idle";
    const isReturning = state === "returning";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        ha-card {
          overflow: hidden;
          background: var(--ha-card-background, var(--card-background-color, #fff));
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, none);
        }

        .content { padding: 16px; }

        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .icon-wrap {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: ${stateColor};
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          ${isMowing ? "animation: pulse 2s infinite;" : ""}
        }
        .icon-wrap ha-icon {
          --mdc-icon-size: 28px;
          color: #fff;
        }

        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0   rgba(76,175,80,.5); }
          70%  { box-shadow: 0 0 0 10px rgba(76,175,80,0);  }
          100% { box-shadow: 0 0 0 0   rgba(76,175,80,0);   }
        }

        .meta { flex: 1; min-width: 0; }
        .name {
          font-size: 1.05em; font-weight: 600;
          color: var(--primary-text-color);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .status {
          display: flex; align-items: center; gap: 5px;
          font-size: .82em; margin-top: 2px;
          color: ${stateColor};
        }
        .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: ${stateColor}; flex-shrink: 0;
        }

        .battery {
          display: flex; flex-direction: column; align-items: center;
          gap: 1px; flex-shrink: 0;
          color: ${battColor};
          font-size: .78em; font-weight: 600;
        }
        .battery ha-icon { --mdc-icon-size: 22px; }

        .bar-track {
          height: 4px;
          background: var(--divider-color, rgba(0,0,0,.12));
          border-radius: 2px; margin-bottom: 16px; overflow: hidden;
        }
        .bar-fill {
          height: 100%; border-radius: 2px;
          width: ${battery ?? 0}%;
          background: ${battColor};
          transition: width .5s ease, background .3s;
        }

        .controls {
          display: flex; gap: 8px;
        }

        .btn {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 5px;
          padding: 10px 8px; border-radius: 10px; cursor: pointer;
          background: var(--secondary-background-color, rgba(0,0,0,.04));
          transition: background .2s, transform .1s;
          user-select: none; -webkit-tap-highlight-color: transparent;
        }
        .btn:hover { background: var(--primary-color, #03a9f4); color: #fff; }
        .btn:hover ha-icon { color: #fff; }
        .btn:active { transform: scale(.95); }
        .btn.active {
          background: var(--primary-color, #03a9f4); color: #fff;
        }
        .btn.active ha-icon { color: #fff; }
        .btn.off { opacity: .35; pointer-events: none; }
        .btn ha-icon { --mdc-icon-size: 24px; color: var(--primary-text-color); }
        .btn span { font-size: .75em; font-weight: 500; color: inherit; }
      </style>

      <ha-card>
        <div class="content">

          <div class="header">
            <div class="icon-wrap">
              ${this._icon("robot-mower")}
            </div>
            <div class="meta">
              <div class="name">${name}</div>
              <div class="status">
                <div class="dot"></div>
                ${this._statusLabel(state)}
              </div>
            </div>
            <div class="battery">
              ${this._batteryIcon(battery)}
              <span>${battery !== null ? battery + "%" : "–"}</span>
            </div>
          </div>

          ${battery !== null ? `<div class="bar-track"><div class="bar-fill"></div></div>` : ""}

          <div class="controls">
            <div class="btn ${isMowing ? "active" : ""}" id="btn-start">
              ${this._icon("play")}
              <span>Start</span>
            </div>
            <div class="btn ${isPaused ? "active" : ""} ${isDocked || isReturning ? "off" : ""}" id="btn-pause">
              ${this._icon("pause")}
              <span>Pause</span>
            </div>
            <div class="btn ${isDocked || isReturning ? "active" : ""}" id="btn-dock">
              ${this._icon("home-import-outline")}
              <span>Basis</span>
            </div>
          </div>

        </div>
      </ha-card>`;

    this.shadowRoot
      .getElementById("btn-start")
      ?.addEventListener("click", () => this._callService("start_mowing"));
    this.shadowRoot
      .getElementById("btn-pause")
      ?.addEventListener("click", () => this._callService("pause"));
    this.shadowRoot
      .getElementById("btn-dock")
      ?.addEventListener("click", () => this._callService("dock"));
  }
}

customElements.define("navimow-card", NavimowCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "navimow-card",
  name: "Navimow Card",
  description: "Steuerungskarte für den Navimow Mähroboter",
  preview: true,
  documentationURL: "https://github.com/dgirod/mowercard",
});

console.info(
  `%c NAVIMOW-CARD %c v${VERSION} `,
  "background:#4caf50;color:#fff;font-weight:700;padding:2px 4px;border-radius:3px 0 0 3px",
  "background:#222;color:#4caf50;font-weight:700;padding:2px 4px;border-radius:0 3px 3px 0"
);
