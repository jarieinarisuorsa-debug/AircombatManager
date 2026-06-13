import { escapeHtml } from "../utils/html.js";

// Helper to render HTML attributes safely
const renderAttrs = (attrs = {}) => {
  return Object.entries(attrs)
    .filter(([_, v]) => v !== undefined && v !== false && v !== null)
    .map(([k, v]) => v === true ? k : `${k}="${escapeHtml(v)}"`)
    .join(" ");
};

// Common UI Component Engine
export const UI = {
  // Layouts & Containers
  Panel: ({ title = "", kicker = "", className = "", id = "", headerActions = "", style = "" } = {}, content = "") => {
    const header = (title || kicker || headerActions) ? `
      <div class="panel-header">
        <div>
          ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
          ${title ? `<h3>${escapeHtml(title)}</h3>` : ""}
        </div>
        ${headerActions}
      </div>
    ` : "";
    
    return `
      <section class="panel ${className}" ${id ? `id="${escapeHtml(id)}"` : ""} ${style ? `style="${escapeHtml(style)}"` : ""}>
        ${header}
        ${content}
      </section>
    `;
  },
  
  SplitLayout: (leftContent = "", rightContent = "") => `
    <section class="split-layout">
      ${leftContent}
      ${rightContent}
    </section>
  `,

  // Forms & Inputs
  FormPanel: ({ title = "", kicker = "", action = "", id = "", className = "", style = "", autocomplete = "off" } = {}, content = "") => {
    return `
      <form class="panel form-panel ${className}" ${id ? `id="${escapeHtml(id)}"` : ""} ${action ? `data-action="${escapeHtml(action)}"` : ""} ${style ? `style="${escapeHtml(style)}"` : ""} ${autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : ""}>
        ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
        ${title ? `<h4 style="margin: 0 0 15px 0;">${escapeHtml(title)}</h4>` : ""}
        ${content}
        <div class="form-status-bar" style="display: none; margin-top: 15px; font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 10px; text-align: right;"></div>
      </form>
    `;
  },

  Input: ({ label = "", name = "", required = false, placeholder = "", type = "text", value = "", style = "", className = "", id = "", ...rest } = {}) => {
    const attrs = renderAttrs({ name, type, placeholder, value, required, style, class: className, id, ...rest });
    return `
      <label>${escapeHtml(label)}
        <input ${attrs} />
      </label>
    `;
  },

  Select: ({ label = "", name = "", options = [], value = "", required = false, style = "", className = "", id = "", ...rest } = {}) => {
    const attrs = renderAttrs({ name, required, style, class: className, id, ...rest });
    const opts = options.map(opt => {
      const isObject = typeof opt === 'object';
      const optVal = isObject ? opt.value : opt;
      const optLabel = isObject ? opt.label : opt;
      return `<option value="${escapeHtml(optVal)}" ${optVal === value ? 'selected' : ''}>${escapeHtml(optLabel)}</option>`;
    }).join("");
    
    if (!label) {
      return `<select ${attrs}>${opts}</select>`;
    }
    return `
      <label>${escapeHtml(label)}
        <select ${attrs}>
          ${opts}
        </select>
      </label>
    `;
  },

  // Buttons & Badges
  Button: ({ label, action = "", variant = "", size = "", type = "button", disabled = false, style = "", title = "", id = "", className = "", ...dataAttrs }) => {
    const classes = ["button"];
    if (variant) classes.push(variant);
    if (size) classes.push(size);
    if (className) classes.push(className);
    
    // Convert dataAttrs like { pilotId: 123 } to {"data-pilot-id": 123}
    const dataObj = Object.fromEntries(
      Object.entries(dataAttrs).map(([k, v]) => [`data-${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, v])
    );
    
    const attrs = renderAttrs({ 
      type, 
      class: classes.join(" "), 
      disabled, 
      style, 
      title, 
      id,
      "data-action": action || undefined,
      ...dataObj
    });
    
    return `<button ${attrs}>${label}</button>`;
  },

  LinkButton: ({ label, href = "", variant = "", size = "", style = "", title = "", id = "", className = "", ...dataAttrs }) => {
    const classes = ["button"];
    if (variant) classes.push(variant);
    if (size) classes.push(size);
    if (className) classes.push(className);
    
    const dataObj = Object.fromEntries(
      Object.entries(dataAttrs).map(([k, v]) => [`data-${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, v])
    );
    
    const attrs = renderAttrs({ 
      class: classes.join(" "), 
      href,
      style, 
      title, 
      id,
      ...dataObj
    });
    
    return `<a ${attrs}>${label}</a>`;
  },

  CountryFlag: (countryCode) => {
    if (!countryCode) return "";
    const code = String(countryCode).trim().toLowerCase();
    if (code.length !== 2) return `<span class="country-badge">${escapeHtml(countryCode)}</span>`;
    return `<img src="https://flagcdn.com/24x18/${code}.png" alt="${escapeHtml(countryCode)}" title="${escapeHtml(countryCode)}" style="width: 20px; height: 15px; border-radius: 2px; vertical-align: middle; box-shadow: 0 1px 2px rgba(0,0,0,0.2);" onerror="this.outerHTML='<span class=\\'country-badge\\'>${escapeHtml(countryCode)}</span>'" />`;
  },

  Badge: ({ label, variant = "info", style = "" }) => {
    const className = variant === "country" ? "country-badge" : `badge badge-${variant}`;
    return `<span class="${className}" style="${escapeHtml(style)}">${escapeHtml(label)}</span>`;
  },
  
  // Tables
  TableContainer: ({ content = "", style = "" } = {}) => {
    const attrs = renderAttrs({
      class: "ui-table-container pilot-table-container",
      style: `width: 100%; max-width: 100%; overflow-x: hidden; ${style}`
    });
    return `
      <div ${attrs}>
        ${content}
      </div>
    `;
  },
  
  Table: ({ headers = [], rows = [], className = "pilot-table", style = "width: 100%; border-collapse: collapse; font-size: 0.9rem;" } = {}) => {
    const ths = headers.map(h => `<th style="padding: 8px;">${escapeHtml(h)}</th>`).join("");
    return `
      <div class="ui-table-wrapper" style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
        <table class="${className}" style="${escapeHtml(style)}">
          <thead>
            <tr style="border-bottom: 2px solid var(--border); text-align: left;">
              ${ths}
            </tr>
          </thead>
          <tbody>
            ${rows.join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  TableRow: ({ cells = [], headers = [], className = "pilot-table-row", dataAttrs = {}, style = "border-bottom: 1px solid var(--border);" }) => {
    const dataObj = Object.fromEntries(
      Object.entries(dataAttrs).map(([k, v]) => [`data-${k.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`, v])
    );
    const attrs = renderAttrs({ class: className, style, ...dataObj });
    const tds = cells.map((c, i) => {
      const labelAttr = headers[i] ? ` data-label="${escapeHtml(headers[i])}"` : "";
      return `<td style="padding: 10px 8px;"${labelAttr}>${c}</td>`;
    }).join("");
    return `<tr ${attrs}>${tds}</tr>`;
  },

  // Grid
  Grid: ({ columns = "repeat(auto-fit, minmax(180px, 1fr))", gap = "10px", style = "", className = "" } = {}, content = "") => {
    const attrs = renderAttrs({
      class: ["ui-grid", className].filter(Boolean).join(" "),
      style: `--ui-grid-columns: ${columns}; --ui-grid-gap: ${gap}; ${style}`
    });
    return `
      <div ${attrs}>
        ${content}
      </div>
    `;
  },

  Flex: ({ direction = "row", gap = "8px", justify = "flex-start", align = "center", wrap = "nowrap", style = "", className = "", id = "" } = {}, content = "") => {
    const attrs = renderAttrs({
      id,
      class: ["ui-flex", className].filter(Boolean).join(" "),
      style: `--ui-flex-direction: ${direction}; --ui-flex-wrap: ${wrap}; --ui-flex-gap: ${gap}; --ui-flex-justify: ${justify}; --ui-flex-align: ${align}; ${style}`
    });
    return `
      <div ${attrs}>
        ${content}
      </div>
    `;
  },

  // Navigation
  ScrollableNav: ({ id = "", className = "", style = "", navStyle = "" } = {}, content = "") => {
    return `
      <div class="ui-tabs-wrapper ${className}" style="display: flex; align-items: center; gap: 4px; width: 100%; max-width: 100%; box-sizing: border-box; ${escapeHtml(style)}">
        <button type="button" class="button nav-arrow nav-arrow-left" data-action="scroll-nav" data-direction="-1" style="padding: 0 6px; flex-shrink: 0; min-height: 36px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="sub-nav" ${id ? `id="${escapeHtml(id)}"` : ""} style="display: flex; gap: 8px; overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex: 1; min-width: 0; scroll-snap-type: x mandatory; ${escapeHtml(navStyle)}">
          ${content}
        </div>
        <button type="button" class="button nav-arrow nav-arrow-right" data-action="scroll-nav" data-direction="1" style="padding: 0 6px; flex-shrink: 0; min-height: 36px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    `;
  },

  // Large hero banner for top-of-view context
  HeroBanner: ({ kicker = "", title = "", subtitle = "", meta = "", actions = "", className = "" } = {}) => `
    <section class="hero-banner ${className}">
      <div class="hero-banner__content">
        ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
        ${title ? `<h2 class="hero-banner__title">${escapeHtml(title)}</h2>` : ""}
        ${subtitle ? `<p class="hero-banner__subtitle">${escapeHtml(subtitle)}</p>` : ""}
        ${meta ? `<div class="hero-banner__meta">${meta}</div>` : ""}
      </div>
      ${actions ? `<div class="hero-banner__actions">${actions}</div>` : ""}
    </section>
  `,

  // Page-level hero header – consistent across all views
  PageHeader: ({ kicker = "", title = "", subtitle = "", headerActions = "", className = "" } = {}) => `
    <section class="page-header ${className}">
      <div class="page-header__info">
        ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
        ${title ? `<h2 class="page-header__title">${escapeHtml(title)}</h2>` : ""}
        ${subtitle ? `<p class="page-header__subtitle">${escapeHtml(subtitle)}</p>` : ""}
      </div>
      ${headerActions ? `<div class="page-header__actions">${headerActions}</div>` : ""}
    </section>
  `
};
