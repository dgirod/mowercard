const VERSION = "1.1.0";

// ─── Navimow i105 – Top-down SVG ────────────────────────────────────────────
const MOWER_SVG = `
<svg viewBox="0 0 300 310" xmlns="http://www.w3.org/2000/svg">

  <!-- ── Left wheel ── -->
  <rect x="2" y="75" width="39" height="158" rx="19" class="c-wheel"/>
  <rect x="5"  y="93"  width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="106" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="119" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="132" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="145" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="158" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="171" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="184" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="197" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="5"  y="210" width="33" height="4" rx="2" class="c-tread"/>

  <!-- ── Right wheel ── -->
  <rect x="259" y="75" width="39" height="158" rx="19" class="c-wheel"/>
  <rect x="262" y="93"  width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="106" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="119" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="132" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="145" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="158" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="171" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="184" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="197" width="33" height="4" rx="2" class="c-tread"/>
  <rect x="262" y="210" width="33" height="4" rx="2" class="c-tread"/>

  <!-- ── Main body ── -->
  <rect x="40" y="22" width="220" height="266" rx="30" class="c-body"/>

  <!-- ── Front green accent bar (camera strip) ── -->
  <rect x="58" y="22" width="184" height="22" rx="11" class="c-accent"/>

  <!-- ── Camera housing ── -->
  <rect x="100" y="40" width="100" height="34" rx="10" class="c-panel"/>
  <!-- Lens -->
  <circle cx="150" cy="57" r="12" class="c-lens-outer"/>
  <circle cx="150" cy="57" r="7"  class="c-lens-inner"/>
  <circle cx="147" cy="54" r="2.5" class="c-lens-shine"/>

  <!-- ── Status LED ── -->
  <circle cx="220" cy="50" r="6" class="c-led"/>
  <!-- LED glow ring (visible when mowing) -->
  <circle cx="220" cy="50" r="10" class="c-led-glow"/>

  <!-- ── Panel divider ── -->
  <rect x="56" y="85"  width="188" height="3" rx="1.5" class="c-divider"/>
  <rect x="56" y="105" width="188" height="3" rx="1.5" class="c-divider"/>

  <!-- ── Segway / Navimow brand pill ── -->
  <rect x="104" y="93" width="92" height="18" rx="7" class="c-panel"/>

  <!-- ── Blade housing (outer ring) ── -->
  <circle cx="150" cy="202" r="62" class="c-wheel"/>
  <!-- Blade housing (inner ring) ── -->
  <circle cx="150" cy="202" r="54" class="c-blade-bg"/>

  <!-- ── Spinning blade group ── -->
  <g class="blade">
    <!-- Arm 1: up -->
    <line x1="150" y1="202" x2="150" y2="152" stroke-width="7" stroke-linecap="round" class="c-blade-arm"/>
    <!-- Arm 2: lower-right (120°) -->
    <line x1="150" y1="202" x2="193" y2="227" stroke-width="7" stroke-linecap="round" class="c-blade-arm"/>
    <!-- Arm 3: lower-left (240°) -->
    <line x1="150" y1="202" x2="107" y2="227" stroke-width="7" stroke-linecap="round" class="c-blade-arm"/>
    <!-- Blade tips -->
    <circle cx="150" cy="152" r="9" class="c-blade-tip"/>
    <circle cx="193" cy="227" r="9" class="c-blade-tip"/>
    <circle cx="107" cy="227" r="9" class="c-blade-tip"/>
    <!-- Hub -->
    <circle cx="150" cy="202" r="11" class="c-hub"/>
    <circle cx="150" cy="202" r="5"  class="c-hub-center"/>
  </g>

  <!-- ── Discharge chute (right side notch) ── -->
  <rect x="247" y="163" width="13" height="52" rx="5" class="c-wheel"/>

  <!-- ── Front caster wheel ── -->
  <ellipse cx="150" cy="22" rx="14" ry="7" class="c-wheel"/>

</svg>`;

// ─── Card class ─────────────────────────────────────────────────────────────
class NavimowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
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
    return 4;
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
    for (const id of [
      `sensor.${base}_battery`,
      `sensor.${base}_battery_level`,
      `sensor.${base}_akku`,
    ]) {
      const s = this._hass.states[id];
      if (s && !isNaN(parseInt(s.state, 10))) return parseInt(s.state, 10);
    }
    const m = this._hass.states[this._config.entity];
    if (m?.attributes.battery_level !== undefined)
      return parseInt(m.attributes.battery_level, 10);
    return null;
  }

  _batteryIcon(l) {
    if (l === null) return "mdi:battery-unknown";
    if (l >= 90) return "mdi:battery";
    if (l >= 80) return "mdi:battery-90";
    if (l >= 70) return "mdi:battery-80";
    if (l >= 60) return "mdi:battery-70";
    if (l >= 50) return "mdi:battery-60";
    if (l >= 40) return "mdi:battery-50";
    if (l >= 30) return "mdi:battery-40";
    if (l >= 20) return "mdi:battery-30";
    if (l >= 10) return "mdi:battery-20";
    return "mdi:battery-alert";
  }

  _statusLabel(s) {
    return { mowing:"Mäht", docked:"Geparkt", paused:"Pausiert",
             returning:"Kehrt zurück", error:"Fehler", idle:"Bereit" }[s] || s;
  }

  _statusColor(s) {
    return {
      mowing:    "var(--success-color, #00b894)",
      docked:    "var(--disabled-color, #9e9e9e)",
      paused:    "var(--warning-color, #ff9800)",
      returning: "var(--info-color, #2196f3)",
      error:     "var(--error-color, #f44336)",
      idle:      "var(--disabled-color, #9e9e9e)",
    }[s] || "var(--secondary-text-color)";
  }

  _batteryColor(l) {
    if (l === null) return "var(--secondary-text-color)";
    if (l > 50) return "var(--success-color, #4caf50)";
    if (l > 20) return "var(--warning-color, #ff9800)";
    return "var(--error-color, #f44336)";
  }

  _render() {
    if (!this._config || !this._hass) return;

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this.shadowRoot.innerHTML = `
        <ha-card><div style="padding:16px;color:var(--error-color)">
          Entität <b>${this._config.entity}</b> nicht gefunden.
        </div></ha-card>`;
      return;
    }

    const state     = stateObj.state;
    const name      = this._config.name || stateObj.attributes.friendly_name || "Navimow";
    const battery   = this._getBatteryLevel();
    const battColor = this._batteryColor(battery);
    const statColor = this._statusColor(state);
    const isMowing  = state === "mowing";
    const isPaused  = state === "paused";
    const isDocked  = state === "docked" || state === "idle";
    const isReturn  = state === "returning";

    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; }

  ha-card {
    overflow: hidden;
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, none);
  }

  .content { padding: 16px 16px 14px; }

  /* ── Top row ── */
  .top {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 4px;
  }
  .name {
    font-size: 1.05em; font-weight: 600;
    color: var(--primary-text-color);
  }
  .battery {
    display: flex; align-items: center; gap: 3px;
    font-size: .8em; font-weight: 600;
    color: ${battColor};
  }
  .battery ha-icon { --mdc-icon-size: 20px; }

  /* ── SVG image ── */
  .mower-wrap {
    display: flex; justify-content: center;
    padding: 8px 0 4px;
  }

  /* SVG color classes */
  .c-wheel      { fill: #1a1a2e; }
  .c-tread      { fill: #252540; }
  .c-body       { fill: #2b2b3b; }
  .c-accent     { fill: #00b894; }
  .c-panel      { fill: #363647; }
  .c-divider    { fill: #363647; }
  .c-lens-outer { fill: #1a1a2e; }
  .c-lens-inner { fill: #0984e3; }
  .c-lens-shine { fill: rgba(255,255,255,0.65); }
  .c-led        { fill: ${statColor}; }
  .c-led-glow   { fill: ${statColor}; opacity: 0; }
  .c-blade-bg   { fill: #242438; }
  .c-blade-arm  { stroke: #5a5a6e; fill: none; }
  .c-blade-tip  { fill: #5a5a6e; }
  .c-hub        { fill: #636e72; }
  .c-hub-center { fill: #2b2b3b; }

  /* ── SVG layout & animation ── */
  svg {
    width: 160px; height: 160px;
    cursor: pointer;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35));
    transition: opacity 0.4s;
  }

  svg.docked    { opacity: 0.45; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)) grayscale(0.4); }
  svg.mowing    { animation: cleaning 2s ease-in-out infinite; }
  svg.returning { animation: returning 2s linear infinite; }

  @keyframes cleaning {
    0%, 100% { transform: rotate(-12deg); }
    50%       { transform: rotate(12deg); }
  }

  @keyframes returning {
    0%   { transform: rotate(0deg);   }
    25%  { transform: rotate(9deg);   }
    50%  { transform: rotate(0deg);   }
    75%  { transform: rotate(-9deg);  }
    100% { transform: rotate(0deg);   }
  }

  /* ── Blade spin ── */
  .blade {
    transform-box: fill-box;
    transform-origin: center;
  }
  .spin .blade {
    animation: blade-spin 1.4s linear infinite;
  }
  @keyframes blade-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── LED pulse when mowing ── */
  .led-pulse .c-led-glow {
    animation: led-pulse 1.5s ease-in-out infinite;
  }
  @keyframes led-pulse {
    0%, 100% { opacity: 0; }
    50%       { opacity: 0.4; }
  }

  /* ── Status row ── */
  .status-row {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin: 6px 0 10px;
    font-size: .85em; font-weight: 500;
    color: ${statColor};
  }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: ${statColor};
  }

  /* ── Battery bar ── */
  .bar-track {
    height: 4px; background: var(--divider-color, rgba(0,0,0,.12));
    border-radius: 2px; margin-bottom: 14px; overflow: hidden;
  }
  .bar-fill {
    height: 100%; border-radius: 2px;
    width: ${battery ?? 0}%; background: ${battColor};
    transition: width .5s ease, background .3s;
  }

  /* ── Buttons ── */
  .controls { display: flex; gap: 8px; }
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
  .btn.active { background: var(--primary-color, #03a9f4); color: #fff; }
  .btn.active ha-icon { color: #fff; }
  .btn.off { opacity: .35; pointer-events: none; }
  .btn ha-icon { --mdc-icon-size: 24px; color: var(--primary-text-color); }
  .btn span { font-size: .75em; font-weight: 500; color: inherit; }
</style>

<ha-card>
  <div class="content">

    <!-- Top: name + battery -->
    <div class="top">
      <div class="name">${name}</div>
      <div class="battery">
        <ha-icon icon="${this._batteryIcon(battery)}"></ha-icon>
        <span>${battery !== null ? battery + "%" : "–"}</span>
      </div>
    </div>

    <!-- Mower SVG image -->
    <div class="mower-wrap">
      ${MOWER_SVG.replace(
        '<svg ',
        `<svg id="mower-svg" class="${state} ${isMowing ? "spin led-pulse" : ""}" `
      )}
    </div>

    <!-- Status -->
    <div class="status-row">
      <div class="status-dot"></div>
      <span>${this._statusLabel(state)}</span>
    </div>

    <!-- Battery bar -->
    ${battery !== null ? `<div class="bar-track"><div class="bar-fill"></div></div>` : ""}

    <!-- Controls -->
    <div class="controls">
      <div class="btn ${isMowing ? "active" : ""}" id="btn-start">
        <ha-icon icon="mdi:play"></ha-icon><span>Start</span>
      </div>
      <div class="btn ${isPaused ? "active" : ""} ${isDocked || isReturn ? "off" : ""}" id="btn-pause">
        <ha-icon icon="mdi:pause"></ha-icon><span>Pause</span>
      </div>
      <div class="btn ${isDocked || isReturn ? "active" : ""}" id="btn-dock">
        <ha-icon icon="mdi:home-import-outline"></ha-icon><span>Basis</span>
      </div>
    </div>

  </div>
</ha-card>`;

    // Click on image: start/pause toggle
    this.shadowRoot.getElementById("mower-svg")
      ?.addEventListener("click", () =>
        this._callService(isMowing ? "pause" : "start_mowing")
      );
    this.shadowRoot.getElementById("btn-start")
      ?.addEventListener("click", () => this._callService("start_mowing"));
    this.shadowRoot.getElementById("btn-pause")
      ?.addEventListener("click", () => this._callService("pause"));
    this.shadowRoot.getElementById("btn-dock")
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
  "background:#00b894;color:#fff;font-weight:700;padding:2px 4px;border-radius:3px 0 0 3px",
  "background:#1a1a2e;color:#00b894;font-weight:700;padding:2px 4px;border-radius:0 3px 3px 0"
);
