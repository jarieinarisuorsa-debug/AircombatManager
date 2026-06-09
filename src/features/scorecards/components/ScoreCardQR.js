import { UI } from "../../../ui/engine.js";
import { escapeHtml } from "../../../utils/html.js";
import { t } from "../../../utils/i18n.js";


// Compressor functions to minimize JSON payload size for QR code
export function compressScoreCard(card) {
  // Map round data to tiny keys to save space
  const rounds = (card.rounds || []).filter(r => r.total > 0 || r.flightMinutes > 0 || r.cuts > 0).map(r => {
    const min = {
      r: r.roundNumber,
      m: r.flightMinutes || 0,
      s: r.flightSeconds || 0,
      c: r.cuts || 0,
      g: r.groundTargets || 0,
      o: r.streamerOk ? 1 : 0,
      h: r.hasenfuss ? 1 : 0,
      l: r.safetylineOverflown ? 1 : 0,
      e: r.landingAfterEndSignal ? 1 : 0,
      t: r.takeoff ? 1 : 0
    };
    
    // Add model points if WWI
    if (r.modelPoints && Object.values(r.modelPoints).some(v => v)) {
      min.mp = {
        f: r.modelPoints.fourStroke ? 1 : 0,
        m: r.modelPoints.multiwing ? 1 : 0,
        r: r.modelPoints.ribStructure ? 1 : 0,
        o: r.modelPoints.onboardPilot ? 1 : 0,
        w: r.modelPoints.weapons ? 1 : 0,
        s: r.modelPoints.riggingStruts ? 1 : 0
      };
    }
    return min;
  });

  const payload = {
    v: 1, // version
    e: card.entryId,
    c: rounds
  };

  return JSON.stringify(payload);
}

export function decompressScoreCard(jsonString, existingCard) {
  try {
    const payload = JSON.parse(jsonString);
    if (payload.v !== 1) return null;

    const newCard = JSON.parse(JSON.stringify(existingCard)); // Deep copy
    
    // Merge rounds
    payload.c.forEach(minRound => {
      let round = newCard.rounds.find(r => r.roundNumber === minRound.r);
      if (!round) {
        round = { roundNumber: minRound.r, templateId: newCard.templateId };
        newCard.rounds.push(round);
      }
      
      round.flightMinutes = minRound.m;
      round.flightSeconds = minRound.s;
      round.cuts = minRound.c;
      round.groundTargets = minRound.g;
      round.streamerOk = Boolean(minRound.o);
      round.hasenfuss = Boolean(minRound.h);
      round.safetylineOverflown = Boolean(minRound.l);
      round.landingAfterEndSignal = Boolean(minRound.e);
      round.takeoff = Boolean(minRound.t);
      
      if (minRound.mp) {
        round.modelPoints = round.modelPoints || {};
        round.modelPoints.fourStroke = Boolean(minRound.mp.f);
        round.modelPoints.multiwing = Boolean(minRound.mp.m);
        round.modelPoints.ribStructure = Boolean(minRound.mp.r);
        round.modelPoints.onboardPilot = Boolean(minRound.mp.o);
        round.modelPoints.weapons = Boolean(minRound.mp.w);
        round.modelPoints.riggingStruts = Boolean(minRound.mp.s);
      }
    });

    return newCard;
  } catch (err) {
    console.error("QR Parse Error", err);
    return null;
  }
}

// ---------------------------------------------------------
// QR Modal Generator (Pilot's phone)
// ---------------------------------------------------------
export function renderQRGeneratorModal(card, pilotName) {
  const payload = compressScoreCard(card);
  
  const content = `
    <div style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
      <p style="text-align: center; margin-bottom: 20px;" class="muted">Näytä tämä koodi tuomarille tulosten tallentamiseksi.</p>
      
      <div id="qrcode-container" style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <canvas id="qrcode-canvas"></canvas>
      </div>
      
      <div style="font-family: monospace; font-size: 10px; color: var(--text-muted); word-break: break-all; max-width: 300px; text-align: center;">
        ${escapeHtml(payload)}
      </div>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('qrcode-canvas');
    if (canvas && window.QRCode) {
      window.QRCode.toCanvas(canvas, payload, {
        width: 250,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, function (error) {
        if (error) console.error(error);
      });
    }
  }, 100);

  return `
    <div class="app-modal-backdrop" style="z-index: 2000;" data-action="close-qr-scanner">
      <div class="app-modal-shell" role="dialog" aria-modal="true" style="max-width: 450px;" data-action="none">
        <div class="app-modal-topbar">
          <h3 style="margin: 0;">QR Tuloskortti - ${escapeHtml(pilotName)}</h3>
        </div>
        <div class="app-modal-content">
          ${content}
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
            <button type="button" class="button" data-action="close-qr-scanner">Sulje</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------
// QR Scanner Modal (Judge's phone)
// ---------------------------------------------------------
export function renderQRScannerModal() {
  const content = `
    <div style="display: flex; flex-direction: column; align-items: center; padding: 10px;">
      <p style="text-align: center; margin-bottom: 15px;" class="muted">Osoita kamera kilpailijan tuloskortin QR-koodiin.</p>
      <div id="qr-reader" style="width: 100%; max-width: 500px; border-radius: 10px; overflow: hidden; background: #000;"></div>
      <div id="qr-scanner-status" style="margin-top: 15px; font-weight: bold; min-height: 24px;"></div>
    </div>
  `;

  // Start scanner
  setTimeout(() => {
    if (!window.Html5Qrcode) {
      document.getElementById('qr-scanner-status').innerHTML = '<span style="color:red">QR-kirjastoa ei löytynyt. Lataa sivu uudelleen.</span>';
      return;
    }

    const html5QrCode = new window.Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Tallenna instanssi windowiin jotta sulkemistoiminto voi pysäyttää sen
    window._currentQrScanner = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" }, // Prefer back camera
      config,
      (decodedText, decodedResult) => {
        // Success callback
        document.getElementById('qr-scanner-status').innerHTML = '<span style="color:var(--success)">Koodi luettu! Tallennetaan...</span>';
        
        // Stop scanning
        html5QrCode.stop().then(() => {
          window._currentQrScanner = null;
          
          // Trigger a global custom event or click action to process the data
          // We can dispatch a custom event on document
          const event = new CustomEvent('qr-scanned', { detail: decodedText });
          document.dispatchEvent(event);
          
        }).catch((err) => {
          console.error("Failed to stop scanner", err);
        });
      },
      (errorMessage) => {
        // Parse error, happens continuously, ignore.
      }
    ).catch((err) => {
      document.getElementById('qr-scanner-status').innerHTML = `<span style="color:var(--danger)">Kameraa ei voitu käynnistää: ${err}</span>`;
    });
  }, 100);

  return `
    <div class="app-modal-backdrop" style="z-index: 2000;" data-action="close-qr-scanner">
      <div class="app-modal-shell" role="dialog" aria-modal="true" style="max-width: 550px;" data-action="none">
        <div class="app-modal-topbar">
          <h3 style="margin: 0;">Skannaa Tuloskortti</h3>
        </div>
        <div class="app-modal-content">
          ${content}
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
            <button type="button" class="button" data-action="close-qr-scanner">Peruuta</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
