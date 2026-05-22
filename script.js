(function () {
  "use strict";

  const STORAGE_KEY = "spendDeterrentOptions";
  const DEFAULT_OPTIONS = [
    "Add to emergency fund",
    "Pay down credit card",
    "Invest in index fund",
    "Top up retirement account",
    "Save for a trip",
    "Buy a book you'll actually read",
    "Cook a nice meal at home",
    "Treat a friend to coffee",
    "Donate to a cause",
    "Save for a rainy day",
  ];

  const PALETTE = [
    "#ef4444", "#f59e0b", "#facc15", "#84cc16",
    "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
    "#a855f7", "#ec4899",
  ];

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spin-btn");
  const resultEl = document.getElementById("result");
  const resultText = document.getElementById("result-text");
  const addForm = document.getElementById("add-form");
  const addInput = document.getElementById("add-input");
  const optionsList = document.getElementById("options-list");
  const resetBtn = document.getElementById("reset-btn");

  let options = loadOptions();
  let currentAngle = 0;
  let spinning = false;

  function loadOptions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s) => typeof s === "string" && s.trim());
        }
      }
    } catch (_) {}
    return [...DEFAULT_OPTIONS];
  }

  function saveOptions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch (_) {}
  }

  function colorFor(index) {
    return PALETTE[index % PALETTE.length];
  }

  function setupHiDpiCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cssSize = canvas.clientWidth;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return cssSize;
  }

  function drawWheel() {
    const size = setupHiDpiCanvas();
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    if (options.length === 0) {
      ctx.fillStyle = "#273449";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 18px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add some options below", cx, cy);
      return;
    }

    const sliceAngle = (Math.PI * 2) / options.length;

    for (let i = 0; i < options.length; i++) {
      const start = currentAngle + i * sliceAngle;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = colorFor(i);
      ctx.fill();
      ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#0f172a";
      const fontSize = Math.max(11, Math.min(18, size / 28));
      ctx.font = `700 ${fontSize}px -apple-system, sans-serif`;
      const label = truncate(options[i], 22);
      ctx.fillText(label, radius - 14, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
  }

  function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
  }

  function renderOptionsList() {
    optionsList.innerHTML = "";
    options.forEach((opt, i) => {
      const li = document.createElement("li");

      const label = document.createElement("div");
      label.className = "label";
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = colorFor(i);
      const text = document.createElement("span");
      text.className = "text";
      text.textContent = opt;
      label.appendChild(swatch);
      label.appendChild(text);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.setAttribute("aria-label", `Remove ${opt}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        options.splice(i, 1);
        saveOptions();
        renderAll();
      });

      li.appendChild(label);
      li.appendChild(remove);
      optionsList.appendChild(li);
    });
  }

  function renderAll() {
    drawWheel();
    renderOptionsList();
    spinBtn.disabled = options.length < 2;
  }

  function spin() {
    if (spinning || options.length < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.classList.remove("highlight");
    resultText.textContent = "Spinning…";

    const sliceAngle = (Math.PI * 2) / options.length;
    const targetIndex = Math.floor(Math.random() * options.length);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.7;

    // Pointer is at top (-PI/2). We want the center of targetIndex to land there.
    // Slice i occupies [currentAngle + i*slice, currentAngle + (i+1)*slice].
    // Its center is at currentAngle + (i + 0.5)*slice. Set that == -PI/2 (mod 2PI).
    const targetCenter = -Math.PI / 2;
    const desiredAngle =
      targetCenter - (targetIndex + 0.5) * sliceAngle + jitter;

    const startAngle = currentAngle;
    const normalizedStart = ((startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const normalizedDesired = ((desiredAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = normalizedDesired - normalizedStart;
    if (delta <= 0) delta += Math.PI * 2;
    const totalRotation = fullSpins * Math.PI * 2 + delta;

    const duration = 4500;
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      currentAngle = startAngle + totalRotation * eased;
      drawWheel();

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        spinBtn.disabled = options.length < 2;
        const winner = options[targetIndex];
        resultText.textContent = winner;
        resultEl.classList.add("highlight");
      }
    }

    requestAnimationFrame(frame);
  }

  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = addInput.value.trim();
    if (!value) return;
    options.push(value);
    saveOptions();
    addInput.value = "";
    renderAll();
  });

  resetBtn.addEventListener("click", () => {
    options = [...DEFAULT_OPTIONS];
    saveOptions();
    renderAll();
  });

  spinBtn.addEventListener("click", spin);

  window.addEventListener("resize", drawWheel);

  renderAll();
})();
