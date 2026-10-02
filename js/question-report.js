// ============================================================
// ⚠️ QUESTION REPORT — report box + email bhejna (FormSubmit)
// Depends on: question-tools.js (nahi mila to chup-chaap kuch nahi karta)
// Mock Test / Notes engine ko touch nahi karta.
// ============================================================
(() => {
  if (typeof QuestionTools === 'undefined') return;

  // ---------- CONFIG (sirf yahan badalna hai) ----------
  const CONFIG = {
    // Pehli baar: apna email. Activation ke baad FormSubmit ka random code
    // yahan daalna (email chhup jaata hai): 'https://formsubmit.co/ajax/<random-code>'
    endpoint: 'https://formsubmit.co/ajax/akshatraj377@gmail.com',
    subject: '[Akshat Study Zone] Question Report',
    cooldownMs: 20000,   // spam rokne ke liye: 20 sec me ek hi report
    minChars: 5,
    maxImagePx: 1280     // image is size tak chhoti hoti hai (email chhota rehta hai)
  };

  const ISSUES = [
    'Question is wrong',
    'Option / answer is wrong',
    'Solution is wrong',
    'Typing / formatting issue',
    'Other'
  ];

  let overlay = null, ctxData = null, imageBlob = null, sending = false, lastSent = 0;

  function injectStyles() {
    if (document.getElementById('qr-styles')) return;
    const st = document.createElement('style');
    st.id = 'qr-styles';
    st.textContent = `
      .qr-overlay{position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:3000;display:flex;
        align-items:flex-end;justify-content:center}
      .qr-box{background:#fff;color:#0f172a;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;
        border-radius:16px 16px 0 0;padding:18px;box-sizing:border-box;font-family:sans-serif}
      .qr-title{font-weight:800;font-size:1.15rem;margin-bottom:4px}
      .qr-q{font-size:.85rem;color:#475569;margin-bottom:12px;background:#f1f5f9;padding:8px 10px;border-radius:8px}
      .qr-label{font-weight:700;font-size:.9rem;margin:12px 0 6px}
      .qr-chips{display:flex;flex-wrap:wrap;gap:8px}
      .qr-chip{padding:8px 12px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#0f172a;
        font-size:.85rem;cursor:pointer}
      .qr-chip.on{background:#2563eb;border-color:#2563eb;color:#fff}
      .qr-text{width:100%;min-height:90px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;
        font-size:1rem;box-sizing:border-box;font-family:inherit;color:#0f172a;background:#fff}
      .qr-file{font-size:.9rem;color:#0f172a}
      .qr-prev{display:none;margin-top:8px;position:relative}
      .qr-prev img{max-width:100%;max-height:160px;border-radius:8px;border:1px solid #e2e8f0}
      .qr-prev button{position:absolute;top:4px;right:4px;border:none;background:#0f172a;color:#fff;
        border-radius:50%;width:26px;height:26px;cursor:pointer}
      .qr-status{margin-top:10px;font-size:.9rem;min-height:1.2em}
      .qr-status.err{color:#b91c1c}.qr-status.ok{color:#15803d}
      .qr-actions{display:flex;gap:10px;margin-top:14px}
      .qr-actions button{flex:1;padding:12px;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;border:1px solid #cbd5e1}
      .qr-cancel{background:#fff;color:#0f172a}
      .qr-submit{background:#2563eb;color:#fff;border-color:#2563eb!important}
      .qr-submit[disabled]{opacity:.6}
    `;
    document.head.appendChild(st);
  }

  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  function setStatus(msg, type) {
    const s = overlay && overlay.querySelector('.qr-status');
    if (!s) return;
    s.textContent = msg || '';
    s.className = 'qr-status' + (type ? ' ' + type : '');
  }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
    imageBlob = null; sending = false;
  }

  // Image ko chhota karke JPEG blob banao
  function shrink(file) {
    return new Promise(resolve => {
      if (!file || !/^image\//.test(file.type)) return resolve(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const s = Math.min(1, CONFIG.maxImagePx / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(b => resolve(b), 'image/jpeg', 0.82);
        } catch (e) { URL.revokeObjectURL(url); resolve(null); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function open(ctx) {
    close();
    ctxData = ctx || {};
    injectStyles();

    overlay = el('div', 'qr-overlay');
    overlay.addEventListener('click', e => { if (e.target === overlay && !sending) close(); });

    const box = el('div', 'qr-box');
    box.appendChild(el('div', 'qr-title', '⚠️ Report a problem'));
    const snippet = (ctxData.question || '').slice(0, 110);
    box.appendChild(el('div', 'qr-q', (ctxData.number ? 'Q' + ctxData.number + ': ' : '') + (snippet || 'Current question')));

    // issue type
    box.appendChild(el('div', 'qr-label', 'What is wrong?'));
    const chips = el('div', 'qr-chips');
    let issue = ISSUES[0];
    ISSUES.forEach((name, i) => {
      const c = el('button', 'qr-chip' + (i === 0 ? ' on' : ''), name);
      c.type = 'button';
      c.addEventListener('click', () => {
        issue = name;
        chips.querySelectorAll('.qr-chip').forEach(x => x.classList.remove('on'));
        c.classList.add('on');
      });
      chips.appendChild(c);
    });
    box.appendChild(chips);

    // comment
    box.appendChild(el('div', 'qr-label', 'Describe the problem'));
    const ta = el('textarea', 'qr-text');
    ta.placeholder = 'Example: Option 3 should be the answer because...';
    ta.maxLength = 1500;
    box.appendChild(ta);

    // image
    box.appendChild(el('div', 'qr-label', 'Attach screenshot (optional)'));
    const file = el('input', 'qr-file');
    file.type = 'file'; file.accept = 'image/*';
    const prev = el('div', 'qr-prev');
    const pimg = document.createElement('img');
    const prem = el('button', '', '✕'); prem.type = 'button';
    prev.appendChild(pimg); prev.appendChild(prem);
    file.addEventListener('change', async () => {
      imageBlob = null; prev.style.display = 'none';
      const f = file.files && file.files[0];
      if (!f) return;
      setStatus('Preparing image…');
      const b = await shrink(f);
      if (!b) { setStatus('This image could not be used. Try another one.', 'err'); file.value = ''; return; }
      imageBlob = b;
      pimg.src = URL.createObjectURL(b);
      prev.style.display = 'block';
      setStatus('');
    });
    prem.addEventListener('click', () => { imageBlob = null; file.value = ''; prev.style.display = 'none'; });
    box.appendChild(file);
    box.appendChild(prev);

    box.appendChild(el('div', 'qr-status'));

    // actions
    const act = el('div', 'qr-actions');
    const cancel = el('button', 'qr-cancel', 'Cancel'); cancel.type = 'button';
    const submit = el('button', 'qr-submit', 'Submit'); submit.type = 'button';
    cancel.addEventListener('click', () => { if (!sending) close(); });
    submit.addEventListener('click', () => send(issue, ta, submit, cancel));
    act.appendChild(cancel); act.appendChild(submit);
    box.appendChild(act);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  async function send(issue, ta, submitBtn, cancelBtn) {
    if (sending) return;
    const comment = ta.value.trim();
    if (comment.length < CONFIG.minChars) { setStatus('Please describe the problem (at least ' + CONFIG.minChars + ' characters).', 'err'); return; }
    if (Date.now() - lastSent < CONFIG.cooldownMs) { setStatus('Please wait a few seconds before sending another report.', 'err'); return; }

    sending = true;
    submitBtn.disabled = true; cancelBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('');

    try {
      const c = ctxData || {};
      const fd = new FormData();
      fd.append('_subject', CONFIG.subject + ' - ' + issue + (c.number ? ' (Q' + c.number + ')' : ''));
      fd.append('_captcha', 'false');
      fd.append('_template', 'table');
      fd.append('_honey', '');
      fd.append('Issue type', issue);
      fd.append('Comment', comment);
      fd.append('Screen', c.where || '');
      fd.append('Question no', c.number || '');
      fd.append('Section / info', c.section || '');
      fd.append('Question', c.question || '');
      fd.append('Options', (c.options || []).join('\n'));
      if (c.correct) fd.append('Correct answer shown', c.correct);
      if (c.explanation) fd.append('Solution text', c.explanation.slice(0, 1500));
      fd.append('Page', location.href);
      fd.append('Time', new Date().toString());
      fd.append('Device', navigator.userAgent);
      if (imageBlob) fd.append('attachment', imageBlob, 'screenshot.jpg');

      const res = await fetch(CONFIG.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      let data = {};
      try { data = await res.json(); } catch (e) { /* non-json */ }
      const ok = res.ok && (data.success === true || data.success === 'true');
      if (!ok) throw new Error((data && data.message) || ('HTTP ' + res.status));

      lastSent = Date.now();
      setStatus('✅ Report sent. Thank you!', 'ok');
      submitBtn.textContent = 'Sent';
      setTimeout(close, 1400);
    } catch (e) {
      console.error('[QuestionReport] send failed:', e);
      sending = false;
      submitBtn.disabled = false; cancelBtn.disabled = false;
      submitBtn.textContent = 'Try again';
      setStatus('Could not send the report. Check your internet and try again. Your text is still here.', 'err');
    }
  }

  QuestionTools.setReportHandler(open);
})();
