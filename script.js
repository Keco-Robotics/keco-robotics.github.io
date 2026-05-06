(function () {
  var y = document.getElementById("y");
  if (y) y.textContent = String(new Date().getFullYear());

  var logo = document.getElementById("swimLogo");
  var img = logo && logo.querySelector(".swim-logo__img");
  if (!logo || !img) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    logo.style.transform = "translate(12px, 80px)";
    return;
  }

  var lastX = window.innerWidth * 0.55;
  var lastY = window.innerHeight * 0.35;
  /** Set false if your PNG already faces right; then “swim right” = no flip. */
  var ART_FACES_LEFT = true;
  var facingRight = false;
  var durationMs = 7000;
  var swimTimer = null;
  var started = false;

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function measure() {
    var rect = logo.getBoundingClientRect();
    return { w: rect.width || 120, h: rect.height || 120 };
  }

  function swimToRandom() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var m = measure();
    var pad = 16;
    var maxX = Math.max(pad, vw - m.w - pad);
    var maxY = Math.max(pad, vh - m.h - pad);
    var nx = pad + Math.random() * (maxX - pad);
    var ny = pad + Math.random() * (maxY - pad);
    nx = clamp(nx, pad, maxX);
    ny = clamp(ny, pad, maxY);

    var dx = nx - lastX;
    var hThresh = 14;
    if (dx > hThresh) facingRight = true;
    else if (dx < -hThresh) facingRight = false;

    lastX = nx;
    lastY = ny;

    var flip = facingRight === ART_FACES_LEFT;
    img.style.transform = flip ? "scaleX(-1)" : "scaleX(1)";

    durationMs = 5000 + Math.random() * 5500;
    logo.style.transition = "transform " + durationMs / 1000 + "s cubic-bezier(0.4, 0, 0.2, 1)";
    logo.style.transform = "translate(" + nx + "px, " + ny + "px)";
  }

  function scheduleNext() {
    if (swimTimer) window.clearTimeout(swimTimer);
    swimTimer = window.setTimeout(function () {
      swimToRandom();
      scheduleNext();
    }, durationMs + 200 + Math.random() * 800);
  }

  function startSwimming() {
    if (started) return;
    started = true;
    swimToRandom();
    scheduleNext();
  }

  var resizeDebounce;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeDebounce);
    resizeDebounce = window.setTimeout(function () {
      swimToRandom();
    }, 120);
  });

  img.addEventListener("load", startSwimming);
  if (img.complete) startSwimming();
})();
