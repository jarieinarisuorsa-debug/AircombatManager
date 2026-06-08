import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { registerAction } from "../../core/actionRegistry.js";

const weatherCache = {};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 mins

export function renderWeatherWidget(event, admin = false) {
  const lat = event.eventInfo?.latitude;
  const lon = event.eventInfo?.longitude;
  const eventId = event.id;

  const cached = weatherCache[eventId];
  const hasValidCache = cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS);

  if (hasValidCache && cached.data) {
    return renderWeatherContainer(eventId, renderWeatherHTML(cached.data, cached.timestamp, false));
  }

  if (!lat || !lon) {
    const adminInstructions = admin ? `<p class="muted" style="margin-top: 10px;">Voit lisätä koordinaatit yläpuolelta "Muokkaa"-painikkeesta.</p>` : "";
    const emptyState = `
      <div style="text-align: center; padding: 30px 10px;">
        <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">🌍</div>
        <p class="muted">Koordinaatteja ei ole asetettu, joten säätietoja ei voida näyttää.</p>
        ${adminInstructions}
        <div style="margin-top: 15px;">
          <button type="button" class="button small dashed" data-action="fetch-local-weather" data-event-id="${escapeHtml(eventId)}">📍 Hae sää omalla sijainnillani</button>
        </div>
      </div>
    `;
    return renderWeatherContainer(eventId, emptyState);
  }

  // Trigger async fetch
  fetchWeather(lat, lon, eventId);

  const loadingState = `
    <div style="text-align: center; padding: 40px 10px;">
      <p class="muted">Haetaan säätietoja...</p>
    </div>
  `;
  return renderWeatherContainer(eventId, loadingState);
}

function renderWeatherContainer(eventId, content) {
  return UI.Panel({ kicker: "Säätila", title: "Kilpailupaikan sää", id: `weather-panel-${eventId}` }, `
    <div id="weather-widget-container-${escapeHtml(eventId)}">
      ${content}
    </div>
  `);
}

async function fetchWeather(lat, lon, eventId) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&wind_speed_unit=ms`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API virhe");
    const data = await response.json();
    
    weatherCache[eventId] = { data: data.current, timestamp: Date.now() };
    
    updateWeatherContainer(eventId, renderWeatherHTML(data.current, Date.now(), false));
  } catch (error) {
    console.error("Weather fetch failed", error);
    const cached = weatherCache[eventId];
    if (cached && cached.data) {
      updateWeatherContainer(eventId, renderWeatherHTML(cached.data, cached.timestamp, true));
    } else {
      updateWeatherContainer(eventId, `
        <div style="text-align: center; padding: 30px 10px;">
          <div style="font-size: 2.5rem; margin-bottom: 10px;">❌</div>
          <p class="muted" style="color: var(--danger);">Säätietojen haku epäonnistui.</p>
        </div>
      `);
    }
  }
}

function updateWeatherContainer(eventId, html) {
  const container = document.getElementById(`weather-widget-container-${eventId}`);
  if (container) {
    container.innerHTML = html;
  }
}

function getWeatherDescription(code) {
  if (code === 0) return "Selkeää";
  if (code === 1 || code === 2 || code === 3) return "Pilvistä";
  if (code === 45 || code === 48) return "Sumua";
  if (code >= 51 && code <= 55) return "Tihkusadetta";
  if (code >= 61 && code <= 65) return "Sadetta";
  if (code >= 71 && code <= 77) return "Lumisadetta";
  if (code >= 80 && code <= 82) return "Sadekuuroja";
  if (code >= 95) return "Ukkosta";
  return "Vaihtelevaa";
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2 || code === 3) return "⛅";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌧️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

function getWindDirection(degrees) {
  if (degrees === undefined || degrees === null) return "";
  const dirs = ["P", "KO", "I", "KA", "E", "LO", "L", "LU"];
  const val = Math.floor((degrees / 45) + 0.5);
  return dirs[val % 8];
}

function renderWeatherHTML(current, timestamp, isOutdated = false) {
  const temp = Math.round(current.temperature_2m);
  const wind = current.wind_speed_10m;
  const gusts = current.wind_gusts_10m;
  const precip = current.precipitation;
  const windDirDeg = current.wind_direction_10m;
  const windDirText = getWindDirection(windDirDeg);
  const desc = getWeatherDescription(current.weather_code);
  const icon = getWeatherIcon(current.weather_code);
  
  const time = new Date(timestamp || current.time).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  
  const windIconStr = windDirDeg !== undefined ? `<div style="transform: rotate(${windDirDeg}deg); display: inline-block; font-size: 0.8em; margin-right: 4px;">⬇️</div>` : "";
  const windText = windDirText ? `${wind} m/s ${windDirText}` : `${wind} m/s`;

  return `
    <div class="weather-widget">
      <div class="weather-main ui-grid" style="--ui-grid-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        
        <div class="weather-hero small-card" style="display: flex; align-items: center; justify-content: center; padding: 25px 15px; background: linear-gradient(135deg, var(--card-alt), var(--surface-1)); border: 1px solid var(--border);">
          <div style="font-size: 4rem; line-height: 1; margin-right: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">${icon}</div>
          <div style="text-align: left;">
            <div style="font-size: 3rem; font-weight: 800; line-height: 1; color: var(--text);">${temp}°C</div>
            <div style="font-size: 1.1rem; font-weight: 600; color: var(--muted); margin-top: 4px;">${desc}</div>
          </div>
        </div>

        <div class="weather-details ui-grid" style="--ui-grid-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
          <div class="weather-stat small-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px 10px; text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 1.5rem; margin-bottom: 5px; color: var(--text);">💨</div>
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); font-weight: 600;">Tuuli</div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-top: 5px; display: flex; align-items: center; justify-content: center;">
              ${windIconStr}${windText}
            </div>
          </div>
          
          <div class="weather-stat small-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px 10px; text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 1.5rem; margin-bottom: 5px; color: var(--text);">🌪️</div>
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); font-weight: 600;">Puuskat</div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-top: 5px;">${gusts} m/s</div>
          </div>

          <div class="weather-stat small-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 15px 10px; text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 1.5rem; margin-bottom: 5px; color: var(--info, #3b82f6);">💧</div>
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted); font-weight: 600;">Sade</div>
            <div style="font-size: 1.1rem; font-weight: 700; margin-top: 5px;">${precip} mm</div>
          </div>
        </div>

      </div>
      <div style="text-align: right; margin-top: 15px; font-size: 0.8rem; color: var(--muted); display: flex; justify-content: space-between; align-items: center;">
        ${isOutdated ? `<span style="color: var(--danger); font-weight: bold;">⚠️ Säädata vanhentunut</span>` : `<span></span>`}
        <span>Päivitetty klo ${time}</span>
      </div>
    </div>
  `;
}

export function registerWeatherActions() {
  registerAction("fetch-local-weather", (e, button) => {
    const eventId = button.dataset.eventId;
    button.textContent = "Paikannetaan...";
    button.disabled = true;

    if (!navigator.geolocation) {
      button.textContent = "Sijaintia ei tueta";
      return true;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        button.style.display = "none";
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeather(lat, lon, eventId);
      },
      (error) => {
        button.textContent = "Paikannus epäonnistui (Lupa evätty?)";
        button.disabled = false;
      }
    );
    return true;
  });
}
