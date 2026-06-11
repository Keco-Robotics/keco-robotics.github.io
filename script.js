(function () {

  /* ── Year ── */
  var y = document.getElementById("y");
  if (y) y.textContent = String(new Date().getFullYear());

  /* ── Notify form → mailto ── */
  var form = document.getElementById("notifyForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (form.querySelector('input[type="email"]').value || "").trim();
      var body  = "Please notify me when you go public."
                + (email ? "\n\nMy email: " + email : "");
      window.location.href =
        "mailto:hello@kecorobotics.com"
        + "?subject=" + encodeURIComponent("Keep me informed")
        + "&body="    + encodeURIComponent(body);
    });
  }

  /* ── Underwater hero canvas ── */
  (function () {
    var canvas = document.getElementById("heroCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0;

    function resize() {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    var NUM_BUBBLES = 38;
    var bubs = [];
    function makeBubble(scatter) {
      return {
        x:  Math.random() * (W || 800),
        y:  scatter ? Math.random() * (H || 600) : (H || 600) + 8,
        r:  0.7 + Math.random() * 3.2,
        vy: -(0.12 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * 0.22,
        op: 0.06 + Math.random() * 0.13
      };
    }
    for (var b = 0; b < NUM_BUBBLES; b++) bubs.push(makeBubble(true));

    var NUM_RAYS = 9;
    var rays = [];
    for (var r = 0; r < NUM_RAYS; r++) {
      rays.push({
        base:    -0.45 + (r / (NUM_RAYS - 1)) * 0.9,
        hw:      0.018 + Math.random() * 0.065,
        opacity: 0.022 + Math.random() * 0.042,
        speed:   0.00012 + Math.random() * 0.00022,
        phase:   Math.random() * Math.PI * 2
      });
    }

    var tick = 0;
    var active = true;
    document.addEventListener("visibilitychange", function () {
      active = !document.hidden;
      if (active) requestAnimationFrame(draw);
    });

    function draw() {
      if (!active) return;
      tick++;
      var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
      if (cw !== W || ch !== H) { W = cw; H = ch; canvas.width = W; canvas.height = H; }
      var t = tick * 0.016;

      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0,    "#010A07");
      bg.addColorStop(0.45, "#032C1C");
      bg.addColorStop(1,    "#085041");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      var ox = W * 0.42, oy = -H * 0.18;
      for (var ri = 0; ri < rays.length; ri++) {
        var ray   = rays[ri];
        var angle = ray.base + Math.sin(t * ray.speed * 1000 + ray.phase) * 0.14;
        var hw    = ray.hw   + Math.sin(t * ray.speed *  700 + ray.phase + 1) * ray.hw * 0.22;
        var len   = H * 2.2;
        var x1 = ox + Math.sin(angle - hw) * len;
        var y1 = oy + Math.cos(angle - hw) * len;
        var x2 = ox + Math.sin(angle + hw) * len;
        var y2 = oy + Math.cos(angle + hw) * len;
        var rg = ctx.createLinearGradient(ox, oy, ox, H);
        rg.addColorStop(0,    "rgba(29,158,117," + ray.opacity + ")");
        rg.addColorStop(0.65, "rgba(29,158,117," + (ray.opacity * 0.28) + ")");
        rg.addColorStop(1,    "rgba(29,158,117,0)");
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = rg;
        ctx.fill();
      }

      ctx.lineWidth = 0.75;
      for (var bi = 0; bi < bubs.length; bi++) {
        var bub = bubs[bi];
        bub.x += bub.vx; bub.y += bub.vy;
        if (bub.y < -bub.r * 4) { bubs[bi] = makeBubble(false); continue; }
        ctx.beginPath();
        ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(225,245,238," + bub.op + ")";
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  /* ── Fish school ── */
  (function () {
    var heroEl = document.getElementById("hero");
    if (!heroEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
     * Formation slots in school-local space.
     * fwd  > 0 = ahead of school centre (toward mouse)
     * side > 0 = to the left of the heading axis
     * driftAmp: sinusoidal side-wander amplitude (px), giving each fish
     *           an organic, slightly-independent feel within the V.
     */
    var SLOTS = [
      { sz: 88, fwd:  26, side:   0, wobble: "3.3s", wobbleDelay:  "0s",   driftAmp:  5, driftFreq: 0.00029 },
      { sz: 76, fwd: -36, side:  44, wobble: "2.7s", wobbleDelay: "-1.1s", driftAmp:  8, driftFreq: 0.00025 },
      { sz: 80, fwd: -36, side: -44, wobble: "3.0s", wobbleDelay: "-0.6s", driftAmp:  7, driftFreq: 0.00031 },
    ];

    /* Build DOM */
    var fish = SLOTS.map(function (slot) {
      var div = document.createElement("div");
      div.className = "swim-logo";
      div.setAttribute("aria-hidden", "true");
      var img = document.createElement("img");
      img.className = "swim-logo__img";
      img.src = "logo.png";
      img.width = slot.sz; img.height = slot.sz;
      img.decoding = "async";
      img.style.width = slot.sz + "px";
      img.style.animation = "wobble " + slot.wobble + " ease-in-out infinite";
      img.style.animationDelay = slot.wobbleDelay;
      div.appendChild(img);
      heroEl.appendChild(div);
      return {
        el: div, sz: slot.sz,
        fwd: slot.fwd, side: slot.side,
        driftAmp: slot.driftAmp, driftFreq: slot.driftFreq,
        driftPhase: Math.random() * Math.PI * 2,
        posX: heroEl.offsetWidth  * 0.5,
        posY: heroEl.offsetHeight * 0.4,
        velX: 0, velY: 0,
        tiltAngle: 0, facingRight: true,
      };
    });

    /* School centre — the single point all slots are relative to */
    var scX = heroEl.offsetWidth  * 0.5;
    var scY = heroEl.offsetHeight * 0.4;
    var scVX = 0, scVY = 0;
    var scHeading = 0;   /* current formation heading, radians */

    /*
     * Movement and look targets are completely separate.
     * The school wanders on its own slow random path — it never chases the
     * mouse. The mouse only controls where the fish *look*.
     */
    var movX = scX, movY = scY;   /* random swim destination       */
    var lookX = scX, lookY = scY; /* where fish orient their heads */
    var mouseInHero = false;
    var PAD = 140;

    window.addEventListener("mousemove", function (e) {
      var r = heroEl.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top  && e.clientY <= r.bottom) {
        lookX = e.clientX - r.left;
        lookY = e.clientY - r.top;
        mouseInHero = true;
      } else {
        mouseInHero = false;
      }
    }, { passive: true });

    function pickRandom() {
      var hw = heroEl.offsetWidth, hh = heroEl.offsetHeight;
      movX = PAD + Math.random() * Math.max(1, hw - PAD * 2);
      movY = PAD + Math.random() * Math.max(1, hh - PAD * 2);
      /* Long pause between destinations — fish sit and idle, then slowly move */
      setTimeout(pickRandom, 14000 + Math.random() * 10000);
    }
    pickRandom();

    /*
     * Physics constants
     * SC_K / SC_D  — very weak spring + heavy damping → sluggish, hesitant drift
     * FSH_K / FSH_D — individual fish spring toward formation slot
     */
    var SC_K  = 0.0007, SC_D  = 0.974;
    var FSH_K = 0.052,  FSH_D = 0.82;

    var tick = 0;

    function step() {
      tick++;
      var hw = heroEl.offsetWidth, hh = heroEl.offsetHeight;

      /* ── School centre slowly follows mouse, falls back to random roaming ── */
      var destX = mouseInHero ? lookX : movX;
      var destY = mouseInHero ? lookY : movY;
      scVX = (scVX + (destX - scX) * SC_K) * SC_D;
      scVY = (scVY + (destY - scY) * SC_K) * SC_D;
      scX += scVX;
      scY += scVY;

      /*
       * Formation heading:
       *   • While swimming — V-shape faces direction of travel.
       *   • While nearly still — face the look target (mouse or forward).
       */
      var speed = Math.sqrt(scVX * scVX + scVY * scVY);
      var lx = mouseInHero ? lookX : scX + Math.cos(scHeading) * 300;
      var ly = mouseInHero ? lookY : scY + Math.sin(scHeading) * 300;
      var wantHeading = speed > 0.1
        ? Math.atan2(scVY, scVX)
        : Math.atan2(ly - scY, lx - scX);
      var hd = wantHeading - scHeading;
      while (hd >  Math.PI) hd -= Math.PI * 2;
      while (hd < -Math.PI) hd += Math.PI * 2;
      scHeading += hd * 0.022;

      var cos_h = Math.cos(scHeading);
      var sin_h = Math.sin(scHeading);
      var edge  = 14;
      var t     = tick * 0.016;

      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];

        /* Slot: formation offset rotated into world space.
           Each fish adds a slow sinusoidal side-drift so the formation
           breathes rather than being rigidly locked. */
        var driftSide = Math.sin(t * f.driftFreq * 1000 + f.driftPhase) * f.driftAmp;
        var effSide   = f.side + driftSide;
        var slotX = scX + cos_h * f.fwd - sin_h * effSide;
        var slotY = scY + sin_h * f.fwd + cos_h * effSide;

        /* Target top-left (posX/posY is top-left of the image div) */
        var targetX = Math.max(edge, Math.min(hw - f.sz - edge, slotX - f.sz * 0.5));
        var targetY = Math.max(edge, Math.min(hh - f.sz - edge, slotY - f.sz * 0.5));

        /* Spring toward slot */
        f.velX = (f.velX + (targetX - f.posX) * FSH_K) * FSH_D;
        f.velY = (f.velY + (targetY - f.posY) * FSH_K) * FSH_D;
        f.posX += f.velX;
        f.posY += f.velY;
        f.posX = Math.max(0, Math.min(hw - f.sz, f.posX));
        f.posY = Math.max(0, Math.min(hh - f.sz, f.posY));

        /* Separation — gentle push when fish crowd each other */
        for (var j = i + 1; j < fish.length; j++) {
          var g   = fish[j];
          var sepX = (f.posX + f.sz * 0.5) - (g.posX + g.sz * 0.5);
          var sepY = (f.posY + f.sz * 0.5) - (g.posY + g.sz * 0.5);
          var d2   = sepX * sepX + sepY * sepY;
          var minD = (f.sz + g.sz) * 0.40;
          if (d2 > 0 && d2 < minD * minD) {
            var d    = Math.sqrt(d2);
            var push = (minD - d) / d * 0.12;
            f.velX += sepX * push;  f.velY += sepY * push;
            g.velX -= sepX * push;  g.velY -= sepY * push;
          }
        }

        /*
         * Orientation — each fish faces the look target (mouse when in hero,
         * otherwise forward along the school heading).
         */
        var logoCX = f.posX + f.sz * 0.5;
        var logoCY = f.posY + f.sz * 0.5;
        var dx = lx - logoCX;
        var dy = ly - logoCY;

        if      (dx >  8) f.facingRight = true;
        else if (dx < -8) f.facingRight = false;

        var tiltTarget = Math.atan2(dy, Math.abs(dx));
        var td = tiltTarget - f.tiltAngle;
        while (td >  Math.PI) td -= Math.PI * 2;
        while (td < -Math.PI) td += Math.PI * 2;
        f.tiltAngle += td * 0.03;

        var sx      = f.facingRight ? 1 : -1;
        var tiltDeg = (f.tiltAngle * 180 / Math.PI).toFixed(2);

        f.el.style.transform =
          "translate(" + f.posX.toFixed(1) + "px," + f.posY.toFixed(1) + "px)" +
          " scaleX(" + sx + ")" +
          " rotate(" + tiltDeg + "deg)";
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  })();

})();
