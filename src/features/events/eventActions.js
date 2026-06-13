import { DEFAULT_RULES } from "../../data/defaultState.js";
import { DEFAULT_COMPETITION_FORMAT, normalizeCompetitionFormat } from "../../logic/competitionFormat.js";
import { DEFAULT_EVENT_INFO, normalizeEventInfo } from "../../logic/eventInfo.js";
import { createId, updateState, getState, isDemo } from "../../state/store.js";
import { requireAdmin } from "../../users/roles.js";
import { requireText } from "../../utils/formValues.js";
import { openConfirmModal } from "../../core/confirmActions.js";
import { openAlertModal } from "../../core/alertActions.js";
import { registerAction } from "../../core/actionRegistry.js";
import { setActiveEvent } from "../settings/settingsActions.js";
import { registerWeatherActions } from "./weatherWidget.js";
import { t } from "../../utils/i18n.js";
import { showToast } from "../../ui/toast.js";
export function addEvent(data) {
  updateState((state) => {
    requireAdmin(state);
    if (isDemo && state.events.length >= 1) {
      throw new Error("Demo-versiossa voit perustaa vain yhden kilpailun.");
    }
    const event = {
      id: createId("event"),
      name: requireText(data.name, "Kilpailun nimi puuttuu."),
      location: requireText(data.location, "Kilpailupaikka puuttuu."),
      date: data.date,
      endDate: data.endDate || data.date,
      status: "planned",
      classes: String(data.classes || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      publicNotice: String(data.publicNotice || "").trim(),
      safetyStatus: "planned",
      resultsPublished: false,
      resultsPublishedAt: null,
      resultsApprovedBy: "",
      rules: { ...DEFAULT_RULES },
      competitionFormat: { ...DEFAULT_COMPETITION_FORMAT },
      classFormats: {},
      eventInfo: { ...DEFAULT_EVENT_INFO }
    };
    state.events.push(event);
    state.activeEventId = event.id;

    if (isDemo) {
      const demoPilotIds = ["demo-p1", "demo-p2", "demo-p3", "demo-p4", "demo-p5", "demo-p6"];
      state.registrations = state.registrations || [];
      state.entries = state.entries || [];
      demoPilotIds.forEach((pId, idx) => {
        const pPlanes = state.aircraft ? state.aircraft.filter(a => a.pilotId === pId) : [];
        const ww2Plane = pPlanes.find(a => a.className === "WWII");
        const ww1Plane = pPlanes.find(a => a.className === "WWI");
        
        const classes = [];
        if (ww2Plane) classes.push("WWII");
        if (ww1Plane) classes.push("WWI");
        
        if (classes.length > 0) {
          const isPending = idx < 3; // Ensimmäiset 3 odottavat hyväksyntää
          state.registrations.push({
            id: createId("reg"),
            eventId: event.id,
            pilotId: pId,
            classes: classes,
            status: isPending ? "pending" : "approved",
            paymentIntent: "pay_on_site",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          if (!isPending) {
            if (ww2Plane) {
               state.entries.push({
                 id: createId("entry"),
                 eventId: event.id,
                 pilotId: pId,
                 aircraftId: ww2Plane.id,
                 className: "WWII",
                 raceNumber: String(idx + 1),
                 paymentStatus: "paid",
                 checkInStatus: "checked_in",
                 technicalInspection: "approved",
                 notes: "Demoilmoittautuminen",
                 paid: true,
                 checkedIn: true,
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
               });
            }
            if (ww1Plane) {
               state.entries.push({
                 id: createId("entry"),
                 eventId: event.id,
                 pilotId: pId,
                 aircraftId: ww1Plane.id,
                 className: "WWI",
                 raceNumber: String(idx + 1),
                 paymentStatus: "paid",
                 checkInStatus: "checked_in",
                 technicalInspection: "approved",
                 notes: "Demoilmoittautuminen",
                 paid: true,
                 checkedIn: true,
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
               });
            }
          }
        }
      });
      const count = state.registrations.filter(r => r.eventId === event.id).length;
      setTimeout(() => {
        showToast("Demo auto-populate suoritettiin. Lisätyt ilmoittautumiset: " + count, "success");
      }, 50);
    }

  }, "add_event");
}

export function deleteEvent(eventId) {
  updateState((state) => {
    requireAdmin(state);
    const heatIds = state.heats.filter((heat) => heat.eventId === eventId).map((heat) => heat.id);
    state.events = state.events.filter((event) => event.id !== eventId);
    state.entries = state.entries.filter((entry) => entry.eventId !== eventId);
    state.heats = state.heats.filter((heat) => heat.eventId !== eventId);
    state.results = state.results.filter((result) => !heatIds.includes(result.heatId));
    state.scoreCards = state.scoreCards.filter((card) => card.eventId !== eventId);
    if (state.activeEventId === eventId) state.activeEventId = state.events[0]?.id || null;
  }, "delete_event");
}

export function moveEventUp(eventId) {
  updateState((state) => {
    requireAdmin(state);
    
    const getYear = (dateStr) => {
      if (!dateStr) return null;
      const match = String(dateStr).match(/\d{4}/);
      if (match) {
        const yr = parseInt(match[0], 10);
        if (yr >= 2000 && yr <= 2100) return yr;
      }
      return null;
    };

    const selectedYear = window.CALENDAR_YEAR || new Date().getFullYear();
    const yearEvents = state.events.filter(e => getYear(e.date) === selectedYear)
      .sort((a, b) => {
        const orderA = a.eventInfo?.orderIndex !== undefined ? a.eventInfo.orderIndex : 99999;
        const orderB = b.eventInfo?.orderIndex !== undefined ? b.eventInfo.orderIndex : 99999;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.date).localeCompare(String(b.date));
      });
      
    const idx = yearEvents.findIndex(e => e.id === eventId);
    if (idx > 0) {
      // Alusta järjestysnumero kaikille saman vuoden kilpailuille, jos puuttuu
      yearEvents.forEach((e, i) => {
        const stateEvent = state.events.find(x => x.id === e.id);
        if (stateEvent) {
          stateEvent.eventInfo = { ...(stateEvent.eventInfo || {}), orderIndex: i };
        }
      });
      
      // Suorita vaihto
      const ev1 = state.events.find(x => x.id === yearEvents[idx].id);
      const ev2 = state.events.find(x => x.id === yearEvents[idx - 1].id);
      if (ev1 && ev2) {
        const temp = ev1.eventInfo.orderIndex;
        ev1.eventInfo = { ...ev1.eventInfo, orderIndex: ev2.eventInfo.orderIndex };
        ev2.eventInfo = { ...ev2.eventInfo, orderIndex: temp };
      }
    }
  }, "move_event_up");
}

export function moveEventDown(eventId) {
  updateState((state) => {
    requireAdmin(state);
    
    const getYear = (dateStr) => {
      if (!dateStr) return null;
      const match = String(dateStr).match(/\d{4}/);
      if (match) {
        const yr = parseInt(match[0], 10);
        if (yr >= 2000 && yr <= 2100) return yr;
      }
      return null;
    };

    const selectedYear = window.CALENDAR_YEAR || new Date().getFullYear();
    const yearEvents = state.events.filter(e => getYear(e.date) === selectedYear)
      .sort((a, b) => {
        const orderA = a.eventInfo?.orderIndex !== undefined ? a.eventInfo.orderIndex : 99999;
        const orderB = b.eventInfo?.orderIndex !== undefined ? b.eventInfo.orderIndex : 99999;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.date).localeCompare(String(b.date));
      });
      
    const idx = yearEvents.findIndex(e => e.id === eventId);
    if (idx >= 0 && idx < yearEvents.length - 1) {
      // Alusta järjestysnumero kaikille saman vuoden kilpailuille, jos puuttuu
      yearEvents.forEach((e, i) => {
        const stateEvent = state.events.find(x => x.id === e.id);
        if (stateEvent) {
          stateEvent.eventInfo = { ...(stateEvent.eventInfo || {}), orderIndex: i };
        }
      });
      
      // Suorita vaihto
      const ev1 = state.events.find(x => x.id === yearEvents[idx].id);
      const ev2 = state.events.find(x => x.id === yearEvents[idx + 1].id);
      if (ev1 && ev2) {
        const temp = ev1.eventInfo.orderIndex;
        ev1.eventInfo = { ...ev1.eventInfo, orderIndex: ev2.eventInfo.orderIndex };
        ev2.eventInfo = { ...ev2.eventInfo, orderIndex: temp };
      }
    }
  }, "move_event_down");
}

export function updateCompetitionFormat(data) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const className = String(data.formatClassName || "").trim();
    if (!className) throw new Error("Kilpailuluokka puuttuu. Avaa rakenneasetus luokkakortin painikkeesta.");

    event.classFormats = event.classFormats || {};
    event.classFormats[className] = normalizeCompetitionFormat({
      qualifyingRounds: data.qualifyingRounds,
      semiFinalEnabled: Boolean(data.semiFinalEnabled),
      semiFinalists: data.semiFinalists,
      finalEnabled: Boolean(data.finalEnabled),
      finalists: data.finalists,
      rankingMode: "total_points"
    });
    event.resultsPublished = false;
    event.resultsPublishedAt = null;
  }, "update_class_competition_format");
}

export function updateEventInfo(data) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) throw new Error("Aktiivista kilpailua ei ole valittu.");

    if ("publicNotice" in data) {
      event.publicNotice = String(data.publicNotice || "").trim();
    }

    const existingInfo = event.eventInfo || {};
    const updatedInfo = { ...existingInfo };
    
    const editableFields = ["description", "organizer", "contactName", "contactEmail", "websiteUrl", "address", "latitude", "longitude", "mapsUrl", "mapImageUrl", "arrivalInfo", "servicesInfo", "documentsText", "coatOfArmsData"];
    editableFields.forEach(field => {
      if (field in data) {
        updatedInfo[field] = data[field];
      }
    });

    event.eventInfo = normalizeEventInfo(updatedInfo);
    
    state.settings = state.settings || {};
    state.settings.eventInfoEditMode = null; // Close edit mode on save
  }, "update_event_info");
}

export function addMapPoi(x, y, label) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) return;
    event.eventInfo.mapPois = event.eventInfo.mapPois || [];
    event.eventInfo.mapPois.push({
      id: createId("poi"),
      x,
      y,
      label
    });
  }, "add_map_poi");
}

export function removeMapPoi(poiId) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) return;
    event.eventInfo.mapPois = (event.eventInfo.mapPois || []).filter((poi) => poi.id !== poiId);
  }, "remove_map_poi");
}

export function moveMapPoi(poiId, x, y) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event || !event.eventInfo.mapPois) return;
    const poi = event.eventInfo.mapPois.find((p) => p.id === poiId);
    if (poi) {
      poi.x = x;
      poi.y = y;
    }
  }, "move_map_poi");
}

export function addMapZone(points, label, color) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) return;
    event.eventInfo.mapZones = event.eventInfo.mapZones || [];
    event.eventInfo.mapZones.push({
      id: createId("zone"),
      points,
      label,
      color
    });
  }, "add_map_zone");
}

export function removeMapZone(zoneId) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) return;
    event.eventInfo.mapZones = (event.eventInfo.mapZones || []).filter((z) => z.id !== zoneId);
  }, "remove_map_zone");
}

export function addEventSponsor(data) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) throw new Error("Aktiivista kilpailua ei ole valittu.");

    event.eventInfo.sponsors = event.eventInfo.sponsors || [];
    event.eventInfo.sponsors.push({
      id: createId("sponsor"),
      name: requireText(data.name, "Sponsorin nimi puuttuu."),
      level: data.level || "Yhteistyökumppani",
      logoUrl: String(data.logoData || data.logoUrl || "").trim(),
      websiteUrl: String(data.websiteUrl || "").trim(),
      description: String(data.description || "").trim()
    });
  }, "add_event_sponsor");
}

export function saveEventScheduleRow(data) {
  updateState((state) => {
    requireAdmin(state);
    const event = state.events.find((item) => item.id === state.activeEventId);
    if (!event) throw new Error("Aktiivista kilpailua ei ole valittu.");

    const info = event.eventInfo || {};
    const schedule = info.schedule || [];
    
    const isPublished = data.isPublished === "true" || data.isPublished === "on";
    const rowId = data.id;
    
    const rowData = {
      date: String(data.date || "").trim(),
      time: requireText(data.time, "Kellonaika puuttuu."),
      title: requireText(data.title, "Otsikko puuttuu."),
      description: String(data.description || "").trim(),
      className: String(data.className || "").trim(),
      location: String(data.location || "").trim(),
      isPublished
    };

    let updatedSchedule;
    if (rowId) {
      updatedSchedule = schedule.map(r => r.id === rowId ? { ...r, ...rowData } : r);
    } else {
      rowData.id = createId("sched");
      updatedSchedule = [...schedule, rowData];
    }
    
    event.eventInfo = { ...info, schedule: updatedSchedule };
    
    state.settings = state.settings || {};
    state.settings.eventInfoEditMode = null; // Close edit mode
  }, "save_event_schedule_row");
}

export function initEventActions() {
  registerWeatherActions();

  registerAction("set-active-event", (event, button, { renderApp }) => {
    setActiveEvent(button.dataset.eventId);
    location.hash = "";
    renderApp();
    return true;
  });

  registerAction("open-calendar-and-event-form", (event, button, { renderApp }) => {
    updateState(state => { 
      state.settings = state.settings || {};
      state.settings.eventFormOpen = true; 
    }, "open_event_form");
    location.hash = "#/calendar";
    renderApp();
    return true;
  });

  registerAction("set-active-event-stay", (event, button, { renderApp }) => {
    setActiveEvent(button.dataset.eventId);
    renderApp();
    return true;
  });

  registerAction("set-calendar-year", (event, button, { renderApp }) => {
    const val = button.dataset.year;
    window.CALENDAR_YEAR = val === "Muut" ? "Muut" : parseInt(val, 10);
    renderApp();
    return true;
  });

  registerAction("open-event-workspace", (event, button, { renderApp }) => {
    requireAdmin(getState());
    setActiveEvent(button.dataset.eventId);
    location.hash = "#/entries";
    renderApp();
    return true;
  });

  registerAction("toggle-wind-animation", async (event, button, { renderApp }) => {
    if (window.WIND_ANIM_ENABLED) {
      window.WIND_ANIM_ENABLED = false;
      window.WIND_ANIM_DATA = null;
      renderApp();
      return true;
    }
    
    const lat = button.dataset.lat;
    const lon = button.dataset.lon;
    const eventId = button.dataset.eventId;
    
    const originalText = button.innerHTML;
    button.innerHTML = "⏳ Haetaan...";
    button.disabled = true;
    
    try {
      const { getOrFetchWeather } = await import("./weatherWidget.js");
      const weather = await getOrFetchWeather(lat, lon, eventId);
      
      if (weather && weather.current && weather.current.wind_direction_10m !== undefined) {
        window.WIND_ANIM_ENABLED = true;
        window.WIND_ANIM_DATA = weather.current;
      } else if (weather && weather.wind_direction_10m !== undefined) {
        window.WIND_ANIM_ENABLED = true;
        window.WIND_ANIM_DATA = weather;
      } else {
        alert(t(getState(), "event_actions.wind_error1"));
      }
    } catch(e) {
      alert(t(getState(), "event_actions.wind_error2"));
    }
    
    button.innerHTML = originalText;
    button.disabled = false;
    renderApp();
    return true;
  });

  registerAction("set-workspace-tab", (event, button, { renderApp }) => {
    const wrapper = button.closest(".ui-tabs-wrapper");
    if (wrapper) {
      const nav = wrapper.querySelector(".sub-nav");
      if (nav && window.NAV_SCROLL_POSITIONS) {
        delete window.NAV_SCROLL_POSITIONS[nav.id || "default"];
      }
    }
    
    const tabValue = button.dataset.tab || button.value;
    if (tabValue === "toggle_combat_mode") {
      updateState((state) => {
        state.settings = state.settings || {};
        state.settings.competitionMode = !state.settings.competitionMode;
      }, "toggle_combat_mode");
      renderApp();
      return true;
    }

    if (tabValue.startsWith("class_")) {
      const className = tabValue.replace("class_", "");
      updateState((state) => {
        state.settings = state.settings || {};
        state.settings.workspaceActiveClassName = className;
      }, "switch_workspace_class");
      renderApp();
      return true;
    }

    updateState((state) => {
      state.settings = state.settings || {};
      state.settings.workspaceActiveTab = tabValue;
    }, "set_workspace_tab");
    location.hash = "#/entries";
    renderApp();
    return true;
  });

  registerAction("open-event-info", (event, button, { renderApp }) => {
    setActiveEvent(button.dataset.eventId);
    location.hash = "#/eventinfo";
    renderApp();
    return true;
  });

  registerAction("open-public-event", (event, button, { renderApp }) => {
    setActiveEvent(button.dataset.eventId);
    location.hash = "";
    renderApp();
    return true;
  });

  registerAction("open-public-event-heats", (event, button, { renderApp }) => {
    setActiveEvent(button.dataset.eventId);
    location.hash = "#/heats";
    renderApp();
    return true;
  });

  registerAction("open-public-event-results", (event, button, { renderApp }) => {
    setActiveEvent(button.dataset.eventId);
    location.hash = "#/results";
    renderApp();
    return true;
  });

  registerAction("delete-event", (event, button, { renderApp }) => {
    openConfirmModal({
      title: t(getState(), "event_actions.del_event_title"),
      message: t(getState(), "event_actions.del_event_msg"),
      action: "execute-delete-event",
      payload: { eventId: button.dataset.eventId }
    });
    return true;
  });

  registerAction("move-event-up", (event, button, { renderApp }) => {
    moveEventUp(button.dataset.eventId);
    renderApp();
    return true;
  });

  registerAction("move-event-down", (event, button, { renderApp }) => {
    moveEventDown(button.dataset.eventId);
    renderApp();
    return true;
  });

  registerAction("execute-delete-event", (event, button, { renderApp }) => {
    requireAdmin(getState());
    deleteEvent(button.dataset.eventId);
    renderApp();
    return true;
  });

  registerAction("select-palette-emoji", (event, button, { renderApp }) => {
    window.ACTIVE_PALETTE_EMOJI = button.dataset.emojiItem;
    renderApp();
    return true;
  });

  registerAction("add-custom-map-emoji", (event, button, { renderApp }) => {
    openConfirmModal({
      title: t(getState(), "map_editor.add_custom_title"),
      message: t(getState(), "map_editor.add_custom_msg"),
      isPrompt: true,
      submitLabel: t(getState(), "map_editor.add_btn"),
      isDanger: false,
      action: "execute-add-custom-map-emoji"
    });
    return true;
  });

  registerAction("execute-add-custom-map-emoji", (event, button, { renderApp }) => {
    const input = button.dataset.promptResult;
    if (!input || !input.trim()) return true;
    updateState(state => {
      state.settings.customMapEmojis = state.settings.customMapEmojis || [];
      if (!state.settings.customMapEmojis.includes(input.trim())) {
        state.settings.customMapEmojis.push(input.trim());
      }
    }, "add_custom_map_emoji");
    renderApp();
    return true;
  });

  registerAction("set-map-mode", (event, button, { renderApp }) => {
    window.MAP_EDITOR_MODE = button.dataset.mode;
    if (window.MAP_EDITOR_MODE !== "zone") {
      window.DRAFT_ZONE_POINTS = [];
    }
    renderApp();
    return true;
  });

  registerAction("cancel-edit-event-section", (event, button, { renderApp }) => {
    updateState(state => {
      state.settings = state.settings || {};
      state.settings.eventInfoEditMode = null;
    });
    renderApp();
    return true;
  });

  registerAction("edit-event-section", (event, button, { renderApp }) => {
    updateState(state => {
      state.settings = state.settings || {};
      state.settings.eventInfoEditMode = button.dataset.section;
    });
    renderApp();
    return true;
  });

  registerAction("set-event-info-tab", (event, button, { renderApp }) => {
    const wrapper = button.closest(".ui-tabs-wrapper");
    if (wrapper) {
      const nav = wrapper.querySelector(".sub-nav");
      if (nav && window.NAV_SCROLL_POSITIONS) {
        delete window.NAV_SCROLL_POSITIONS[nav.id || "default"];
      }
    }
    window.EVENT_INFO_TAB = button.dataset.tab || button.value;
    updateState(state => {
      state.settings = state.settings || {};
      state.settings.eventInfoEditMode = null;
    });
    renderApp();
    return true;
  });

  registerAction("map-click", (event, button, { renderApp }) => {
    if (window.IS_DRAGGING_POI) return true;
    
    requireAdmin(getState());
    const rect = button.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const mode = window.MAP_EDITOR_MODE || "poi";
    if (mode === "zone") {
      window.DRAFT_ZONE_POINTS = window.DRAFT_ZONE_POINTS || [];
      window.DRAFT_ZONE_POINTS.push({ x, y });
      renderApp();
      return true;
    }

    let title = t(getState(), "map_editor.new_poi_title");
    let message = t(getState(), "map_editor.new_poi_msg");
    let promptDefault = "";
    if (window.ACTIVE_PALETTE_EMOJI) {
      title = t(getState(), "map_editor.add_selected_title");
      message = t(getState(), "map_editor.edit_label_msg");
      promptDefault = window.ACTIVE_PALETTE_EMOJI;
    }

    openConfirmModal({
      title,
      message,
      isPrompt: true,
      promptDefault,
      submitLabel: t(getState(), "map_editor.add_to_map_btn"),
      isDanger: false,
      action: "execute-add-map-poi",
      payload: { x, y }
    });
    return true;
  });

  registerAction("execute-add-map-poi", (event, button, { renderApp }) => {
    const input = button.dataset.promptResult;
    if (!input || !input.trim()) return true;
    const x = parseFloat(button.dataset.x);
    const y = parseFloat(button.dataset.y);
    addMapPoi(x, y, input.trim());
    renderApp();
    return true;
  });

  registerAction("finish-zone", (event, button, { renderApp }) => {
    if (!window.DRAFT_ZONE_POINTS || window.DRAFT_ZONE_POINTS.length < 3) {
      openAlertModal({ title: t(getState(), "map_editor.not_enough_points_title"), message: t(getState(), "map_editor.not_enough_points_msg") });
      return true;
    }
    openConfirmModal({
      title: t(getState(), "map_editor.zone_info_title"),
      message: t(getState(), "map_editor.zone_name_msg"),
      isPrompt: true,
      submitLabel: t(getState(), "map_editor.continue_btn"),
      isDanger: false,
      action: "execute-finish-zone-step2"
    });
    return true;
  });

  registerAction("execute-finish-zone-step2", (event, button, { renderApp }) => {
    const label = button.dataset.promptResult;
    if (!label || !label.trim()) return true;

    openConfirmModal({
      title: t(getState(), "map_editor.zone_color_title"),
      message: t(getState(), "map_editor.zone_color_msg"),
      isPrompt: true,
      promptDefault: "1",
      submitLabel: t(getState(), "map_editor.save_zone_btn"),
      isDanger: false,
      action: "execute-finish-zone-final",
      payload: { label }
    });
    return true;
  });

  registerAction("execute-finish-zone-final", (event, button, { renderApp }) => {
    const colorInput = button.dataset.promptResult;
    const label = button.dataset.label;

    let color = "rgba(46, 204, 113, 0.4)"; // 1 = Green
    let strokeColor = "#2ecc71";
    if (colorInput === "2") { color = "rgba(231, 76, 60, 0.4)"; strokeColor = "#e74c3c"; }
    if (colorInput === "3") { color = "rgba(52, 152, 219, 0.4)"; strokeColor = "#3498db"; }
    if (colorInput === "4") { color = "rgba(241, 196, 15, 0.4)"; strokeColor = "#f1c40f"; }
    
    addMapZone(window.DRAFT_ZONE_POINTS, label, { fill: color, stroke: strokeColor });
    window.DRAFT_ZONE_POINTS = [];
    renderApp();
    return true;
  });

  registerAction("cancel-zone", (event, button, { renderApp }) => {
    window.DRAFT_ZONE_POINTS = [];
    renderApp();
    return true;
  });

  registerAction("remove-map-zone", (event, button) => {
    openConfirmModal({
      title: t(getState(), "map_editor.del_zone_title"),
      message: t(getState(), "map_editor.del_zone_msg"),
      action: "execute-remove-map-zone",
      payload: { zoneId: button.dataset.zoneId }
    });
    return true;
  });

  registerAction("execute-remove-map-zone", (event, button, { renderApp }) => {
    removeMapZone(button.dataset.zoneId);
    renderApp();
    return true;
  });

  registerAction("remove-map-poi", (event, button) => {
    requireAdmin(getState());
    event.stopPropagation(); // Älä laukaise kartan klikkausta
    openConfirmModal({
      title: t(getState(), "map_editor.del_poi_title"),
      message: t(getState(), "map_editor.del_poi_msg"),
      action: "execute-remove-map-poi",
      payload: { poiId: button.dataset.poiId }
    });
    return true;
  });

  registerAction("execute-remove-map-poi", (event, button, { renderApp }) => {
    requireAdmin(getState());
    removeMapPoi(button.dataset.poiId);
    renderApp();
    return true;
  });

  registerAction("delete-event-sponsor", (e, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: t(getState(), "event_actions.del_sponsor_title"),
      message: t(getState(), "event_actions.del_sponsor_msg"),
      action: "execute-delete-event-sponsor",
      payload: { sponsorId: button.dataset.sponsorId }
    });
    return true;
  });

  registerAction("execute-delete-event-sponsor", (e, button, { renderApp }) => {
    requireAdmin(getState());
    updateState((state) => {
      const event = state.events.find((item) => item.id === state.activeEventId);
      if (!event) return;
      event.eventInfo.sponsors = (event.eventInfo.sponsors || []).filter(s => s.id !== button.dataset.sponsorId);
    }, "delete_event_sponsor");
    renderApp();
    return true;
  });

  registerAction("delete-event-schedule-row", (e, button) => {
    requireAdmin(getState());
    openConfirmModal({
      title: t(getState(), "event_actions.del_sched_title"),
      message: t(getState(), "event_actions.del_sched_msg"),
      action: "execute-delete-event-schedule-row",
      payload: { rowId: button.dataset.rowId }
    });
    return true;
  });

  registerAction("execute-delete-event-schedule-row", (e, button, { renderApp }) => {
    requireAdmin(getState());
    updateState((state) => {
      const event = state.events.find((item) => item.id === state.activeEventId);
      if (!event) return;
      event.eventInfo.schedule = (event.eventInfo.schedule || []).filter(r => r.id !== button.dataset.rowId);
    }, "delete_event_schedule_row");
    renderApp();
    return true;
  });

  registerAction("fetch-admin-location", (e, button, { renderApp }) => {
    const statusEl = document.getElementById("admin-location-status");
    if (statusEl) statusEl.textContent = t(getState(), "event_actions.fetch_loc_loading");
    
    if (!navigator.geolocation) {
      if (statusEl) statusEl.textContent = t(getState(), "event_actions.fetch_loc_unsupported");
      return true;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latInput = document.getElementById("event-latitude-input");
        const lonInput = document.getElementById("event-longitude-input");
        if (latInput) latInput.value = position.coords.latitude.toFixed(6);
        if (lonInput) lonInput.value = position.coords.longitude.toFixed(6);
        if (statusEl) statusEl.textContent = t(getState(), "event_actions.fetch_loc_success");
      },
      (error) => {
        if (statusEl) statusEl.textContent = t(getState(), "event_actions.fetch_loc_failed");
      }
    );
    return true;
  });
}
