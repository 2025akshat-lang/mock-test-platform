/* ============================================================
   🍧 DESSERT GLASS BACKGROUND ANIMATION — HOME PAGE DECORATION
   (v2 — fixed visibility bug, bigger + lighter/faded)
   ------------------------------------------------------------
   Fixes vs v1:
   1) z-index ab #home-dashboard (z:10) se UPAR hai (11), isliye
      home screen ka opaque background isse ab dhakta nahi.
   2) Visibility check ab sahi hai: sirf tab dikhega jab
      #mock-panel active ho AUR #home-dashboard ka display
      'none' na ho — matlab sirf real home screen par, exam,
      analysis, notes ya future panel par kabhi nahi.
   3) Size ab viewport ke hisaab se responsive scale hoti hai
      (chhoti mobile screen ho ya bada laptop, dono par achhe
      se fit hoga) aur opacity kaafi kam (halka "light fade
      wallpaper" jaisa) taaki padhne mein disturbance na ho.
   ------------------------------------------------------------
   Baaki sab pehle jaisa hi hai: apna khud ka isolated <style>,
   pointer-events:none (click kabhi block nahi hoga), sirf CSS
   transform/opacity animation (GPU-friendly, site slow nahi
   hogi), koi existing class-name reuse nahi (sab "icl-bg-"
   prefixed).
   ------------------------------------------------------------
   USAGE: index.html mein ek line (agar pehle se nahi dali):

       <script src="js/icecream-bg-animation.js"></script>
   ============================================================ */

(function DessertBgAnimation() {
  "use strict";

  if (window.__dessertBgStarted) return;
  window.__dessertBgStarted = true;

  const STYLE_ID = "icl-bg-style";
  const WRAP_ID = "icl-bg-wrap";
  const VISIBLE_OPACITY = 0.38; // 👈 halka fade — badhana/ghatana ho to sirf yeh number change karo

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${WRAP_ID} {
        position: fixed;
        left: 50%;
        bottom: -10px;
        width: 280px;
        height: 440px;
        transform: translateX(-50%) scale(var(--icl-bg-scale, 1));
        transform-origin: bottom center;
        pointer-events: none;
        user-select: none;
        z-index: 11; /* home-dashboard (z:10) se upar, isliye ab dikhega */
        opacity: 0;
        filter: saturate(0.65) brightness(1.12);
        transition: opacity 0.6s ease;
      }
      #${WRAP_ID}.icl-bg-visible {
        opacity: ${VISIBLE_OPACITY};
      }

      #${WRAP_ID} .icl-bg-scene {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
      }

      /* Glass */
      #${WRAP_ID} .icl-bg-glass {
        position: relative;
        width: 220px;
        height: 300px;
        background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.15));
        backdrop-filter: blur(6px);
        border-radius: 10px 10px 60px 60px;
        border: 3px solid rgba(255,255,255,0.85);
        box-shadow: 0 20px 40px rgba(0,0,0,0.08), inset 0 0 20px rgba(255,255,255,0.9);
        overflow: hidden;
        z-index: 2;
      }
      #${WRAP_ID} .icl-bg-glass::after {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 60%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
        transform: skewX(-25deg);
        animation: icl-bg-shine 4s infinite linear;
      }
      @keyframes icl-bg-shine {
        0% { left: -100%; }
        30%, 100% { left: 200%; }
      }

      /* Milkshake fill */
      #${WRAP_ID} .icl-bg-liquid {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 92%;
        background: linear-gradient(180deg, #ffd6e6 0%, #ff9ec4 100%);
        border-radius: 0 0 55px 55px;
        overflow: hidden;
      }
      #${WRAP_ID} .icl-bg-wave {
        position: absolute;
        top: -12px; left: -50%;
        width: 200%; height: 25px;
        background: rgba(255,255,255,0.4);
        border-radius: 40%;
        animation: icl-bg-wave-motion 3.5s infinite linear;
      }
      @keyframes icl-bg-wave-motion {
        0% { transform: translateX(0) rotate(0deg); }
        100% { transform: translateX(-50%) rotate(360deg); }
      }

      #${WRAP_ID} .icl-bg-bubble {
        position: absolute;
        background: rgba(255,255,255,0.65);
        border-radius: 50%;
        bottom: -20px;
        animation: icl-bg-rise 4s infinite ease-in;
      }
      #${WRAP_ID} .icl-bg-b1 { width: 10px; height: 10px; left: 20%; animation-duration: 3.2s; }
      #${WRAP_ID} .icl-bg-b2 { width: 14px; height: 14px; left: 50%; animation-duration: 4.5s; animation-delay: 1.2s; }
      #${WRAP_ID} .icl-bg-b3 { width: 8px;  height: 8px;  left: 75%; animation-duration: 2.8s; animation-delay: 0.7s; }
      #${WRAP_ID} .icl-bg-b4 { width: 12px; height: 12px; left: 35%; animation-duration: 3.8s; animation-delay: 2.1s; }
      @keyframes icl-bg-rise {
        0%   { bottom: -20px; opacity: 0; transform: translateX(0); }
        50%  { opacity: 0.9; transform: translateX(10px); }
        100% { bottom: 100%; opacity: 0; transform: translateX(-10px); }
      }

      /* Whipped cream scoops on top */
      #${WRAP_ID} .icl-bg-cream-group {
        position: absolute;
        top: 105px; left: 50%;
        transform: translateX(-50%);
        width: 230px; height: 60px;
        z-index: 3;
        animation: icl-bg-cream-float 4s infinite ease-in-out;
      }
      @keyframes icl-bg-cream-float {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-3px); }
      }
      #${WRAP_ID} .icl-bg-scoop {
        position: absolute;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: inset -2px -4px 6px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.06);
      }
      #${WRAP_ID} .icl-bg-scoop-1 { width: 65px; height: 55px; left: 5px;   top: 10px; }
      #${WRAP_ID} .icl-bg-scoop-2 { width: 75px; height: 65px; left: 50px;  top: -5px; }
      #${WRAP_ID} .icl-bg-scoop-3 { width: 80px; height: 70px; left: 100px; top: -10px; }
      #${WRAP_ID} .icl-bg-scoop-4 { width: 70px; height: 60px; left: 160px; top: 8px; }

      #${WRAP_ID} .icl-bg-sprinkle {
        position: absolute;
        width: 6px; height: 6px;
        border-radius: 50%;
      }
      #${WRAP_ID} .icl-bg-s1 { top: 15px; left: 40px;  background: #ff8fab; }
      #${WRAP_ID} .icl-bg-s2 { top: 8px;  left: 85px;  background: #ffd166; }
      #${WRAP_ID} .icl-bg-s3 { top: 22px; left: 120px; background: #8ecae6; }
      #${WRAP_ID} .icl-bg-s4 { top: 12px; left: 155px; background: #c77dff; }
      #${WRAP_ID} .icl-bg-s5 { top: 25px; left: 180px; background: #ff8fab; }

      /* Candy-stick characters */
      #${WRAP_ID} .icl-bg-char {
        position: absolute;
        width: 38px; height: 110px;
        border-radius: 20px 20px 8px 8px;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        box-shadow: inset -3px 0 5px rgba(0,0,0,0.12);
        transition: transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
      }
      #${WRAP_ID} .icl-bg-char::before {
        content: '';
        position: absolute;
        top: -12px;
        width: 12px; height: 15px;
        border-radius: 5px 5px 0 0;
        background: inherit;
        filter: brightness(0.85);
      }
      #${WRAP_ID} .icl-bg-char-1 { background: linear-gradient(180deg, #ff9fc0 0%, #ec6a9a 100%); }
      #${WRAP_ID} .icl-bg-char-2 { background: linear-gradient(180deg, #ffd98a 0%, #f2a93f 100%); }
      #${WRAP_ID} .icl-bg-char-3 { background: linear-gradient(180deg, #ffffff 0%, #d9c6b3 100%); }
      #${WRAP_ID} .icl-bg-char-4 { background: linear-gradient(180deg, #b98a63 0%, #7c5533 100%); }
      #${WRAP_ID} .icl-bg-char-5 { background: linear-gradient(180deg, #9ad3ff 0%, #5aa9e6 100%); }

      #${WRAP_ID} .icl-bg-eyes {
        display: flex; gap: 3px;
        margin-top: 25px;
        animation: icl-bg-blink 3.5s infinite;
      }
      @keyframes icl-bg-blink {
        0%, 92%, 100% { transform: scaleY(1); }
        96% { transform: scaleY(0.1); }
      }
      #${WRAP_ID} .icl-bg-eye {
        width: 12px; height: 12px;
        background: white;
        border-radius: 50%;
        position: relative;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        overflow: hidden;
      }
      #${WRAP_ID} .icl-bg-pupil {
        position: absolute;
        top: 3px; left: 3px;
        width: 6px; height: 6px;
        background: #2d1b12;
        border-radius: 50%;
        animation: icl-bg-eye-roll 5s infinite ease-in-out;
      }
      @keyframes icl-bg-eye-roll {
        0%, 100% { transform: translate(0,0); }
        25% { transform: translate(-2px,0); }
        50% { transform: translate(2px,-1px); }
        75% { transform: translate(0,-2px); }
      }
      #${WRAP_ID} .icl-bg-mouth {
        width: 8px; height: 4px;
        border-bottom: 2px solid rgba(0,0,0,0.45);
        border-radius: 0 0 10px 10px;
        margin-top: 2px;
      }
      #${WRAP_ID} .icl-bg-char.icl-bg-surprised .icl-bg-mouth {
        width: 6px; height: 6px;
        background: rgba(0,0,0,0.45);
        border-radius: 50%;
        border: none;
      }

      @keyframes icl-bg-float1 { 0%,100% { transform: rotate(-18deg) translateY(0); } 50% { transform: rotate(-15deg) translateY(-6px); } }
      @keyframes icl-bg-float2 { 0%,100% { transform: rotate(-8deg) translateY(0); }  50% { transform: rotate(-11deg) translateY(-8px); } }
      @keyframes icl-bg-float3 { 0%,100% { transform: rotate(2deg) translateY(0); }   50% { transform: rotate(0deg) translateY(-10px); } }
      @keyframes icl-bg-float4 { 0%,100% { transform: rotate(12deg) translateY(0); }  50% { transform: rotate(15deg) translateY(-7px); } }
      @keyframes icl-bg-float5 { 0%,100% { transform: rotate(22deg) translateY(0); }  50% { transform: rotate(19deg) translateY(-8px); } }

      #${WRAP_ID} .icl-bg-char-1 { left: 25px;  top: 20px; animation: icl-bg-float1 3s infinite ease-in-out; }
      #${WRAP_ID} .icl-bg-char-2 { left: 68px;  top: 5px;  animation: icl-bg-float2 3.2s infinite ease-in-out 0.2s; }
      #${WRAP_ID} .icl-bg-char-3 { left: 120px; top: 0px;  animation: icl-bg-float3 2.8s infinite ease-in-out 0.4s; }
      #${WRAP_ID} .icl-bg-char-4 { left: 168px; top: 12px; animation: icl-bg-float4 3.1s infinite ease-in-out 0.1s; }
      #${WRAP_ID} .icl-bg-char-5 { left: 212px; top: 30px; animation: icl-bg-float5 2.9s infinite ease-in-out 0.3s; }

      #${WRAP_ID} .icl-bg-char.icl-bg-surprised {
        animation: none !important;
        transform: translateY(-22px) scale(1.15) !important;
        z-index: 5;
      }

      @media (prefers-reduced-motion: reduce) {
        #${WRAP_ID} * { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildScene() {
    const wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `
      <div class="icl-bg-scene">
        <div class="icl-bg-char icl-bg-char-1"><div class="icl-bg-eyes"><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div></div><div class="icl-bg-mouth"></div></div>
        <div class="icl-bg-char icl-bg-char-2"><div class="icl-bg-eyes"><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div></div><div class="icl-bg-mouth"></div></div>
        <div class="icl-bg-char icl-bg-char-3"><div class="icl-bg-eyes"><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div></div><div class="icl-bg-mouth"></div></div>
        <div class="icl-bg-char icl-bg-char-4"><div class="icl-bg-eyes"><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div></div><div class="icl-bg-mouth"></div></div>
        <div class="icl-bg-char icl-bg-char-5"><div class="icl-bg-eyes"><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div><div class="icl-bg-eye"><div class="icl-bg-pupil"></div></div></div><div class="icl-bg-mouth"></div></div>

        <div class="icl-bg-cream-group">
          <div class="icl-bg-scoop icl-bg-scoop-1"></div>
          <div class="icl-bg-scoop icl-bg-scoop-2"></div>
          <div class="icl-bg-scoop icl-bg-scoop-3"></div>
          <div class="icl-bg-scoop icl-bg-scoop-4"></div>
          <div class="icl-bg-sprinkle icl-bg-s1"></div>
          <div class="icl-bg-sprinkle icl-bg-s2"></div>
          <div class="icl-bg-sprinkle icl-bg-s3"></div>
          <div class="icl-bg-sprinkle icl-bg-s4"></div>
          <div class="icl-bg-sprinkle icl-bg-s5"></div>
        </div>

        <div class="icl-bg-glass">
          <div class="icl-bg-liquid">
            <div class="icl-bg-wave"></div>
            <div class="icl-bg-bubble icl-bg-b1"></div>
            <div class="icl-bg-bubble icl-bg-b2"></div>
            <div class="icl-bg-bubble icl-bg-b3"></div>
            <div class="icl-bg-bubble icl-bg-b4"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  /* ---------- Responsive scale: bigger screen = bigger scene, capped ---------- */
  function updateScale(wrap) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scaleByWidth = (vw * 0.92) / 280;   // ~92% of screen width
    const scaleByHeight = (vh * 0.6) / 440;   // ~60% of screen height (anchored bottom)
    const scale = Math.max(0.8, Math.min(scaleByWidth, scaleByHeight, 2.4));
    wrap.style.setProperty("--icl-bg-scale", scale.toFixed(3));
  }

  function startRandomSurprise(wrap) {
    const chars = wrap.querySelectorAll(".icl-bg-char");
    setInterval(() => {
      if (!chars.length) return;
      const chosen = chars[Math.floor(Math.random() * chars.length)];
      chosen.classList.add("icl-bg-surprised");
      setTimeout(() => chosen.classList.remove("icl-bg-surprised"), 1200);
    }, 2500);
  }

  /* ---------- Correct visibility detection ----------
     Sirf tab TRUE jab #mock-panel active ho AUR
     #home-dashboard hidden na ho. Yeh exam/analysis/notes/
     future panel — sab jagah automatically FALSE ho jaata
     hai bina kisi extra hook ke. */
function isHomeVisible() {
  const home = document.getElementById("home-dashboard");
  const mockPanel = document.getElementById("mock-panel");
  const level1 = document.getElementById("view-level-1");
  if (!home || !mockPanel || !level1) return true;
  const mockActive = mockPanel.classList.contains("active");
  const homeShown = window.getComputedStyle(home).display !== "none";
  const onLevel1 = window.getComputedStyle(level1).display !== "none";
  return mockActive && homeShown && onLevel1;
}
  function watchVisibility(wrap) {
    const sync = () => {
      wrap.classList.toggle("icl-bg-visible", isHomeVisible());
    };
    sync();

    const home = document.getElementById("home-dashboard");
    const mockPanel = document.getElementById("mock-panel");

    if (home) {
      new MutationObserver(sync).observe(home, { attributes: true, attributeFilter: ["style"] });
    }
    ["view-level-1", "view-level-2", "view-level-3"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ["style"] });
});
    if (mockPanel) {
      new MutationObserver(sync).observe(mockPanel, { attributes: true, attributeFilter: ["class"] });
    }
    // Sidebar panel switch dusre wrappers ki class badalta hai, unhe bhi observe kar lo (safe/cheap)
    document.querySelectorAll(".app-panel-wrapper").forEach((el) => {
      new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ["class"] });
    });
  }

  function start() {
    injectStyles();
    const wrap = buildScene();
    updateScale(wrap);
    window.addEventListener("resize", () => updateScale(wrap));
    watchVisibility(wrap);
    startRandomSurprise(wrap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
