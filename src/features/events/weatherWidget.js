import { escapeHtml } from "../../utils/html.js";
import { UI } from "../../ui/engine.js";
import { registerAction } from "../../core/actionRegistry.js";

const weatherCache = {};
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 mins

export function renderWeatherWidget(event, admin = false, headerActions = "") {
  const lat = event.eventInfo?.latitude;
  const lon = event.eventInfo?.longitude;
  const eventId = event.id;

  const cached = weatherCache[eventId];
  const hasValidCache = cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS);

  if (hasValidCache && cached.data) {
    return renderWeatherContainer(eventId, renderWeatherHTML(cached.data, cached.timestamp, false), headerActions);
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
    return renderWeatherContainer(eventId, emptyState, headerActions);
  }

  // Trigger async fetch
  fetchWeather(lat, lon, eventId);

  const loadingState = `
    <div style="text-align: center; padding: 40px 10px;">
      <p class="muted">Haetaan säätietoja...</p>
    </div>
  `;
  return renderWeatherContainer(eventId, loadingState, headerActions);
}

export async function getOrFetchWeather(lat, lon, eventId) {
  const cached = weatherCache[eventId];
  const hasValidCache = cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS);
  
  if (hasValidCache && cached.data) {
    return cached.data;
  }
  
  if (!lat || !lon) return null;
  
  try {
    const safeLat = String(lat).replace(",", ".").trim();
    const safeLon = String(lon).replace(",", ".").trim();
    
    if (isNaN(parseFloat(safeLat)) || isNaN(parseFloat(safeLon))) {
      throw new Error("Virheelliset koordinaatit");
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${safeLat}&longitude=${safeLon}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&wind_speed_unit=ms&timezone=auto&forecast_days=4`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API virhe");
    const data = await response.json();
    weatherCache[eventId] = { data: data, timestamp: Date.now() };
    return data;
  } catch(e) {
    return null;
  }
}

function renderWeatherContainer(eventId, content, headerActions = "") {
  return UI.Panel({ kicker: "Säätila", title: "Kilpailupaikan sää", id: `weather-panel-${eventId}`, headerActions }, `
    <div id="weather-widget-container-${escapeHtml(eventId)}">
      ${content}
    </div>
  `);
}

async function fetchWeather(lat, lon, eventId) {
  const data = await getOrFetchWeather(lat, lon, eventId);
  if (data) {
    updateWeatherContainer(eventId, renderWeatherHTML(data, Date.now(), false));
  } else {
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

function renderWeatherHTML(data, timestamp, isOutdated = false) {
  const current = data.current || data;
  const daily = data.daily;
  
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

  let forecastHtml = "";
  if (daily && daily.time && daily.time.length > 1) {
    const daysHtml = [];
    for (let i = 1; i < Math.min(4, daily.time.length); i++) {
      const date = new Date(daily.time[i]);
      const weekday = date.toLocaleDateString('fi-FI', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' });
      const maxTemp = Math.round(daily.temperature_2m_max[i]);
      const minTemp = Math.round(daily.temperature_2m_min[i]);
      const windMax = Math.round(daily.wind_speed_10m_max[i]);
      const dayPrecip = daily.precipitation_sum[i];
      const dayIcon = getWeatherIcon(daily.weather_code[i]);

      daysHtml.push(`
        <div class="weather-forecast-day" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 12px; background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.15) 100%); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: transform 0.2s;">
          <div style="font-weight: bold; text-transform: capitalize; font-size: 0.85rem; color: var(--muted); margin-bottom: 8px; letter-spacing: 0.05em;">${weekday} ${dateStr}</div>
          <div style="font-size: 2.5rem; margin: 4px 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${dayIcon}</div>
          <div style="font-weight: 800; font-size: 1.2rem; margin: 8px 0;">${maxTemp}° <span style="color: var(--muted); font-size: 0.9rem; font-weight: normal;">${minTemp}°</span></div>
          <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">💨 ${windMax} m/s</div>
            ${dayPrecip > 0 ? `<div style="color: var(--info, #3b82f6); margin-top: 4px; font-weight: 600;">💧 ${dayPrecip} mm</div>` : `<div style="color: transparent; margin-top: 4px;">-</div>`}
          </div>
        </div>
      `);
    }

    forecastHtml = `
      <div style="margin-top: 20px;">
        <h4 style="margin: 0 0 12px 0; font-size: 1rem; color: var(--text-color); border-bottom: 1px solid var(--border); padding-bottom: 5px;">Tulevat päivät</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
          ${daysHtml.join("")}
        </div>
      </div>
    `;
  }

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
      ${forecastHtml}
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
