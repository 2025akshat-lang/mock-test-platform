/* ============================================================
   🍦 ICE CREAM MASCOT LOGO — HEADER BADGE (FULLY ISOLATED)
   ------------------------------------------------------------
   ✅ Yeh full-screen loader NAHI hai — ek chhota, cute, hamesha
      header mein baithne wala animated mascot hai jo
      "⚡ Akshat Study Portal" text ke bagal (.goal-selector) mein
      khud ko insert kar leta hai.
   ✅ Kisi bhi existing HTML/CSS/JS ko touch nahi karta — sirf
      apna khud ka <style> aur ek chhota <span> injection karta
      hai. Mock test, DataLoader, NotesEngine — sab untouched.
   ✅ Agar .goal-selector mil na paaye (kabhi structure badla),
      script chup-chaap kuch nahi karti — koi error nahi aayega.
   ------------------------------------------------------------
   USAGE: index.html mein ek line daalo (</body> se pehle kahin
   bhi, ya jahan icecream-loader.js already daala hai wahin):

       <script src="js/icecream-logo.js"></script>
   ============================================================ */

(function IceCreamLogo() {
  "use strict";

  if (window.__icecreamLogoStarted) return;
  window.__icecreamLogoStarted = true;

  const STYLE_ID = "icecream-logo-style";
  const LOGO_ID = "icecream-logo-badge";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${LOGO_ID} {
        position: relative;
        display: inline-flex;
        align-items: flex-end;
        justify-content: center;
        width: 24px;
        height: 30px;
        flex-shrink: 0;
        margin-right: 2px;
        animation: icl-logo-bob 2.6s ease-in-out infinite;
        transform-origin: 50% 100%;
      }

      #${LOGO_ID} .icl-logo-cone {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 9px solid transparent;
        border-right: 9px solid transparent;
        border-top: 16px solid #d9a066;
        clip-path: polygon(50% 100%, 0 0, 100% 0);
      }

      #${LOGO_ID} .icl-logo-scoop {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: 22px;
        height: 20px;
        border-radius: 50%;
        background: #ffe3ea;
        box-shadow: inset -2px -3px 0 rgba(0,0,0,0.06);
      }

      #${LOGO_ID} .icl-logo-cherry {
        position: absolute;
        top: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #d1274a;
        box-shadow: inset -1px -1px 0 rgba(0,0,0,0.15);
        z-index: 2;
      }

      #${LOGO_ID} .icl-logo-face {
        position: absolute;
        top: 4px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 3px;
      }

      #${LOGO_ID} .icl-logo-eye {
        width: 3px;
        height: 3px;
        background: #4a3038;
        border-radius: 50%;
        animation: icl-logo-blink 3.6s infinite;
      }
      #${LOGO_ID} .icl-logo-eye:nth-child(2) { animation-delay: 0.05s; }

      #${LOGO_ID} .icl-logo-mouth {
        position: absolute;
        top: 9px;
        left: 50%;
        transform: translateX(-50%);
        width: 5px;
        height: 2px;
        border-bottom: 1.4px solid #4a3038;
        border-radius: 0 0 6px 6px;
      }

      /* idle gentle bob */
      @keyframes icl-logo-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }

      /* periodic blink */
      @keyframes icl-logo-blink {
        0%, 88%, 100% { transform: scaleY(1); }
        92% { transform: scaleY(0.15); }
      }

      /* excited pop, triggered occasionally via JS */
      #${LOGO_ID}.icl-logo-pop {
        animation: icl-logo-jump 0.5s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes icl-logo-jump {
        0%   { transform: translateY(0) scale(1); }
        40%  { transform: translateY(-6px) scale(1.12); }
        70%  { transform: translateY(1px) scale(0.97); }
        100% { transform: translateY(0) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        #${LOGO_ID}, #${LOGO_ID} * { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildLogo() {
    const span = document.createElement("span");
    span.id = LOGO_ID;
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = `
      <span class="icl-logo-cherry"></span>
      <span class="icl-logo-scoop">
        <span class="icl-logo-face">
          <span class="icl-logo-eye"></span>
          <span class="icl-logo-eye"></span>
        </span>
        <span class="icl-logo-mouth"></span>
      </span>
      <span class="icl-logo-cone"></span>
    `;
    return span;
  }

  function insertIntoHeader() {
    if (document.getElementById(LOGO_ID)) return true;
    const target = document.querySelector(".goal-selector");
    if (!target) return false;
    target.insertBefore(buildLogo(), target.firstChild);
    return true;
  }

  function startOccasionalPop() {
    setInterval(() => {
      const badge = document.getElementById(LOGO_ID);
      if (!badge) return;
      badge.classList.add("icl-logo-pop");
      setTimeout(() => badge.classList.remove("icl-logo-pop"), 500);
    }, 4000 + Math.random() * 2000);
  }

  function start() {
    injectStyles();
    // .goal-selector shuru mein DOM mein na ho to thoda retry karo
    let tries = 0;
    const tryInsert = () => {
      if (insertIntoHeader()) {
        startOccasionalPop();
        return;
      }
      tries++;
      if (tries < 20) setTimeout(tryInsert, 150);
    };
    tryInsert();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
