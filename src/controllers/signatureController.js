export function initSignaturePad() {
  const canvas = document.getElementById("signature-pad");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function resizeCanvas() {
    // Only resize if the modal is actually visible to avoid messing up scale
    const modal = document.getElementById("signature-modal");
    if (modal && !modal.classList.contains("hidden")) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200; // Fixed height
    }
  }

  // Set up context
  function setupCtx() {
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
  }

  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Calculate scale because canvas.width and rect.width might differ
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function startDrawing(e) {
    if (e.cancelable) e.preventDefault(); // prevent scrolling on touch
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;
  }

  function draw(e) {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault(); // prevent scrolling on touch
    
    const { x, y } = getCoordinates(e);
    
    setupCtx();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  // Mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // Touch events
  canvas.addEventListener("touchstart", startDrawing, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchcancel", stopDrawing);
  
  window.addEventListener("resize", resizeCanvas);
}

export function openSignatureModal(inputName, imageId) {
  const modal = document.getElementById("signature-modal");
  const targetInput = document.getElementById("signature-target-input");
  const targetImage = document.getElementById("signature-target-image");
  
  if (!modal) { console.error("ERROR: signature-modal not found in DOM"); return; }
  if (!targetInput) { console.error("ERROR: signature-target-input not found"); return; }
  if (!targetImage) { console.error("ERROR: signature-target-image not found"); return; }

  targetInput.value = inputName;
  targetImage.value = imageId;
  modal.classList.remove("hidden");
  
  // Clear the canvas on open
  const canvas = document.getElementById("signature-pad");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    
    // Fix canvas size for crisp rendering before clearing
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = rect.height || 200;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    console.error("ERROR: signature-pad canvas not found");
  }
}

export function closeSignatureModal() {
  const modal = document.getElementById("signature-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

export function clearSignature() {
  const canvas = document.getElementById("signature-pad");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function saveSignature() {
  const canvas = document.getElementById("signature-pad");
  const targetInputName = document.getElementById("signature-target-input")?.value;
  const targetImageId = document.getElementById("signature-target-image")?.value;
  
  if (canvas && targetInputName) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasPixels = false;
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 0) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    let dataUrl = "";
    if (hasPixels) {
      const padding = 10;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);
      
      const bboxWidth = Math.max(1, maxX - minX);
      const bboxHeight = Math.max(1, maxY - minY);
      
      // Force all signatures into a standardized 300x120 image.
      // This guarantees identical scaling and stroke thickness in the print view.
      const targetWidth = 300;
      const targetHeight = 120;
      
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const tempCtx = tempCanvas.getContext("2d");
      
      let drawWidth = bboxWidth;
      let drawHeight = bboxHeight;
      
      // Only scale down if it exceeds the 300x120 bounds. Never scale up!
      if (drawWidth > targetWidth || drawHeight > targetHeight) {
         const scale = Math.min(targetWidth / drawWidth, targetHeight / drawHeight);
         drawWidth *= scale;
         drawHeight *= scale;
      }
      
      const dx = (targetWidth - drawWidth) / 2;
      const dy = (targetHeight - drawHeight) / 2;
      
      tempCtx.drawImage(canvas, minX, minY, bboxWidth, bboxHeight, dx, dy, drawWidth, drawHeight);
      dataUrl = tempCanvas.toDataURL("image/png");
    }
    
    // Find the input field within the form
    const inputs = document.querySelectorAll(`input[name="${targetInputName}"]`);
    
    // Update all matching hidden inputs
    inputs.forEach(input => {
      input.value = dataUrl;
    });
    
    // Update the preview image if provided
    if (targetImageId) {
      const img = document.getElementById(targetImageId);
      if (img) {
        if (dataUrl) {
          img.src = dataUrl;
          img.style.display = "block";
        } else {
          img.src = "";
          img.style.display = "none";
        }
      }
    }
    
    closeSignatureModal();
  }
}

import { registerAction } from "../core/actionRegistry.js";

export function initSignatureActions() {
  // Initialize the canvas event listeners
  initSignaturePad();

  registerAction("open-signature", (event, button) => {
    const inputName = button.dataset.targetInput;
    const imageId = button.dataset.targetImage;
    openSignatureModal(inputName, imageId);
    return true;
  });

  registerAction("close-signature", () => {
    closeSignatureModal();
    return true;
  });

  registerAction("clear-signature", () => {
    clearSignature();
    return true;
  });

  registerAction("save-signature", () => {
    saveSignature();
    return true;
  });
}
