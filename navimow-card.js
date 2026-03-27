import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

class NavimowCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a lawn_mower entity.");
    }
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  _callService(service) {
    const [domain, action] = service.split(".");
    this.hass.callService(domain, action, {
      entity_id: this.config.entity,
    });
  }

  _getBatteryEntity() {
    if (this.config.battery_entity) {
      return this.config.battery_entity;
    }
    // Try to auto-detect battery entity based on mower entity name
    const base = this.config.entity.replace("lawn_mower.", "");
    return `sensor.${base}_battery`;
  }

  _getBatteryLevel() {
    const batteryEntity = this._getBatteryEntity();
    const stateObj = this.hass.states[batteryEntity];
    if (stateObj) {
      return parseInt(stateObj.state, 10);
    }
    // Fallback: check attribute on mower entity
    const mowerState = this.hass.states[this.config.entity];
    if (mowerState && mowerState.attributes.battery_level !== undefined) {
      return parseInt(mowerState.attributes.battery_level, 10);
    }
    return null;
  }

  _getBatteryIcon(level) {
    if (level === null) return "mdi:battery-unknown";
    if (level >= 90) return "mdi:battery";
    if (level >= 80) return "mdi:battery-90";
    if (level >= 70) return "mdi:battery-80";
    if (level >= 60) return "mdi:battery-70";
    if (level >= 50) return "mdi:battery-60";
    if (level >= 40) return "mdi:battery-50";
    if (level >= 30) return "mdi:battery-40";
    if (level >= 20) return "mdi:battery-30";
    if (level >= 10) return "mdi:battery-20";
    return "mdi:battery-alert";
  }

  _getBatteryColor(level) {
    if (level === null) return "var(--secondary-text-color)";
    if (level > 50) return "var(--success-color, #4caf50)";
    if (level > 20) return "var(--warning-color, #ff9800)";
    return "var(--error-color, #f44336)";
  }

  _getStatusLabel(state) {
    const labels = {
      mowing: "Mäht",
      docked: "Geparkt",
      paused: "Pausiert",
      returning: "Kehrt zurück",
      error: "Fehler",
      idle: "Bereit",
    };
    return labels[state] || state;
  }

  _getStatusColor(state) {
    const colors = {
      mowing: "var(--success-color, #4caf50)",
      docked: "var(--info-color, #2196f3)",
      paused: "var(--warning-color, #ff9800)",
      returning: "var(--info-color, #2196f3)",
      error: "var(--error-color, #f44336)",
      idle: "var(--secondary-text-color)",
    };
    return colors[state] || "var(--secondary-text-color)";
  }

  _getMowerIcon(state) {
    return "mdi:robot-mower";
  }

  render() {
    if (!this.hass || !this.config) return html``;

    const entityId = this.config.entity;
    const stateObj = this.hass.states[entityId];

    if (!stateObj) {
      return html`
        <ha-card>
          <div class="not-found">
            Entität <b>${entityId}</b> nicht gefunden.
          </div>
        </ha-card>
      `;
    }

    const state = stateObj.state;
    const name = this.config.name || stateObj.attributes.friendly_name || "Navimow";
    const battery = this._getBatteryLevel();
    const batteryIcon = this._getBatteryIcon(battery);
    const batteryColor = this._getBatteryColor(battery);
    const statusLabel = this._getStatusLabel(state);
    const statusColor = this._getStatusColor(state);

    const isMowing = state === "mowing";
    const isPaused = state === "paused";
    const isDocked = state === "docked" || state === "idle";
    const isReturning = state === "returning";
    const isError = state === "error";

    return html`
      <ha-card>
        <div class="card-content">

          <!-- Header: Icon + Name + Battery -->
          <div class="header">
            <div class="icon-container ${state}">
              <ha-icon icon="${this._getMowerIcon(state)}"></ha-icon>
            </div>
            <div class="name-status">
              <div class="name">${name}</div>
              <div class="status" style="color: ${statusColor}">
                <span class="status-dot" style="background: ${statusColor}"></span>
                ${statusLabel}
              </div>
            </div>
            <div class="battery" style="color: ${batteryColor}">
              <ha-icon icon="${batteryIcon}"></ha-icon>
              <span>${battery !== null ? battery + "%" : "–"}</span>
            </div>
          </div>

          <!-- Battery bar -->
          ${battery !== null ? html`
            <div class="battery-bar-container">
              <div
                class="battery-bar"
                style="width: ${battery}%; background: ${batteryColor};"
              ></div>
            </div>
          ` : ""}

          <!-- Control Buttons -->
          <div class="controls">

            <div class="control-btn ${isMowing ? "active" : ""} ${isError || isReturning ? "disabled" : ""}"
              @click="${() => this._callService("lawn_mower.start_mowing")}"
              title="Mähen starten">
              <ha-icon icon="mdi:play"></ha-icon>
              <span>Start</span>
            </div>

            <div class="control-btn ${isPaused ? "active" : ""} ${isDocked || isReturning ? "disabled" : ""}"
              @click="${() => this._callService("lawn_mower.pause")}"
              title="Pausieren">
              <ha-icon icon="mdi:pause"></ha-icon>
              <span>Pause</span>
            </div>

            <div class="control-btn ${isDocked || isReturning ? "active" : ""}"
              @click="${() => this._callService("lawn_mower.dock")}"
              title="Zur Ladestation">
              <ha-icon icon="mdi:home-import-outline"></ha-icon>
              <span>Basis</span>
            </div>

          </div>

        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        background: var(--ha-card-background, var(--card-background-color, #fff));
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, none);
        overflow: hidden;
      }

      .not-found {
        padding: 16px;
        color: var(--error-color);
      }

      .card-content {
        padding: 16px;
      }

      /* ---- Header ---- */
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .icon-container {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--primary-color, #03a9f4);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.3s;
      }

      .icon-container.mowing {
        background: var(--success-color, #4caf50);
        animation: pulse 2s infinite;
      }

      .icon-container.paused {
        background: var(--warning-color, #ff9800);
      }

      .icon-container.returning {
        background: var(--info-color, #2196f3);
      }

      .icon-container.error {
        background: var(--error-color, #f44336);
      }

      .icon-container.docked,
      .icon-container.idle {
        background: var(--disabled-color, #9e9e9e);
      }

      @keyframes pulse {
        0%   { box-shadow: 0 0 0 0   rgba(76, 175, 80, 0.5); }
        70%  { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);   }
        100% { box-shadow: 0 0 0 0   rgba(76, 175, 80, 0);    }
      }

      .icon-container ha-icon {
        --mdc-icon-size: 28px;
        color: #fff;
      }

      .name-status {
        flex: 1;
        min-width: 0;
      }

      .name {
        font-size: 1.1em;
        font-weight: 600;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.85em;
        margin-top: 2px;
      }

      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .battery {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 0.78em;
        font-weight: 600;
        gap: 1px;
        flex-shrink: 0;
      }

      .battery ha-icon {
        --mdc-icon-size: 22px;
      }

      /* ---- Battery bar ---- */
      .battery-bar-container {
        height: 4px;
        background: var(--divider-color, rgba(0,0,0,0.12));
        border-radius: 2px;
        margin-bottom: 16px;
        overflow: hidden;
      }

      .battery-bar {
        height: 100%;
        border-radius: 2px;
        transition: width 0.5s ease, background 0.3s;
      }

      /* ---- Controls ---- */
      .controls {
        display: flex;
        justify-content: space-around;
        gap: 8px;
      }

      .control-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 10px 16px;
        border-radius: 10px;
        background: var(--secondary-background-color, rgba(0,0,0,0.04));
        cursor: pointer;
        flex: 1;
        transition: background 0.2s, transform 0.1s;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .control-btn:hover {
        background: var(--primary-color, #03a9f4);
        color: #fff;
      }

      .control-btn:hover ha-icon {
        color: #fff;
      }

      .control-btn:active {
        transform: scale(0.95);
      }

      .control-btn.active {
        background: var(--primary-color, #03a9f4);
        color: #fff;
      }

      .control-btn.active ha-icon {
        color: #fff;
      }

      .control-btn.disabled {
        opacity: 0.4;
        pointer-events: none;
      }

      .control-btn ha-icon {
        --mdc-icon-size: 24px;
        color: var(--primary-text-color);
      }

      .control-btn span {
        font-size: 0.75em;
        font-weight: 500;
        color: inherit;
      }
    `;
  }
}

customElements.define("navimow-card", NavimowCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "navimow-card",
  name: "Navimow Card",
  description: "Steuerungskarte für den Navimow Mähroboter",
  preview: true,
});
