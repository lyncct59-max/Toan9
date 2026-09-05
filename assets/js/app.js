/* =========================================================================
   app.js — GIAO DIỆN, ĐIỀU HƯỚNG & KHỞI ĐỘNG
   -------------------------------------------------------------------------
   Dùng đúng tên class trong styles.css. Mỗi "view" trả về chuỗi HTML rồi
   gắn sự kiện sau khi chèn. Điều hướng bằng hash (#/lo-trinh, #/hoc/<id>…).
   ========================================================================= */
(function (App) {
  "use strict";

  const APP_VERSION = "v4.0 · 05/09/2026";

  const S = App.Storage;
  const E = App.Engine;
  const D = App.DATA;

  const RING_R = 62, RING_C = 2 * Math.PI * RING_R;
  const STEP_META = [
    { n: 1, t: "Giải thích đơn giản", s: "Như kể cho lớp 5" },
    { n: 2, t: "Nhìn thấy tận mắt", s: "Hình ảnh & đồ thị" },
    { n: 3, t: "Dùng trong đời thực", s: "Toán quanh ta" },
    { n: 4, t: "Tự giảng lại", s: "Phương pháp Feynman" },
    { n: 5, t: "Luyện tập", s: "Dễ · TB · Nâng cao" }
  ];

  let viewEl, titleEl;
  let timerHandle = null;          // dọn interval khi đổi view

  /* ---------------- Tiện ích chung ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function setView(html) { viewEl.innerHTML = '<div class="view">' + html + "</div>"; try { mathifyElement(viewEl); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function go(hash) { location.hash = hash; }

  function allLessons() {
    // theo đúng thứ tự khai báo trong chapters
    const out = [];
    D.chapters.forEach(ch => ch.lessons.forEach(id => { if (D.lessons[id]) out.push(D.lessons[id]); }));
    return out;
  }
  function lessonIndex(id) { return allLessons().findIndex(l => l.id === id); }
  function chapterOf(id) { return D.chapters.find(c => c.id === (D.lessons[id] || {}).chapterId); }

  function isUnlocked(id) {
    const list = allLessons();
    const i = list.findIndex(l => l.id === id);
    if (i <= 0) return true;                       // bài đầu luôn mở
    if (S.lesson(id) && Object.keys(S.lesson(id).steps).length) return true; // đã bắt đầu
    return !!S.lesson(list[i - 1].id).done;        // mở khi bài trước đã xong
  }
  function nextLesson() {
    const list = allLessons();
    return list.find(l => isUnlocked(l.id) && !S.lesson(l.id).done) || list.find(l => !S.lesson(l.id).done) || list[0];
  }

  /* ---------------- Cập nhật khung (chrome) ---------------- */
  function refreshChrome() {
    const st = S.effectiveStreak();
    const lv = E.levelInfo(S.state.exp);
    const best = (S.state.streak && S.state.streak.longest) || 0;
    const cs = $("#chip-streak"); if (cs) cs.innerHTML = '<span class="ic flame">🔥</span> ' + (st > 0 ? st : (best > 0 ? "kỷ lục " + best : "bắt đầu"));
    try { daily5Check(); } catch (e) {}
    const ce = $("#chip-exp"); if (ce) ce.innerHTML = '<span class="ic">⭐</span> ' + S.state.exp + " EXP";
    const cl = $("#chip-level"); if (cl) cl.textContent = "Lv " + lv.level;
    const due = S.srsDueCount();
    $$("[data-badge=ontap]").forEach(b => {
      b.style.display = due ? "" : "none";
      b.textContent = due;
    });
  }

  function setActive(base) {
    $$("[data-route]").forEach(a => {
      const r = a.getAttribute("data-route");
      const on = r === base || (base === "hoc" && r === "lo-trinh");
      a.classList.toggle("active", on);
      if (on) { const g = a.closest(".nav-group"); if (g) g.classList.remove("collapsed"); }
    });
  }

  /* ---------------- Giọng thầy/cô giảng bài (Web Speech API) ---------------- */
  const TTS = {
    ok: (typeof window !== "undefined") && ("speechSynthesis" in window) && (typeof SpeechSynthesisUtterance !== "undefined"),
    activeBtn: null
  };
  // CHỈ lấy giọng tiếng Việt (không rơi về giọng Anh)
  function ttsVoices() {
    if (!TTS.ok) return [];
    const all = window.speechSynthesis.getVoices() || [];
    const vi = all.filter(v => /^vi([-_]|$)/i.test(v.lang || "") || /viet/i.test(v.name || ""));
    // xếp hạng: Natural (Edge HoaiMy/NamMinh) > Google > Microsoft An > còn lại
    const rank = v => {
      const n = (v.name || "").toLowerCase();
      if (/natural/.test(n)) return 0;
      if (/hoaimy|namminh/.test(n)) return 1;
      if (/google/.test(n)) return 2;
      if (/\ban\b|microsoft/.test(n)) return 3;
      return 4;
    };
    return vi.sort((x, y) => rank(x) - rank(y));
  }
  function ttsPickVoice() {
    const pref = (S.ttsGet().voice || "");
    const vs = ttsVoices();
    return vs.find(v => v.voiceURI === pref || v.name === pref) || vs[0] || null;
  }
  // Danh sách giọng nạp không đồng bộ trên Chrome/Edge → chờ voiceschanged (tối đa ~1.2s)
  function ttsEnsureVoices(cb) {
    if (!TTS.ok) { cb(); return; }
    const synth = window.speechSynthesis;
    if ((synth.getVoices() || []).length) { cb(); return; }
    let done = false;
    const fin = () => { if (!done) { done = true; cb(); } };
    try { synth.addEventListener ? synth.addEventListener("voiceschanged", fin, { once: true }) : (synth.onvoiceschanged = fin); } catch (e) {}
    setTimeout(fin, 1200);
  }
  // Bảng hướng dẫn cài giọng tiếng Việt miễn phí
  function showTtsGuide() {
    if ($("#tts-guide")) return;
    const el = document.createElement("div");
    el.id = "tts-guide"; el.className = "tts-guide-backdrop";
    el.innerHTML = `<div class="tts-guide">
      <h3>⚠️ Thiết bị chưa có giọng đọc tiếng Việt</h3>
      <p class="soft" style="margin:4px 0 10px">Cài miễn phí theo một trong các cách sau (khuyên dùng cách 1):</p>
      <ol class="guide-list">
        <li><b>Nhanh nhất trên Windows:</b> mở app này bằng <b>Microsoft Edge</b> (có sẵn trong Windows). Edge kèm giọng tiếng Việt tự nhiên <b>HoaiMy / NamMinh</b> — mở lại bài học là nghe được ngay.</li>
        <li><b>Muốn dùng Chrome trên Windows:</b> vào <b>Settings → Time &amp; Language → Language</b> → Add a language → <b>Tiếng Việt</b> (tick <i>Text-to-speech</i>) → khởi động lại máy. Chrome sẽ có giọng <b>Microsoft An</b>.</li>
        <li><b>Điện thoại:</b> Android — cài giọng tiếng Việt trong <i>Cài đặt → Hệ thống → Ngôn ngữ → Chuyển văn bản thành giọng nói (Google)</i>. iPhone — <i>Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt</i>.</li>
      </ol>
      <div class="row mt" style="gap:8px;flex-wrap:wrap">
        <button class="btn sm" id="tts-guide-retry">🔄 Tôi đã cài — thử lại</button>
        <button class="btn ghost sm" id="tts-guide-anyway">Vẫn đọc bằng giọng hiện có</button>
        <button class="btn ghost sm" id="tts-guide-close">Đóng</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    $("#tts-guide-close").onclick = () => el.remove();
    el.onclick = e => { if (e.target === el) el.remove(); };
    $("#tts-guide-retry").onclick = () => {
      el.remove();
      ttsEnsureVoices(() => {
        if (ttsVoices().length) E.toast('<span class="t-ic">✅</span> Đã tìm thấy giọng tiếng Việt: ' + esc(ttsVoices()[0].name));
        else showTtsGuide();
      });
    };
    $("#tts-guide-anyway").onclick = () => { TTS.allowForeign = true; el.remove(); E.toast("Sẽ đọc bằng giọng hiện có của máy (có thể lơ lớ) — cài giọng Việt để hay hơn nhé."); };
  }
  // Chuyển HTML/kí hiệu Toán thành câu nói tự nhiên
  function speechText(html) {
    const div = document.createElement("div");
    div.innerHTML = String(html || "");
    let t = div.textContent || "";
    const rep = [
      [/√\(/g, " căn bậc hai của ("], [/√/g, " căn "], [/∛/g, " căn bậc ba của "],
      [/x²/g, "x bình phương"], [/R²/g, "R bình phương"], [/r²/g, "r bình phương"], [/a²/g, "a bình phương"],
      [/²/g, " bình phương"], [/³/g, " lập phương"], [/π/g, " pi "],
      [/⟺|⇔/g, " khi và chỉ khi "], [/⟹|⇒|→/g, " suy ra "],
      [/≥/g, " lớn hơn hoặc bằng "], [/≤/g, " nhỏ hơn hoặc bằng "], [/≠/g, " khác "],
      [/±/g, " cộng trừ "], [/·|×/g, " nhân "], [/⅓/g, " một phần ba "], [/½/g, " một phần hai "], [/¼/g, " một phần tư "],
      [/&gt;|>/g, " lớn hơn "], [/&lt;|</g, " nhỏ hơn "],
      [/Δ/g, " đen-ta "], [/°/g, " độ "], [/α/g, " an-pha "], [/β/g, " bê-ta "],
      [/S(ₓq|xq)/g, " diện tích xung quanh "], [/Ω/g, " ô-mê-ga "],
      [/\bvd\b/gi, "ví dụ"], [/\bĐKXĐ\b/gi, "điều kiện xác định"], [/\bPT\b/g, "phương trình"], [/\bHCN\b/g, "hình chữ nhật"]
    ];
    rep.forEach(([a, b]) => { t = t.replace(a, b); });
    return t.replace(/\s+/g, " ").trim();
  }
  function ttsBtnState(btn, mode) {
    if (!btn) return;
    btn.textContent = mode === "play" ? "⏸ Tạm dừng" : mode === "pause" ? "▶ Nghe tiếp" : "🔊 Nghe giảng";
    btn.classList.toggle("playing", mode === "play");
  }
  function ttsStop() {
    if (TTS.ok) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    ttsBtnState(TTS.activeBtn, "idle"); TTS.activeBtn = null;
  }
  function ttsToggle(text, btn, preface) {
    if (!TTS.ok) { E.toast("Trình duyệt này chưa hỗ trợ giọng đọc — thử Chrome/Edge hoặc điện thoại nhé."); return; }
    const synth = window.speechSynthesis;
    if (TTS.activeBtn === btn && synth.speaking) {
      if (synth.paused) { synth.resume(); ttsBtnState(btn, "play"); }
      else { synth.pause(); ttsBtnState(btn, "pause"); }
      return;
    }
    ttsStop();
    ttsEnsureVoices(() => {
    const v = ttsPickVoice();
    if (!v && !TTS.allowForeign) { showTtsGuide(); return; }
    const cfg = S.ttsGet();
    const hello = preface === false ? "" :
      (cfg.persona === "thay" ? "Thầy giảng nhé. " : "Cô giảng nhé. ");
    const u = new SpeechSynthesisUtterance(hello + speechText(text));
    u.lang = "vi-VN";
    if (v) u.voice = v;
    u.rate = cfg.rate || 1;
    u.onend = u.onerror = () => { if (TTS.activeBtn === btn) { ttsBtnState(btn, "idle"); TTS.activeBtn = null; } };
    TTS.activeBtn = btn; ttsBtnState(btn, "play");
    synth.speak(u);
    });
  }
  // Gắn nút nghe vào một panel (sau .step-eyebrow hoặc đầu panel)
  function mountTts(host, text, sel) {
    const anchor = host.querySelector(sel || ".step-eyebrow") || host.firstElementChild;
    if (!anchor) return;
    const btn = document.createElement("button");
    btn.className = "tts-btn"; btn.textContent = "🔊 Nghe giảng";
    btn.onclick = () => ttsToggle(text, btn);
    anchor.insertAdjacentElement("afterend", btn);
  }
  // để kiểm thử / mở rộng
  if (window.App) window.App.TTS = { speechText, toggle: ttsToggle, stop: ttsStop, voices: ttsVoices };

  /* ---------------- Thu âm bài giảng của học sinh ---------------- */
  const REC = {
    ok: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    mr: null, stream: null, timer: null, sec: 0, data: null, dur: 0
  };
  const REC_MAX = 120; // tối đa 2 phút / bản thu
  function recFmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  function recCleanup() {
    if (REC.timer) { clearInterval(REC.timer); REC.timer = null; }
    if (REC.mr && REC.mr.state !== "inactive") { try { REC.mr.stop(); } catch (e) {} }
    if (REC.stream) { try { REC.stream.getTracks().forEach(t => t.stop()); } catch (e) {} }
    REC.mr = null; REC.stream = null;
  }

  function recorderHtml(L) {
    const meta = (S.state.recordings || {})[L.id];
    const saved = meta ? `
      <div class="rec-saved" id="rec-saved">
        <p class="soft" style="margin:0 0 6px;font-size:13px">🎧 Bài giảng em đã lưu ${meta.dur ? "(" + recFmt(meta.dur) + ")" : ""} — ngày ${new Date(meta.t).getDate()}/${new Date(meta.t).getMonth() + 1}:</p>
        <audio controls preload="none" style="width:100%" src="${S.recGet(L.id) || ""}"></audio>
        <div class="row mt-sm" style="gap:8px">
          <button class="btn ghost sm" id="rec-del">🗑 Xoá bản này</button>
        </div>
      </div>` : "";
    return `<div class="rec-card mt" id="rec-card">
        <h4 style="margin:0 0 2px">🎙️ Giảng bằng giọng của em</h4>
        <p class="soft" style="margin:0 0 10px;font-size:13.5px">Hãy đọc và giảng lại bài này như một thầy cô thật (nhìn bài viết ở trên để nói theo). Thu âm xong <b>nghe lại chính mình</b> — cách nhớ bài lâu nhất đấy!</p>
        ${REC.ok ? `
          <div class="row" style="gap:10px;align-items:center;flex-wrap:wrap">
            <button class="btn sm" id="rec-toggle">🎙️ Bắt đầu thu</button>
            <span class="rec-time" id="rec-time">00:00 / ${recFmt(REC_MAX)}</span>
          </div>
          <div id="rec-preview"></div>`
        : `<p class="soft" style="font-size:13px">⚠️ Trình duyệt này chưa hỗ trợ thu âm — hãy dùng Chrome/Edge hoặc điện thoại nhé.</p>`}
        ${saved}
      </div>`;
  }

  function wireRecorder(L) {
    const delBtn = $("#rec-del");
    if (delBtn) delBtn.onclick = () => {
      S.recDelete(L.id);
      const sv = $("#rec-saved"); if (sv) sv.remove();
      E.toast("Đã xoá bản thu.");
    };
    const btn = $("#rec-toggle");
    if (!btn) return;
    const timeEl = $("#rec-time"), preview = $("#rec-preview");

    function setRecUI(on) {
      btn.textContent = on ? "⏹ Dừng thu" : "🎙️ Bắt đầu thu";
      btn.classList.toggle("recording", on);
    }
    function showPreview() {
      preview.innerHTML = `
        <p class="soft mt-sm" style="margin-bottom:4px;font-size:13px">Nghe thử bản vừa thu (${recFmt(REC.dur)}):</p>
        <audio controls style="width:100%" src="${REC.data}"></audio>
        <div class="row mt-sm" style="gap:8px;flex-wrap:wrap">
          <button class="btn sm" id="rec-save">💾 Lưu bài giảng</button>
          <button class="btn ghost sm" id="rec-again">🔄 Thu lại</button>
        </div>`;
      $("#rec-again").onclick = () => { preview.innerHTML = ""; REC.data = null; timeEl.textContent = "00:00 / " + recFmt(REC_MAX); };
      $("#rec-save").onclick = () => {
        if (!REC.data) return;
        if (REC.data.length > 2500000) { E.toast("Bản thu hơi dài — em thu gọn trong 2 phút nhé."); return; }
        const first = !(S.state.recordings || {})[L.id];
        const ok = S.recSave(L.id, REC.data, REC.dur);
        if (!ok) { E.toast("⚠️ Bộ nhớ trình duyệt đầy — hãy xoá bớt bản thu cũ."); return; }
        if (first) { gain(E.EXP.record); }
        S.log("record", L.title);
        checkBadges(); refreshChrome();
        E.toast('<span class="t-ic">🎙️</span> Đã lưu bài giảng của em!');
        // vẽ lại khối đã lưu
        const card = $("#rec-card");
        if (card) { card.outerHTML = recorderHtml(L); wireRecorder(L); }
      };
    }

    btn.onclick = async () => {
      if (REC.mr && REC.mr.state === "recording") { // dừng
        try { REC.mr.stop(); } catch (e) {}
        return;
      }
      try {
        REC.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        E.toast("Không truy cập được micro — em kiểm tra quyền micro của trình duyệt nhé.");
        return;
      }
      let chunks = [];
      try { REC.mr = new MediaRecorder(REC.stream); }
      catch (e) { E.toast("Trình duyệt không thu âm được định dạng này."); return; }
      REC.sec = 0; REC.data = null; preview.innerHTML = "";
      REC.mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      REC.mr.onstop = () => {
        if (REC.timer) { clearInterval(REC.timer); REC.timer = null; }
        setRecUI(false);
        try { REC.stream && REC.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
        REC.stream = null;
        const blob = new Blob(chunks, { type: (REC.mr && REC.mr.mimeType) || "audio/webm" });
        REC.mr = null;
        const fr = new FileReader();
        fr.onload = () => { REC.data = fr.result; REC.dur = REC.sec; showPreview(); };
        fr.readAsDataURL(blob);
      };
      REC.mr.start();
      setRecUI(true);
      timeEl.textContent = "00:00 / " + recFmt(REC_MAX);
      REC.timer = setInterval(() => {
        REC.sec++;
        timeEl.textContent = recFmt(REC.sec) + " / " + recFmt(REC_MAX);
        if (REC.sec >= REC_MAX && REC.mr) { try { REC.mr.stop(); } catch (e) {} }
      }, 1000);
    };
  }

  /* ---------------- KaTeX: hiển thị công thức đẹp ---------------- */
  // Nhận diện các mẫu Toán phổ biến trong nội dung (√, ∛, mũ ² ³) rồi render bằng KaTeX.
  // Không cần sửa tay nội dung; nếu KaTeX chưa nạp thì giữ nguyên chữ Unicode (không lỗi).
  const SUP = { "²": "2", "³": "3", "⁴": "4", "ⁿ": "n" };
  function toTex(src) {
    // src là một cụm đã tách, trả về chuỗi LaTeX
    return src;
  }
  // Tìm các cụm công thức trong một chuỗi text thuần → mảng {i, len, tex}
  function findMath(t) {
    const hits = [];
    const push = (i, len, tex) => hits.push({ i: i, len: len, tex: tex });
    let m;
    // √( ... ) và ∛( ... ) — cho phép 1 mức ngoặc lồng
    const reRoot = /(√|∛)\(((?:[^()]|\([^()]*\))*)\)/g;
    while ((m = reRoot.exec(t))) {
      const tex = (m[1] === "∛" ? "\\sqrt[3]{" : "\\sqrt{") + texInner(m[2]) + "}";
      push(m.index, m[0].length, tex);
    }
    // √n / √x  (số hoặc 1 chữ)
    const reRootS = /(√|∛)\s*([0-9]+(?:[.,][0-9]+)?|[A-Za-zαβπΔ])/g;
    while ((m = reRootS.exec(t))) {
      if (covered(hits, m.index)) continue;
      const tex = (m[1] === "∛" ? "\\sqrt[3]{" : "\\sqrt{") + m[2] + "}";
      push(m.index, m[0].length, tex);
    }
    // luỹ thừa: (….)²  hoặc  chuỗi-chữ-số²  → base^{n}
    const rePow = /(\([^()]*\)|[A-Za-z0-9]+)([²³⁴ⁿ])/g;
    while ((m = rePow.exec(t))) {
      if (covered(hits, m.index)) continue;
      push(m.index, m[0].length, texInner(m[1]) + "^{" + SUP[m[2]] + "}");
    }
    return hits.sort((a, b) => a.i - b.i);
  }
  function covered(hits, i) { return hits.some(h => i >= h.i && i < h.i + h.len); }
  // xử lý bên trong dấu căn: chuyển căn lồng + mũ lồng sang LaTeX
  function texInner(s) {
    s = String(s);
    s = s.replace(/(√|∛)\(([^()]*)\)/g, (x, r, b2) => (r === "∛" ? "\\sqrt[3]{" : "\\sqrt{") + b2 + "}");
    s = s.replace(/(√|∛)\s*([0-9]+(?:[.,][0-9]+)?|[A-Za-z])/g, (x, r, b2) => (r === "∛" ? "\\sqrt[3]{" : "\\sqrt{") + b2 + "}");
    s = s.replace(/(\([^()]*\)|[A-Za-z0-9]+)([²³⁴])/g, (x, b2, p) => b2 + "^{" + SUP[p] + "}");
    return s;
  }
  function katexReady() { return typeof window.katex !== "undefined" && window.katex.renderToString; }
  function mathifyElement(root) {
    if (!root || !katexReady()) return;
    const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, CODE: 1, KATEX: 1 };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue || !/[√∛²³⁴ⁿ]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        let p = node.parentNode;
        while (p && p !== root) {
          if (SKIP[p.nodeName] || (p.classList && (p.classList.contains("katex") || p.classList.contains("no-math")))) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const targets = [];
    let n; while ((n = walker.nextNode())) targets.push(n);
    targets.forEach(node => {
      const t = node.nodeValue;
      const hits = findMath(t);
      if (!hits.length) return;
      const frag = document.createDocumentFragment();
      let pos = 0;
      hits.forEach(h => {
        if (h.i < pos) return; // chồng lấn
        if (h.i > pos) frag.appendChild(document.createTextNode(t.slice(pos, h.i)));
        const span = document.createElement("span");
        try { span.innerHTML = window.katex.renderToString(h.tex, { throwOnError: false, displayMode: false }); }
        catch (e) { span.textContent = t.slice(h.i, h.i + h.len); }
        frag.appendChild(span);
        pos = h.i + h.len;
      });
      if (pos < t.length) frag.appendChild(document.createTextNode(t.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---------------- Phần thưởng ---------------- */
  function gain(n) {
    const before = E.levelInfo(S.state.exp).level;
    S.addExp(n);
    const after = E.levelInfo(S.state.exp).level;
    refreshChrome();
    if (after > before) {
      E.confetti();
      E.toast('<span class="t-ic">🎉</span> Lên Level ' + after + " — " + E.levelTitle(after) + "!");
    }
    checkBadges();
  }
  function checkBadges() {
    const newly = E.refreshBadges();
    newly.forEach((b, i) => {
      S.log("badge", b.name);
      setTimeout(() => {
        E.toast('<span class="t-ic">' + b.emoji + "</span> Mở huy hiệu: <b>" + b.name + "</b>");
      }, i * 600);
    });
    if (newly.length) E.confetti();
  }

  /* =======================================================================
     VIEW: DASHBOARD
     ===================================================================== */
  function renderDashboard() {
    try { daily5Check(); } catch (e) {}
    const hour = new Date().getHours();
    const hi = hour < 11 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
    const mins = S.minutesToday();
    const goal = S.getGoals().min;
    const pct = Math.min(100, Math.round(mins / goal * 100));
    const off = RING_C * (1 - pct / 100);
    const nl = nextLesson();
    const lv = E.levelInfo(S.state.exp);
    const week = S.daysStudiedThisWeek();
    const goalDays = S.getGoals().days;
    const totalLessons = allLessons().length;
    const doneLessons = S.lessonsDoneCount();
    const quests = E.dailyQuests();
    const allDone = E.dailyAllDone();
    const claimed = S.dailyClaimed();
    const st = S.streakStatus();
    const due = S.srsDueCount();

    // Bài tập được giao (do phụ huynh đặt)
    const asg = S.assignGet();
    const aTasks = asg.tasks || [];
    const aDone = aTasks.filter(S.taskDone).length;
    const assignedCard = aTasks.length ? `
      <div class="card assign-card mt">
        <div class="section-title"><span class="ic">📌</span><h2>Bài tập được giao</h2></div>
        <div class="row between"><b>Tiến độ hôm nay</b><span class="soft">${aDone}/${aTasks.length} xong</span></div>
        <div class="progress mt-sm"><span style="width:${Math.round(aDone / aTasks.length * 100)}%"></span></div>
        <div class="assign-list mt-sm">
          ${aTasks.map((t, i) => {
            const done = S.taskDone(t);
            return `<div class="assign-item ${done ? "done" : ""}">
              <div class="ai-ic">${done ? "✅" : (t.type === "practice" ? "📒" : "📖")}</div>
              <div class="ai-main"><b>${esc(t.label)}</b><span class="ai-sub">${t.type === "practice" ? "Luyện tập" : "Bài học"}</span></div>
              ${done ? '<span class="ai-tag">Xong</span>' : '<button class="btn sm" data-task="' + i + '">Làm ngay</button>'}
            </div>`;
          }).join("")}
        </div>
        ${aDone === aTasks.length ? '<div class="plan-done mt-sm">🎉 Em đã làm xong tất cả bài được giao. Giỏi quá!</div>' : ""}
      </div>` : "";

    // lịch 28 ngày, căn theo Thứ Hai
    const days = S.calendarLast(28);
    const firstDow = (new Date(days[0].date).getDay() + 6) % 7;
    let cells = "";
    for (let i = 0; i < firstDow; i++) cells += '<div class="cal-cell empty"></div>';
    days.forEach(d => {
      const dnum = Number(d.date.split("-")[2]);
      const cls = ["cal-cell", d.state, d.isToday ? "today" : ""].filter(Boolean).join(" ");
      cells += '<div class="' + cls + '" title="' + d.date + ': ' + d.minutes + ' phút">' + dnum + "</div>";
    });
    const dows = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(x => '<div class="cal-dow">' + x + "</div>").join("");

    // tiến độ từng chương
    const chapterBars = D.chapters.map(ch => {
      const total = ch.lessons.filter(id => D.lessons[id]).length;
      const done = ch.lessons.filter(id => S.lesson(id).done).length;
      const p = total ? Math.round(done / total * 100) : 0;
      return '<div class="mt-sm"><div class="row between"><b style="font-size:14px">' + ch.emoji + " " + esc(ch.name) +
        '</b><span class="soft" style="font-size:13px">' + done + "/" + total + '</span></div>' +
        '<div class="progress thin mt-sm"><span style="width:' + p + '%"></span></div></div>';
    }).join("");

    // Sổ tay lỗi sai — nhắc số câu cần ôn hôm nay
    const mkDue = S.mistakesDueCount();
    const mkCard = mkDue ? `
      <div class="card mk-due-card mt">
        <div class="row between" style="align-items:center;gap:10px">
          <div><b>\u{1F4D5} ${mkDue} câu lỗi sai cần ôn hôm nay</b>
            <div class="soft" style="font-size:13px">Ôn lại đúng câu em từng sai — nhớ chắc hơn làm câu mới.</div></div>
          <button class="btn sm" id="dash-mk">Ôn ngay →</button>
        </div>
      </div>` : "";

    // Chủ đề yếu cần ôn lại (dựa trên tỉ lệ đúng khi làm bài)
    const weak = S.weakTopics(3, 0.6).slice(0, 3);
    const weakCard = weak.length ? `
      <div class="card weak-card mt">
        <div class="section-title"><span class="ic">🎯</span><h2>Cần ôn lại</h2></div>
        <p class="soft" style="font-size:13.5px;margin:-2px 0 4px">Vài phần em còn hay nhầm — ôn nhanh lý thuyết rồi luyện lại là chắc kiến thức ngay nhé!</p>
        <div class="weak-list mt-sm">
          ${weak.map(t => {
            const L = D.lessons[t.lessonId]; if (!L) return "";
            const pset = LESSON_PRACTICE[t.lessonId];
            return `<div class="weak-item">
              <div class="wk-info"><b>${esc(L.title)}</b>
                <span class="wk-sub">Đúng ${Math.round(t.acc * 100)}% · sai ${t.miss} câu</span></div>
              <div class="wk-btns">
                <button class="btn ghost sm" data-weak-lesson="${t.lessonId}">📖 Ôn lý thuyết</button>
                ${pset ? `<button class="btn sm" data-weak-prac="${pset}">📒 Luyện lại</button>` : ""}
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>` : "";

    setView(`
      ${daily5Card()}
      ${hookOfDayCard()}
      <div class="grid dash-hero">
        <div class="card hero-card card-pad-lg">
          <div class="deco">🧠</div>
          <span class="pill" style="background:rgba(255,255,255,.18);color:#fff;border:none">Học hiểu — không học vẹt</span>
          <h2 style="margin-top:12px">${hi}! 👋</h2>
          <p class="lead">Mỗi ngày 30 phút theo phương pháp Feynman: hiểu bản chất, nhớ thật lâu.
            Hôm nay em đã học <b>${mins}</b> / ${goal} phút.</p>
          <div class="row">
            <button class="btn lg accent" data-act="session">▶ Bắt đầu buổi học 30'</button>
            <button class="btn lg ghost" data-act="continue" style="--ink:#fff;color:#fff;background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);box-shadow:0 4px 0 rgba(0,0,0,.15)">Tiếp tục: ${esc(nl.title)}</button>
          </div>
        </div>

        <div class="card" style="display:grid;place-items:center;text-align:center">
          <div class="ring-wrap">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle class="ring-bg" cx="75" cy="75" r="${RING_R}" fill="none" stroke-width="13"></circle>
              <circle class="ring-fg" cx="75" cy="75" r="${RING_R}" fill="none" stroke-width="13"
                stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
                transform="rotate(-90 75 75)"></circle>
            </svg>
            <div class="ring-label"><div class="big">${mins}'</div><div class="sub">/ ${goal} phút</div></div>
          </div>
          <p class="soft mt-sm" style="font-size:13.5px">Mục tiêu hôm nay</p>
        </div>
      </div>

      ${st.atRisk ? `<div class="streak-banner">🔥 Chuỗi <b>${st.value} ngày</b> đang chờ — học hôm nay để giữ vững!${st.freezes ? ` <span class="sb-freeze">Có ${st.freezes} 🧊 Bùa dự phòng</span>` : ""}</div>` : ""}
      ${assignedCard}
      ${mkCard}
      ${weakCard}

      <div class="grid cols-2 mt">
        <div class="card plan-card">
          <div class="section-title"><span class="ic">🗓️</span><h2>Kế hoạch hôm nay</h2></div>
          <div class="quests">
            ${quests.map(q => `
              <div class="quest ${q.done ? "done" : ""}">
                <div class="q-ic">${q.done ? "✅" : q.icon}</div>
                <div class="q-main">
                  <div class="q-row"><b>${esc(q.name)}</b><span class="q-count">${q.value}/${q.goal}</span></div>
                  <div class="progress thin mt-sm"><span style="width:${Math.round(q.value / q.goal * 100)}%"></span></div>
                </div>
              </div>`).join("")}
          </div>
          ${allDone
            ? (claimed
                ? '<div class="plan-done">🎉 Hoàn thành mọi nhiệm vụ hôm nay. Quá xuất sắc!</div>'
                : `<button class="btn accent block mt" id="claim-bonus">🎁 Nhận thưởng: +${E.DAILY_BONUS} EXP &amp; +1 🧊 Bùa</button>`)
            : `<p class="soft mt-sm" style="font-size:13px">Xong cả 4 nhiệm vụ để nhận <b>+${E.DAILY_BONUS} EXP</b> và <b>+1 🧊 Bùa giữ chuỗi</b>.</p>`}
        </div>

        <div class="card">
          <div class="section-title"><span class="ic">⚡</span><h2>Bắt đầu nhanh</h2></div>
          <button class="btn block" data-act="continue2">📖 Học tiếp: ${esc(nl.title)}</button>
          <button class="btn ghost block mt-sm" data-act="review">🃏 Ôn tập${due ? ' · <b style="color:var(--accent-deep)">' + due + " thẻ</b> đến hạn" : " (chưa có thẻ đến hạn)"}</button>
          <button class="btn ghost block mt-sm" data-act="practice">📒 Luyện tập theo SGK</button>
          <button class="btn ghost block mt-sm" data-act="tree">🌳 Bản đồ cây kiến thức</button>
          <button class="btn ghost block mt-sm" data-act="think">🧠 Rèn tư duy & Tự luận</button>
          <button class="btn ghost block mt-sm" data-act="progress">📈 Tiến bộ & Kiểm tra định kỳ</button>
          <button class="btn ghost block mt-sm" data-act="arena">⚔️ Đấu trường Toán học</button>
        </div>
      </div>

      <div class="grid cols-3 mt">
        <div class="card text-c"><div class="stat-num" style="color:var(--accent-deep)">${st.value} 🔥</div><div class="stat-lbl">Chuỗi ngày · 🧊 ${st.freezes} Bùa</div></div>
        <div class="card text-c"><div class="stat-num" style="color:var(--gold)">Lv ${lv.level}</div><div class="stat-lbl">${esc(lv.title)}</div></div>
        <div class="card text-c"><div class="stat-num" style="color:var(--brand)">${doneLessons}/${totalLessons}</div><div class="stat-lbl">Bài đã hoàn thành</div></div>
      </div>

      <div class="grid cols-2 mt">
        <div class="card">
          <div class="section-title"><span class="ic">📅</span><h2>Lịch học</h2></div>
          <div class="calendar">${dows}${cells}</div>
          <p class="soft mt-sm" style="font-size:13px">Ô xanh đậm = đủ 30 phút · ô nhạt = có học. Giữ chuỗi nhé!</p>
        </div>
        <div class="card">
          <div class="section-title"><span class="ic">🎯</span><h2>Mục tiêu & tiến độ</h2></div>
          <div class="row between"><b>Tuần này</b><span class="soft">${week}/${goalDays} ngày</span></div>
          <div class="progress mt-sm"><span style="width:${Math.min(100, Math.round(week / goalDays * 100))}%"></span></div>
          ${chapterBars}
        </div>
      </div>
    `);

    $("[data-act=session]").onclick = () => go("#/session");
    $("[data-act=continue]").onclick = () => go("#/hoc/" + nl.id);
    const c2 = $("[data-act=continue2]"); if (c2) c2.onclick = () => go("#/hoc/" + nl.id);
    const rv = $("[data-act=review]"); if (rv) rv.onclick = () => go("#/on-tap");
    const ar = $("[data-act=arena]"); if (ar) ar.onclick = () => go("#/game");
    const pr = $("[data-act=practice]"); if (pr) pr.onclick = () => go("#/luyen-tap");
    const tk = $("[data-act=think]"); if (tk) tk.onclick = () => go("#/tu-duy");
    const tr = $("[data-act=tree]"); if (tr) tr.onclick = () => go("#/ban-do");
    const pg = $("[data-act=progress]"); if (pg) pg.onclick = () => go("#/tien-bo");
    wireDaily5();
    const dmk = $("#dash-mk"); if (dmk) dmk.onclick = () => go("#/loi-sai");
    $$("[data-weak-lesson]").forEach(b => b.onclick = () => go("#/hoc/" + b.getAttribute("data-weak-lesson")));
    $$("[data-weak-prac]").forEach(b => b.onclick = () => go("#/luyen-tap/" + b.getAttribute("data-weak-prac")));
    $$("[data-task]").forEach(b => b.onclick = () => {
      const t = aTasks[+b.getAttribute("data-task")];
      if (t) go(t.type === "practice" ? "#/luyen-tap/" + t.ref : "#/hoc/" + t.ref);
    });
    const cb = $("#claim-bonus");
    if (cb) cb.onclick = () => {
      if (S.claimDailyBonus()) {
        gain(E.DAILY_BONUS);
        E.confetti();
        E.toast('<span class="t-ic">🎁</span> +' + E.DAILY_BONUS + ' EXP và +1 🧊 Bùa giữ chuỗi!');
        renderDashboard();
      }
    };
  }

  /* =======================================================================
     VIEW: LỘ TRÌNH
     ===================================================================== */
  function renderRoadmap() {
    let html = '<div class="section-title"><span class="ic">🗺️</span><h2>Lộ trình học Toán 9</h2></div>' +
      '<p class="soft mb">Hoàn thành một bài để mở khoá bài tiếp theo. Mỗi bài gồm 5 bước Feynman.</p>';

    D.chapters.forEach(ch => {
      const cards = ch.lessons.map(id => {
        const L = D.lessons[id];
        if (!L) return "";
        const done = S.lesson(id).done;
        const locked = !isUnlocked(id);
        const pct = S.lessonCompletionPct(id, 5);
        return `<div class="lesson-card ${locked ? "locked" : ""}" data-lesson="${locked ? "" : id}">
            ${done ? '<div class="done-tick">✓</div>' : ""}
            <div class="l-emoji">${locked ? "🔒" : L.emoji}</div>
            <h3>${esc(L.title)}</h3>
            <p class="soft" style="font-size:13px;margin:0">${L.estMinutes} phút · 5 bước</p>
            <div class="l-progress"><div class="progress thin"><span style="width:${pct}%"></span></div></div>
          </div>`;
      }).join("");
      html += `<div class="chapter">
        <div class="chapter-head">
          <div class="chapter-icon" style="background:${ch.color}">${ch.emoji}</div>
          <div><h2 style="font-size:18px">${esc(ch.name)}</h2>
          <span class="soft" style="font-size:13px">${ch.lessons.length} bài học</span></div>
        </div>
        <div class="lesson-grid">${cards}</div>
      </div>`;
    });
    setView(html);

    $$("[data-lesson]").forEach(c => c.onclick = () => {
      const id = c.getAttribute("data-lesson");
      if (!id) { E.toast('<span class="t-ic">🔒</span> Hoàn thành bài trước để mở khoá nhé!'); return; }
      go("#/hoc/" + id);
    });
  }

  /* =======================================================================
     VIEW: BÀI HỌC (5 bước Feynman)
     ===================================================================== */
  let curLesson = null, curStep = 1;

  function renderLesson(id) {
    const L = D.lessons[id];
    if (!L) { go("#/lo-trinh"); return; }
    curLesson = L; curStep = 1;
    titleEl.textContent = L.emoji + " " + L.title;

    const rail = STEP_META.map(m => {
      const done = S.isStepDone(id, m.n);
      return `<div class="step-link ${m.n === 1 ? "active" : ""} ${done ? "done" : ""}" data-step="${m.n}">
          <div class="step-num">${done ? "✓" : m.n}</div>
          <div class="step-t">${m.t}<small>${m.s}</small></div>
        </div>`;
    }).join("");

    setView(`<div class="lesson-layout">
        <aside class="steps-rail" id="rail">${rail}</aside>
        <section id="step-host"></section>
      </div>`);

    $$("#rail .step-link").forEach(el => el.onclick = () => showStep(Number(el.getAttribute("data-step"))));
    showStep(1);
  }

  function railSync() {
    $$("#rail .step-link").forEach(el => {
      const n = Number(el.getAttribute("data-step"));
      el.classList.toggle("active", n === curStep);
      const done = S.isStepDone(curLesson.id, n);
      el.classList.toggle("done", done);
      el.querySelector(".step-num").textContent = done ? "✓" : n;
    });
  }

  function stepNavButtons(n) {
    const prev = n > 1 ? `<button class="btn ghost" data-nav="${n - 1}">← Quay lại</button>` : "<span></span>";
    const next = n < 5 ? `<button class="btn" data-nav="${n + 1}">Tiếp tục →</button>` : "";
    return `<div class="row between mt">${prev}${next}</div>`;
  }

  function showStep(n) {
    curStep = n; railSync();
    ttsStop();
    recCleanup();
    const L = curLesson, host = $("#step-host");
    const f = L.feynman;
    const eyebrow = e => '<div class="step-eyebrow">' + e + "</div>";

    if (n === 1) {
      if (L.hook && !HOOK_SEEN[L.id]) { renderHook(L, host); return; }
      host.innerHTML = `<div class="step-panel">
        ${eyebrow("① Giải thích như cho lớp 5")}
        <div class="prose">${f.s1.html}</div>
        ${stepNavButtons(1)}</div>`;
      mountTts(host, L.title + ". " + f.s1.html);
      markStep(1);
    }
    else if (n === 2) {
      host.innerHTML = `<div class="step-panel">
        ${eyebrow("② Nhìn thấy tận mắt")}
        <div id="fig-host"></div>
        <p class="soft mt-sm" style="font-size:14.5px">${esc(f.s2.caption || "")}</p>
        ${stepNavButtons(2)}</div>`;
      mountFigure(f.s2, $("#fig-host"));
      mountTts(host, (f.s2.caption || "") + " Em hãy quan sát kĩ hình minh hoạ nhé.");
      markStep(2);
    }
    else if (n === 3) {
      const cards = f.s3.map(a => `<div class="app-card"><div class="a-ic">${a.ic}</div>
        <h4>${esc(a.title)}</h4><p>${a.html}</p></div>`).join("");
      host.innerHTML = `<div class="step-panel">
        ${eyebrow("③ Toán dùng trong đời thực")}
        <p class="prose mb">Đây là lúc thấy Toán <strong>hữu ích thật sự</strong> — không chỉ nằm trên giấy:</p>
        <div class="apps-grid">${cards}</div>
        ${stepNavButtons(3)}</div>`;
      mountTts(host, "Toán này dùng trong đời thực thế nào? " + f.s3.map(x => x.title + ". " + x.html).join(" Tiếp theo. "));
      markStep(3);
    }
    else if (n === 4) {
      renderFeynmanStep(host);
    }
    else if (n === 5) {
      renderQuizStep(host);
    }

    host.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => showStep(Number(b.getAttribute("data-nav"))));
  }

  function markStep(n) {
    if (S.setStepDone(curLesson.id, n)) { gain(E.EXP.step); }
    railSync();
  }

  function mountFigure(s2, host) {
    if (s2.type === "graph") {
      E.mountGraph(host, { a: 2, b: 1 });
    } else if (s2.type === "chart") {
      host.innerHTML = '<div class="figure"><canvas class="graph-canvas" id="bar-cv"></canvas></div>';
      requestAnimationFrame(() => E.drawBars($("#bar-cv"), s2.chart));
    } else {
      host.innerHTML = '<figure class="figure">' + (s2.svg || "") + "</figure>";
    }
  }

  /* ---- Bước 4: tự giải thích ---- */
  function renderFeynmanStep(host) {
    const L = curLesson, s4 = L.feynman.s4;
    const saved = S.getNote(L.id);
    host.innerHTML = `<div class="step-panel feynman-box">
      ${'<div class="step-eyebrow">④ Tự giảng lại (Feynman)</div>'}
      <div class="eli5"><div class="e-ic">✍️</div><div class="e-body">${esc(s4.prompt)}</div></div>
      <textarea id="fey" placeholder="Viết lời giải thích của em ở đây… cứ tự nhiên như đang nói chuyện.">${esc(saved)}</textarea>
      <div class="row mt-sm">
        <button class="btn" id="fey-check">Kiểm tra cách hiểu</button>
        <button class="btn ghost" id="fey-sample">Xem gợi ý mẫu</button>
      </div>
      <div id="fey-fb"></div>
      ${recorderHtml(L)}
      ${stepNavButtons(4)}
    </div>`;

    mountTts(host, "Đến lượt em làm thầy cô. " + s4.prompt + " Em viết lời giải thích của mình rồi bấm kiểm tra nhé.");
    wireRecorder(L);
    $("#fey").addEventListener("input", e => S.setNote(L.id, e.target.value));

    $("#fey-check").onclick = () => {
      const text = $("#fey").value;
      const r = E.checkFeynman(text, s4.keywords);
      const kws = s4.keywords.map(k =>
        '<span class="kw ' + (r.hits.indexOf(k) !== -1 ? "hit" : "miss") + '">' +
        (r.hits.indexOf(k) !== -1 ? "✓ " : "+ ") + esc(k) + "</span>").join("");
      $("#fey-fb").innerHTML = `<div class="feedback ${r.tier}">
        <h4>${r.tooShort ? "✍️ Viết thêm chút nữa nhé" : "Mức độ phủ ý: " + r.pct + "%"}</h4>
        <div class="cover-meter"><span style="width:${r.pct}%"></span></div>
        <p style="margin:8px 0 4px">${r.message}</p>
        <div style="margin-top:8px">${kws}</div>
        <p class="soft mt-sm" style="font-size:13px">✓ = ý em đã nhắc tới &nbsp;·&nbsp; + = ý nên bổ sung. Đây là gợi ý, không phải chấm đúng/sai.</p>
      </div>`;
      if (!r.tooShort && S.setStepDone(L.id, 4)) { gain(E.EXP.feynman); S.log("feynman", L.id); checkBadges(); railSync(); }
    };
    $("#fey-sample").onclick = () => {
      $("#fey-fb").innerHTML = `<div class="feedback good"><h4>💡 Một cách giải thích mẫu</h4>
        <p style="margin:0">${esc(s4.sample)}</p>
        <p class="soft mt-sm" style="font-size:13px">Không cần giống hệt — quan trọng là em hiểu và nói được bằng lời của mình.</p></div>`;
    };
  }

  /* ---- Bước 5: bài tập ---- */
  function renderQuizStep(host) {
    host.innerHTML = `<div class="step-panel">
      <div class="step-eyebrow">⑤ Luyện tập</div>
      <div class="row between mb">
        <div class="tabs" id="qtabs">
          <div class="tab active" data-d="easy"><span class="dot"></span>Dễ</div>
          <div class="tab" data-d="medium"><span class="dot"></span>Trung bình</div>
          <div class="tab" data-d="hard"><span class="dot"></span>Nâng cao</div>
        </div>
      </div>
      <div id="quiz-host"></div>
      <div id="lesson-finish"></div>
      ${stepNavButtons(5)}
    </div>`;
    $$("#qtabs .tab").forEach(t => t.onclick = () => {
      $$("#qtabs .tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      renderQuizSet(t.getAttribute("data-d"));
    });
    renderQuizSet("easy");
  }

  function renderQuizSet(diff) {
    const L = curLesson;
    const qs = (L.exercises[diff] || []);
    const qhost = $("#quiz-host");
    if (!qs.length) { qhost.innerHTML = '<div class="empty-state"><div class="e-emoji">🌱</div>Chưa có câu hỏi ở mức này.</div>'; return; }

    const state = { answered: 0, correct: 0, total: qs.length, awarded: {} };
    qhost.innerHTML = qs.map((q, i) => renderQuestion(q, i, diff)).join("");

    qs.forEach((q, i) => wireQuestion(q, i, diff, state, L));
  }

  function renderQuestion(q, i, diff) {
    let body = "";
    if (q.type === "mc") {
      const keys = ["A", "B", "C", "D", "E"];
      body = '<div class="options">' + q.options.map((o, k) =>
        `<button class="opt" data-opt="${k}"><span class="opt-key">${keys[k]}</span><span>${esc(o)}</span></button>`).join("") + "</div>";
    } else if (q.type === "fill") {
      body = `<div class="row" style="gap:10px;align-items:stretch">
          <input class="fill-input" data-fill="1" placeholder="Nhập đáp án…" autocomplete="off">
          <button class="btn" data-check="1">Kiểm tra</button>
        </div>`;
    } else if (q.type === "match") {
      const left = q.pairs.map((p, k) => `<button class="match-item" data-side="L" data-k="${k}">${esc(p[0])}</button>`).join("");
      const shuffled = q.pairs.map((p, k) => ({ k, v: p[1] })).sort(() => Math.random() - .5);
      const right = shuffled.map(o => `<button class="match-item" data-side="R" data-k="${o.k}">${esc(o.v)}</button>`).join("");
      body = `<div class="match-grid"><div class="match-col">${left}</div><div class="match-col">${right}</div></div>`;
    } else if (q.type === "open") {
      body = `<div class="open-wrap">
          <textarea class="open-input" data-open="1" rows="3" placeholder="Nháp lời giải của em ở đây (không bắt buộc)…"></textarea>
          <button class="btn block mt-sm" data-reveal="1">📝 Xem lời giải mẫu &amp; tự đánh giá</button>
        </div>`;
    }
    const showHint = q.type !== "open" && stepsFromSol(q.sol).length >= 2;
    const badge = q.type === "open" ? '<span class="q-badge open">✍️ Tự luận</span>' : (q.think ? '<span class="q-badge think">🧠 Tư duy</span>' : "");
    return `<div class="q-card mb" data-q="${i}">
        <div class="q-head"><span class="q-counter">Câu ${i + 1}${badge}</span>${showHint ? '<button class="q-hint" data-hint="1">💡 Gợi ý</button>' : ""}</div>
        <div class="q-text">${esc(q.q)}</div>
        ${body}
        <div class="hint-host"></div>
        <div class="sol-host"></div>
      </div>`;
  }

  // Tách một chuỗi lời giải thành các bước nhỏ theo dấu → ⟹ ⇒ ⇔
  function stepsFromSol(sol) {
    const out = [];
    (sol || []).forEach(s => {
      String(s).split(/\s*(?:→|⟹|⇒|⇔)\s*/).forEach(part => {
        const p = part.trim();
        if (p) out.push(p);
      });
    });
    return out;
  }

  // Sổ tay lỗi sai: chỉ ghi câu tự chấm được (mc/fill) khi làm SAI
  function qHash(str) { let h = 0; str = String(str || ""); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function noteMistake(q, correct, meta) {
    if (correct || !q || (q.type !== "mc" && q.type !== "fill")) return;
    const id = ((meta && meta.source) || "q") + ":" + qHash(q.q);
    S.mistakeAdd(id, q, meta);
  }

  function solutionHtml(q) {
    const steps = stepsFromSol(q.sol);
    if (!steps.length) return "";
    const items = steps.map((s, k) =>
      `<li><span class="step-n">Bước ${k + 1}</span><span class="step-t">${esc(s)}</span></li>`).join("");
    return `<div class="solution"><h4>🧭 Lời giải từng bước</h4><ol class="steps">${items}</ol></div>`;
  }

  // Gợi ý = bước đầu tiên (chỉ dùng khi có từ 2 bước trở lên)
  function hintHtml(q) {
    const steps = stepsFromSol(q.sol);
    if (steps.length < 1) return "";
    return `<div class="hint"><b>💡 Gợi ý (bước 1):</b> ${esc(steps[0])}</div>`;
  }

  // Nút gợi ý + chỗ hiện gợi ý (dùng chung cho bài học & luyện tập)
  function wireHint(card, q) {
    const b = card.querySelector("[data-hint]");
    if (!b) return;
    b.onclick = () => {
      const host = card.querySelector(".hint-host");
      if (host) host.innerHTML = hintHtml(q);
      b.disabled = true; b.textContent = "💡 Đã xem gợi ý";
    };
  }

  // Lời giải đầy đủ (kèm "Đáp số" cho câu tự luận)
  function solutionFullHtml(q) {
    let html = solutionHtml(q);
    if (q.final) html += `<div class="final-ans"><b>Đáp số:</b> ${esc(q.final)}</div>`;
    return html;
  }

  /* Chấm chung cho khu Tư duy & Luyện tập cá nhân hoá.
     Hỗ trợ 'mc', 'fill' (tự chấm) và 'open' (tự đánh giá). Gọi onGraded(correct). */
  function wireGeneric(card, q, topic, onGraded) {
    const solHost = card.querySelector(".sol-host");
    let done = false;
    const finish = (correct) => {
      if (done) return; done = true;
      S.recordTopic(topic, correct);
      if (correct) gain(E.EXP.quizCorrect);
      onGraded && onGraded(correct);
    };
    wireHint(card, q);

    if (q.type === "mc") {
      const opts = $$(".opt", card);
      opts.forEach(btn => btn.onclick = () => {
        if (card.dataset.locked) return; card.dataset.locked = "1";
        const k = Number(btn.getAttribute("data-opt"));
        const ok = E.checkMc(k, q);
        btn.classList.add(ok ? "correct" : "wrong", "selected");
        if (!ok) opts[q.answer].classList.add("correct");
        opts.forEach(o => o.classList.add("locked"));
        solHost.innerHTML = solutionFullHtml(q);
        finish(ok);
      });
    } else if (q.type === "fill") {
      const input = card.querySelector("[data-fill]");
      const check = card.querySelector("[data-check]");
      const doCheck = () => {
        if (card.dataset.locked) return; card.dataset.locked = "1";
        const ok = E.checkFill(input.value, q);
        input.classList.add(ok ? "correct" : "wrong");
        input.disabled = true; check.disabled = true;
        if (!ok) solHost.insertAdjacentHTML("afterbegin",
          '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
        solHost.insertAdjacentHTML("beforeend", solutionFullHtml(q));
        finish(ok);
      };
      check.onclick = doCheck;
      input.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
    } else if (q.type === "open") {
      const reveal = card.querySelector("[data-reveal]");
      reveal.onclick = () => {
        if (card.dataset.revealed) return; card.dataset.revealed = "1";
        reveal.disabled = true;
        solHost.innerHTML = solutionFullHtml(q) + `
          <div class="self-rate">
            <div class="sr-q">Em tự đánh giá bài làm của mình:</div>
            <div class="sr-btns">
              <button class="btn ghost sm" data-rate="miss">😅 Chưa được</button>
              <button class="btn ghost sm" data-rate="part">🙂 Một phần</button>
              <button class="btn sm" data-rate="ok">💪 Làm được</button>
            </div>
          </div>`;
        $$("[data-rate]", card).forEach(b => b.onclick = () => {
          const r = b.getAttribute("data-rate");
          $$("[data-rate]", card).forEach(x => { x.disabled = true; });
          b.classList.add("chosen");
          if (r === "ok") finish(true);
          else if (r === "part") { S.recordTopic(topic, true); finish(false); }
          else finish(false);
        });
      };
    }
  }

  function wireQuestion(q, i, diff, state, L) {
    const card = $('.q-card[data-q="' + i + '"]');
    const solHost = card.querySelector(".sol-host");
    wireHint(card, q);

    function finished(correct) {
      state.answered++;
      S.recordTopic(L && L.id, correct);
      noteMistake(q, correct, { source: "hoc", lessonId: L && L.id, label: L && L.title });
      if (correct) {
        state.correct++;
        if (!state.awarded[i]) { state.awarded[i] = 1; gain(E.EXP.quizCorrect); }
      }
      solHost.innerHTML = solutionHtml(q);
      if (state.answered === state.total) onSetComplete(diff, state, L);
    }

    if (q.type === "mc") {
      const opts = $$(".opt", card);
      opts.forEach(btn => btn.onclick = () => {
        if (card.dataset.locked) return;
        card.dataset.locked = "1";
        const k = Number(btn.getAttribute("data-opt"));
        const ok = E.checkMc(k, q);
        btn.classList.add(ok ? "correct" : "wrong", "selected");
        if (!ok) opts[q.answer].classList.add("correct");
        opts.forEach(o => o.classList.add("locked"));
        finished(ok);
      });
    } else if (q.type === "fill") {
      const input = card.querySelector("[data-fill]");
      const check = card.querySelector("[data-check]");
      const doCheck = () => {
        if (card.dataset.locked) return;
        card.dataset.locked = "1";
        const ok = E.checkFill(input.value, q);
        input.classList.add(ok ? "correct" : "wrong");
        input.disabled = true; check.disabled = true;
        if (!ok) solHost.insertAdjacentHTML("afterbegin",
          '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
        finished(ok);
      };
      check.onclick = doCheck;
      input.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
    } else if (q.type === "match") {
      let pick = null, done = 0;
      $$(".match-item", card).forEach(it => it.onclick = () => {
        if (it.classList.contains("matched")) return;
        const side = it.getAttribute("data-side");
        if (side === "L") {
          $$('.match-item[data-side="L"]', card).forEach(x => x.classList.remove("picked"));
          it.classList.add("picked"); pick = it;
        } else if (pick) {
          if (pick.getAttribute("data-k") === it.getAttribute("data-k")) {
            pick.classList.remove("picked"); pick.classList.add("matched"); it.classList.add("matched");
            pick = null; done++;
            if (done === q.pairs.length) finished(true);
          } else {
            it.classList.add("wrong"); setTimeout(() => it.classList.remove("wrong"), 400);
          }
        }
      });
    }
  }

  function onSetComplete(diff, state, L) {
    S.recordQuiz(L.id, diff, state.correct, state.total);
    if (S.setStepDone(L.id, 5)) gain(E.EXP.step);
    checkBadges();
    const finish = $("#lesson-finish");
    if (finish) finish.innerHTML = `<div class="feedback good mt">
        <h4>✅ Hoàn thành ${state.correct}/${state.total} câu mức ${diff === "easy" ? "Dễ" : diff === "medium" ? "Trung bình" : "Nâng cao"}</h4>
        <p style="margin:4px 0 12px">Em đã đi hết 5 bước của bài này. Đánh dấu hoàn thành để mở bài tiếp theo nhé!</p>
        <button class="btn lg" id="btn-complete">🎉 Hoàn thành bài học</button>
      </div>`;
    const bc = $("#btn-complete");
    if (bc) bc.onclick = () => {
      if (S.setLessonDone(L.id)) { gain(E.EXP.lessonDone); S.log("lesson", L.title); }
      // nạp flashcard của bài vào SRS (đến hạn ngay để ôn)
      (L.flashcards || []).forEach((c, idx) => { if (!S.srsGet(L.id + "#" + idx)) S.srsSet(L.id + "#" + idx, 0, S.dateStr()); });
      E.confetti(); checkBadges(); refreshChrome();
      E.toast('<span class="t-ic">🏆</span> Đã hoàn thành <b>' + esc(L.title) + "</b>!");
      setTimeout(() => go("#/lo-trinh"), 900);
    };
  }

  /* =======================================================================
     VIEW: FLASHCARD
     ===================================================================== */
  function buildDeck(lessonId) {
    const deck = [];
    const src = lessonId && lessonId !== "all" ? [D.lessons[lessonId]] : allLessons();
    src.forEach(L => (L.flashcards || []).forEach((c, i) => deck.push({ key: L.id + "#" + i, front: c.front, back: c.back, lesson: L.title })));
    return deck;
  }

  function renderFlashcards(lessonId) {
    lessonId = lessonId || "all";
    const pills = ['<button class="pill ' + (lessonId === "all" ? "green" : "") + '" data-deck="all">Tất cả</button>']
      .concat(allLessons().map(L => '<button class="pill ' + (lessonId === L.id ? "green" : "") + '" data-deck="' + L.id + '">' + L.emoji + " " + esc(L.title) + "</button>")).join(" ");

    setView(`<div class="section-title"><span class="ic">🃏</span><h2>Flashcard — ôn nhanh</h2></div>
      <p class="soft mb">Nhìn câu hỏi, tự trả lời trong đầu rồi lật thẻ để kiểm tra. Bấm "Đã nhớ / Chưa nhớ" để hệ thống tự xếp lịch ôn lại.</p>
      <div class="row mb" style="gap:8px">${pills}</div>
      <div id="flash-host"></div>`);

    $$("[data-deck]").forEach(b => b.onclick = () => go("#/flashcard/" + b.getAttribute("data-deck")));
    runDeck(buildDeck(lessonId), $("#flash-host"), false);
  }

  function runDeck(deck, host, dueOnly) {
    if (!deck.length) {
      host.innerHTML = '<div class="empty-state"><div class="e-emoji">🎉</div>' +
        (dueOnly ? "Không có thẻ nào đến hạn ôn. Quay lại sau nhé!" : "Chưa có thẻ. Hãy học một bài trước.") + "</div>";
      return;
    }
    let idx = 0, flipped = false;
    function show() {
      const c = deck[idx];
      host.innerHTML = `
        <p class="soft text-c mb">Thẻ ${idx + 1} / ${deck.length} · <b>${esc(c.lesson)}</b></p>
        <div class="flash-scene"><div class="flash" id="card">
          <div class="flash-face flash-front"><div class="f-label">Câu hỏi</div><div class="f-text">${esc(c.front)}</div></div>
          <div class="flash-face flash-back"><div class="f-label">Trả lời</div><div class="f-text">${esc(c.back)}</div></div>
        </div></div>
        <p class="flash-hint">👆 Bấm vào thẻ để lật</p>
        <div class="srs-actions">
          <button class="btn ghost lg" data-srs="0">😕 Chưa nhớ</button>
          <button class="btn lg" data-srs="1">😀 Đã nhớ</button>
        </div>`;
      flipped = false;
      const card = $("#card", host);
      card.onclick = () => { flipped = !flipped; card.classList.toggle("flipped", flipped); };
      $$("[data-srs]", host).forEach(b => b.onclick = () => {
        const ok = b.getAttribute("data-srs") === "1";
        E.review(c.key, ok);
        S.log("flashcard", c.key);
        gain(E.EXP.flashcard);
        refreshChrome();
        idx++;
        if (idx >= deck.length) {
          host.innerHTML = '<div class="empty-state"><div class="e-emoji">🌟</div>Xong! Em đã ôn ' + deck.length + ' thẻ. Tuyệt vời!</div>';
          E.confetti();
        } else show();
      });
    }
    show();
  }

  /* =======================================================================
     VIEW: ÔN TẬP (SRS đến hạn)
     ===================================================================== */
  function renderReview() {
    const keys = S.srsDueKeys();
    const deck = keys.map(k => {
      const [lid, i] = k.split("#");
      const L = D.lessons[lid];
      const c = L && L.flashcards && L.flashcards[Number(i)];
      return c ? { key: k, front: c.front, back: c.back, lesson: L.title } : null;
    }).filter(Boolean);

    setView(`<div class="section-title"><span class="ic">🔁</span><h2>Ôn tập đến hạn</h2></div>
      <p class="soft mb">Những thẻ này được lên lịch ôn lại đúng lúc em sắp quên — cách nhớ lâu nhất (lặp lại ngắt quãng 1·3·7·14·30 ngày).</p>
      <div id="flash-host"></div>`);
    runDeck(deck, $("#flash-host"), true);
  }

  /* =======================================================================
     VIEW: AI MENTOR
     ===================================================================== */
  const SUGGESTS = ["Tại sao phải học hàm số?", "Làm sao đo chiều cao cây?", "Δ dùng để làm gì?", "Mình hay ghét toán, học sao đây?", "Xác suất là gì?"];

  function renderMentor() {
    const live = aiReady();
    setView(`<div class="section-title"><span class="ic">🤖</span><h2>AI Mentor</h2></div>
      ${live
        ? '<div class="ai-banner on">🟢 Đang dùng <b>ChatGPT thật</b> (' + esc(S.aiGet().model || "gpt-4o-mini") + ') — cô giáo AI hiểu cả phần em còn yếu.</div>'
        : '<div class="ai-banner">⚪ Đang ở chế độ <b>ngoại tuyến</b> (câu trả lời soạn sẵn). Muốn trò chuyện với ChatGPT thật? <button class="btn sm" id="ai-setup">Cài khoá API →</button></div>'}
      <div class="card chat-wrap">
        <div class="chat-log" id="log"></div>
        <div class="suggest-row" id="suggests">${SUGGESTS.map(s => '<button class="suggest">' + esc(s) + "</button>").join("")}</div>
        <div class="chat-input">
          <input id="chat-in" placeholder="Hỏi bất cứ điều gì về Toán 9…" autocomplete="off">
          <button class="btn" id="chat-send">Gửi</button>
        </div>
      </div>`);
    const log = $("#log");
    const setup = $("#ai-setup"); if (setup) setup.onclick = () => go("#/cai-dat");
    const history = [];
    let waiting = false;

    push("bot", live
      ? "Chào em! Cô là AI Mentor 🤖 (ChatGPT). Em hỏi bài, nhờ gợi ý bài tập, hay bảo cô giải thích lại phần nào chưa hiểu đều được nhé!"
      : "Chào em! Mình là AI Mentor 🤖. Mình giúp em hiểu <b>vì sao</b> phải học mỗi thứ, bằng ví dụ đời thực. Em cứ hỏi thoải mái nhé!");

    function push(who, html) {
      const av = who === "bot" ? "🤖" : "🙂";
      log.insertAdjacentHTML("beforeend",
        `<div class="msg ${who}"><div class="av">${av}</div><div class="bubble">${html}</div></div>`);
      log.scrollTop = log.scrollHeight;
      return log.lastElementChild;
    }

    async function ask(text) {
      text = (text || "").trim();
      if (!text || waiting) return;
      push("me", esc(text));
      $("#chat-in").value = "";
      if (!live) { setTimeout(() => push("bot", E.askMentor(text)), 350); return; }

      waiting = true;
      const tEl = push("bot", '<span class="typing"><span></span><span></span><span></span></span>');
      history.push({ role: "user", content: text });
      try {
        const reply = await aiChat(
          [{ role: "system", content: aiSystemPrompt() }].concat(history.slice(-12))
        );
        history.push({ role: "assistant", content: reply });
        tEl.querySelector(".bubble").innerHTML = aiToHtml(reply);
      } catch (e) {
        tEl.querySelector(".bubble").innerHTML =
          "⚠️ " + esc(aiErrMsg(e)) + "<br><span class='soft' style='font-size:12.5px'>Tạm thời cô trả lời ngoại tuyến:</span><br>" + E.askMentor(text);
      }
      waiting = false;
      log.scrollTop = log.scrollHeight;
    }

    $("#chat-send").onclick = () => ask($("#chat-in").value);
    $("#chat-in").addEventListener("keydown", e => { if (e.key === "Enter") ask(e.target.value); });
    $$("#suggests .suggest").forEach(b => b.onclick = () => ask(b.textContent));
  }

  /* =======================================================================
     VIEW: THÀNH TÍCH
     ===================================================================== */
  function renderAchievements() {
    const lv = E.levelInfo(S.state.exp);
    const badges = E.BADGES.map(b => {
      const on = S.hasBadge(b.id);
      return `<div class="badge ${on ? "unlocked" : "locked"}">
          <div class="b-emoji">${b.emoji}</div><h4>${esc(b.name)}</h4><p>${esc(b.desc)}</p>
        </div>`;
    }).join("");

    setView(`<div class="section-title"><span class="ic">🏆</span><h2>Thành tích</h2></div>
      <div class="card mb">
        <div class="level-bar">
          <div class="level-medal">${lv.level}</div>
          <div style="flex:1">
            <div class="row between"><b>Level ${lv.level} · ${esc(lv.title)}</b>
              <span class="soft">${lv.cur}/${lv.need} EXP</span></div>
            <div class="progress mt-sm"><span style="width:${lv.pct}%"></span></div>
          </div>
        </div>
      </div>
      <div class="grid cols-3 mb">
        <div class="card text-c"><div class="stat-num" style="color:var(--accent-deep)">${S.effectiveStreak()} 🔥</div><div class="stat-lbl">Chuỗi hiện tại</div></div>
        <div class="card text-c"><div class="stat-num" style="color:var(--gold)">${S.state.streak.longest}</div><div class="stat-lbl">Chuỗi dài nhất</div></div>
        <div class="card text-c"><div class="stat-num" style="color:var(--brand)">${S.lessonsDoneCount()}</div><div class="stat-lbl">Bài hoàn thành</div></div>
      </div>
      <div class="section-title"><span class="ic">🎖️</span><h2>Huy hiệu (${S.state.badges.length}/${E.BADGES.length})</h2></div>
      <div class="badge-grid">${badges}</div>`);
  }

  /* =======================================================================
     VIEW: CÀI ĐẶT
     ===================================================================== */
  function renderSettings() {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    const goals = S.getGoals();
    const rem = S.getReminder();
    setView(`<div class="section-title"><span class="ic">⚙️</span><h2>Cài đặt</h2></div>
      <div class="card">
        <div class="setting-row">
          <div class="s-text"><b>Chế độ tối 🌙</b><span>Dịu mắt khi học buổi đêm.</span></div>
          <div class="switch ${dark ? "on" : ""}" id="sw-dark"></div>
        </div>
        <div class="setting-row">
          <div class="s-text"><b>Mục tiêu mỗi ngày</b><span>Số phút học mỗi ngày.</span></div>
          <div class="tabs" id="goal-min">
            ${[15, 30, 45].map(m => '<div class="tab ' + (goals.min === m ? "active" : "") + '" data-m="' + m + '">' + m + "'</div>").join("")}
          </div>
        </div>
        <div class="setting-row">
          <div class="s-text"><b>Mục tiêu mỗi tuần</b><span>Số ngày học trong tuần.</span></div>
          <div class="tabs" id="goal-days">
            ${[3, 5, 7].map(d => '<div class="tab ' + (goals.days === d ? "active" : "") + '" data-d="' + d + '">' + d + " ngày</div>").join("")}
          </div>
        </div>
      </div>

      <div class="section-title mt"><span class="ic">🔊</span><h2>Giọng giảng bài</h2></div>
      <div class="card">
        <div class="setting-row">
          <div class="s-text"><b>Xưng hô</b><span>Giọng đọc tự xưng là Cô hay Thầy khi giảng.</span></div>
          <div class="tabs" id="tts-persona">
            <div class="tab ${S.ttsGet().persona !== "thay" ? "active" : ""}" data-p="co">👩‍🏫 Cô</div>
            <div class="tab ${S.ttsGet().persona === "thay" ? "active" : ""}" data-p="thay">👨‍🏫 Thầy</div>
          </div>
        </div>
        <div class="setting-row">
          <div class="s-text"><b>Tốc độ đọc</b><span>Chậm để nghe kĩ, nhanh để ôn lại.</span></div>
          <div class="tabs" id="tts-rate">
            ${[["Chậm",0.85],["Vừa",1],["Nhanh",1.15]].map(x => '<div class="tab ' + (Math.abs((S.ttsGet().rate||1)-x[1])<0.01 ? "active" : "") + '" data-r="' + x[1] + '">' + x[0] + "</div>").join("")}
          </div>
        </div>
        <div class="setting-row">
          <div class="s-text"><b>Giọng đọc</b><span>Chọn giọng tiếng Việt có trên thiết bị (nếu có nhiều).</span></div>
          <select id="tts-voice" class="psel" style="max-width:220px"><option value="">Tự động</option></select>
        </div>
        <p id="tts-status" class="soft" style="font-size:13px;margin:2px 0 8px">Đang kiểm tra giọng đọc…</p>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn ghost" id="tts-try" style="flex:1">🔊 Nghe thử</button>
          <button class="btn ghost" id="tts-guide-open" style="flex:1">📖 Cài giọng Việt miễn phí</button>
        </div>
        <p class="soft mt-sm" style="font-size:12.5px">Mẹo Windows: mở app bằng <b>Microsoft Edge</b> để có ngay giọng tiếng Việt tự nhiên (HoaiMy/NamMinh) — miễn phí, không cần cài gì.</p>
      </div>

      <div class="section-title mt"><span class="ic">🤖</span><h2>AI Mentor (ChatGPT)</h2></div>
      <div class="card">
        <p class="soft" style="font-size:13px;margin:0 0 10px">Dán <b>khoá API của OpenAI</b> để mở khoá: trò chuyện tự do với cô giáo AI ở mục Mentor và nhờ AI <b>chấm bài tự luận</b>. Khoá chỉ lưu trên máy này, không gửi đi đâu khác ngoài OpenAI, và <b>không nằm trong tệp sao lưu</b>.</p>
        <div class="setting-row">
          <div class="s-text"><b>Khoá API</b><span>Lấy tại platform.openai.com → API keys (bắt đầu bằng sk-…). Dùng model rẻ thì vài trăm câu hỏi chỉ tốn cỡ vài nghìn đồng.</span></div>
          <input type="password" id="ai-key" class="psel" style="max-width:230px" placeholder="sk-…" value="${esc(S.aiGet().key || "")}" autocomplete="off">
        </div>
        <div class="setting-row">
          <div class="s-text"><b>Model</b><span>gpt-4o-mini: rẻ & nhanh (khuyên dùng). gpt-4o: thông minh hơn, đắt hơn.</span></div>
          <select id="ai-model" class="psel" style="max-width:190px">
            ${AI_MODELS.map(m => '<option value="' + m + '" ' + ((S.aiGet().model || "gpt-4o-mini") === m ? "selected" : "") + ">" + m + "</option>").join("")}
          </select>
        </div>
        <p id="ai-status" class="soft" style="font-size:13px;margin:2px 0 8px">${aiReady() ? "🟢 Đã có khoá — AI Mentor đang bật." : "⚪ Chưa có khoá — Mentor dùng câu trả lời soạn sẵn."}</p>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button class="btn" id="ai-save" style="flex:1">💾 Lưu</button>
          <button class="btn ghost" id="ai-test" style="flex:1">🔌 Kiểm tra kết nối</button>
          <button class="btn ghost" id="ai-clear">🗑 Xoá khoá</button>
        </div>
        <p class="soft mt-sm" style="font-size:12px">Lưu ý an toàn: không chia sẻ khoá cho người khác; nên đặt <b>hạn mức chi tiêu</b> trong tài khoản OpenAI (Billing → Limits).</p>
      </div>

      <div class="section-title mt"><span class="ic">👥</span><h2>Thành viên & Sao lưu</h2></div>
      <div class="card">
        <div class="setting-row">
          <div class="s-text"><b>Thành viên (${S.profilesList().length}/3)</b><span>Đang dùng: ${S.currentProfile().emoji} ${esc(S.currentProfile().name)}. Mỗi người có tiến độ riêng.</span></div>
          <button class="btn" id="prof-manage">Đổi / Thêm</button>
        </div>
        <div class="setting-row">
          <div class="s-text"><b>Sao lưu & chuyển máy</b><span>Xuất tệp tiến độ để gửi Zalo / mở trên điện thoại, rồi Nhập ở máy kia.</span></div>
          <div class="row" style="gap:7px">
            <button class="btn ghost sm" id="bk-export">⬇️ Xuất tệp</button>
            <button class="btn ghost sm" id="bk-import">⬆️ Nhập tệp</button>
            <input type="file" id="bk-file" accept=".json,application/json" hidden>
          </div>
        </div>
      </div>

      <div class="section-title mt"><span class="ic">👨‍👩‍👧</span><h2>Phụ huynh & giao bài</h2></div>
      <div class="card">
        <div class="setting-row">
          <div class="s-text"><b>Góc phụ huynh</b><span>Giao bài bắt buộc, theo dõi tiến độ học của con và đặt mã PIN bảo vệ.</span></div>
          <button class="btn" id="go-parent">Mở</button>
        </div>
      </div>

      <div class="section-title mt"><span class="ic">🔁</span><h2>Duy trì thói quen</h2></div>
      <div class="card">
        <div class="setting-row">
          <div class="s-text"><b>Nhắc học theo lịch tuần ⏰</b><span>Chọn giờ cho từng ngày để né lịch học các môn khác. Đến giờ (khi app đang mở) sẽ hiện lời nhắc; đã học đủ mục tiêu thì không nhắc nữa.</span></div>
          <div class="switch ${rem.enabled ? "on" : ""}" id="sw-remind"></div>
        </div>
        <div class="remind-week" id="remind-week">
          ${["CN","T2","T3","T4","T5","T6","T7"].map((lb, d) => `
            <div class="rw-day ${rem.times[d] ? "on" : ""}" data-d="${d}">
              <button class="rw-toggle" data-rw="${d}">${lb}</button>
              <input type="time" class="time-input rw-time" data-rt="${d}" value="${rem.times[d] || "19:00"}" ${rem.times[d] ? "" : "disabled"}>
            </div>`).join("")}
        </div>
        <div class="setting-row">
          <div class="s-text"><b>🧊 Bùa giữ chuỗi: <span id="freeze-num">${S.getFreezes()}</span></b><span>Lỡ một ngày, hệ thống tự dùng Bùa để chuỗi không bị đứt. Kiếm thêm bằng cách hoàn thành nhiệm vụ hằng ngày và đạt mục tiêu tuần.</span></div>
          <button class="btn ghost sm" id="enable-notif">Bật thông báo</button>
        </div>
      </div>

      <div class="card mt">
        <div class="setting-row">
          <div class="s-text"><b>Xoá toàn bộ dữ liệu</b><span>Đặt lại tiến độ, điểm, streak về 0. Không thể hoàn tác.</span></div>
          <button class="btn ghost" id="reset">Đặt lại</button>
        </div>
      </div>
      <p class="soft mt" style="font-size:13px">Mọi dữ liệu chỉ lưu trên trình duyệt của em (LocalStorage) — không gửi đi đâu cả.<br />Phiên bản: <b>${APP_VERSION}</b></p>`);

    $("#sw-dark").onclick = () => {
      const nowDark = document.documentElement.getAttribute("data-theme") !== "dark";
      applyTheme(nowDark ? "dark" : "light", true);
      $("#sw-dark").classList.toggle("on", nowDark);
    };
    $$("#goal-min .tab").forEach(t => t.onclick = () => {
      S.setGoals(Number(t.getAttribute("data-m")), null);
      $$("#goal-min .tab").forEach(x => x.classList.remove("active")); t.classList.add("active");
    });
    $$("#goal-days .tab").forEach(t => t.onclick = () => {
      S.setGoals(null, Number(t.getAttribute("data-d")));
      $$("#goal-days .tab").forEach(x => x.classList.remove("active")); t.classList.add("active");
    });
    $("#sw-remind").onclick = () => {
      const on = !S.getReminder().enabled;
      S.setReminder(on, null);
      $("#sw-remind").classList.toggle("on", on);
      if (on) E.toast('<span class="t-ic">⏰</span> Đã bật nhắc học hằng ngày.');
    };
    $("#remind-time") && ($("#remind-time").onchange = e => { S.setReminder(null, e.target.value); });
    $$("#remind-week .rw-toggle").forEach(b => b.onclick = () => {
      const d = b.getAttribute("data-rw");
      const inp = $('.rw-time[data-rt="' + d + '"]');
      const row = b.closest(".rw-day");
      const nowOn = !row.classList.contains("on");
      row.classList.toggle("on", nowOn);
      inp.disabled = !nowOn;
      S.setReminderDay(Number(d), nowOn ? (inp.value || "19:00") : "");
    });
    $$("#remind-week .rw-time").forEach(inp => inp.onchange = () => {
      const d = Number(inp.getAttribute("data-rt"));
      if (!inp.disabled) S.setReminderDay(d, inp.value);
    });
    const gp = $("#go-parent"); if (gp) gp.onclick = () => go("#/phu-huynh");
    // Giọng giảng bài
    $$("#tts-persona .tab").forEach(t => t.onclick = () => {
      S.ttsSet({ persona: t.getAttribute("data-p") });
      $$("#tts-persona .tab").forEach(x => x.classList.remove("active")); t.classList.add("active");
    });
    $$("#tts-rate .tab").forEach(t => t.onclick = () => {
      S.ttsSet({ rate: Number(t.getAttribute("data-r")) });
      $$("#tts-rate .tab").forEach(x => x.classList.remove("active")); t.classList.add("active");
    });
    const vsel = $("#tts-voice");
    function fillVoices() {
      const cur = S.ttsGet().voice || "";
      const vs = ttsVoices();
      vsel.innerHTML = '<option value="">Tự động</option>' +
        vs.map(v => `<option value="${esc(v.voiceURI || v.name)}" ${((v.voiceURI||v.name)===cur)?"selected":""}>${esc(v.name)} (${esc(v.lang)})</option>`).join("");
    }
    function ttsStatusSync() {
      const st = $("#tts-status"); if (!st) return;
      if (!TTS.ok) { st.innerHTML = "⚠️ Trình duyệt này không hỗ trợ giọng đọc."; return; }
      const vs = ttsVoices();
      st.innerHTML = vs.length
        ? "✅ Giọng tiếng Việt: <b>" + esc(vs[0].name) + "</b>" + (vs.length > 1 ? " (+" + (vs.length - 1) + " giọng khác)" : "")
        : "⚠️ <b>Chưa có giọng tiếng Việt</b> trên thiết bị — bấm \"Cài giọng Việt miễn phí\" để xem hướng dẫn.";
    }
    if (TTS.ok) {
      ttsEnsureVoices(() => { fillVoices(); ttsStatusSync(); });
      try { window.speechSynthesis.onvoiceschanged = () => { fillVoices(); ttsStatusSync(); }; } catch (e) {}
    } else { ttsStatusSync(); }
    $("#tts-guide-open").onclick = showTtsGuide;
    vsel.onchange = () => S.ttsSet({ voice: vsel.value });
    $("#tts-try").onclick = () => ttsToggle("Chúng ta cùng học Toán 9 nhé. Ví dụ: căn bậc hai của 25 bằng 5, vì 5 bình phương bằng 25.", $("#tts-try"));
    // Thành viên & sao lưu
    // AI Mentor
    const aiStatus = $("#ai-status");
    $("#ai-save").onclick = () => {
      S.aiSet({ key: ($("#ai-key").value || "").trim(), model: $("#ai-model").value });
      aiStatus.textContent = aiReady() ? "🟢 Đã lưu khoá — AI Mentor đang bật." : "⚪ Đã xoá khoá — Mentor về chế độ soạn sẵn.";
      E.toast('<span class="t-ic">🤖</span> Đã lưu cài đặt AI.');
    };
    $("#ai-clear").onclick = () => {
      $("#ai-key").value = "";
      S.aiSet({ key: "" });
      aiStatus.textContent = "⚪ Đã xoá khoá — Mentor về chế độ soạn sẵn.";
    };
    $("#ai-test").onclick = async () => {
      S.aiSet({ key: ($("#ai-key").value || "").trim(), model: $("#ai-model").value });
      if (!aiReady()) { aiStatus.textContent = "⚪ Chưa nhập khoá."; return; }
      const btn = $("#ai-test"); btn.disabled = true; aiStatus.textContent = "⏳ Đang kiểm tra…";
      try {
        const r = await aiChat([{ role: "user", content: "Trả lời đúng 2 chữ: 'Kết nối OK'" }]);
        aiStatus.textContent = "🟢 Kết nối thành công! AI trả lời: " + r.slice(0, 60);
      } catch (e) {
        aiStatus.textContent = "🔴 " + aiErrMsg(e);
      }
      btn.disabled = false;
    };
    $("#prof-manage").onclick = showProfilePicker;
    $("#bk-export").onclick = downloadBackup;
    const bkFile = $("#bk-file");
    $("#bk-import").onclick = () => bkFile.click();
    bkFile.onchange = () => {
      const f = bkFile.files && bkFile.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        const r = S.importState(fr.result);
        if (!r.ok) { E.toast("⚠️ " + r.msg); return; }
        E.toast('<span class="t-ic">✅</span> Đã nhập tiến độ — đang tải lại…');
        setTimeout(reloadApp, 600);
      };
      fr.readAsText(f);
    };
    $("#enable-notif").onclick = () => {
      try {
        if (!window.Notification) { E.toast("Trình duyệt không hỗ trợ thông báo."); return; }
        Notification.requestPermission().then(p => {
          E.toast(p === "granted" ? '<span class="t-ic">🔔</span> Đã bật thông báo trình duyệt.' : "Chưa cấp quyền thông báo.");
        });
      } catch (err) { E.toast("Không bật được thông báo."); }
    };
    $("#reset").onclick = () => {
      if (confirm("Xoá toàn bộ tiến độ và bắt đầu lại? Hành động này không thể hoàn tác.")) {
        S.resetAll(); refreshChrome();
        E.toast('<span class="t-ic">🧹</span> Đã đặt lại dữ liệu.');
        go("#/dashboard"); route();
      }
    };
  }

  /* =======================================================================
     VIEW: GÓC PHỤ HUYNH (giao bài + theo dõi)
     ===================================================================== */
  let parentUnlocked = false;

  function renderParentPin() {
    setView(`<div class="section-title"><span class="ic">🔒</span><h2>Góc phụ huynh</h2></div>
      <div class="card" style="max-width:380px">
        <p class="soft mb">Nhập mã PIN của phụ huynh để xem khu vực này.</p>
        <input type="password" inputmode="numeric" id="pin-enter" class="time-input" placeholder="Mã PIN" style="width:100%;box-sizing:border-box">
        <button class="btn block mt" id="pin-go">Mở khoá</button>
        <button class="btn ghost block mt-sm" id="pin-back">⟵ Quay lại</button>
      </div>`);
    const submit = () => {
      if (S.assignVerifyPin($("#pin-enter").value)) { parentUnlocked = true; renderParent(); }
      else E.toast("Sai mã PIN. Thử lại nhé.");
    };
    $("#pin-go").onclick = submit;
    $("#pin-enter").addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    $("#pin-back").onclick = () => go("#/cai-dat");
  }

  function renderParent() {
    const A = S.assignGet();
    if (A.pin && !parentUnlocked) { renderParentPin(); return; }

    const wk = S.calendarLast(7);
    const goal = S.getGoals().min;
    const maxMin = Math.max(goal, ...wk.map(d => d.minutes), 1);
    const dows = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const chart = wk.map(d => {
      const h = Math.max(5, Math.round(d.minutes / maxMin * 100));
      const dow = dows[new Date(d.date).getDay()];
      return `<div class="pbar-col"><div class="pbar-val">${d.minutes}'</div>
        <div class="pbar ${d.state}" style="height:${h}%"></div>
        <div class="pbar-day ${d.isToday ? "today" : ""}">${dow}</div></div>`;
    }).join("");
    const weekMin = wk.reduce((s, d) => s + d.minutes, 0);

    const totalLessons = allLessons().length;
    const doneLessons = S.lessonsDoneCount();
    const pracTotal = D.practice.weeks.length;
    const pracPassed = S.practiceDoneCount();

    // bài đã giao
    const tasks = A.tasks;
    const taskList = tasks.length ? tasks.map((t, i) => {
      const done = S.taskDone(t);
      return `<div class="assign-item ${done ? "done" : ""}">
        <div class="ai-ic">${done ? "✅" : (t.type === "practice" ? "📒" : "📖")}</div>
        <div class="ai-main"><b>${esc(t.label)}</b><span class="ai-sub">${t.type === "practice" ? "Luyện tập" : "Bài học"} · ${done ? "đã xong" : "chưa xong"}</span></div>
        <button class="btn ghost sm" data-del="${i}">Bỏ</button></div>`;
    }).join("") : '<p class="soft">Chưa giao bài nào. Hãy chọn bài học hoặc bộ luyện tập bên dưới để giao cho con.</p>';

    const lessonOpts = D.chapters.map(c => {
      const items = c.lessons.filter(id => D.lessons[id]).map(id => `<option value="${id}">${esc(D.lessons[id].title)}</option>`).join("");
      return items ? `<optgroup label="${esc(c.name)}">${items}</optgroup>` : "";
    }).join("");
    const byTerm = {};
    D.practice.weeks.forEach(w => { (byTerm[w.term] = byTerm[w.term] || []).push(w); });
    const practiceOpts = Object.keys(byTerm).map(term =>
      `<optgroup label="${esc(term)}">${byTerm[term].map(w => `<option value="${w.id}">${esc(w.tag)}: ${esc(w.title)}</option>`).join("")}</optgroup>`).join("");

    // hoạt động gần đây
    const ICON = { lesson: "📖", practice: "📒", badge: "🎖️", "arena-win": "⚔️", "freeze-used": "🧊", "freeze-earned": "🧊" };
    const TXT = {
      lesson: i => "Hoàn thành bài: " + i, practice: i => "Luyện tập: " + i, badge: i => "Mở huy hiệu: " + i,
      "arena-win": () => "Thắng một trận Đấu trường", "freeze-used": () => "Dùng Bùa giữ chuỗi", "freeze-earned": () => "Nhận thêm Bùa giữ chuỗi"
    };
    const ago = t => {
      const s = (Date.now() - t) / 1000;
      if (s < 60) return "vừa xong";
      if (s < 3600) return Math.floor(s / 60) + " phút trước";
      if (s < 86400) return Math.floor(s / 3600) + " giờ trước";
      if (s < 2592000) return Math.floor(s / 86400) + " ngày trước";
      return new Date(t).toLocaleDateString("vi-VN");
    };
    const feed = (S.state.history || []).filter(h => TXT[h.type]).slice(0, 14).map(h =>
      `<div class="act-item"><span class="act-ic">${ICON[h.type] || "•"}</span>
        <div class="act-main"><div>${esc(TXT[h.type](h.info))}</div><div class="act-time">${ago(h.t)}</div></div></div>`
    ).join("") || '<p class="soft">Chưa có hoạt động nào. Khi con học, mọi hoạt động sẽ hiện ở đây.</p>';

    setView(`
      <div class="row between">
        <div class="section-title"><span class="ic">👨‍👩‍👧</span><h2>Góc phụ huynh</h2></div>
        <button class="btn ghost sm" id="par-back">⟵ Về app của con</button>
      </div>
      <p class="soft mb">Khu vực để bố mẹ <b>giao bài</b> và <b>theo dõi</b> con học — giúp con tạo thói quen đều đặn. Dữ liệu nằm trên thiết bị này.</p>

      <div class="grid cols-3 mb">
        <div class="card text-c"><div class="stat-num" style="color:var(--accent-deep)">${S.effectiveStreak()} 🔥</div><div class="stat-lbl">Chuỗi ngày học</div></div>
        <div class="card text-c"><div class="stat-num" style="color:var(--brand)">${doneLessons}/${totalLessons}</div><div class="stat-lbl">Bài đã hoàn thành</div></div>
        <div class="card text-c"><div class="stat-num" style="color:var(--violet-500,#8b5cf6)">${pracPassed}/${pracTotal}</div><div class="stat-lbl">Bộ luyện tập đạt</div></div>
      </div>

      <div class="card">
        <div class="section-title"><span class="ic">📊</span><h2>Số phút học 7 ngày qua</h2></div>
        <div class="pchart">${chart}</div>
        <p class="soft mt-sm" style="font-size:13px">Tổng tuần: <b>${weekMin} phút</b> · mục tiêu mỗi ngày: <b>${goal} phút</b>. Cột xanh = đạt mục tiêu ngày đó.</p>
        <button class="btn ghost sm mt-sm" id="par-report">📋 Xuất báo cáo tuần (gửi Zalo)</button>
      </div>
      ${reportCardHtml("parrep")}

      <div class="card mt">
        <div class="section-title mt"><span class="ic">🔒</span><h2>Chế độ nghiêm</h2></div>
        <div class="card">
          <div class="setting-row">
            <div class="s-text"><b>Khoá khu trò chơi 🎮</b><span>Bật: con chỉ vào được trò chơi sau khi <b>học đủ ${A.minutesGoal || 30} phút</b> hôm nay <b>và</b> làm xong bài bố mẹ giao. Tắt: chơi tự do.</span></div>
            <div class="switch ${A.strict ? "on" : ""}" id="sw-strict"></div>
          </div>
          <p class="soft" id="strict-now" style="font-size:13px;margin:2px 0 0">${(function () {
            const st = S.strictStatus();
            if (!A.strict) return "Hiện đang tắt — khu trò chơi luôn mở.";
            return st.locked
              ? "🔒 Đang khoá: con đã học " + st.mins + "/" + st.goal + " phút" + (st.tasksLeft ? ", còn " + st.tasksLeft + " việc được giao" : "") + "."
              : "🔓 Đã mở: con hoàn thành nhiệm vụ hôm nay rồi!";
          })()}</p>
        </div>

        <div class="section-title"><span class="ic">📌</span><h2>Giao bài cho con</h2></div>
        <div class="assign-list">${taskList}</div>
        <div class="add-row mt">
          <select id="add-lesson" class="psel"><option value="">— Chọn bài học để giao —</option>${lessonOpts}</select>
          <button class="btn sm" id="btn-add-lesson">+ Giao</button>
        </div>
        <div class="add-row mt-sm">
          <select id="add-practice" class="psel"><option value="">— Chọn bộ luyện tập để giao —</option>${practiceOpts}</select>
          <button class="btn sm" id="btn-add-practice">+ Giao</button>
        </div>
        <p class="soft mt-sm" style="font-size:13px">Bài được giao sẽ hiện ở mục “📌 Bài tập được giao” trên trang chính của con.</p>
      </div>

      <div class="grid cols-2 mt">
        <div class="card">
          <div class="section-title"><span class="ic">⏱️</span><h2>Mục tiêu mỗi ngày</h2></div>
          <p class="soft" style="font-size:13px;margin-bottom:8px">Số phút con nên học mỗi ngày (đồng bộ với vòng tròn mục tiêu của con).</p>
          <div class="tabs" id="pmin">${[15, 30, 45].map(m => '<div class="tab ' + (goal === m ? "active" : "") + '" data-m="' + m + '">' + m + "'</div>").join("")}</div>
        </div>
        <div class="card">
          <div class="section-title"><span class="ic">🔑</span><h2>Mã PIN phụ huynh</h2></div>
          <p class="soft" style="font-size:13px;margin-bottom:8px">${A.pin ? "Đang bảo vệ bằng PIN. Đặt PIN mới hoặc xoá." : "Đặt PIN để chỉ phụ huynh mở được khu vực này."}</p>
          <div class="add-row">
            <input type="password" inputmode="numeric" id="pin-in" class="time-input" placeholder="${A.pin ? "PIN mới" : "Nhập PIN"}">
            <button class="btn sm" id="pin-save">${A.pin ? "Đổi" : "Đặt"}</button>
            ${A.pin ? '<button class="btn ghost sm" id="pin-clear">Xoá</button>' : ""}
          </div>
        </div>
      </div>

      <div class="card mt">
        <div class="section-title"><span class="ic">🕒</span><h2>Hoạt động gần đây của con</h2></div>
        <div class="act-list">${feed}</div>
      </div>
      ${A.pin ? '<button class="btn ghost block mt" id="par-lock">🔒 Khoá Góc phụ huynh</button>' : ""}
    `);

    $("#par-back").onclick = () => go("#/dashboard");
    const swStrict = $("#sw-strict");
    if (swStrict) swStrict.onclick = () => {
      const on = !S.assignGet().strict;
      S.assignSetStrict(on);
      swStrict.classList.toggle("on", on);
      const now = $("#strict-now");
      if (now) {
        const st = S.strictStatus();
        now.textContent = !on ? "Hiện đang tắt — khu trò chơi luôn mở."
          : (st.locked ? "🔒 Đang khoá: con đã học " + st.mins + "/" + st.goal + " phút" + (st.tasksLeft ? ", còn " + st.tasksLeft + " việc được giao" : "") + "."
                       : "🔓 Đã mở: con hoàn thành nhiệm vụ hôm nay rồi!");
      }
      E.toast(on ? '<span class="t-ic">🔒</span> Đã bật Chế độ nghiêm — trò chơi mở sau khi con học đủ.' : "🔓 Đã tắt Chế độ nghiêm.");
    };
    wireReport("parrep", "par-report");
    const pl = $("#par-lock"); if (pl) pl.onclick = () => { parentUnlocked = false; go("#/dashboard"); };
    $$("#pmin .tab").forEach(t => t.onclick = () => {
      S.setGoals(Number(t.getAttribute("data-m")), null);
      $$("#pmin .tab").forEach(x => x.classList.remove("active")); t.classList.add("active");
      refreshChrome();
    });
    $("#btn-add-lesson").onclick = () => {
      const v = $("#add-lesson").value; if (!v) return;
      S.assignAddTask({ type: "lesson", ref: v, label: D.lessons[v].title });
      renderParent();
    };
    $("#btn-add-practice").onclick = () => {
      const v = $("#add-practice").value; if (!v) return;
      const w = D.practice.weeks.find(x => x.id === v);
      S.assignAddTask({ type: "practice", ref: v, label: w ? w.tag + ": " + w.title : v });
      renderParent();
    };
    $$("[data-del]").forEach(b => b.onclick = () => {
      const t = tasks[+b.getAttribute("data-del")];
      if (t) { S.assignRemoveTask(t.type, t.ref); renderParent(); }
    });
    $("#pin-save").onclick = () => {
      const v = ($("#pin-in").value || "").trim();
      if (!v) { E.toast("Hãy nhập PIN."); return; }
      S.assignSetPin(v); parentUnlocked = true;
      E.toast('<span class="t-ic">🔑</span> Đã lưu mã PIN.'); renderParent();
    };
    const pc = $("#pin-clear"); if (pc) pc.onclick = () => { S.assignClearPin(); E.toast("Đã xoá PIN."); renderParent(); };
  }

  /* =======================================================================
     VIEW: BUỔI HỌC 30 PHÚT
     ===================================================================== */
  const PHASES = [
    { t: "Ôn lại hôm qua", m: 5, ic: "🔁", desc: "Lướt nhanh flashcard đến hạn để 'làm nóng' trí nhớ." },
    { t: "Học kiến thức mới", m: 10, ic: "📖", desc: "Đi qua bước 1–3 của một bài mới: hiểu ý tưởng & ví dụ thực tế." },
    { t: "Luyện bài tập", m: 10, ic: "✏️", desc: "Làm bài tập từ dễ tới khó để biến hiểu thành nhớ." },
    { t: "Tự giải thích (Feynman)", m: 5, ic: "🗣️", desc: "Tự giảng lại bằng lời của em — chỗ nào ấp úng là chỗ cần xem lại." }
  ];

  function renderSession() {
    let phase = 0, elapsed = 0, totalElapsed = 0, running = false;

    setView(`<div class="section-title"><span class="ic">⏳</span><h2>Buổi học 30 phút</h2></div>
      <div class="grid cols-2">
        <div class="card text-c">
          <p class="soft" id="phase-name" style="font-weight:800;font-size:16px"></p>
          <div class="timer-big" id="timer">00:00</div>
          <div class="row" style="justify-content:center" id="ctrls">
            <button class="btn lg" id="play">▶ Bắt đầu</button>
            <button class="btn ghost lg" id="skip">Bước tiếp →</button>
          </div>
          <p class="soft mt" id="phase-desc" style="font-size:14px"></p>
          <div class="divider"></div>
          <button class="btn accent block" id="finish">Kết thúc & lưu phút học</button>
        </div>
        <div class="card">
          <div class="section-title"><span class="ic">🧭</span><h2>4 chặng</h2></div>
          <div class="phase-list" id="phases">
            ${PHASES.map((p, i) => `<div class="phase" data-p="${i}">
                <div class="p-num">${p.ic}</div>
                <div><b>${esc(p.t)}</b><div class="soft" style="font-size:13px">${esc(p.desc)}</div></div>
                <div class="p-min">${p.m}'</div>
              </div>`).join("")}
          </div>
          <button class="btn ghost block mt" id="open-lesson">Mở bài học gợi ý →</button>
        </div>
      </div>`);

    const timerEl = $("#timer"), nameEl = $("#phase-name"), descEl = $("#phase-desc"), playBtn = $("#play");

    function fmt(s) { return String((s / 60 | 0)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
    function syncPhase() {
      nameEl.textContent = PHASES[phase].ic + " " + PHASES[phase].t + " · mục tiêu " + PHASES[phase].m + " phút";
      descEl.textContent = PHASES[phase].desc;
      $$("#phases .phase").forEach((el, i) => {
        el.classList.toggle("active", i === phase);
        el.classList.toggle("done", i < phase);
      });
    }
    function tick() {
      elapsed++; totalElapsed++;
      timerEl.textContent = fmt(elapsed);
      if (elapsed >= PHASES[phase].m * 60) {
        E.toast('<span class="t-ic">✅</span> Xong chặng "' + PHASES[phase].t + '"!');
        nextPhase();
      }
    }
    function nextPhase() {
      if (phase < PHASES.length - 1) { phase++; elapsed = 0; timerEl.textContent = "00:00"; syncPhase(); }
      else { stop(); finish(); }
    }
    function start() { if (running) return; running = true; playBtn.textContent = "⏸ Tạm dừng"; timerHandle = setInterval(tick, 1000); }
    function stop() { running = false; playBtn.textContent = "▶ Tiếp tục"; clearInterval(timerHandle); timerHandle = null; }
    function finish() {
      stop();
      const mins = Math.max(1, Math.round(totalElapsed / 60));
      // Phút học đã được bộ đếm toàn cục ghi liên tục (kể cả khi em chuyển trang) — không cộng lần hai.
      timebankTick();
      gain(E.EXP.step);
      checkBadges(); refreshChrome();
      E.confetti();
      E.toast('<span class="t-ic">🎉</span> Buổi học ' + mins + " phút hoàn thành! Mở khoá phần thưởng… 🎮");
      setTimeout(() => go("#/game/thuong"), 1100);
    }

    playBtn.onclick = () => running ? stop() : start();
    $("#skip").onclick = nextPhase;
    $("#finish").onclick = finish;
    $("#open-lesson").onclick = () => go("#/hoc/" + nextLesson().id);
    syncPhase();
  }

  /* =======================================================================
     KHU TRÒ CHƠI — hub + Đua xe tính nhanh + Mê cung đáp án + Đấu trường
     ===================================================================== */
  function renderGame(mode) {
    const st = S.strictStatus();
    if (st.locked) { renderGameLocked(st); return; }
    if (mode === "arena") { renderArena(false); return; }
    if (mode === "dua-xe") { renderRace(); return; }
    if (mode === "me-cung") { renderMaze(); return; }
    renderGameHub(mode === "thuong");
  }

  function renderGameLocked(st) {
    const minsLeft = Math.max(0, st.goal - st.mins);
    setView(`<div class="section-title"><span class="ic">🔒</span><h2>Khu trò chơi đang khoá</h2></div>
      <div class="card locked-card">
        <div class="lk-emoji">🔐</div>
        <p><b>Bố mẹ đã bật Chế độ nghiêm.</b> Học xong nhiệm vụ hôm nay là mở khoá ngay!</p>
        <div class="lk-req ${st.mins >= st.goal ? "ok" : ""}">
          ${st.mins >= st.goal ? "✅" : "⏳"} Học đủ <b>${st.goal} phút</b> hôm nay
          <span class="soft">(đã học ${st.mins} phút${minsLeft ? " · còn " + minsLeft + " phút" : ""})</span>
        </div>
        ${st.tasksTotal ? `<div class="lk-req ${st.tasksLeft === 0 ? "ok" : ""}">
          ${st.tasksLeft === 0 ? "✅" : "📌"} Hoàn thành <b>bài bố mẹ giao</b>
          <span class="soft">(còn ${st.tasksLeft}/${st.tasksTotal} việc)</span>
        </div>` : ""}
        <div class="row mt" style="gap:8px;flex-wrap:wrap">
          <button class="btn primary" id="lk-learn" style="flex:1">📚 Vào học ngay</button>
          <button class="btn ghost" id="lk-parent">Bố mẹ mở khoá</button>
        </div>
      </div>
      <p class="soft mt-sm" style="font-size:13px">Mẹo: mở mục <b>Buổi học 30'</b> hoặc học bất kỳ bài nào — phút học được tính tự động.</p>`);
    $("#lk-learn").onclick = () => go("#/lo-trinh");
    $("#lk-parent").onclick = () => go("#/phu-huynh");
  }

  function renderGameHub(reward) {
    setView(`
      ${reward ? '<div class="arena-reward">🎁 <b>Học đủ mục tiêu hôm nay rồi!</b> Chọn một trò để xả hơi — chơi mà vẫn luyện não. 🧠</div>' : ""}
      <div class="section-title"><span class="ic">🎮</span><h2>Khu trò chơi</h2></div>
      <p class="soft mb">Mọi trò đều dùng Toán để thắng — chơi thoải mái, não vẫn chạy!</p>
      <div class="game-hub">
        <button class="game-card gc-race" data-g="dua-xe">
          <div class="gc-emoji">🏎️</div><b>Đua xe tính nhanh</b>
          <span>Tính nhẩm đúng để đốt nitro 🔥 — về đích trước đối thủ! 3 độ khó.</span>
          <span class="gc-shine"></span>
        </button>
        <button class="game-card gc-maze" data-g="me-cung">
          <div class="gc-emoji">🏛️</div><b>Đền cổ kho báu</b>
          <span>Vượt 10 cánh cửa đá bằng đáp án đúng — coi chừng Cửa Thần cuối cùng!</span>
          <span class="gc-shine"></span>
        </button>
        <button class="game-card gc-arena" data-g="arena">
          <div class="gc-emoji">⚔️</div><b>Đấu trường Toán học</b>
          <span>Hạ 3 quái vật bằng những câu trả lời chính xác và combo cháy!</span>
          <span class="gc-shine"></span>
        </button>
      </div>`);
    $$(".game-card").forEach(b => b.onclick = () => go("#/game/" + b.getAttribute("data-g")));
  }

  /* ---------- sinh câu tính nhanh theo độ khó ---------- */
  function quickMath(level) {
    const r = n => 1 + ((Math.random() * n) | 0);
    let q, ans;
    if (level === "de") {
      if (Math.random() < 0.5) { const a = r(30) + 5, b = r(30) + 5; q = a + " + " + b; ans = a + b; }
      else { const a = r(30) + 20, b = r(19); q = a + " − " + b; ans = a - b; }
    } else if (level === "kho") {
      const kind = (Math.random() * 4) | 0;
      if (kind === 0) { const n = r(10) + 2; q = "√" + (n * n); ans = n; }
      else if (kind === 1) { const b2 = r(7) + 2; const e = Math.random() < 0.5 ? 2 : 3; q = b2 + (e === 2 ? "²" : "³"); ans = Math.pow(b2, e); }
      else if (kind === 2) { const base = (r(8) + 1) * 20; const p = [10, 25, 50][(Math.random() * 3) | 0]; q = p + "% của " + base; ans = base * p / 100; }
      else { const a = r(8) + 11, b = r(7) + 2; q = a + " × " + b; ans = a * b; }
    } else { // vua
      const kind = (Math.random() * 4) | 0;
      if (kind === 0) { const a = r(40) + 9, b = r(40) + 9; q = a + " + " + b; ans = a + b; }
      else if (kind === 1) { const a = r(40) + 30, b = r(29); q = a + " − " + b; ans = a - b; }
      else if (kind === 2) { const a = r(9) + 2, b = r(9) + 2; q = a + " × " + b; ans = a * b; }
      else { const b = r(9) + 2, c = r(9) + 2; q = (b * c) + " : " + b; ans = c; }
    }
    const opts = [ans];
    let guard = 0;
    while (opts.length < 4 && guard++ < 60) {
      const d = ans + ((Math.random() * 12 | 0) - 6) || (ans + opts.length);
      if (d !== ans && d > 0 && opts.indexOf(d) === -1) opts.push(d);
    }
    while (opts.length < 4) opts.push(ans + opts.length * 3 + 1);
    for (let i = opts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return { q: q + " = ?", options: opts.map(String), answer: opts.indexOf(ans) };
  }

  /* =======================================================================
     🏎️ ĐUA XE TÍNH NHANH — canvas 60fps: đường cuộn, nitro, vạch đích
     ===================================================================== */
  function renderRace() {
    let level = "vua";
    let me = 0, ai = 0, vMe = 0, streak = 0, boost = 0, shake = 0;
    let done = false, started = false, qStart = 0, current = null, dashOff = 0;
    const AI_SPEED = 1.9;   // %/giây → về đích ~53 giây
    const BASE_V = 0.55;    // tốc độ nền của em (%/giây) — phải trả lời mới nhanh được

    setView(`<div class="race">
      <div class="section-title"><span class="ic">🏎️</span><h2>Đua xe tính nhanh</h2></div>
      <div class="race-level" id="race-level">
        <span class="soft" style="font-size:13px">Độ khó:</span>
        <button class="tabchip" data-lv="de">🙂 Dễ</button>
        <button class="tabchip active" data-lv="vua">😎 Vừa</button>
        <button class="tabchip" data-lv="kho">🔥 Khó</button>
      </div>
      <div class="race-stage" id="race-stage">
        <canvas id="race-cv" width="720" height="240"></canvas>
        <div class="race-count" id="race-count" hidden><span id="race-count-n">3</span></div>
        <div class="race-hud2">
          <div class="rh-row">🏎️ Em <div class="rh-bar"><span id="rh-me" style="width:0%"></span></div><b id="rh-me-t">0%</b></div>
          <div class="rh-row">🤖 Máy <div class="rh-bar ai"><span id="rh-ai" style="width:0%"></span></div><b id="rh-ai-t">0%</b></div>
        </div>
        <div class="race-streak" id="race-streak" hidden>🔥 combo ×<b id="race-streak-n">0</b></div>
      </div>
      <div class="q-card mt"><div class="q-text" id="race-q">Chọn độ khó rồi bấm Xuất phát!</div><div class="q-opts" id="race-opts"></div></div>
      <div class="row mt" style="gap:8px">
        <button class="btn" id="race-go" style="flex:1">🚦 Xuất phát!</button>
        <button class="btn ghost" id="race-quit">⟵ Thoát</button>
      </div>
    </div>`);

    const cv = $("#race-cv");
    const ctx = (cv.getContext && cv.getContext("2d")) || null;

    // ---------- vẽ cảnh ----------
    function draw(dt) {
      if (!ctx) return;
      try {
        const W = 720, H = 240;
        ctx.clearRect(0, 0, W, H);
        // cỏ hai bên
        ctx.fillStyle = "#78c841"; ctx.fillRect(0, 0, W, 34);
        ctx.fillStyle = "#5fb02e"; ctx.fillRect(0, H - 34, W, 34);
        // bụi cây trang trí trôi theo tốc độ
        ctx.fillStyle = "#3f8f1f";
        for (let k = 0; k < 6; k++) {
          const x = ((k * 140 - dashOff * 0.6) % (W + 60) + W + 60) % (W + 60) - 30;
          ctx.beginPath(); ctx.arc(x, 20, 12, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(W - x, H - 20, 12, 0, Math.PI * 2); ctx.fill();
        }
        // mặt đường
        ctx.fillStyle = "#4b5563"; ctx.fillRect(0, 34, W, H - 68);
        // lề trắng
        ctx.fillStyle = "#e5e7eb"; ctx.fillRect(0, 34, W, 4); ctx.fillRect(0, H - 38, W, 4);
        // vạch giữa trôi
        ctx.fillStyle = "#f8fafc";
        for (let k = -1; k < 12; k++) {
          const x = ((k * 70 - dashOff) % (W + 70) + W + 70) % (W + 70) - 35;
          ctx.fillRect(x, H / 2 - 3, 38, 6);
        }
        // vạch đích ca-rô hiện dần khi em > 78%
        if (me > 78) {
          const fx = W - (100 - me) / 22 * (W * 0.55) - 40;
          for (let ry = 0; ry < (H - 68) / 12; ry++) for (let cx2 = 0; cx2 < 3; cx2++) {
            ctx.fillStyle = (ry + cx2) % 2 ? "#111827" : "#f9fafb";
            ctx.fillRect(fx + cx2 * 12, 38 + ry * 12, 12, 12);
          }
        }
        // xe: vị trí ngang theo chênh lệch tiến độ (em cố định giữa, máy lệch theo ai-me)
        const meX = 200, laneMe = H / 2 + 44, laneAi = H / 2 - 44;
        const aiX = Math.max(24, Math.min(W - 60, meX + (ai - me) * 5.2));
        const jitter = shake > 0 ? (Math.random() * 6 - 3) : 0;
        ctx.font = "34px serif"; ctx.textBaseline = "middle";
        // nitro
        if (boost > 0) {
          ctx.font = "22px serif";
          ctx.fillText("🔥", meX - 26, laneMe + jitter);
          ctx.fillText("💨", meX - 46, laneMe + jitter);
          ctx.font = "34px serif";
        }
        ctx.fillText("🚗", aiX, laneAi);
        ctx.fillText("🏎️", meX, laneMe + jitter);
        // vệt tốc độ khi boost
        if (boost > 0) {
          ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2;
          for (let k = 0; k < 5; k++) {
            const y = 44 + Math.random() * (H - 88);
            ctx.beginPath(); ctx.moveTo(Math.random() * W, y); ctx.lineTo(Math.random() * W - 60, y); ctx.stroke();
          }
        }
      } catch (e) { /* canvas mock/không hỗ trợ: bỏ qua vẽ, game vẫn chạy */ }
    }

    function hud() {
      $("#rh-me").style.width = Math.min(100, me) + "%";
      $("#rh-ai").style.width = Math.min(100, ai) + "%";
      $("#rh-me-t").textContent = Math.round(Math.min(100, me)) + "%";
      $("#rh-ai-t").textContent = Math.round(Math.min(100, ai)) + "%";
      const st = $("#race-streak");
      if (streak >= 2) { st.hidden = false; $("#race-streak-n").textContent = streak; }
      else st.hidden = true;
    }

    // ---------- vòng lặp 60fps ----------
    let lastT = 0;
    function frame(t) {
      if (done || !cv.isConnected) return;              // rời trang → tự dừng
      if (!lastT) lastT = t;
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
      if (started) {
        vMe = Math.max(BASE_V, vMe - dt * 5.5);          // nitro tắt dần
        me += vMe * dt; ai += AI_SPEED * dt;
        boost = Math.max(0, boost - dt);
        shake = Math.max(0, shake - dt);
        dashOff += (60 + vMe * 22) * dt;
        hud();
        if (me >= 100) return end(true);
        if (ai >= 100) return end(false);
      } else dashOff += 18 * dt;
      draw(dt);
      (window.requestAnimationFrame || function (f) { setTimeout(function () { f(Date.now()); }, 16); })(frame);
    }

    function loadQ() {
      if (done || !$("#race-q")) return;
      current = quickMath(level);
      if (window.App) window.App._race = { answer: current.answer };
      $("#race-q").textContent = current.q;
      $("#race-opts").innerHTML = current.options.map((o, i) => '<button class="q-opt" data-i="' + i + '">' + esc(o) + "</button>").join("");
      $$("#race-opts .q-opt").forEach(b => b.onclick = () => pick(+b.dataset.i, b));
      qStart = Date.now();
    }
    function pick(i, btn) {
      if (done || !started) return;
      const ok = i === current.answer;
      if (ok) {
        streak++;
        const fast = Math.max(0, 4 - (Date.now() - qStart) / 1000);
        vMe += 7 + Math.min(3, streak) + fast * 1.6;     // nitro!
        boost = 0.9;
        btn.classList.add("correct");
      } else {
        streak = 0; shake = 0.5;
        me = Math.max(0, me - 2); vMe = BASE_V;
        btn.classList.add("wrong");
        E.toast("Ối, xe trượt bánh! 🛞");
      }
      hud();
      setTimeout(loadQ, 120);
    }

    function startCountdown() {
      $("#race-go").disabled = true;
      $$("#race-level .tabchip").forEach(x => x.disabled = true);
      const cd = $("#race-count"), n = $("#race-count-n");
      cd.hidden = false;
      let left = 3;
      n.textContent = left;
      const h = setInterval(() => {
        left--;
        if (left <= 0) {
          clearInterval(h);
          n.textContent = "GO!";
          setTimeout(() => { cd.hidden = true; }, 450);
          started = true; qStart = Date.now();
          loadQ();
        } else n.textContent = left;
      }, 800);
    }

    function end(winFlag) {
      if (done) return; done = true;
      const exp = winFlag ? (level === "kho" ? 40 : 30) : 0;
      if (winFlag) { S.addExp(exp); S.log("race-win"); E.confetti(); checkBadges(); refreshChrome(); }
      setView(`<div class="arena"><div class="arena-end ${winFlag ? "win" : "lose"}">
          <div class="arena-end-emoji">${winFlag ? "🏆" : "🐌"}</div>
          <h2>${winFlag ? "VỀ ĐÍCH TRƯỚC!" : "Đối thủ về đích trước…"}</h2>
          <p>${winFlag ? "Tốc độ tính nhẩm đỉnh thật! Nhận <b>+" + exp + " EXP</b> 🎉" : "Luyện tính nhẩm thêm chút là thắng ngay — thử lại nhé! 💪"}</p>
          <div class="arena-end-actions">
            <button class="btn primary" id="race-again">Đua lại</button>
            <button class="btn ghost" id="race-hub">Trò khác</button>
          </div></div></div>`);
      $("#race-again").onclick = () => renderRace();
      $("#race-hub").onclick = () => go("#/game");
    }

    $$("#race-level .tabchip").forEach(b => b.onclick = () => {
      level = b.getAttribute("data-lv");
      $$("#race-level .tabchip").forEach(x => x.classList.toggle("active", x === b));
    });
    $("#race-go").onclick = startCountdown;
    $("#race-quit").onclick = () => go("#/game");
    hud();
    (window.requestAnimationFrame || function (f) { setTimeout(function () { f(Date.now()); }, 16); })(frame);
  }

  /* =======================================================================
     🏛️ ĐỀN CỔ KHO BÁU — mê cung sương mù, cửa đá mở 3D, Cửa Thần
     ===================================================================== */
  function mazeQuestions() {
    const out = [];
    D.practice.weeks.forEach(w => w.questions.forEach(q => { if (q.type === "mc") out.push(q); }));
    for (let i = out.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  const MAZE_FLAVOR = [
    "Cánh cửa đá khắc một câu đố cổ…",
    "Ngọn đuốc bùng lên soi rõ dòng chữ…",
    "Tiếng vọng từ sâu trong đền: “Trả lời đi!”",
    "Bụi rơi lả tả — cánh cửa này đã ngàn năm chưa mở…",
    "Một con nhện đá canh giữ lối đi…",
    "Sàn đá rung nhẹ… chọn cho đúng nhé!",
    "Bức phù điêu hiện lên câu hỏi…",
    "Không khí lạnh dần — kho báu đang gần lắm rồi…"
  ];
  function renderMaze() {
    const PATH = [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[4,3],[3,3],[2,3]];
    const COLS = 5, ROWS = 4, STEPS = PATH.length;
    let pos = 0, hearts = 3, done = false;
    let pool = mazeQuestions(), ptr = 0, current = null;

    setView(`<div class="maze temple">
      <div class="section-title"><span class="ic">🏛️</span><h2>Đền cổ kho báu</h2></div>
      <p class="soft" style="margin:0 0 10px">Mỗi cánh cửa đá là một câu hỏi — chọn <b>đáp án đúng</b> để mở đường tới kho báu 💎. Cửa cuối là <b>Cửa Thần</b>. Sai mất 1 tim!</p>
      <div class="maze-hud"><span id="maze-hearts">❤️❤️❤️</span>
        <span class="mz-torch">🔥</span>
        <span id="maze-step">Bước 1/${STEPS}</span>
        <span class="mz-torch t2">🔥</span></div>
      <div class="maze-grid" id="maze-grid" style="grid-template-columns:repeat(${COLS},1fr)"></div>
      <div class="q-card mt" id="maze-card">
        <div class="q-topic mz-flavor" id="maze-flavor"></div>
        <div class="q-topic" id="maze-topic"></div>
        <div class="q-text" id="maze-q"></div><div class="q-opts" id="maze-opts"></div></div>
      <div class="row mt"><button class="btn ghost" id="maze-quit">⟵ Thoát</button></div>
    </div>`);

    function cellIndexOf(c, r) { return r * COLS + c; }
    function paint(openDoor) {
      const g = $("#maze-grid");
      const cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push('<div class="mz-cell" data-i="' + cellIndexOf(c, r) + '"></div>');
      g.innerHTML = cells.join("");
      PATH.forEach((p, k) => {
        const cell = g.children[cellIndexOf(p[0], p[1])];
        cell.classList.add("path");
        if (k < pos) cell.classList.add("walked");
        if (k === pos) { cell.classList.add("here"); cell.innerHTML = '<span class="mz-hero">🧭</span>'; }
        if (k === pos + 1 && k < STEPS) {
          cell.classList.add("door");
          if (openDoor) cell.classList.add("opening");
          cell.innerHTML = '<span class="mz-door">🚪</span>';
        }
        if (k > pos + 1) cell.classList.add("fog");
        if (k === STEPS - 1) {
          if (k === pos) cell.innerHTML = '<span class="mz-hero">🧭</span>';
          else cell.innerHTML = (k <= pos + 1 ? "" : "") + '<span class="mz-gem' + (k > pos + 1 ? " dim" : "") + '">💎</span>';
        }
      });
      $("#maze-hearts").innerHTML = "❤️".repeat(hearts) + "🖤".repeat(3 - hearts);
      $("#maze-step").textContent = "Bước " + Math.min(pos + 1, STEPS) + "/" + STEPS;
    }
    function nextQ() { if (ptr >= pool.length) { pool = mazeQuestions(); ptr = 0; } return pool[ptr++]; }
    function loadQ() {
      current = nextQ();
      if (window.App) window.App._maze = { answer: current.answer };
      const isBoss = pos === STEPS - 2;
      $("#maze-flavor").textContent = isBoss ? "⚡ CỬA THẦN — cánh cửa cuối cùng phát sáng rực rỡ…" : MAZE_FLAVOR[(Math.random() * MAZE_FLAVOR.length) | 0];
      $("#maze-topic").textContent = (isBoss ? "🌟 Cửa Thần" : "Cánh cửa số " + (pos + 1));
      $("#maze-q").textContent = current.q;
      $("#maze-opts").innerHTML = current.options.map((o, i) => '<button class="q-opt" data-i="' + i + '">' + esc(o) + "</button>").join("");
      $$("#maze-opts .q-opt").forEach(b => b.onclick = () => pick(+b.dataset.i));
    }
    function pick(i) {
      if (done) return;
      if (i === current.answer) {
        paint(true); // cửa mở xoay 3D
        setTimeout(() => {
          pos++;
          if (pos >= STEPS - 1) { pos = STEPS - 1; paint(); return end(true); }
          paint();
          loadQ();
        }, 380);
      } else {
        hearts--;
        const card = $("#maze-card"); if (card) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
        paint();
        if (hearts <= 0) return end(false);
        E.toast("Cửa không mở… thử câu khác! (−1 ❤️)");
        loadQ();
      }
    }
    function end(winFlag) {
      if (done) return; done = true;
      if (winFlag) { S.addExp(30); S.log("maze-win"); E.confetti(); checkBadges(); refreshChrome(); }
      setView(`<div class="arena"><div class="arena-end ${winFlag ? "win" : "lose"}">
          <div class="arena-end-emoji">${winFlag ? "💎" : "🕯️"}</div>
          <h2>${winFlag ? "TÌM THẤY KHO BÁU!" : "Hết tim mất rồi…"}</h2>
          <p>${winFlag ? "Vượt cả Cửa Thần bằng kiến thức thật. Nhận <b>+30 EXP</b> 🎉" : "Ôn lại vài bài rồi quay lại — kho báu vẫn chờ em! 💪"}</p>
          <div class="arena-end-actions">
            <button class="btn primary" id="maze-again">Chơi lại</button>
            <button class="btn ghost" id="maze-hub">Trò khác</button>
          </div></div></div>`);
      $("#maze-again").onclick = () => renderMaze();
      $("#maze-hub").onclick = () => go("#/game");
    }
    $("#maze-quit").onclick = () => go("#/game");
    paint(); loadQ();
  }

  /* =======================================================================
     GAME — ĐẤU TRƯỜNG TOÁN HỌC (phần thưởng giải trí)
     ===================================================================== */
  function renderArena(mode) {
    const G = D.games;
    const reward = mode === "thuong";

    // ----- trạng thái trận -----
    let foeIdx = 0;
    let foeHP = 0, foeMax = 0;
    let heroHP = 100; const heroMax = 100;
    let combo = 0, bestCombo = 0;
    let pool = shuffle(G.questions.slice());
    let pPtr = 0;
    let current = null;
    let tLeft = 0, tMax = 0;
    let answered = false;

    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function nextQ() { if (pPtr >= pool.length) { pool = shuffle(pool); pPtr = 0; } return pool[pPtr++]; }
    function pct(x, m) { return Math.max(0, Math.min(100, (x / m) * 100)); }

    setView(
      '<div class="arena">' +
        (reward
          ? '<div class="arena-reward">🎁 <b>Hết 30 phút học rồi!</b> Đây là phần thưởng giải trí — chiến nào!</div>'
          : "") +
        '<div class="arena-head"><h2>⚔️ Đấu trường Toán học</h2>' +
        '<p class="arena-intro">' + G.intro + "</p></div>" +
        '<div class="arena-foes" id="arena-foes"></div>' +
        '<div class="battle" id="battle">' +
          '<div class="foe" id="foe">' +
            '<div class="foe-emoji" id="foe-emoji">🐌</div>' +
            '<div class="foe-name" id="foe-name"></div>' +
            '<div class="hpbar foe-hpbar"><span class="hp-fill" id="foe-hp"></span></div>' +
            '<div class="foe-taunt" id="foe-taunt"></div>' +
          "</div>" +
          '<div class="hero">' +
            '<div class="hero-row"><span class="hero-emoji">🧑‍🎓</span>' +
            '<div class="hpbar hero-hpbar"><span class="hp-fill" id="hero-hp"></span></div>' +
            '<span class="hero-hp-num" id="hero-hp-num">100</span></div>' +
            '<div class="combo" id="combo">Combo ×0</div>' +
          "</div>" +
          '<div class="timerbar"><span class="timer-fill" id="timer-fill"></span></div>' +
          '<div class="q-card">' +
            '<div class="q-topic" id="q-topic"></div>' +
            '<div class="q-text" id="q-text"></div>' +
            '<div class="q-opts" id="q-opts"></div>' +
          "</div>" +
        "</div>" +
        '<div class="arena-actions"><button class="btn ghost" id="quit-game">⟵ Thoát Đấu trường</button></div>' +
      "</div>"
    );

    const el = id => $("#" + id);
    el("quit-game").onclick = () => go(reward ? "#/dashboard" : "#/dashboard");

    function renderFoes() {
      el("arena-foes").innerHTML = G.opponents.map((o, i) => {
        const st = i < foeIdx ? "done" : i === foeIdx ? "now" : "";
        return '<span class="foe-pip ' + st + '">' + o.emoji + "</span>";
      }).join('<span class="foe-sep">›</span>');
    }

    function startFoe(i) {
      const o = G.opponents[i];
      foeMax = o.hp; foeHP = o.hp;
      el("foe-emoji").textContent = o.emoji;
      el("foe-name").textContent = o.name + "  ·  HP " + o.hp;
      el("foe-taunt").textContent = "“" + o.taunt + "”";
      el("foe-hp").style.background = o.color;
      el("foe-hp").style.width = "100%";
      renderFoes();
      loadQ();
    }

    function loadQ() {
      answered = false;
      current = nextQ();
      el("q-topic").textContent = current.topic;
      el("q-text").textContent = current.q;
      el("q-opts").innerHTML = current.options
        .map((op, i) => '<button class="q-opt" data-i="' + i + '">' + esc(op) + "</button>")
        .join("");
      $$("#q-opts .q-opt").forEach(b => (b.onclick = () => answer(+b.dataset.i)));
      tMax = G.opponents[foeIdx].time; tLeft = tMax;
      el("timer-fill").style.width = "100%";
      if (timerHandle) clearInterval(timerHandle);
      timerHandle = setInterval(tick, 100);
    }

    function tick() {
      tLeft -= 0.1;
      el("timer-fill").style.width = pct(tLeft, tMax) + "%";
      if (tLeft <= 0) { clearInterval(timerHandle); timerHandle = null; answer(-1); }
    }

    function answer(idx) {
      if (answered) return;
      answered = true;
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
      const opts = $$("#q-opts .q-opt");
      const correct = idx === current.answer;
      opts.forEach((b, i) => {
        b.disabled = true;
        if (i === current.answer) b.classList.add("correct");
        else if (i === idx) b.classList.add("wrong");
      });

      if (correct) {
        combo += 1; bestCombo = Math.max(bestCombo, combo);
        const speed = Math.round((tLeft / tMax) * 10);
        const dmg = 14 + combo * 4 + speed;
        foeHP = Math.max(0, foeHP - dmg);
        el("foe-hp").style.width = pct(foeHP, foeMax) + "%";
        el("combo").textContent = "Combo ×" + combo + "  ⚡ −" + dmg;
        el("combo").classList.add("hot");
        const foe = el("foe"); foe.classList.remove("hit"); void foe.offsetWidth; foe.classList.add("hit");
        setTimeout(() => {
          el("combo").classList.remove("hot");
          if (foeHP <= 0) defeatFoe(); else loadQ();
        }, 650);
      } else {
        combo = 0;
        el("combo").textContent = "Combo ×0";
        const o = G.opponents[foeIdx];
        heroHP = Math.max(0, heroHP - o.dmg);
        el("hero-hp").style.width = pct(heroHP, heroMax) + "%";
        el("hero-hp-num").textContent = heroHP;
        const battle = el("battle"); battle.classList.remove("shake"); void battle.offsetWidth; battle.classList.add("shake");
        setTimeout(() => {
          if (heroHP <= 0) lose(); else loadQ();
        }, 950);
      }
    }

    function defeatFoe() {
      foeIdx += 1;
      renderFoes();
      if (foeIdx >= G.opponents.length) return win();
      E.toast('<span class="t-ic">💥</span> Hạ gục! Quái tiếp theo xuất hiện…');
      // thưởng máu nhỏ khi qua màn
      heroHP = Math.min(heroMax, heroHP + 15);
      el("hero-hp").style.width = pct(heroHP, heroMax) + "%";
      el("hero-hp-num").textContent = heroHP;
      startFoe(foeIdx);
    }

    function endScreen(winFlag) {
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
      const html =
        '<div class="arena"><div class="arena-end ' + (winFlag ? "win" : "lose") + '">' +
          '<div class="arena-end-emoji">' + (winFlag ? "🏆" : "💀") + "</div>" +
          "<h2>" + (winFlag ? "VÔ ĐỊCH ĐẤU TRƯỜNG!" : "Thua mất rồi…") + "</h2>" +
          "<p>" + (winFlag
            ? "Bạn đã hạ cả 3 quái vật. Combo cao nhất: <b>×" + bestCombo + "</b>. Nhận <b>+40 EXP</b>! 🎉"
            : "Đừng nản! Ôn lại vài bài rồi quay lại phục thù nhé. 💪") + "</p>" +
          '<div class="arena-end-actions">' +
            '<button class="btn primary" id="again">Chơi lại</button>' +
            '<button class="btn ghost" id="home">Về trang chủ</button>' +
            '<button class="btn ghost" id="study">Ôn bài</button>' +
          "</div>" +
        "</div></div>";
      setView(html);
      $("#again").onclick = () => renderArena(mode);
      $("#home").onclick = () => go("#/dashboard");
      $("#study").onclick = () => go("#/lo-trinh");
    }

    function win() {
      S.addExp(40);
      S.log("arena-win");
      refreshChrome();
      E.confetti();
      checkBadges();
      endScreen(true);
    }
    function lose() { endScreen(false); }

    el("hero-hp").style.width = "100%";
    startFoe(0);
  }

  /* =======================================================================
     LUYỆN TẬP 12 TUẦN (lộ trình 3 tháng)
     ===================================================================== */
  /* Bản đồ: mỗi bộ luyện tập ↔ bài học lý thuyết tương ứng */
  const PRACTICE_LESSON = {
    c1b1: "pt-he-khai-niem", c1b2: "he-phuong-trinh", c1b3: "lap-he-pt",
    c2b4: "pt-tich", c2b5: "bat-dang-thuc", c2b6: "bat-phuong-trinh",
    c3b7: "can-bac-hai", c3b8: "khai-can", c3b9: "rut-gon-can", c3b10: "can-bac-ba",
    c4b11: "ti-so-luong-giac", c4b12: "he-thuc-luong",
    c5b13: "duong-tron", c5b14: "cung-day", c5b15: "do-dai-cung", c5b16: "vi-tri-duong-thang-tron",
    c6b18: "ham-so-y-ax2", c6b19: "phuong-trinh-bac-hai", c6b20: "he-thuc-vi-et", c6b21: "lap-pt",
    c7b22: "thong-ke", c7b23: "tan-so-tuong-doi", c7b24: "tan-so-ghep-nhom",
    c8b25: "phep-thu", c8b26: "xac-suat",
    c9b27: "goc-noi-tiep", c9b28: "duong-tron-ngoai-noi-tiep", c9b29: "tu-giac-noi-tiep", c9b30: "da-giac-deu",
    c10b31: "hinh-tru-non", c10b32: "hinh-cau"
  };
  // đảo ngược: từ lessonId → id bộ luyện tập (để nút "Luyện lại")
  const LESSON_PRACTICE = Object.keys(PRACTICE_LESSON).reduce((m, wk) => {
    m[PRACTICE_LESSON[wk]] = wk; return m;
  }, {});
  function theoryHintHtml(lessonId) {
    const L = D.lessons[lessonId];
    if (!L) return "";
    const cards = (L.flashcards || []).slice(0, 6).map(c =>
      `<li><b>${esc(c.front)}</b> ${esc(c.back)}</li>`).join("");
    return `<details class="theory mb">
        <summary>💡 Gợi ý lý thuyết <span class="soft">(mở ra khi quên)</span></summary>
        <div class="theory-body">
          <p class="soft" style="margin:2px 0 8px">Nhắc nhanh kiến thức của <b>${esc(L.title)}</b>:</p>
          <ul class="theory-list">${cards}</ul>
          <button class="btn ghost sm" data-open-lesson="${lessonId}">📖 Mở bài học đầy đủ</button>
          <button class="tts-btn" data-tts-theory="${lessonId}" style="margin-left:6px">🔊 Nghe giảng</button>
        </div>
      </details>`;
  }

  function renderPractice(weekId) {
    const P = D.practice;
    if (!weekId) {
      const doneN = S.practiceDoneCount();
      const totalW = P.weeks.length;
      let lastTerm = "";
      const cards = P.weeks.map(w => {
        const rec = S.practiceGet(w.id);
        const passed = rec && rec.best / rec.total >= 0.5;
        const pctW = rec ? Math.round(rec.best / rec.total * 100) : 0;
        const scoreTxt = rec ? rec.best + "/" + rec.total : "Chưa làm";
        let header = "";
        if (w.term !== lastTerm) { lastTerm = w.term; header = '<div class="wk-chapter">' + esc(w.term) + "</div>"; }
        return header + `<button class="wk-card ${passed ? "passed" : ""}" data-week="${w.id}">
            <div class="wk-num"><span class="wk-emoji">${w.emoji}</span><span class="wk-w">${esc(w.tag)}</span></div>
            <div class="wk-main">
              <div class="wk-title">${esc(w.title)}</div>
              <div class="wk-meta"><span class="wk-score">${scoreTxt}</span></div>
              <div class="progress thin mt-sm"><span style="width:${pctW}%"></span></div>
            </div>
            <div class="wk-go">${passed ? "✅" : "▶"}</div>
          </button>`;
      }).join("");
      setView(`<div class="section-title"><span class="ic">📒</span><h2>Luyện tập theo SGK</h2></div>
        <p class="soft mb">${esc(P.intro)}</p>
        <div class="card mb"><div class="row between"><b>Tiến độ luyện tập</b><span class="soft">${doneN}/${totalW} bài đạt</span></div>
          <div class="progress mt-sm"><span style="width:${Math.round(doneN / totalW * 100)}%"></span></div></div>
        <div class="wk-list">${cards}</div>`);
      $$(".wk-card").forEach(b => b.onclick = () => go("#/luyen-tap/" + b.getAttribute("data-week")));
      return;
    }

    const w = P.weeks.find(x => x.id === weekId);
    if (!w) { go("#/luyen-tap"); return; }
    titleEl.textContent = w.tag;
    const qs = w.questions;
    const pstate = { answered: 0, correct: 0, total: qs.length, awarded: {}, done: false };
    const lessonId = PRACTICE_LESSON[w.id];
    setView(`<button class="btn ghost sm mb" id="back-wk">⟵ Danh sách bài</button>
      <div class="wk-detail-term">${esc(w.term)}</div>
      <div class="section-title"><span class="ic">${w.emoji}</span><h2>${esc(w.tag)}: ${esc(w.title)}</h2></div>
      <p class="soft mb">Làm hết ${qs.length} câu, có lời giải sau mỗi câu. Điểm cao nhất của em sẽ được lưu lại.</p>
      ${lessonId ? theoryHintHtml(lessonId) : ""}
      <div id="pr-host"></div>
      <div id="pr-finish"></div>`);
    $("#back-wk").onclick = () => go("#/luyen-tap");
    const ol = $("[data-open-lesson]"); if (ol) ol.onclick = () => go("#/hoc/" + ol.getAttribute("data-open-lesson"));
    const tb = $("[data-tts-theory]");
    if (tb) tb.onclick = () => {
      const Lx = D.lessons[tb.getAttribute("data-tts-theory")];
      if (!Lx) return;
      const txt = "Nhắc nhanh kiến thức của " + Lx.title + ". " +
        (Lx.flashcards || []).slice(0, 6).map(c => c.front + " " + c.back).join(" Tiếp theo. ");
      ttsToggle(txt, tb);
    };
    $("#pr-host").innerHTML = qs.map((q, i) => renderQuestion(q, i, "practice")).join("");
    qs.forEach((q, i) => wirePractice(q, i, pstate, w));
  }

  function wirePractice(q, i, pstate, w) {
    const card = $('.q-card[data-q="' + i + '"]');
    const solHost = card.querySelector(".sol-host");
    wireHint(card, q);
    function finished(correct) {
      pstate.answered++;
      S.recordTopic(PRACTICE_LESSON[w.id], correct);
      noteMistake(q, correct, { source: "luyen", lessonId: PRACTICE_LESSON[w.id], label: w.tag || w.title });
      if (correct) { pstate.correct++; if (!pstate.awarded[i]) { pstate.awarded[i] = 1; gain(E.EXP.quizCorrect); } }
      solHost.innerHTML = solutionHtml(q);
      if (pstate.answered === pstate.total && !pstate.done) { pstate.done = true; practiceComplete(pstate, w); }
    }
    if (q.type === "mc") {
      const opts = $$(".opt", card);
      opts.forEach(btn => btn.onclick = () => {
        if (card.dataset.locked) return;
        card.dataset.locked = "1";
        const k = Number(btn.getAttribute("data-opt"));
        const ok = E.checkMc(k, q);
        btn.classList.add(ok ? "correct" : "wrong", "selected");
        if (!ok) opts[q.answer].classList.add("correct");
        opts.forEach(o => o.classList.add("locked"));
        finished(ok);
      });
    } else if (q.type === "fill") {
      const input = card.querySelector("[data-fill]");
      const check = card.querySelector("[data-check]");
      const doCheck = () => {
        if (card.dataset.locked) return;
        card.dataset.locked = "1";
        const ok = E.checkFill(input.value, q);
        input.classList.add(ok ? "correct" : "wrong");
        input.disabled = true; check.disabled = true;
        if (!ok) solHost.insertAdjacentHTML("afterbegin",
          '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
        finished(ok);
      };
      check.onclick = doCheck;
      input.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
    }
  }

  function practiceComplete(pstate, w) {
    S.practiceRecord(w.id, pstate.correct, pstate.total);
    if (pstate.correct / pstate.total >= 0.5) S.log("practice", w.tag + " — " + w.title + " (" + pstate.correct + "/" + pstate.total + ")");
    checkBadges(); refreshChrome();
    const pass = pstate.correct / pstate.total >= 0.5;
    if (pstate.correct === pstate.total) E.confetti();
    const idx = D.practice.weeks.findIndex(x => x.id === w.id);
    const next = D.practice.weeks[idx + 1];
    const fin = $("#pr-finish");
    if (!fin) return;
    fin.innerHTML = `<div class="feedback ${pass ? "good" : "mid"} mt">
        <h4>${pass ? "✅" : "💪"} Kết quả: ${pstate.correct}/${pstate.total} câu đúng</h4>
        <p style="margin:4px 0 12px">${pass ? "Làm tốt lắm! " : "Xem lại lời giải rồi thử lại để chắc hơn nhé. "}${next ? "Sẵn sàng cho " + next.tag + " chưa?" : "Em đã hoàn thành bộ luyện tập cuối cùng! 🎉"}</p>
        <div class="row">
          <button class="btn" id="pr-retry">Làm lại bài này</button>
          ${next ? '<button class="btn ghost" id="pr-next">' + next.tag + " →</button>" : '<button class="btn ghost" id="pr-list">Về danh sách bài</button>'}
        </div>
      </div>`;
    const rt = $("#pr-retry"); if (rt) rt.onclick = () => renderPractice(w.id);
    const nx = $("#pr-next"); if (nx) nx.onclick = () => go("#/luyen-tap/" + next.id);
    const ls = $("#pr-list"); if (ls) ls.onclick = () => go("#/luyen-tap");
  }

  /* =======================================================================
     VIEW: RÈN TƯ DUY & TỰ LUẬN (cá nhân hoá)
     ===================================================================== */
  const SKILL_LABEL = {
    reasoning: { t: "Suy luận", e: "🧩" }, proof: { t: "Chứng minh", e: "📐" },
    modeling: { t: "Mô hình hoá", e: "🌍" }, explain: { t: "Giải thích", e: "💬" }
  };
  function thinkProblems() { return (D.thinking && D.thinking.problems) || []; }
  // Xếp thứ tự cá nhân hoá: chưa làm & thuộc chủ đề yếu lên đầu, rồi chưa làm, rồi đã làm
  function thinkOrdered() {
    const weak = new Set(S.weakTopics(2, 0.7).map(t => t.lessonId));
    const list = thinkProblems().map(p => ({
      p, done: S.thinkDone(p.id), weak: weak.has(p.lessonId)
    }));
    const score = x => (x.done ? 100 : 0) + (x.weak ? 0 : 10);
    return list.sort((a, b) => score(a) - score(b));
  }
  function thinkRecommend() {
    const ord = thinkOrdered().filter(x => !x.done);
    return ord.filter(x => x.weak).slice(0, 2).concat(ord.filter(x => !x.weak)).slice(0, 2);
  }

  function renderThinking(id) {
    if (id) { renderThinkProblem(id); return; }
    const ord = thinkOrdered();
    const total = ord.length, done = ord.filter(x => x.done).length;
    const rec = thinkRecommend();
    const recHtml = rec.length ? `
      <div class="card rec-card mb">
        <div class="section-title"><span class="ic">✨</span><h2>Đề xuất cho em</h2></div>
        <p class="soft" style="font-size:13.5px;margin:-2px 0 8px">${rec.some(x => x.weak) ? "Ưu tiên đúng phần em còn hay nhầm — làm thử nhé!" : "Bắt đầu với vài bài rèn tư duy sau:"}</p>
        <div class="rec-list">
          ${rec.map(x => {
            const sk = SKILL_LABEL[x.p.skill] || { t: x.p.skill, e: "🧠" };
            return `<button class="rec-item" data-go="${x.p.id}">
              <div class="rec-badges"><span class="skill-badge">${sk.e} ${sk.t}</span>${x.weak ? '<span class="weak-badge">★ nên ôn</span>' : ""}<span class="type-badge">${x.p.type === "essay" ? "Tự luận" : "Trắc nghiệm"}</span></div>
              <div class="rec-q">${esc(x.p.tag)}: ${esc(x.p.q)}</div>
            </button>`;
          }).join("")}
        </div>
      </div>` : "";

    // nhóm theo chương
    let lastTerm = "", listHtml = "";
    ord.forEach(x => {
      if (x.p.term !== lastTerm) { lastTerm = x.p.term; listHtml += '<div class="wk-chapter">' + esc(x.p.term) + "</div>"; }
      const sk = SKILL_LABEL[x.p.skill] || { t: x.p.skill, e: "🧠" };
      listHtml += `<button class="think-card ${x.done ? "done" : ""}" data-go="${x.p.id}">
          <div class="tk-top"><span class="skill-badge">${sk.e} ${sk.t}</span>
            <span class="type-badge">${x.p.type === "essay" ? "Tự luận" : "Trắc nghiệm"}</span>
            ${x.weak && !x.done ? '<span class="weak-badge">★ nên ôn</span>' : ""}
            ${x.done ? '<span class="tk-done">✓ đã làm</span>' : ""}</div>
          <div class="tk-q">${esc(x.p.tag)}: ${esc(x.p.q)}</div>
        </button>`;
    });

    setView(`<div class="section-title"><span class="ic">🧠</span><h2>Rèn tư duy & Tự luận</h2></div>
      <p class="soft mb">${esc(D.thinking.intro)}</p>
      <div class="card mb"><div class="row between"><b>Tiến độ</b><span class="soft">${done}/${total} bài đã làm</span></div>
        <div class="progress mt-sm"><span style="width:${total ? Math.round(done / total * 100) : 0}%"></span></div></div>
      ${recHtml}
      <div class="think-list">${listHtml}</div>`);
    $$("[data-go]").forEach(b => b.onclick = () => go("#/tu-duy/" + b.getAttribute("data-go")));
  }

  function renderThinkProblem(id) {
    const p = thinkProblems().find(x => x.id === id);
    if (!p) { go("#/tu-duy"); return; }
    const sk = SKILL_LABEL[p.skill] || { t: p.skill, e: "🧠" };
    const L = D.lessons[p.lessonId];
    const wasDone = S.thinkDone(p.id);
    titleEl.textContent = "Rèn tư duy";

    const head = `<button class="btn ghost sm mb" id="tk-back">⟵ Danh sách</button>
      <div class="wk-detail-term">${esc(p.term)} · ${esc(p.tag)}</div>
      <div class="think-badges mb">
        <span class="skill-badge">${sk.e} ${sk.t}</span>
        <span class="type-badge">${p.type === "essay" ? "Tự luận" : "Trắc nghiệm suy luận"}</span>
        ${wasDone ? '<span class="tk-done">✓ đã làm</span>' : ""}
      </div>`;

    if (p.type === "mc") {
      setView(head + `<div id="tk-host"></div>
        ${L ? `<button class="btn ghost sm mt" id="tk-theory">📖 Ôn lý thuyết: ${esc(L.title)}</button>` : ""}
        <div id="tk-next" class="mt"></div>`);
      $("#tk-host").innerHTML = renderQuestion(p, 0, "think");
      const card = $('.q-card[data-q="0"]');
      wireHint(card, p);
      const opts = $$(".opt", card);
      opts.forEach(btn => btn.onclick = () => {
        if (card.dataset.locked) return; card.dataset.locked = "1";
        const k = Number(btn.getAttribute("data-opt"));
        const ok = E.checkMc(k, p);
        btn.classList.add(ok ? "correct" : "wrong", "selected");
        if (!ok) opts[p.answer].classList.add("correct");
        opts.forEach(o => o.classList.add("locked"));
        card.querySelector(".sol-host").innerHTML = solutionHtml(p);
        S.recordTopic(p.lessonId, ok);
        noteMistake(p, ok, { source: "tuduy", lessonId: p.lessonId, label: p.tag });
        if (ok && !wasDone) gain(E.EXP.think);
        S.thinkRecord(p.id, ok ? "got" : "again");
        finishThink(p);
      });
    } else {
      // TỰ LUẬN: viết → xem lời giải mẫu + tiêu chí → tự chấm
      setView(head + `
        <div class="q-card">
          <div class="q-text">${esc(p.q)}</div>
          ${p.hint ? `<button class="q-hint" id="tk-hint">💡 Gợi ý</button><div class="hint-host"></div>` : ""}
          <textarea class="essay-input" id="tk-essay" rows="6" placeholder="Viết bài làm / lập luận của em ở đây (viết ra sẽ nhớ lâu hơn)…"></textarea>
          <button class="btn block mt" id="tk-reveal">Xem lời giải mẫu & tự chấm</button>
          <div id="tk-model"></div>
        </div>
        ${L ? `<button class="btn ghost sm mt" id="tk-theory">📖 Ôn lý thuyết: ${esc(L.title)}</button>` : ""}
        <div id="tk-next" class="mt"></div>`);
      const hintBtn = $("#tk-hint");
      if (hintBtn) hintBtn.onclick = () => { $(".hint-host").innerHTML = `<div class="hint"><b>💡 Gợi ý:</b> ${esc(p.hint)}</div>`; hintBtn.disabled = true; };
      $("#tk-reveal").onclick = () => {
        const rubric = (p.rubric || []).map((r, k) =>
          `<label class="rubric-item"><input type="checkbox" data-rk="${k}"><span>${esc(r)}</span></label>`).join("");
        $("#tk-model").innerHTML = `
          <div class="model-answer mt">
            <h4>📝 Lời giải mẫu</h4><p>${esc(p.sample)}</p>
          </div>
          <div class="rubric mt">
            <h4>✅ Tự chấm — em làm được những ý nào?</h4>
            ${rubric}
          </div>
          <p class="soft mt-sm" style="font-size:13px">So bài của em với lời giải mẫu, tick các ý đã làm đúng rồi tự đánh giá:</p>
          <div class="selfrate mt-sm">
            <button class="btn sm" data-rate="got">✅ Em làm được</button>
            <button class="btn sm ghost" data-rate="partial">🟡 Gần đúng</button>
            <button class="btn sm ghost" data-rate="again">🔴 Chưa được</button>
          </div>
          ${aiReady() ? '<button class="btn ghost block mt" id="tk-ai">🤖 Nhờ AI chấm bài của em (ChatGPT)</button><div id="tk-ai-out"></div>' : ""}`;
        $("#tk-reveal").disabled = true;
        $$("[data-rate]").forEach(b => b.onclick = () => {
          const rate = b.getAttribute("data-rate");
          S.recordTopic(p.lessonId, rate === "got");
          if (!wasDone) gain(E.EXP.essay);
          S.thinkRecord(p.id, rate);
          E.toast(rate === "got" ? '<span class="t-ic">🌟</span> Giỏi lắm! Đã ghi nhận.' : "Đã ghi nhận — phần này sẽ được nhắc ôn lại.");
          $$("[data-rate]").forEach(x => x.disabled = true);
          finishThink(p);
        });
        const aiBtn = $("#tk-ai");
        if (aiBtn) aiBtn.onclick = async () => {
          const work = ($("#tk-essay").value || "").trim();
          const out = $("#tk-ai-out");
          if (!work) { E.toast("Em viết bài làm vào ô phía trên trước đã nhé."); return; }
          aiBtn.disabled = true; aiBtn.textContent = "🤖 AI đang chấm…";
          out.innerHTML = '<div class="ai-feedback"><span class="typing"><span></span><span></span><span></span></span></div>';
          try {
            const prompt = "Hãy chấm bài tự luận Toán 9 của học sinh theo tiêu chí.\n" +
              "ĐỀ BÀI: " + p.q + "\n" +
              "LỜI GIẢI MẪU: " + p.sample + "\n" +
              "TIÊU CHÍ: " + (p.rubric || []).map((r, k) => (k + 1) + ") " + r).join(" ") + "\n" +
              "BÀI LÀM CỦA HỌC SINH: " + work + "\n" +
              "Yêu cầu trả lời: (1) điểm theo thang 10; (2) từng tiêu chí đạt/chưa đạt kèm giải thích 1 câu; (3) một lời khuyên cải thiện; (4) một lời động viên. Ngắn gọn.";
            const reply = await aiChat([
              { role: "system", content: aiSystemPrompt() },
              { role: "user", content: prompt }
            ]);
            out.innerHTML = '<div class="ai-feedback"><b>🤖 Nhận xét của AI:</b><br>' + aiToHtml(reply) + "</div>";
          } catch (e) {
            out.innerHTML = '<div class="ai-feedback err">⚠️ ' + esc(aiErrMsg(e)) + "</div>";
          }
          aiBtn.disabled = false; aiBtn.textContent = "🤖 Nhờ AI chấm bài của em (ChatGPT)";
        };
      };
    }

    const th = $("#tk-theory"); if (th) th.onclick = () => go("#/hoc/" + p.lessonId);
    const back = $("#tk-back"); if (back) back.onclick = () => go("#/tu-duy");
  }

  function finishThink(p) {
    const host = $("#tk-next"); if (!host) return;
    const nextRec = thinkRecommend().filter(x => x.p.id !== p.id)[0];
    host.innerHTML = `<div class="card tk-nextcard">
        <b>Làm tốt lắm! 🎉</b>
        <div class="row mt-sm" style="gap:8px;flex-wrap:wrap">
          ${nextRec ? `<button class="btn sm" id="tk-nextgo">Bài tiếp theo →</button>` : ""}
          <button class="btn ghost sm" id="tk-listgo">Về danh sách</button>
        </div>
      </div>`;
    const ng = $("#tk-nextgo"); if (ng && nextRec) ng.onclick = () => go("#/tu-duy/" + nextRec.p.id);
    const lg = $("#tk-listgo"); if (lg) lg.onclick = () => go("#/tu-duy");
  }

  /* =======================================================================
     VIEW: KIỂM TRA ĐỊNH KỲ (tính giờ, trộn chương) & TIẾN BỘ
     ===================================================================== */
  const TEST_N = 12, TEST_SECONDS = 12 * 60;
  let TEST_TIMER = null;
  function stopTestTimer() { if (TEST_TIMER) { clearInterval(TEST_TIMER); TEST_TIMER = null; } }

  // Chọn 12 câu trải đều các chương (round-robin theo term)
  function buildTest() {
    const byTerm = {};
    D.practice.weeks.forEach(w => {
      (byTerm[w.term] = byTerm[w.term] || []).push(
        ...w.questions.map(q => ({ q, wid: w.id, term: w.term, tag: w.tag })));
    });
    const groups = Object.values(byTerm).map(g => g.sort(() => Math.random() - .5));
    groups.sort(() => Math.random() - .5);
    const out = [];
    let gi = 0;
    while (out.length < TEST_N && groups.some(g => g.length)) {
      const g = groups[gi % groups.length];
      if (g.length) out.push(g.pop());
      gi++;
    }
    return out.sort(() => Math.random() - .5);
  }

  function renderTest() {
    stopTestTimer();
    const items = buildTest();
    const st = { answered: 0, correct: 0, total: items.length, start: Date.now(), done: false, byTerm: {} };

    setView(`<div class="section-title"><span class="ic">⏱️</span><h2>Kiểm tra định kỳ</h2></div>
      <p class="soft mb">${items.length} câu trộn từ nhiều chương · <b>${TEST_SECONDS / 60} phút</b>. Đây là "thước đo" để em thấy mình tiến bộ qua từng lần — cứ làm hết sức, sai cũng là dữ liệu quý!</p>
      <div class="test-bar card mb"><span>⏳ Còn lại: <b id="test-clock">--:--</b></span>
        <span id="test-count">0/${items.length} câu</span></div>
      <div id="test-host">${items.map((it, i) => renderQuestion(it.q, i, "test")).join("")}</div>`);

    // gỡ nút gợi ý trong bài kiểm tra (đo thực lực)
    $$("#test-host .q-hint").forEach(b => b.remove());

    const clock = $("#test-clock"), count = $("#test-count");
    let left = TEST_SECONDS;
    const tick = () => {
      const m = String(Math.floor(left / 60)).padStart(2, "0"), s = String(left % 60).padStart(2, "0");
      clock.textContent = m + ":" + s;
      if (left <= 60) clock.style.color = "var(--rose-500, #f43f5e)";
      if (left <= 0) { finishTest(true); return; }
      left--;
    };
    tick(); TEST_TIMER = setInterval(tick, 1000);

    function record(it, ok) {
      st.answered++;
      if (ok) st.correct++;
      const t = st.byTerm[it.term] || (st.byTerm[it.term] = { hit: 0, total: 0 });
      t.total++; if (ok) t.hit++;
      S.recordTopic(PRACTICE_LESSON[it.wid], ok);
      noteMistake(it.q, ok, { source: "kiemtra", lessonId: PRACTICE_LESSON[it.wid], label: it.tag });
      count.textContent = st.answered + "/" + st.total + " câu";
      if (st.answered === st.total) finishTest(false);
    }

    items.forEach((it, i) => {
      const q = it.q;
      const card = $('.q-card[data-q="' + i + '"]', $("#test-host"));
      const solHost = card.querySelector(".sol-host");
      if (q.type === "mc") {
        const opts = $$(".opt", card);
        opts.forEach(btn => btn.onclick = () => {
          if (st.done || card.dataset.locked) return; card.dataset.locked = "1";
          const k = Number(btn.getAttribute("data-opt"));
          const ok = E.checkMc(k, q);
          btn.classList.add(ok ? "correct" : "wrong", "selected");
          if (!ok) opts[q.answer].classList.add("correct");
          opts.forEach(o => o.classList.add("locked"));
          solHost.innerHTML = solutionHtml(q);
          record(it, ok);
        });
      } else if (q.type === "fill") {
        const input = card.querySelector("[data-fill]");
        const check = card.querySelector("[data-check]");
        const doCheck = () => {
          if (st.done || card.dataset.locked) return; card.dataset.locked = "1";
          const ok = E.checkFill(input.value, q);
          input.classList.add(ok ? "correct" : "wrong");
          input.disabled = true; check.disabled = true;
          if (!ok) solHost.insertAdjacentHTML("afterbegin",
            '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
          solHost.innerHTML += solutionHtml(q);
          record(it, ok);
        };
        check.onclick = doCheck;
        input.addEventListener("keydown", e => { if (e.key === "Enter") doCheck(); });
      }
    });

    function finishTest(timeout) {
      if (st.done) return; st.done = true; stopTestTimer();
      const sec = Math.min(TEST_SECONDS, Math.round((Date.now() - st.start) / 1000));
      const prev = S.testList().slice(-1)[0] || null;
      S.testRecord(st.correct, st.total, sec);
      S.log("test", "Kiểm tra định kỳ: " + st.correct + "/" + st.total);
      gain(E.EXP.quizCorrect * st.correct);
      checkBadges(); refreshChrome();
      const pct = Math.round(st.correct / st.total * 100);
      const prevPct = prev && prev.total ? Math.round(prev.score / prev.total * 100) : null;
      const delta = prevPct == null ? null : pct - prevPct;
      const deltaHtml = delta == null ? '<p class="soft">Đây là lần đầu — điểm này sẽ là mốc để so các lần sau. 💪</p>'
        : delta > 0 ? `<p class="delta up">📈 Tăng <b>+${delta}%</b> so với lần trước (${prevPct}%) — tiến bộ rõ rệt!</p>`
        : delta === 0 ? `<p class="delta">➡️ Bằng lần trước (${prevPct}%) — giữ vững phong độ, thử bứt phá lần tới!</p>`
        : `<p class="delta down">Lần trước ${prevPct}% — hôm nay chưa như ý, nhưng phần sai đã được ghi lại để ôn đúng chỗ. Cố lên! 🌱</p>`;
      const byTerm = Object.keys(st.byTerm).map(t => {
        const x = st.byTerm[t];
        return `<div class="row between" style="font-size:13.5px"><span>${esc(t)}</span><b>${x.hit}/${x.total}</b></div>`;
      }).join("");
      const mm = String(Math.floor(sec / 60)).padStart(2, "0"), ss = String(sec % 60).padStart(2, "0");
      const host = document.createElement("div");
      host.innerHTML = `<div class="card result-card mt">
          <h3 style="margin:0 0 4px">${timeout ? "⏰ Hết giờ!" : "🎉 Hoàn thành!"} Kết quả: <b>${st.correct}/${st.total}</b> (${pct}%)</h3>
          <p class="soft" style="margin:0 0 6px">Thời gian: ${mm}:${ss}</p>
          ${deltaHtml}
          <div class="mt-sm">${byTerm}</div>
          <div class="row mt" style="gap:8px;flex-wrap:wrap">
            <button class="btn sm" id="test-progress">📈 Xem tiến bộ</button>
            <button class="btn ghost sm" id="test-again">Làm đề khác</button>
          </div>
        </div>`;
      $("#test-host").prepend(host.firstElementChild);
      window.scrollTo({ top: 0, behavior: "smooth" });
      $("#test-progress").onclick = () => go("#/tien-bo");
      $("#test-again").onclick = () => renderTest();
    }
  }

  function renderProgress() {
    const tests = S.testList();
    const cal = S.calendarLast(14);
    const thisW = cal.slice(7).reduce((s, d) => s + d.minutes, 0);
    const lastW = cal.slice(0, 7).reduce((s, d) => s + d.minutes, 0);
    const wDelta = thisW - lastW;
    const weekMsg = lastW === 0 && thisW === 0 ? "Tuần này bắt đầu học là có dữ liệu ngay!"
      : wDelta > 0 ? `Nhiều hơn tuần trước <b>+${wDelta} phút</b> — chăm chỉ hơn rồi! 🔥`
      : wDelta === 0 ? "Bằng tuần trước — đều đặn là sức mạnh!"
      : `Ít hơn tuần trước ${-wDelta} phút — tuần này bù lại nhé 💪`;

    // điểm mạnh & cần cố gắng theo chủ đề
    const stats = Object.keys(S.state.topics || {}).map(id => S.topicStat(id)).filter(x => x && x.total >= 4);
    const strong = stats.filter(x => x.acc >= 0.8).sort((a, b) => b.acc - a.acc).slice(0, 3);
    const weak = S.weakTopics(3, 0.6).slice(0, 3);
    const topicRow = (t, cls) => {
      const L = D.lessons[t.lessonId]; if (!L) return "";
      return `<div class="prog-topic ${cls}"><b>${esc(L.title)}</b><span>${Math.round(t.acc * 100)}% đúng · ${t.total} câu</span></div>`;
    };

    const doneLessons = S.lessonsDoneCount(), doneP = S.practiceDoneCount(), doneT = S.thinkDoneCount();
    const best = Math.round(S.testBestPct() * 100);
    const longest = (S.state.streak && S.state.streak.longest) || 0;

    setView(`<div class="section-title"><span class="ic">📈</span><h2>Tiến bộ của em</h2></div>
      <div class="grid cols-3 mb">
        <div class="card stat"><div class="stat-num">${doneLessons}</div><div class="soft">bài học xong</div></div>
        <div class="card stat"><div class="stat-num">${doneP + doneT}</div><div class="soft">bộ luyện & bài tư duy</div></div>
        <div class="card stat"><div class="stat-num">${longest}🔥</div><div class="soft">chuỗi dài nhất</div></div>
      </div>

      <div class="card mb">
        <div class="section-title"><span class="ic">⏱️</span><h2>Điểm kiểm tra định kỳ</h2></div>
        ${tests.length ? `<canvas id="prog-tests"></canvas>
          <p class="soft mt-sm" style="font-size:13px">Điểm cao nhất: <b>${best}%</b> · ${tests.length} lần kiểm tra. Mỗi cột là một lần — cột sau cao hơn cột trước chính là tiến bộ!</p>`
        : `<p class="soft">Chưa có lần kiểm tra nào. Làm bài đầu tiên để tạo "mốc số 0" — từ đó mọi lần sau đều đo được em tiến bao xa.</p>
           <button class="btn mt-sm" id="prog-taketest">⏱️ Làm kiểm tra đầu tiên</button>`}
      </div>

      <div class="card mb">
        <div class="section-title"><span class="ic">📅</span><h2>Phút học 7 ngày qua</h2></div>
        <canvas id="prog-week"></canvas>
        <p class="soft mt-sm" style="font-size:13px">Tuần này: <b>${thisW} phút</b>. ${weekMsg}</p>
      </div>

      ${S.recCount() ? `<div class="card mb">
        <div class="section-title"><span class="ic">🎙️</span><h2>Nghe lại bài giảng của em</h2></div>
        <p class="soft" style="font-size:13px;margin:-2px 0 8px">Nghe lại chính mình giảng là cách ôn bài cực nhớ — và rất vui khi thấy giọng mình ngày càng tự tin!</p>
        <div id="rec-list">
          ${S.recList().slice(0, 6).map(r => {
            const Lx = D.lessons[r.lessonId]; if (!Lx) return "";
            const d = new Date(r.t);
            return `<div class="rec-item" data-rec="${r.lessonId}">
              <div class="ri-main"><b>${esc(Lx.title)}</b><span class="ri-sub">${d.getDate()}/${d.getMonth() + 1}${r.dur ? " · " + recFmt(r.dur) : ""}</span></div>
              <div class="ri-btns"><button class="btn ghost sm" data-rec-play="${r.lessonId}">▶ Nghe</button>
              <button class="btn ghost sm" data-rec-del="${r.lessonId}">🗑</button></div>
            </div>`;
          }).join("")}
        </div>
      </div>` : ""}
      <div class="grid cols-2">
        <div class="card"><div class="section-title"><span class="ic">💪</span><h2>Điểm mạnh</h2></div>
          ${strong.length ? strong.map(t => topicRow(t, "up")).join("") : '<p class="soft" style="font-size:13.5px">Làm thêm bài tập để lộ diện điểm mạnh nhé!</p>'}</div>
        <div class="card"><div class="section-title"><span class="ic">🌱</span><h2>Cần cố gắng</h2></div>
          ${weak.length ? weak.map(t => topicRow(t, "down")).join("") : '<p class="soft" style="font-size:13.5px">Tuyệt — hiện không có phần nào yếu rõ rệt!</p>'}</div>
      </div>
      <div class="row mt" style="gap:8px;flex-wrap:wrap">
        <button class="btn" id="prog-test2">⏱️ Làm kiểm tra định kỳ</button>
        <button class="btn ghost" id="prog-think">🧠 Rèn tư duy</button>
        <button class="btn ghost" id="prog-report">📋 Báo cáo tuần (gửi phụ huynh)</button>
      </div>
      ${reportCardHtml("progrep")}`);

    if (tests.length) {
      const last = tests.slice(-8);
      E.drawBars($("#prog-tests"), {
        labels: last.map(x => { const d = new Date(x.t); return (d.getDate()) + "/" + (d.getMonth() + 1); }),
        values: last.map(x => x.total ? Math.round(x.score / x.total * 100) : 0),
        color: "var(--brand)"
      });
    }
    E.drawBars($("#prog-week"), {
      labels: cal.slice(7).map(d => { const p = d.date.split("-"); return p[2] + "/" + p[1]; }),
      values: cal.slice(7).map(d => d.minutes),
      color: "var(--violet-500)"
    });
    const t1 = $("#prog-taketest"); if (t1) t1.onclick = () => go("#/kiem-tra");
    $("#prog-test2").onclick = () => go("#/kiem-tra");
    $("#prog-think").onclick = () => go("#/tu-duy");
    wireReport("progrep", "prog-report");
    $$("[data-rec-play]").forEach(b => b.onclick = () => {
      const id = b.getAttribute("data-rec-play");
      const src = S.recGet(id);
      if (!src) { E.toast("Không đọc được bản thu."); return; }
      const item = b.closest(".rec-item");
      item.insertAdjacentHTML("beforeend", `<audio controls autoplay style="width:100%;margin-top:8px" src="${src}"></audio>`);
      b.remove();
    });
    $$("[data-rec-del]").forEach(b => b.onclick = () => {
      const id = b.getAttribute("data-rec-del");
      S.recDelete(id);
      const item = b.closest(".rec-item"); if (item) item.remove();
      E.toast("Đã xoá bản thu.");
    });
  }

  /* =======================================================================
     BÁO CÁO TUẦN (xuất văn bản gửi phụ huynh)
     ===================================================================== */
  function fmtDM(d) { return d.getDate() + "/" + (d.getMonth() + 1); }
  function buildWeeklyReport() {
    const cal = S.calendarLast(14);
    const thisW = cal.slice(7), lastW = cal.slice(0, 7);
    const mins = thisW.reduce((s, d) => s + d.minutes, 0);
    const minsPrev = lastW.reduce((s, d) => s + d.minutes, 0);
    const daysActive = thisW.filter(d => d.minutes > 0).length;
    const from = new Date(thisW[0].date + "T00:00:00");
    const to = new Date(thisW[6].date + "T00:00:00");
    const weekStart = from.getTime();

    const H = S.state.history || [];
    const inWeek = H.filter(h => h.t >= weekStart);
    const lessons = inWeek.filter(h => h.type === "lesson").map(h => h.info).filter(Boolean);
    const nPractice = inWeek.filter(h => h.type === "practice").length;
    const badges = inWeek.filter(h => h.type === "badge").map(h => h.info).filter(Boolean);

    const allTests = S.testList();
    const tests = allTests.filter(x => x.t >= weekStart);
    const prevTest = allTests.filter(x => x.t < weekStart).slice(-1)[0] || null;
    let testLine = "• Kiểm tra định kỳ: chưa làm trong tuần này.";
    if (tests.length) {
      const lastT = tests[tests.length - 1];
      const pct = Math.round(lastT.score / lastT.total * 100);
      let cmp = "";
      const ref = tests.length >= 2 ? tests[tests.length - 2] : prevTest;
      if (ref && ref.total) {
        const d = pct - Math.round(ref.score / ref.total * 100);
        cmp = d > 0 ? ` (📈 tăng +${d}% so với lần trước)` : d === 0 ? " (giữ nguyên so với lần trước)" : ` (giảm ${-d}% so với lần trước — phần sai đã được ghi lại để ôn)`;
      }
      testLine = `• Kiểm tra định kỳ: ${tests.length} lần, gần nhất ${lastT.score}/${lastT.total} (${pct}%)${cmp}.`;
    }

    const stats = Object.keys(S.state.topics || {}).map(id => S.topicStat(id)).filter(x => x && x.total >= 4);
    const strong = stats.filter(x => x.acc >= 0.8).sort((a, b) => b.acc - a.acc).slice(0, 2)
      .map(t => (D.lessons[t.lessonId] || {}).title).filter(Boolean);
    const weak = S.weakTopics(3, 0.6).slice(0, 2)
      .map(t => (D.lessons[t.lessonId] || {}).title).filter(Boolean);

    const A = S.assignGet();
    const nTasks = (A.tasks || []).length;
    const nTasksDone = (A.tasks || []).filter(t => S.taskDone(t)).length;

    const streak = S.effectiveStreak();
    const name = (S.state.profile && S.state.profile.name) || "Con";

    const L = [];
    L.push(`📚 BÁO CÁO TUẦN — ${name} (Toán 9)`);
    L.push(`Tuần ${fmtDM(from)}–${fmtDM(to)}`);
    L.push("");
    L.push(`• Thời gian học: ${mins} phút, ${daysActive}/7 ngày có học` +
      (minsPrev ? (mins >= minsPrev ? ` (nhiều hơn tuần trước +${mins - minsPrev}')` : ` (ít hơn tuần trước ${minsPrev - mins}')`) : "") + ".");
    L.push(`• Chuỗi ngày học hiện tại: ${streak} ngày 🔥`);
    L.push(`• Bài học hoàn thành: ${lessons.length}` + (lessons.length ? ` (${lessons.slice(0, 3).join("; ")}${lessons.length > 3 ? "…" : ""})` : "") + ".");
    L.push(`• Luyện tập đạt: ${nPractice} bộ.`);
    L.push(testLine);
    if (nTasks) L.push(`• Bài được giao: hoàn thành ${nTasksDone}/${nTasks}.`);
    if (strong.length) L.push(`• Điểm mạnh: ${strong.join("; ")}.`);
    if (weak.length) L.push(`• Cần kèm thêm: ${weak.join("; ")}.`);
    if (badges.length) L.push(`• Huy hiệu mới: ${badges.join(", ")} 🏅`);
    L.push("");
    L.push(mins === 0 ? "Tuần này con chưa học — bố mẹ nhắc con mở app 30 phút mỗi tối nhé!"
      : weak.length ? "Nhờ bố mẹ động viên con ôn thêm phần \"cần kèm\" ở trên — app đã tự xếp bài ôn đúng chỗ đó. 🌱"
      : "Con đang học đều và tiến bộ — bố mẹ khen con một câu nhé! 🌟");
    L.push("— Tạo từ app Toán 9 Feynman");
    return L.join("\n");
  }

  function reportCardHtml(idPrefix) {
    return `<div class="card report-card mt" id="${idPrefix}-card" hidden>
        <div class="section-title"><span class="ic">📋</span><h2>Báo cáo tuần</h2></div>
        <textarea class="report-text" id="${idPrefix}-text" rows="14" readonly></textarea>
        <div class="row mt-sm" style="gap:8px">
          <button class="btn sm" id="${idPrefix}-copy">📄 Sao chép</button>
          <span class="soft" style="font-size:13px">Dán vào Zalo/Messenger gửi cho phụ huynh.</span>
        </div>
      </div>`;
  }
  function wireReport(idPrefix, btnId) {
    const btn = $("#" + btnId); if (!btn) return;
    btn.onclick = () => {
      const card = $("#" + idPrefix + "-card"), ta = $("#" + idPrefix + "-text");
      ta.value = buildWeeklyReport();
      card.hidden = false;
      if (card.scrollIntoView) try { card.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
    };
    const cp = $("#" + idPrefix + "-copy");
    if (cp) cp.onclick = () => {
      const ta = $("#" + idPrefix + "-text");
      const done = () => E.toast('<span class="t-ic">📋</span> Đã sao chép báo cáo!');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(done).catch(() => { ta.select(); try { document.execCommand("copy"); } catch (e) {} done(); });
      } else { ta.select(); try { document.execCommand("copy"); } catch (e) {} done(); }
    };
  }

  /* =======================================================================
     HỒ SƠ THÀNH VIÊN & SAO LƯU / CHUYỂN MÁY
     ===================================================================== */
  const PROFILE_EMOJIS = ["🦊", "🐼", "🐯", "🐰", "🦁", "🐨"];
  function reloadApp() { try { location.reload(); } catch (e) { route(); refreshChrome(); } }

  function profileChipSync() {
    const chip = $("#profile-chip"); if (!chip) return;
    const p = S.currentProfile();
    chip.innerHTML = `${p.emoji} <span id="profile-chip-name">${esc(p.name)}</span> <small>đổi ▾</small>`;
  }
  function showProfilePicker() {
    if ($("#profile-picker")) return;
    const list = S.profilesList();
    const cur = S.activeProfileId();
    const el = document.createElement("div");
    el.id = "profile-picker"; el.className = "tts-guide-backdrop";
    el.innerHTML = `<div class="tts-guide">
      <h3>👥 Ai đang học?</h3>
      <p class="soft" style="margin:2px 0 10px">Mỗi thành viên có tiến độ, huy hiệu và bài giảng riêng (tối đa 3 người).</p>
      <div class="profile-list">
        ${list.map(p => `<button class="profile-row ${p.id === cur ? "active" : ""}" data-prof="${p.id}">
            <span class="pf-emoji">${p.emoji}</span><b>${esc(p.name)}</b>
            ${p.id === cur ? '<span class="pf-now">đang dùng</span>' : ""}
          </button>`).join("")}
      </div>
      ${list.length < 3 ? `<div class="row mt" style="gap:8px">
          <input id="prof-new-name" class="psel" style="flex:1" placeholder="Tên thành viên mới…" maxlength="20">
          <button class="btn sm" id="prof-add">➕ Thêm</button>
        </div>` : '<p class="soft mt-sm" style="font-size:12.5px">Đã đủ 3 thành viên.</p>'}
      <div class="row mt" style="gap:8px"><button class="btn ghost sm" id="prof-close">Đóng</button></div>
    </div>`;
    document.body.appendChild(el);
    el.onclick = e => { if (e.target === el) el.remove(); };
    $("#prof-close").onclick = () => el.remove();
    $$("[data-prof]", el).forEach(b => b.onclick = () => {
      const id = b.getAttribute("data-prof");
      if (id === cur) { el.remove(); return; }
      S.setActiveProfile(id);
      el.remove();
      reloadApp();
    });
    const add = $("#prof-add");
    if (add) add.onclick = () => {
      const name = ($("#prof-new-name").value || "").trim();
      if (!name) { E.toast("Nhập tên thành viên đã nhé."); return; }
      const id = S.profileAdd(name, PROFILE_EMOJIS[S.profilesList().length % PROFILE_EMOJIS.length]);
      if (!id) { E.toast("Tối đa 3 thành viên."); return; }
      S.setActiveProfile(id);
      el.remove();
      reloadApp();
    };
  }
  function initProfileChip() {
    profileChipSync();
    const chip = $("#profile-chip");
    if (chip) chip.onclick = showProfilePicker;
  }

  function downloadBackup() {
    const p = S.currentProfile();
    const d = new Date();
    const name = "toan9-" + p.name.replace(/\s+/g, "-") + "-" + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + ".json";
    const blob = new Blob([S.exportState()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch (e) {} }, 4000);
    E.toast('<span class="t-ic">💾</span> Đã tạo tệp sao lưu — gửi Zalo hoặc mở trên máy khác để nhập.');
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  /* =======================================================================
     BỘ ĐẾM PHÚT HỌC TOÀN CỤC (không reset khi chuyển module)
     ===================================================================== */
  const TIMEBANK = { acc: 0, last: null, handle: null };
  function timebankTick(now) {
    now = now || Date.now();
    const visible = !document.hidden;
    if (TIMEBANK.last != null && visible) {
      TIMEBANK.acc += Math.min(Math.max(0, now - TIMEBANK.last), 60000); // chống nhảy khi máy ngủ
    }
    TIMEBANK.last = visible ? now : null;
    let credited = 0;
    while (TIMEBANK.acc >= 60000) {
      TIMEBANK.acc -= 60000;
      const before = S.minutesToday();
      S.recordStudyMinutes(1);
      credited++;
      const goal = (S.getGoals().min || 30);
      if (before < goal && before + 1 >= goal) goalReached(goal);
    }
    if (credited) refreshChrome();
    checkReminder(now);
  }
  function startTimebank() {
    if (TIMEBANK.handle) return;
    TIMEBANK.last = Date.now();
    TIMEBANK.handle = setInterval(() => timebankTick(), 15000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { timebankTick(); TIMEBANK.last = null; }
      else TIMEBANK.last = Date.now();
    });
  }

  // 🎉 Đủ mục tiêu phút hôm nay → tự mở phần thưởng trò chơi
  const GOAL_COUNTDOWN = 6;
  function goalReached(goal) {
    const today = (function () { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
    if (S.goalDayGet() === today || $("#goal-party")) return;
    S.goalDaySet();
    if (S.strictStatus().locked) { E.confetti(); E.toast('<span class="t-ic">🎉</span> Đã học đủ ' + goal + ' phút! Hoàn thành nốt bài bố mẹ giao là mở khu trò chơi nhé.'); return; }
    E.confetti();
    const el = document.createElement("div");
    el.id = "goal-party"; el.className = "tts-guide-backdrop";
    el.innerHTML = `<div class="tts-guide" style="text-align:center">
        <div style="font-size:46px">🎉</div>
        <h3>Học đủ ${goal} phút hôm nay!</h3>
        <p class="soft" style="margin:4px 0 12px">Não đã làm việc chăm chỉ — giờ là <b>phần thưởng trò chơi</b>!<br>
        Tự vào khu trò chơi sau <b id="gp-count">${GOAL_COUNTDOWN}</b> giây…</p>
        <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn" id="gp-play">🎮 Chơi ngay</button>
          <button class="btn ghost" id="gp-stay">Học tiếp đã 💪</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    let left = GOAL_COUNTDOWN;
    const h = setInterval(() => {
      left--; const c = $("#gp-count"); if (c) c.textContent = left;
      if (left <= 0) { clearInterval(h); el.remove(); go("#/game/thuong"); }
    }, 1000);
    $("#gp-play").onclick = () => { clearInterval(h); el.remove(); go("#/game/thuong"); };
    $("#gp-stay").onclick = () => { clearInterval(h); el.remove(); E.toast("Chăm quá! Khi nào muốn, khu 🎮 Trò chơi luôn mở."); };
  }

  // ⏰ Nhắc học theo lịch từng ngày trong tuần
  function checkReminder(now) {
    const rem = S.getReminder();
    if (!rem.enabled) return;
    const d = new Date(now || Date.now());
    const t = rem.times[d.getDay()];
    if (!t) return;
    const cur = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    if (cur < t) return;
    const key = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "|" + t;
    if (rem.lastNotified === key) return;
    const goal = S.getGoals().min || 30;
    if (S.minutesToday() >= goal) { S.reminderMark(key); return; } // đã học đủ thì khỏi nhắc
    S.reminderMark(key);
    const msg = "⏰ Đến giờ học Toán rồi! Mục tiêu hôm nay: " + goal + " phút — vào bài thôi!";
    try {
      if (window.Notification && Notification.permission === "granted") {
        new Notification("Toán 9 — Feynman", { body: msg });
      }
    } catch (e) {}
    E.toast('<span class="t-ic">⏰</span> ' + msg);
  }
  // hook cho kiểm thử
  if (window.App) window.App.TimeBank = { tick: timebankTick, _s: TIMEBANK };

  /* =======================================================================
     🎣 TẠO HỨNG THÚ — hook mở bài trước khi vào lý thuyết
     ===================================================================== */
  const HOOK_SEEN = {}; // mỗi bài chỉ hiện 1 lần trong phiên; mở app lần sau lại có
  function renderHook(L, host) {
    const h = L.hook;
    host.innerHTML = `<div class="step-panel hook-panel">
        <div class="hook-eyebrow">🎣 Tạo hứng thú · 3 phút <button class="hook-skip" id="hook-skip">Bỏ qua →</button></div>
        <div class="hook-emoji">${h.emoji}</div>
        <div class="hook-q">${h.q}</div>
        <p class="hook-think">🤔 Khoan kéo xuống — em thử <b>tự đoán</b> trong 30 giây đã!</p>
        <div id="hook-reveal-host"></div>
        <div class="row mt" style="gap:8px;flex-wrap:wrap">
          <button class="btn block" id="hook-reveal-btn" style="flex:1">🔍 Bật mí bí mật Toán học</button>
        </div>
      </div>`;
    mountTts(host, h.q, ".hook-q");
    const done = () => { HOOK_SEEN[L.id] = 1; showStep(1); };
    $("#hook-skip").onclick = done;
    $("#hook-reveal-btn").onclick = () => {
      $("#hook-reveal-host").innerHTML = `<div class="hook-reveal">${h.reveal}</div>`;
      const btn = $("#hook-reveal-btn");
      btn.textContent = "🚀 Vào bài học ngay!";
      btn.onclick = done;
      const rv = $(".hook-reveal");
      mountTtsInline(rv, h.reveal);
    };
  }
  // nút nghe nhỏ gắn vào cuối một khối bất kỳ
  function mountTtsInline(el, text) {
    if (!el) return;
    const btn = document.createElement("button");
    btn.className = "tts-btn"; btn.textContent = "🔊 Nghe giảng";
    btn.onclick = () => ttsToggle(text, btn);
    el.appendChild(btn);
  }

  /* =======================================================================
     🤖 AI MENTOR THẬT (OpenAI/ChatGPT — khoá API của người dùng, lưu trên máy)
     ===================================================================== */
  const AI_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"];
  function aiReady() { return !!(S.aiGet().key || "").trim(); }
  function aiSystemPrompt() {
    const weak = S.weakTopics(3, 0.6).slice(0, 3)
      .map(t => (D.lessons[t.lessonId] || {}).title).filter(Boolean);
    const name = (S.state.profile && S.state.profile.name) || "em";
    return [
      "Bạn là cô giáo Toán lớp 9 tận tâm, dạy theo SGK 'Kết nối tri thức' (Việt Nam).",
      "Học sinh tên " + name + ". Luôn trả lời bằng tiếng Việt, thân thiện, xưng 'cô' gọi 'em'.",
      "Nguyên tắc dạy: giải thích bản chất bằng ví dụ đời thực trước, rồi mới tới công thức.",
      "Với bài tập: KHÔNG giải hộ ngay. Gợi ý bước 1, hỏi lại để em tự nghĩ; chỉ đưa lời giải đầy đủ khi em yêu cầu rõ hoặc đã thử 2 lần.",
      "Trình bày ngắn gọn (tối đa ~200 từ), xuống dòng thoáng, dùng ký hiệu đơn giản (√, x², ≤).",
      "Nếu câu hỏi ngoài Toán/học tập, nhẹ nhàng lái về việc học.",
      weak.length ? ("Em này đang yếu các phần: " + weak.join("; ") + " — khi liên quan, hãy củng cố kỹ hơn.") : ""
    ].filter(Boolean).join(" ");
  }
  async function aiChat(messages) {
    const cfg = S.aiGet();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.key.trim() },
      body: JSON.stringify({ model: cfg.model || "gpt-4o-mini", messages: messages, temperature: 0.7, max_tokens: 700 })
    });
    if (!res.ok) {
      let detail = ""; try { detail = (await res.json()).error.message || ""; } catch (e) {}
      const err = new Error(detail || ("HTTP " + res.status));
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    return ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "").trim();
  }
  function aiErrMsg(e) {
    if (e && e.status === 401) return "Khoá API không đúng hoặc đã bị thu hồi — em kiểm tra lại trong Cài đặt nhé.";
    if (e && e.status === 429) return "Tài khoản OpenAI hết hạn mức hoặc gửi quá nhanh — thử lại sau ít phút.";
    if (e && e.status) return "Máy chủ AI báo lỗi (" + e.status + "). Thử lại sau nhé.";
    return "Không kết nối được tới AI — kiểm tra mạng giúp cô nhé.";
  }
  // chuyển văn bản AI thành HTML an toàn (escape rồi mới xuống dòng + **đậm**)
  function aiToHtml(text) {
    return esc(text)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");
  }

  /* =======================================================================
     VIEW: SỔ TAY LỖI SAI (ôn lại chính câu đã sai theo lịch)
     ===================================================================== */
  const MK_SOURCE_LABEL = { hoc: "Bài học", luyen: "Luyện tập", tuduy: "Rèn tư duy", kiemtra: "Kiểm tra", thithu: "Thi thử vào 10", ai: "AI ra đề", rama: "Góc Ramanujan", vohan: "Luyện vô hạn" };

  function renderMistakes() {
    const due = S.mistakesDueList();
    const all = S.mistakesList();
    const later = all.length - due.length;

    if (!all.length) {
      setView(`<div class="section-title"><span class="ic">📕</span><h2>Sổ tay lỗi sai</h2></div>
        <div class="card empty-note">
          <div style="font-size:40px">🎉</div>
          <p><b>Chưa có lỗi nào — tuyệt vời!</b></p>
          <p class="soft" style="font-size:13.5px">Khi em làm sai một câu ở bài học, luyện tập, rèn tư duy hay kiểm tra, câu đó sẽ tự vào đây để ôn lại đúng chỗ. Cứ học tự nhiên nhé!</p>
        </div>`);
      return;
    }
    if (!due.length) {
      setView(`<div class="section-title"><span class="ic">📕</span><h2>Sổ tay lỗi sai</h2></div>
        <div class="card empty-note">
          <div style="font-size:40px">✅</div>
          <p><b>Hôm nay không còn câu nào cần ôn!</b></p>
          <p class="soft" style="font-size:13.5px">Em đang giữ ${all.length} câu trong sổ, chúng sẽ hiện lại đúng ngày cần ôn (cách quãng để nhớ lâu). Quay lại vào ngày mai nhé!</p>
        </div>
        <button class="btn ghost block mt" id="mk-review-anyway">Vẫn muốn ôn lại ${all.length} câu ngay</button>`);
      $("#mk-review-anyway").onclick = () => startMistakeReview(all.slice());
      return;
    }
    setView(`<div class="section-title"><span class="ic">📕</span><h2>Sổ tay lỗi sai</h2></div>
      <p class="soft mb">Đây là <b>chính những câu em từng làm sai</b>. Làm lại đúng câu mình đã sai là cách nhớ chắc nhất. Làm đúng <b>3 lần</b> (cách quãng vài ngày) thì câu đó "tốt nghiệp" khỏi sổ. 💪</p>
      <div class="card mk-summary">
        <div><div class="mk-big">${due.length}</div><span class="soft">câu cần ôn hôm nay</span></div>
        <div><div class="mk-big">${all.length}</div><span class="soft">tổng trong sổ</span></div>
        ${later > 0 ? `<div><div class="mk-big">${later}</div><span class="soft">đang chờ tới ngày</span></div>` : ""}
      </div>
      <button class="btn block mt" id="mk-start">🔁 Ôn lại ${due.length} câu ngay</button>
      <div class="mk-list mt">
        ${all.slice().sort((a,b)=>(a.box-b.box)).map(m => `
          <div class="mk-item">
            <div class="mk-info">
              <span class="mk-src">${MK_SOURCE_LABEL[m.source] || "Khác"}${m.label ? " · " + esc(m.label) : ""}</span>
              <span class="mk-q">${esc((m.q.q || "").slice(0, 70))}${(m.q.q || "").length > 70 ? "…" : ""}</span>
              <span class="mk-meta">Đã sai ${m.wrongCount || 1} lần · ${boxLabel(m)}</span>
            </div>
            <button class="btn ghost sm" data-mk-del="${m.id}">🗑</button>
          </div>`).join("")}
      </div>`);
    $("#mk-start").onclick = () => startMistakeReview(due.slice());
    $$("[data-mk-del]").forEach(b => b.onclick = () => {
      S.mistakeRemove(b.getAttribute("data-mk-del"));
      renderMistakes();
    });
  }
  function boxLabel(m) {
    const today = new Date().toISOString().slice(0, 10);
    if (m.due <= today) return "cần ôn hôm nay";
    return "ôn lại ngày " + m.due.split("-").reverse().slice(0, 2).join("/");
  }

  function startMistakeReview(queue) {
    let i = 0, fixed = 0, again = 0;
    function next() {
      if (i >= queue.length) return doneReview();
      const m = queue[i];
      const q = m.q;
      const src = MK_SOURCE_LABEL[m.source] || "Khác";
      setView(`<div class="section-title"><span class="ic">🔁</span><h2>Ôn lại lỗi sai</h2></div>
        <div class="mk-progress">Câu ${i + 1}/${queue.length} · ${src}${m.label ? " · " + esc(m.label) : ""}</div>
        <div id="mk-host"></div>
        <div class="row mt"><button class="btn ghost sm" id="mk-quit">⟵ Thoát</button></div>`);
      $("#mk-quit").onclick = () => go("#/loi-sai");
      const host = $("#mk-host");
      host.innerHTML = renderQuestion(q, 0, "mk");
      const card = $('.q-card[data-q="0"]', host);
      const solHost = card.querySelector(".sol-host");
      wireHint(card, q);
      let answered = false;
      const settle = (correct) => {
        if (answered) return; answered = true;
        solHost.innerHTML = solutionHtml(q);
        const res = S.mistakeReview(m.id, correct);
        if (correct) fixed++; else again++;
        const note = document.createElement("div");
        note.className = "mk-result " + (correct ? "ok" : "no");
        note.innerHTML = correct
          ? (res === "graduated"
              ? '🎓 <b>Tốt nghiệp!</b> Em đã làm đúng câu này đủ vững — gỡ khỏi sổ. Giỏi lắm!'
              : '✅ <b>Đúng rồi!</b> Câu này sẽ hiện lại sau vài ngày để chắc chắn em nhớ.')
          : '💡 <b>Chưa đúng.</b> Xem lời giải rồi ghi nhớ nhé — câu này sẽ được hỏi lại sớm.';
        note.innerHTML += '<div class="row mt-sm"><button class="btn sm" id="mk-next">' + (i + 1 >= queue.length ? "Xem kết quả →" : "Câu tiếp →") + "</button></div>";
        card.appendChild(note);
        $("#mk-next").onclick = () => { i++; next(); };
      };
      if (q.type === "mc") {
        const opts = $$(".opt", card);
        opts.forEach(btn => btn.onclick = () => {
          if (answered) return;
          const k = Number(btn.getAttribute("data-opt"));
          const ok = E.checkMc(k, q);
          btn.classList.add(ok ? "correct" : "wrong", "selected");
          if (!ok) opts[q.answer].classList.add("correct");
          opts.forEach(o => o.classList.add("locked"));
          settle(ok);
        });
      } else if (q.type === "fill") {
        const input = card.querySelector("[data-fill]");
        const check = card.querySelector("[data-check]");
        const go2 = () => {
          if (answered) return;
          const ok = E.checkFill(input.value, q);
          input.classList.add(ok ? "correct" : "wrong");
          input.disabled = true; check.disabled = true;
          if (!ok) solHost.insertAdjacentHTML("afterbegin", '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
          settle(ok);
        };
        check.onclick = go2;
        input.addEventListener("keydown", e => { if (e.key === "Enter") go2(); });
      }
    }
    function doneReview() {
      if (fixed > 0) { gain(E.EXP.quizCorrect * fixed); refreshChrome(); }
      setView(`<div class="arena"><div class="arena-end win">
          <div class="arena-end-emoji">🔁</div>
          <h2>Ôn xong ${queue.length} câu!</h2>
          <p>Làm đúng <b>${fixed}</b> câu${again ? ", còn <b>" + again + "</b> câu cần ôn tiếp (sẽ hiện lại sớm)" : " — sạch sổ đợt này"}. Kiên trì sửa lỗi là bí quyết của học sinh giỏi! 🌟</p>
          <div class="arena-end-actions">
            <button class="btn primary" id="mk-back">Về sổ lỗi sai</button>
            <button class="btn ghost" id="mk-home">Trang chính</button>
          </div></div></div>`);
      $("#mk-back").onclick = () => go("#/loi-sai");
      $("#mk-home").onclick = () => go("#/dashboard");
    }
    next();
  }

  /* =======================================================================
     VIEW: BẢN ĐỒ CÂY KIẾN THỨC
     ===================================================================== */
  // Mức thành thạo mỗi bài: 0 chưa học · 1 đang học · 2 đã xong · 3 thành thạo
  function lessonLevel(id) {
    const L = S.lesson(id);
    const stepsDone = Object.keys(L.steps || {}).filter(k => L.steps[k]).length;
    const stat = S.topicStat ? S.topicStat(id) : null;
    if (L.done && stat && stat.total >= 4 && stat.acc >= 0.85) return 3;
    if (L.done) return 2;
    if (stepsDone > 0) return 1;
    return 0;
  }
  const LEVEL_INFO = [
    { key: "lv0", label: "Chưa học", ic: "" },
    { key: "lv1", label: "Đang học", ic: "✏️" },
    { key: "lv2", label: "Đã xong", ic: "✓" },
    { key: "lv3", label: "Thành thạo", ic: "★" }
  ];

  function renderTree() {
    const reachable = new Set();
    D.chapters.forEach(c => c.lessons.forEach(id => reachable.add(id)));
    const total = reachable.size;
    let counts = [0, 0, 0, 0];
    reachable.forEach(id => counts[lessonLevel(id)]++);
    const doneish = counts[2] + counts[3];
    const pct = total ? Math.round(doneish / total * 100) : 0;

    const chaptersHtml = D.chapters.map((c, ci) => {
      const lvls = c.lessons.map(lessonLevel);
      const cDone = lvls.filter(v => v >= 2).length;
      const cPct = c.lessons.length ? Math.round(cDone / c.lessons.length * 100) : 0;
      const nodes = c.lessons.map(id => {
        const L = D.lessons[id]; if (!L) return "";
        const lv = lessonLevel(id);
        const info = LEVEL_INFO[lv];
        const shortT = (L.title || "").replace(/^Bài\s*\d+:\s*/, "");
        return `<button class="tree-node ${info.key}" data-tree="${id}" title="${esc(L.title)}">
            <span class="tn-dot">${lv === 3 ? "★" : lv === 2 ? "✓" : (L.emoji || "•")}</span>
            <span class="tn-label">${esc(shortT)}</span>
          </button>`;
      }).join("");
      return `<div class="tree-chapter">
          <div class="tree-spine-dot" style="background:${c.color || "var(--brand)"}">${ci + 1}</div>
          <div class="tree-chapter-body">
            <div class="tree-ch-head">
              <span class="tch-emoji">${c.emoji || "📘"}</span>
              <b>${esc(c.name)}</b>
              <span class="tch-pct">${cPct}%</span>
            </div>
            <div class="tree-nodes">${nodes}</div>
          </div>
        </div>`;
    }).join("");

    setView(`<div class="section-title"><span class="ic">🗺️</span><h2>Bản đồ cây kiến thức</h2></div>
      <p class="soft mb">Toàn cảnh hành trình Toán 9 của em. Mỗi ô là một bài — màu cho biết mức thành thạo. Bấm vào ô bất kỳ để học hoặc ôn lại.</p>
      <div class="card tree-top">
        <div class="tree-overall">
          <div class="tree-big">${pct}%</div>
          <div class="soft">bản đồ đã chinh phục<br>${doneish}/${total} bài đã xong${counts[3] ? " · " + counts[3] + " bài thành thạo ★" : ""}</div>
        </div>
        <div class="tree-legend">
          ${LEVEL_INFO.map((x, k) => `<span class="tl-item"><span class="tl-dot ${x.key}">${x.ic}</span>${x.label} (${counts[k]})</span>`).join("")}
        </div>
      </div>
      <div class="tree-map">${chaptersHtml}</div>`);

    $$("[data-tree]").forEach(b => b.onclick = () => go("#/hoc/" + b.getAttribute("data-tree")));
  }

  /* =======================================================================
     🎓 THI THỬ VÀO 10 — 90 phút, thang điểm 10, chấm theo trọng số
     ===================================================================== */
  const EXAM_MINUTES = 90;
  function examRank(score) {
    if (score >= 8) return { label: "Giỏi", emoji: "🏆", note: "Phong độ thi thật rồi — giữ vững nhé!" };
    if (score >= 6.5) return { label: "Khá", emoji: "👍", note: "Nền tảng tốt! Soát kỹ các ý sai để lên Giỏi." };
    if (score >= 5) return { label: "Trung bình", emoji: "📈", note: "Đã qua mức an toàn — luyện thêm phần mất điểm." };
    return { label: "Cần cố gắng", emoji: "💪", note: "Đừng nản: xem lời giải, ôn Sổ lỗi sai rồi thi lại!" };
  }

  function renderExamHub() {
    const hist = S.examList().slice().reverse().slice(0, 5);
    const best = S.examBest();
    setView(`<div class="section-title"><span class="ic">🎓</span><h2>Thi thử vào 10</h2></div>
      <p class="soft mb">Đề mô phỏng đúng cấu trúc đề tuyển sinh vào lớp 10: căn thức → hệ phương trình & bài toán thực tế → phương trình bậc hai & Vi-ét → hình học đường tròn → câu khó chốt điểm. <b>90 phút · thang điểm 10</b>, chấm theo trọng số từng ý như chấm thật.</p>
      ${best ? `<div class="card exam-best">🥇 Kỷ lục của em: <b>${best.score} điểm</b> (${D.exams.find(e => e.id === best.deId)?.name || best.deId}, ${best.date.split("-").reverse().join("/")})</div>` : ""}
      <div class="exam-list">
        ${D.exams.map(e => {
          const b = S.examBest(e.id);
          return `<button class="exam-card" data-de="${e.id}">
            <div class="ec-head"><b>📄 ${e.name}</b>${b ? `<span class="ec-best">tốt nhất: ${b.score}đ</span>` : '<span class="ec-new">chưa thi</span>'}</div>
            <span class="ec-desc">${esc(e.desc)}</span>
            <span class="ec-meta">⏱ 90 phút · ${e.questions.length} ý · 10 điểm</span>
          </button>`;
        }).join("")}
      </div>
      ${hist.length ? `<div class="section-title mt"><span class="ic">🗓</span><h2>Lần thi gần đây</h2></div>
        <div class="card">${hist.map(h => `<div class="exam-hist-row"><span>${(D.exams.find(e => e.id === h.deId) || {}).name || h.deId}</span><span class="soft">${h.date.split("-").reverse().join("/")}</span><b>${h.score}đ</b></div>`).join("")}</div>` : ""}`);
    $$("[data-de]").forEach(b => b.onclick = () => go("#/thi-thu/" + b.getAttribute("data-de")));
  }

  // Sinh đề cho LẦN THI NÀY: số liệu ngẫu nhiên (nếu có gen) + trộn thứ tự đáp án
  function materializeExam(de) {
    const qs = de.questions.map(src => {
      let q = Object.assign({}, src);
      if (src.gen && D.examGen && D.examGen[src.gen]) {
        try { q = Object.assign({}, src, D.examGen[src.gen](src.genArg)); } catch (e) { q = Object.assign({}, src); }
      }
      if (q.type === "mc" && Array.isArray(q.options)) {
        const correct = q.options[q.answer];
        const arr = q.options.slice();
        for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; }
        q.options = arr; q.answer = arr.indexOf(correct);
      }
      return q;
    });
    return { id: de.id, name: de.name, desc: de.desc, questions: qs };
  }

  function renderExam(deId) {
    const src = D.exams.find(e => e.id === deId);
    if (!src) { renderExamHub(); return; }
    const de = materializeExam(src);
    const startAt = Date.now();
    let endAt = startAt + EXAM_MINUTES * 60 * 1000;
    let submitted = false;
    const warned = {};
    const answers = {}; // idx -> {picked | text}

    setView(`<div class="exam">
      <div class="exam-timerbar" id="exam-timerbar">
        <span>🎓 ${esc(de.name)} — Thi thử vào 10</span>
        <b id="exam-clock">90:00</b>
        <button class="btn sm" id="exam-submit">📤 Nộp bài</button>
      </div>
      <p class="soft" style="margin:10px 0">Làm như thi thật: không tra bài học, tự tính nháp. Hết 90 phút bài sẽ <b>tự nộp</b>. Chúc em bình tĩnh — đọc kỹ đề! 🍀</p>
      <div id="exam-body">
        ${de.questions.map((q, i) => `
          <div class="exam-q" data-x="${i}">
            <div class="eq-head"><b>${esc(q.cau)}</b><span class="eq-pts">${q.points} điểm</span></div>
            <div class="eq-text">${q.q}</div>
            ${q.type === "mc"
              ? `<div class="q-opts">${q.options.map((o, k) => `<button class="q-opt ex-opt" data-k="${k}">${esc(o)}</button>`).join("")}</div>`
              : `<div class="row" style="gap:8px"><input class="fill-input ex-fill" placeholder="Đáp án…" autocomplete="off"></div>`}
          </div>`).join("")}
      </div>
      <button class="btn primary block mt" id="exam-submit2">📤 Nộp bài & xem điểm</button>
      <div class="row mt-sm"><button class="btn ghost sm" id="exam-quit">⟵ Thoát (không lưu)</button></div>
    </div>`);

    // chọn đáp án (đổi được tới khi nộp)
    $$(".exam-q").forEach(qEl => {
      const i = +qEl.getAttribute("data-x");
      $$(".ex-opt", qEl).forEach(btn => btn.onclick = () => {
        if (submitted) return;
        answers[i] = { picked: +btn.getAttribute("data-k") };
        $$(".ex-opt", qEl).forEach(x => x.classList.toggle("selected", x === btn));
      });
      const inp = qEl.querySelector(".ex-fill");
      if (inp) inp.oninput = () => { answers[i] = { text: inp.value }; };
    });

    function fmtClock(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    }
    function tick() {
      if (submitted) return;
      const left = endAt - Date.now();
      const clock = $("#exam-clock");
      if (clock) clock.textContent = fmtClock(left);
      if (left <= 15 * 60 * 1000 && !warned.m15) { warned.m15 = 1; E.toast("⏳ Còn 15 phút — soát lại các câu bỏ trống nhé!"); }
      if (left <= 5 * 60 * 1000 && !warned.m5) { warned.m5 = 1; const tb = $("#exam-timerbar"); tb && tb.classList.add("danger"); E.toast("🚨 Còn 5 phút — điền hết đáp án rồi nộp!"); }
      if (left <= 0) { E.toast("⏰ Hết giờ! Bài được nộp tự động."); grade(true); }
    }
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(tick, 1000);
    if (window.App) {
      window.App._exam = { submit: () => grade(false), shiftEnd: (ms) => { endAt = Date.now() + ms; } };
      window.App._examAnswers = de.questions.map(q => ({ type: q.type, answer: q.answer }));
    }

    function grade(auto) {
      if (submitted) return; submitted = true;
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
      const secs = Math.round((Date.now() - startAt) / 1000);
      let score = 0; const results = [];
      de.questions.forEach((q, i) => {
        const a = answers[i];
        let ok = false;
        if (q.type === "mc") ok = !!a && E.checkMc(a.picked, q);
        else ok = !!a && E.checkFill(a.text || "", q);
        if (ok) score += q.points;
        else noteMistake(q, false, { source: "thithu", label: de.name + " · " + q.cau });
        results.push({ q: q, ok: ok, a: a });
      });
      score = Math.round(score * 100) / 100;
      S.examRecord(de.id, score, 10, secs);
      const exp = 40 + (score >= 8 ? 20 : 0);
      S.addExp(exp); S.log("exam", de.name + " — " + score + "đ");
      checkBadges(); refreshChrome();
      if (score >= 8) E.confetti();
      renderExamResult(de, score, secs, results, exp, auto);
    }
    $("#exam-submit").onclick = () => confirmSubmit();
    $("#exam-submit2").onclick = () => confirmSubmit();
    $("#exam-quit").onclick = () => { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } go("#/thi-thu"); };
    function confirmSubmit() {
      const blank = de.questions.filter((q, i) => !answers[i] || (answers[i].text !== undefined && !String(answers[i].text).trim())).length;
      if (blank > 0 && !confirm("Còn " + blank + " ý chưa làm. Nộp bài luôn chứ?")) return;
      grade(false);
    }
  }

  function renderExamResult(de, score, secs, results, exp, auto) {
    const rk = examRank(score);
    const wrong = results.filter(r => !r.ok).length;
    const mins = Math.floor(secs / 60), rs = secs % 60;
    setView(`<div class="exam-result">
      <div class="card exam-score ${score >= 8 ? "gold" : ""}">
        <div class="es-emoji">${rk.emoji}</div>
        <div class="es-score">${score}<span>/10</span></div>
        <div class="es-rank">Xếp loại: <b>${rk.label}</b>${auto ? " · (tự nộp khi hết giờ)" : ""}</div>
        <div class="soft">${rk.note}</div>
        <div class="soft mt-sm">⏱ Làm trong ${mins} phút ${rs} giây · +${exp} EXP</div>
      </div>
      ${wrong ? `<div class="card mk-due-card mt"><b>📕 ${wrong} ý sai đã vào Sổ tay lỗi sai</b><div class="soft" style="font-size:13px">Ôn lại theo lịch để lần thi sau không mất điểm chỗ cũ.</div></div>` : ""}
      <div class="section-title mt"><span class="ic">📋</span><h2>Chi tiết & lời giải</h2></div>
      ${results.map(r => `
        <div class="exam-q ${r.ok ? "eq-ok" : "eq-no"}">
          <div class="eq-head"><b>${r.ok ? "✅" : "❌"} ${esc(r.q.cau)}</b><span class="eq-pts">${r.ok ? "+" + r.q.points : "0"}/${r.q.points} điểm</span></div>
          <div class="eq-text">${r.q.q}</div>
          <div class="soft" style="font-size:13px;margin:4px 0">
            Em trả lời: <b>${r.a ? esc(r.q.type === "mc" ? (r.q.options[r.a.picked] ?? "—") : (r.a.text || "—")) : "—"}</b>
            ${r.ok ? "" : " · Đáp án đúng: <b>" + esc(r.q.type === "mc" ? r.q.options[r.q.answer] : String(r.q.answer)) + "</b>"}
          </div>
          <div class="sol-block"><b>Lời giải:</b><ol>${r.q.sol.map(st => "<li>" + st + "</li>").join("")}</ol></div>
        </div>`).join("")}
      <div class="row mt" style="gap:8px;flex-wrap:wrap">
        <button class="btn primary" id="exr-again" style="flex:1">🔁 Thi lại đề này</button>
        ${wrong ? '<button class="btn" id="exr-mk" style="flex:1">📕 Ôn lỗi sai ngay</button>' : ""}
        <button class="btn ghost" id="exr-hub">Chọn đề khác</button>
      </div>
    </div>`);
    $("#exr-again").onclick = () => renderExam(de.id);
    const mk = $("#exr-mk"); if (mk) mk.onclick = () => go("#/loi-sai");
    $("#exr-hub").onclick = () => go("#/thi-thu");
  }

  /* =======================================================================
     🤖 AI RA ĐỀ VÔ HẠN THEO ĐIỂM YẾU (cần khoá API ChatGPT)
     ===================================================================== */
  function weakLabels(n) {
    const weak = S.weakTopics(3, 0.6).slice(0, n || 3);
    return weak.map(w => {
      const L = D.lessons[w.id];
      return { id: w.id, title: L ? L.title : w.id, acc: Math.round((w.acc || 0) * 100) };
    });
  }
  function renderAiDrill() {
    const weak = weakLabels(3);
    if (!aiReady()) {
      setView(`<div class="section-title"><span class="ic">🤖</span><h2>AI ra đề theo điểm yếu</h2></div>
        <div class="card empty-note">
          <div style="font-size:40px">🔑</div>
          <p><b>Cần bật AI Mentor trước</b></p>
          <p class="soft" style="font-size:13.5px">Tính năng này nhờ ChatGPT tự soạn câu hỏi mới đúng chủ đề em hay sai — luyện mãi không hết bài. Vào Cài đặt → AI Mentor để dán khoá API.</p>
          <button class="btn mt" id="aid-setup">⚙️ Mở Cài đặt</button>
        </div>`);
      $("#aid-setup").onclick = () => go("#/cai-dat");
      return;
    }
    setView(`<div class="section-title"><span class="ic">🤖</span><h2>AI ra đề theo điểm yếu</h2></div>
      <p class="soft mb">ChatGPT sẽ soạn <b>câu hỏi mới hoàn toàn</b> đúng dạng em hay sai, kèm lời giải từng bước. Bấm là có đề mới — luyện bao nhiêu cũng được.</p>
      <div class="card">
        <div class="s-text" style="margin-bottom:8px"><b>Chủ đề đang yếu của em</b>
          <span>${weak.length ? weak.map(w => esc(w.title.replace(/^Bài\s*\d+:\s*/, "")) + " (" + w.acc + "%)").join(" · ") : "Chưa đủ dữ liệu — AI sẽ ra đề tổng hợp Toán 9."}</span></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <select id="aid-topic" class="psel" style="flex:1;min-width:180px">
            <option value="">🎯 Tự động (theo điểm yếu)</option>
            ${allLessons().map(L => '<option value="' + L.id + '">' + esc(L.title) + "</option>").join("")}
          </select>
          <select id="aid-level" class="psel" style="max-width:150px">
            <option value="co ban">Mức cơ bản</option>
            <option value="trung binh" selected>Mức vừa</option>
            <option value="nang cao">Mức nâng cao</option>
          </select>
        </div>
        <button class="btn primary block mt" id="aid-go">✨ Tạo 3 câu mới</button>
        <p class="soft mt-sm" style="font-size:12.5px" id="aid-status"></p>
      </div>
      <div id="aid-host"></div>`);
    $("#aid-go").onclick = generate;

    async function generate() {
      const btn = $("#aid-go"), st = $("#aid-status");
      const topicId = $("#aid-topic").value;
      const level = $("#aid-level").value;
      const topicName = topicId ? (D.lessons[topicId] || {}).title
        : (weak.length ? weak.map(w => w.title).join(", ") : "tổng hợp Toán 9");
      btn.disabled = true;
      st.innerHTML = '<span class="typing"><span></span><span></span><span></span></span> AI đang soạn đề…';
      $("#aid-host").innerHTML = "";
      const sys = "Bạn là giáo viên Toán 9 Việt Nam (SGK Kết nối tri thức). Soạn câu hỏi trắc nghiệm CHÍNH XÁC về mặt toán học, số liệu đẹp, phù hợp học sinh lớp 9. "
        + "CHỈ trả về JSON thuần, không markdown, không giải thích ngoài JSON. Định dạng: "
        + '{"questions":[{"q":"đề bài","options":["A","B","C","D"],"answer":0,"sol":["bước 1","bước 2"]}]}. '
        + "answer là chỉ số (0-3) của phương án ĐÚNG. Mỗi câu có 2-4 bước giải ngắn gọn tiếng Việt.";
      const usr = "Soạn 3 câu trắc nghiệm mới về chủ đề: " + topicName + ". Mức độ: " + level + ". "
        + "Không lặp lại đề quen thuộc, thay số liệu mới. Kiểm tra kỹ đáp án trước khi trả về.";
      try {
        const raw = await aiChat([{ role: "system", content: sys }, { role: "user", content: usr }]);
        const clean = raw.replace(/```json|```/g, "").trim();
        const obj = JSON.parse(clean);
        const qs = (obj.questions || []).filter(q => q && q.q && Array.isArray(q.options) && q.options.length === 4
          && typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3);
        if (!qs.length) throw new Error("AI trả về dữ liệu không dùng được, thử lại nhé.");
        st.textContent = "✅ Đã có " + qs.length + " câu mới. Làm xong bấm tạo tiếp nhé!";
        renderAiQuestions(qs, topicId || (weak[0] && weak[0].id) || "");
      } catch (e) {
        st.innerHTML = '<span style="color:var(--rose-500)">⚠️ ' + esc(e instanceof SyntaxError ? "AI trả lời sai định dạng — bấm tạo lại giúp mình." : aiErrMsg(e)) + "</span>";
      }
      btn.disabled = false;
    }

    function renderAiQuestions(qs, lessonId) {
      const host = $("#aid-host");
      host.innerHTML = qs.map((q, i) => `
        <div class="q-card aiq" data-q="${i}">
          <div class="q-topic">🤖 Câu ${i + 1} · AI soạn</div>
          <div class="q-text">${esc(q.q)}</div>
          <div class="q-opts">${q.options.map((o, k) => '<button class="q-opt opt" data-opt="' + k + '">' + esc(String(o)) + "</button>").join("")}</div>
          <div class="sol-host"></div>
        </div>`).join("");
      qs.forEach((q, i) => {
        const card = $('.aiq[data-q="' + i + '"]', host);
        const opts = $$(".opt", card);
        let answered = false;
        opts.forEach(btn => btn.onclick = () => {
          if (answered) return; answered = true;
          const k = Number(btn.getAttribute("data-opt"));
          const ok = k === q.answer;
          btn.classList.add(ok ? "correct" : "wrong", "selected");
          if (!ok && opts[q.answer]) opts[q.answer].classList.add("correct");
          opts.forEach(o => o.classList.add("locked"));
          const sol = Array.isArray(q.sol) ? q.sol : [String(q.sol || "")];
          card.querySelector(".sol-host").innerHTML =
            '<div class="sol-block"><b>' + (ok ? "✅ Chính xác!" : "💡 Lời giải") + "</b><ol>" + sol.map(x => "<li>" + esc(String(x)) + "</li>").join("") + "</ol></div>";
          if (lessonId) S.recordTopic(lessonId, ok);
          if (ok) { gain(E.EXP.quizCorrect); refreshChrome(); }
          else noteMistake({ type: "mc", q: q.q, options: q.options, answer: q.answer, sol: sol }, false,
            { source: "ai", lessonId: lessonId, label: "AI ra đề" });
        });
      });
      try { mathifyElement(host); } catch (e) {}
    }
  }

  /* =======================================================================
     🔮 GÓC RAMANUJAN — Quan sát → Đoán → Kiểm chứng → Chứng minh → Giải nhanh
     ===================================================================== */
  function renderRamaHub() {
    const done = S.ramaDoneCount(), total = D.rama.length;
    setView(`<div class="section-title"><span class="ic">🔮</span><h2>Góc Ramanujan</h2></div>
      <div class="card rama-intro">
        <p style="margin:0 0 8px"><b>Srinivasa Ramanujan</b> (1887–1920) là nhà toán học Ấn Độ tự học, nổi tiếng vì <b>nhìn ra quy luật</b> từ hàng đống con số cụ thể — nhiều công thức ông viết ra khiến cả thế giới mất hàng chục năm mới chứng minh nổi.</p>
        <p class="soft" style="margin:0">Ở đây em học <b>đúng cách nghĩ đó</b>, nhưng có thêm bước ông từng bị chê thiếu: <b>chứng minh</b>. Năm bước mỗi khám phá:</p>
        <div class="rama-steps">
          <span>👀 Quan sát</span><span>🔮 Đoán</span><span>✅ Kiểm chứng</span><span>📐 Chứng minh</span><span>⚡ Giải nhanh</span>
        </div>
      </div>
      <div class="rama-progress card">
        <div><div class="mk-big">${done}/${total}</div><span class="soft">khám phá đã chinh phục</span></div>
        <div class="prog"><span style="width:${total ? Math.round(done / total * 100) : 0}%"></span></div>
      </div>
      <div class="rama-list mt">
        ${D.rama.map((r, i) => {
          const st = S.ramaGet(r.id);
          return `<button class="rama-card ${st.done ? "done" : ""}" data-rama="${r.id}">
            <span class="rc-emoji">${r.emoji}</span>
            <span class="rc-body"><b>${esc(r.title)}</b>
              <span class="rc-meta">${st.done ? "✅ Đã khám phá" : st.guessed ? "✏️ Đang làm dở" : "Khám phá thứ " + (i + 1)}</span></span>
            <span class="rc-go">→</span>
          </button>`;
        }).join("")}
      </div>`);
    $$("[data-rama]").forEach(b => b.onclick = () => go("#/ramanujan/" + b.getAttribute("data-rama")));
  }

  function renderRama(id) {
    const R = D.rama.find(x => x.id === id);
    if (!R) { renderRamaHub(); return; }
    let stage = 1; // 1 quan sát+đoán · 2 kiểm chứng+chứng minh · 3 giải nhanh
    let applyIdx = 0, applyOk = 0;

    function shell(inner) {
      setView(`<div class="rama-view">
        <div class="rama-head">
          <span class="rh-emoji">${R.emoji}</span>
          <div><b>${esc(R.title)}</b><div class="soft" style="font-size:12.5px">Góc Ramanujan · bước ${stage}/3</div></div>
        </div>
        ${inner}
        <div class="row mt"><button class="btn ghost sm" id="rama-back">⟵ Danh sách khám phá</button></div>
      </div>`);
      $("#rama-back").onclick = () => go("#/ramanujan");
    }

    function stepObserve() {
      stage = 1;
      shell(`
        <div class="card rama-story">${R.story}</div>
        <div class="section-title mt"><span class="ic">👀</span><h2>Bước 1 — Quan sát</h2></div>
        <p class="soft" style="margin:0 0 8px">Ramanujan không đọc lời giải; ông viết ra vài trường hợp nhỏ rồi <b>ngồi nhìn</b>. Em nhìn bảng này thật kỹ nhé:</p>
        <table class="rama-table">${R.observe.map(row => `<tr><td>${row[0]}</td><td class="rt-eq">=</td><td><b>${row[1]}</b></td></tr>`).join("")}</table>
        <p class="rama-hint">💡 ${R.observeNote}</p>
        <div class="section-title mt"><span class="ic">🔮</span><h2>Bước 2 — Đoán trước khi biết</h2></div>
        <div class="q-card">
          <div class="q-text">${R.guess.q}</div>
          <div class="row" style="gap:8px"><input class="fill-input" id="rama-guess" placeholder="Dự đoán của em…" autocomplete="off"><button class="btn" id="rama-check">Kiểm chứng</button></div>
          <div id="rama-guess-res"></div>
        </div>`);
      const inp = $("#rama-guess");
      const submit = () => {
        const ok = E.checkFill(inp.value, { answer: R.guess.answer, accept: R.guess.accept });
        S.ramaGuess(R.id);
        inp.classList.add(ok ? "correct" : "wrong");
        $("#rama-guess-res").innerHTML = ok
          ? '<div class="mk-result ok">🎉 <b>Chuẩn không cần chỉnh!</b> Em vừa làm đúng điều Ramanujan làm: nhìn số → thấy quy luật.<div class="row mt-sm"><button class="btn sm" id="rama-next">Xem quy luật đầy đủ →</button></div></div>'
          : '<div class="mk-result no">Chưa trúng — nhưng <b>đoán sai là một phần của khám phá</b>! Đáp án là <b>' + esc(R.guess.answer) + "</b>. Xem tiếp để hiểu vì sao nhé.<div class=\"row mt-sm\"><button class=\"btn sm\" id=\"rama-next\">Xem quy luật →</button></div></div>";
        if (ok) { gain(E.EXP.quizCorrect); refreshChrome(); }
        $("#rama-next").onclick = stepRule;
      };
      $("#rama-check").onclick = submit;
      inp.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    }

    function stepRule() {
      stage = 2;
      shell(`
        <div class="section-title"><span class="ic">✅</span><h2>Bước 3 — Quy luật</h2></div>
        <div class="card rama-rule">${R.rule}</div>
        <div class="section-title mt"><span class="ic">📐</span><h2>Bước 4 — Chứng minh</h2></div>
        <p class="soft" style="margin:0 0 8px">Ramanujan hay bỏ qua bước này và bị các nhà toán học phê bình. Em thì <b>không được bỏ</b> — đoán ra rồi phải chứng minh mới chắc chắn đúng:</p>
        <div class="card"><ol class="rama-proof">${R.proof.map(p => "<li>" + p + "</li>").join("")}</ol></div>
        <button class="btn primary block mt" id="rama-apply">⚡ Dùng quy luật này giải nhanh →</button>`);
      $("#rama-apply").onclick = () => { applyIdx = 0; applyOk = 0; stepApply(); };
    }

    function stepApply() {
      stage = 3;
      const q = R.apply[applyIdx];
      shell(`
        <div class="section-title"><span class="ic">⚡</span><h2>Bước 5 — Giải nhanh (${applyIdx + 1}/${R.apply.length})</h2></div>
        <div class="card rama-rule mini">${R.rule}</div>
        <div id="rama-q-host"></div>`);
      const host = $("#rama-q-host");
      host.innerHTML = renderQuestion(q, 0, "rama");
      const card = $('.q-card[data-q="0"]', host);
      const solHost = card.querySelector(".sol-host");
      wireHint(card, q);
      let answered = false;
      const settle = (ok) => {
        if (answered) return; answered = true;
        if (ok) { applyOk++; gain(E.EXP.quizCorrect); refreshChrome(); }
        solHost.innerHTML = solutionHtml(q);
        if (!ok) noteMistake(q, false, { source: "rama", label: R.title });
        const note = document.createElement("div");
        note.className = "mk-result " + (ok ? "ok" : "no");
        note.innerHTML = (ok ? "✅ <b>Nhanh như Ramanujan!</b>" : "💡 Xem lại lời giải rồi thử tiếp nhé.")
          + '<div class="row mt-sm"><button class="btn sm" id="rama-next2">'
          + (applyIdx + 1 < R.apply.length ? "Câu tiếp →" : "Hoàn thành khám phá →") + "</button></div>";
        card.appendChild(note);
        $("#rama-next2").onclick = () => {
          if (applyIdx + 1 < R.apply.length) { applyIdx++; stepApply(); }
          else finish();
        };
      };
      if (q.type === "mc") {
        const opts = $$(".opt", card);
        opts.forEach(btn => btn.onclick = () => {
          if (answered) return;
          const k = Number(btn.getAttribute("data-opt"));
          const ok = E.checkMc(k, q);
          btn.classList.add(ok ? "correct" : "wrong", "selected");
          if (!ok) opts[q.answer].classList.add("correct");
          opts.forEach(o => o.classList.add("locked"));
          settle(ok);
        });
      } else {
        const input = card.querySelector("[data-fill]");
        const check = card.querySelector("[data-check]");
        const go2 = () => {
          if (answered) return;
          const ok = E.checkFill(input.value, q);
          input.classList.add(ok ? "correct" : "wrong");
          input.disabled = true; check.disabled = true;
          if (!ok) solHost.insertAdjacentHTML("afterbegin", '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
          settle(ok);
        };
        check.onclick = go2;
        input.addEventListener("keydown", e => { if (e.key === "Enter") go2(); });
      }
    }

    function finish() {
      const first = S.ramaDone(R.id);
      if (first) { gain(E.EXP.feynman); S.log("rama", R.title); }
      checkBadges(); refreshChrome();
      if (applyOk === R.apply.length) E.confetti();
      setView(`<div class="arena"><div class="arena-end win">
          <div class="arena-end-emoji">${R.emoji}</div>
          <h2>Khám phá xong!</h2>
          <p>Em vừa đi trọn con đường của một nhà toán học: <b>quan sát → đoán → kiểm chứng → chứng minh → dùng được</b>. Giải đúng ${applyOk}/${R.apply.length} câu áp dụng.${first ? " <b>+" + E.EXP.feynman + " EXP</b> 🎉" : ""}</p>
          <p class="soft">“Một phương trình với tôi chẳng có ý nghĩa gì, trừ khi nó diễn tả một ý nghĩ của Thượng đế.” — Ramanujan</p>
          <div class="arena-end-actions">
            <button class="btn primary" id="rama-more">Khám phá tiếp</button>
            <button class="btn ghost" id="rama-home">Trang chính</button>
          </div></div></div>`);
      $("#rama-more").onclick = () => go("#/ramanujan");
      $("#rama-home").onclick = () => go("#/dashboard");
    }

    stepObserve();
  }

  /* =======================================================================
     ⚡ HÔM NAY 5 PHÚT — một việc nhỏ app chọn sẵn · 🎣 TÒ MÒ HÔM NAY
     ===================================================================== */
  const D5_TARGET = { review: 3, flip: 5, hook: 1, step: 1 };
  const D5_EXP = 15;
  function hookOfDay() {
    const all = allLessons().filter(L => L.hook);
    if (!all.length) return null;
    const notDone = all.filter(L => !S.lesson(L.id).done);
    const pool = notDone.length ? notDone : all;
    const d = new Date();
    const doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    return pool[doy % pool.length];
  }
  function pickDaily5() {
    const cur = S.daily5Get();
    if (cur) return cur;
    let task;
    if (S.mistakesDueCount() > 0) {
      task = { kind: "review", label: "Ôn lại 3 câu em từng làm sai", est: "≈3 phút", route: "#/loi-sai", icon: "📕" };
    } else if (S.srsDueCount() > 0) {
      task = { kind: "flip", label: "Lật 5 thẻ ghi nhớ đến hạn", est: "≈3 phút", route: "#/flashcard", icon: "🃏" };
    } else {
      const h = hookOfDay();
      if (h) task = { kind: "hook", ref: h.id, label: "Khám phá 1 điều tò mò về Toán", est: "≈2 phút", route: "#hook", icon: "🎣" };
      else { const nl = nextLesson(); task = { kind: "step", ref: nl && nl.id, label: "Học 1 bước bài mới", est: "≈5 phút", route: "#/hoc/" + (nl && nl.id), icon: "📚" }; }
    }
    task.base = S.counter(task.kind);
    return S.daily5Set(task);
  }
  function daily5Check() {
    const t = S.daily5Get();
    if (!t || t.done) return;
    const need = D5_TARGET[t.kind] || 1;
    if (S.counter(t.kind) - (t.base || 0) >= need) {
      if (S.daily5Done()) {
        gain(D5_EXP);
        E.toast('<span class="t-ic">⚡</span> <b>Xong việc 5 phút hôm nay!</b> +' + D5_EXP + ' EXP — học tiếp hay nghỉ đều ổn.');
        const card = $(".today5"); if (card) card.outerHTML = daily5Card();
      }
    }
  }
  function daily5Card() {
    const t = pickDaily5();
    if (t.done) {
      return `<div class="card today5 done">
        <div class="t5-left"><div class="t5-eyebrow">⚡ HÔM NAY · 5 PHÚT</div>
          <b>✅ Đã xong việc hôm nay</b>
          <span class="soft">Điểm danh thành công. Muốn học thêm? Mọi thứ bên dưới đều mở.</span></div>
      </div>`;
    }
    return `<div class="card today5">
      <div class="t5-left"><div class="t5-eyebrow">⚡ HÔM NAY · 5 PHÚT</div>
        <b>${t.icon} ${esc(t.label)}</b>
        <span class="soft">${t.est} · làm xong là đủ điểm danh hôm nay</span></div>
      <button class="btn primary" id="t5-go">Bắt đầu →</button>
    </div>`;
  }
  function hookOfDayCard() {
    const h = hookOfDay();
    if (!h) return "";
    return `<div class="card hod" id="hod-card" data-hod="${h.id}">
      <div class="t5-eyebrow">🎣 TÒ MÒ HÔM NAY</div>
      <div class="hod-q"><span class="hod-emoji">${h.hook.emoji}</span> ${h.hook.q}</div>
      <div id="hod-reveal"></div>
      <div class="row mt-sm" style="gap:8px;flex-wrap:wrap">
        <button class="btn sm" id="hod-btn">🔍 Xem 1 phút</button>
      </div>
    </div>`;
  }
  function wireDaily5() {
    const t = S.daily5Get();
    const go5 = $("#t5-go");
    if (go5 && t) go5.onclick = () => {
      if (t.route === "#hook") { const b = $("#hod-btn"); if (b) { b.click(); const c = $("#hod-card"); c && c.scrollIntoView && c.scrollIntoView({ behavior: "smooth", block: "center" }); } return; }
      go(t.route);
    };
    const hb = $("#hod-btn");
    if (hb) hb.onclick = () => {
      const id = $("#hod-card").getAttribute("data-hod");
      const L = D.lessons[id]; if (!L || !L.hook) return;
      $("#hod-reveal").innerHTML = '<div class="hook-reveal">' + L.hook.reveal + "</div>";
      HOOK_SEEN[id] = 1;
      S.bump("hook");
      hb.textContent = "🚀 Vào bài này";
      hb.onclick = () => go("#/hoc/" + id);
      daily5Check();
      const card = $("#hod-card"); if (card) { const t5 = $(".today5"); if (t5 && S.daily5Get() && S.daily5Get().done) t5.outerHTML = daily5Card(); }
    };
  }

  /* =======================================================================
     ♾️ LUYỆN VÔ HẠN — bài tập sinh tự động theo kỹ năng, không bao giờ cạn
     ===================================================================== */
  function renderInfinite(skillId) {
    if (!skillId) {
      setView(`<div class="section-title"><span class="ic">♾️</span><h2>Luyện vô hạn</h2></div>
        <p class="soft mb">Mỗi lần bấm là một <b>bộ 10 câu mới</b>, số liệu khác nhau — luyện tới khi thành phản xạ. Chọn kỹ năng:</p>
        <div class="game-hub">
          ${D.skills.map(sk => {
            const st = S.topicStat ? S.topicStat(sk.lessonId) : null;
            return `<button class="skill-card" data-skill="${sk.id}">
              <div class="gc-emoji">${sk.emoji}</div><b>${esc(sk.title)}</b>
              <span>${st && st.total ? "Độ chính xác: " + Math.round(st.acc * 100) + "% (" + st.total + " câu)" : "Chưa luyện"}</span>
            </button>`;
          }).join("")}
        </div>`);
      $$("[data-skill]").forEach(b => b.onclick = () => go("#/vo-han/" + b.getAttribute("data-skill")));
      return;
    }
    const sk = D.skills.find(x => x.id === skillId);
    if (!sk) { renderInfinite(); return; }
    const qs = []; for (let i = 0; i < 10; i++) qs.push(sk.gen());
    let answered = 0, correct = 0;
    setView(`<div class="section-title"><span class="ic">${sk.emoji}</span><h2>${esc(sk.title)}</h2></div>
      <div class="row between mb" style="align-items:center"><span class="soft">Bộ 10 câu sinh ngẫu nhiên · <b id="inf-score">0/0</b></span>
        <button class="btn ghost sm" id="inf-new">🔁 Bộ khác</button></div>
      <div id="inf-host">${qs.map((q, i) => renderQuestion(q, i, "inf")).join("")}</div>
      <div class="card mt" id="inf-done" hidden></div>
      <div class="row mt"><button class="btn ghost sm" id="inf-back">⟵ Chọn kỹ năng khác</button></div>`);
    $("#inf-new").onclick = () => renderInfinite(skillId);
    $("#inf-back").onclick = () => go("#/vo-han");
    qs.forEach((q, i) => {
      const card = $('.q-card[data-q="' + i + '"]');
      const solHost = card.querySelector(".sol-host");
      wireHint(card, q);
      let done = false;
      const settle = ok => {
        if (done) return; done = true;
        answered++; if (ok) correct++;
        $("#inf-score").textContent = correct + "/" + answered;
        solHost.innerHTML = solutionHtml(q);
        S.recordTopic(sk.lessonId, ok);
        if (ok) { gain(E.EXP.quizCorrect); refreshChrome(); }
        else noteMistake(q, false, { source: "vohan", lessonId: sk.lessonId, label: sk.title });
        if (answered === qs.length) {
          const pct = Math.round(correct / qs.length * 100);
          const box = $("#inf-done"); box.hidden = false;
          box.innerHTML = "<b>" + (pct >= 90 ? "🏆 Xuất sắc!" : pct >= 70 ? "👍 Tốt lắm!" : "💪 Cứ luyện tiếp!") + "</b> Đúng " + correct + "/" + qs.length + " (" + pct + "%). " +
            (pct >= 90 ? "Kỹ năng này đã thành phản xạ — chuyển sang kỹ năng khác nhé." : "Làm thêm một bộ nữa để chắc tay.") +
            '<div class="row mt-sm" style="gap:8px"><button class="btn sm" id="inf-again">🔁 Bộ mới ngay</button></div>';
          if (pct >= 90) E.confetti();
          $("#inf-again").onclick = () => renderInfinite(skillId);
        }
      };
      if (q.type === "mc") {
        const opts = $$(".opt", card);
        opts.forEach(btn => btn.onclick = () => {
          if (done) return;
          const k = Number(btn.getAttribute("data-opt"));
          const ok = E.checkMc(k, q);
          btn.classList.add(ok ? "correct" : "wrong", "selected");
          if (!ok) opts[q.answer].classList.add("correct");
          opts.forEach(o => o.classList.add("locked"));
          settle(ok);
        });
      } else {
        const input = card.querySelector("[data-fill]");
        const check = card.querySelector("[data-check]");
        const go2 = () => {
          if (done) return;
          const ok = E.checkFill(input.value, q);
          input.classList.add(ok ? "correct" : "wrong"); input.disabled = true; check.disabled = true;
          if (!ok) solHost.insertAdjacentHTML("afterbegin", '<p class="mt-sm" style="color:var(--rose-500);font-weight:700">Đáp án đúng: ' + esc(q.answer) + "</p>");
          settle(ok);
        };
        check.onclick = go2;
        input.addEventListener("keydown", e => { if (e.key === "Enter") go2(); });
      }
    });
  }

  /* =======================================================================
     ✍️ TẬP VIẾT CHỨNG MINH HÌNH HỌC — sắp xếp bước + chọn căn cứ
     ===================================================================== */
  function renderProofs(pid) {
    if (!pid) {
      setView(`<div class="section-title"><span class="ic">✍️</span><h2>Tập viết chứng minh</h2></div>
        <div class="card rama-intro">
          <p style="margin:0 0 6px"><b>Hình học chứng minh chiếm 2,5 điểm đề thi vào 10</b> — và là phần nhiều bạn mất điểm nhất, không phải vì không hiểu, mà vì <b>không biết viết cho có căn cứ</b>.</p>
          <p class="soft" style="margin:0">Ở đây em luyện đúng kỹ năng đó: các bước chứng minh bị xáo trộn, em <b>sắp lại đúng thứ tự</b> và <b>chọn căn cứ</b> (định lí/tính chất) cho các bước then chốt — y như cách giám khảo chấm.</p>
        </div>
        <div class="rama-list mt">
          ${D.proofs.map((p, i) => {
            const st = S.lesson("proof:" + p.id);
            return `<button class="rama-card ${st.done ? "done" : ""}" data-proof="${p.id}">
              <span class="rc-emoji">${p.emoji}</span>
              <span class="rc-body"><b>${esc(p.title)}</b><span class="rc-meta">${st.done ? "✅ Đã hoàn thành" : "Bài " + (i + 1) + " · " + p.steps.length + " bước"}</span></span>
              <span class="rc-go">→</span></button>`;
          }).join("")}
        </div>`);
      $$("[data-proof]").forEach(b => b.onclick = () => go("#/chung-minh/" + b.getAttribute("data-proof")));
      return;
    }
    const P = D.proofs.find(x => x.id === pid);
    if (!P) { renderProofs(); return; }
    // xáo trộn bước
    const order = P.steps.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    if (order.every((v, i) => v === i)) order.reverse();
    let placed = [];   // chỉ số bước đã đặt theo thứ tự em chọn
    let phase = 1;

    function render() {
      setView(`<div class="proof-view">
        <div class="rama-head"><span class="rh-emoji">${P.emoji}</span><div><b>${esc(P.title)}</b><div class="soft" style="font-size:12.5px">Tập viết chứng minh · ${phase === 1 ? "Bước 1/2: sắp xếp" : "Bước 2/2: căn cứ"}</div></div></div>
        <div class="card proof-gt"><div><b>Giả thiết:</b> ${P.given}</div><div class="mt-sm"><b>Kết luận:</b> ${P.prove}</div></div>
        <p class="rama-hint">💡 ${P.tip}</p>
        ${phase === 1 ? `
          <div class="section-title mt"><span class="ic">🔀</span><h2>Bấm các bước theo đúng thứ tự</h2></div>
          <div class="proof-pool" id="proof-pool">
            ${order.filter(i => placed.indexOf(i) === -1).map(i => `<button class="proof-step" data-st="${i}">${P.steps[i].t}</button>`).join("")}
          </div>
          <div class="section-title mt"><span class="ic">📝</span><h2>Bài chứng minh của em</h2></div>
          <ol class="proof-list" id="proof-list">
            ${placed.map((i, k) => `<li><span>${P.steps[i].t}</span><button class="proof-undo" data-un="${k}" title="Bỏ bước này">✕</button></li>`).join("")}
            ${placed.length ? "" : '<li class="soft" style="list-style:none">Chưa có bước nào — bấm vào các bước ở trên.</li>'}
          </ol>
          <button class="btn primary block mt" id="proof-check1" ${placed.length === P.steps.length ? "" : "disabled"}>Kiểm tra thứ tự</button>`
        : `
          <div class="section-title mt"><span class="ic">📐</span><h2>Chọn căn cứ cho các bước then chốt</h2></div>
          <ol class="proof-list final" id="proof-final">
            ${P.steps.map((st, i) => `<li><span>${st.t}</span>${st.why ? `<div class="why-opts" data-w="${i}">${shuffled(st.whys).map(w => `<button class="why-opt" data-why="${esc(w)}">${esc(w)}</button>`).join("")}</div>` : ""}</li>`).join("")}
          </ol>
          <button class="btn primary block mt" id="proof-check2">Chấm bài chứng minh</button>`}
        <div class="row mt"><button class="btn ghost sm" id="proof-back">⟵ Danh sách bài</button></div>
      </div>`);
      $("#proof-back").onclick = () => go("#/chung-minh");
      if (phase === 1) {
        $$(".proof-step").forEach(b => b.onclick = () => { placed.push(+b.getAttribute("data-st")); render(); });
        $$(".proof-undo").forEach(b => b.onclick = () => { placed.splice(+b.getAttribute("data-un"), 1); render(); });
        const chk = $("#proof-check1");
        chk.onclick = () => {
          const ok = placed.every((v, i) => v === i);
          if (ok) { E.toast('<span class="t-ic">✅</span> Thứ tự chuẩn! Giờ ghi căn cứ cho từng bước.'); phase = 2; render(); }
          else {
            const firstWrong = placed.findIndex((v, i) => v !== i);
            E.toast("⚠️ Bước số " + (firstWrong + 1) + " chưa đúng chỗ — nghĩ xem bước đó cần điều gì trước nó?");
            placed = placed.slice(0, firstWrong); render();
          }
        };
      } else {
        $$(".why-opts").forEach(box => $$(".why-opt", box).forEach(b => b.onclick = () => {
          $$(".why-opt", box).forEach(x => x.classList.toggle("selected", x === b));
        }));
        $("#proof-check2").onclick = () => {
          let need = 0, got = 0;
          P.steps.forEach((st, i) => {
            if (!st.why) return; need++;
            const box = $('.why-opts[data-w="' + i + '"]');
            const sel = box.querySelector(".why-opt.selected");
            const ok = sel && sel.getAttribute("data-why") === st.why;
            if (ok) got++;
            $$(".why-opt", box).forEach(x => { x.classList.add("locked"); if (x.getAttribute("data-why") === st.why) x.classList.add("correct"); else if (x === sel) x.classList.add("wrong"); });
          });
          finish(need, got);
        };
      }
    }
    function shuffled(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function finish(need, got) {
      const full = got === need;
      const first = !S.lesson("proof:" + P.id).done;
      if (full) { S.setLessonDone("proof:" + P.id); if (first) gain(E.EXP.feynman); E.confetti(); }
      else gain(E.EXP.quizCorrect * got);
      refreshChrome();
      const btn = $("#proof-check2"); if (btn) btn.remove();
      const res = document.createElement("div");
      res.className = "mk-result " + (full ? "ok" : "no");
      res.innerHTML = (full
        ? "🏆 <b>Bài chứng minh hoàn chỉnh!</b> Đúng thứ tự và đủ " + need + " căn cứ — đây chính là bài được điểm tối đa khi thi." + (first ? " <b>+" + E.EXP.feynman + " EXP</b>" : "")
        : "📝 Thứ tự đúng, căn cứ đúng " + got + "/" + need + ". Căn cứ đúng đã tô xanh — <b>đọc kỹ tên định lí</b>, thi thật thiếu căn cứ là mất điểm dù đáp án đúng.")
        + '<div class="row mt-sm" style="gap:8px"><button class="btn sm" id="proof-again">Làm lại</button><button class="btn ghost sm" id="proof-list-btn">Bài khác</button></div>';
      $("#proof-final").insertAdjacentElement("afterend", res);
      $("#proof-again").onclick = () => renderProofs(P.id);
      $("#proof-list-btn").onclick = () => go("#/chung-minh");
    }
    render();
  }

  /* =======================================================================
     ROUTER
     ===================================================================== */
  function route() {
    stopTestTimer();
    ttsStop();
    recCleanup();
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    const raw = (location.hash || "#/dashboard").replace(/^#\//, "");
    const parts = raw.split("/");
    const base = parts[0] || "dashboard";
    const titles = {
      dashboard: "Trang chủ", "lo-trinh": "Lộ trình", flashcard: "Flashcard",
      "on-tap": "Ôn tập", mentor: "AI Mentor", "thanh-tich": "Thành tích",
      "cai-dat": "Cài đặt", session: "Buổi học 30'", game: "Đấu trường", "luyen-tap": "Luyện tập",
      "phu-huynh": "Góc phụ huynh", "tu-duy": "Rèn tư duy", "kiem-tra": "Kiểm tra định kỳ", "tien-bo": "Tiến bộ", "loi-sai": "Sổ tay lỗi sai", "ban-do": "Bản đồ kiến thức", "thi-thu": "Thi thử vào 10", "ai-de": "AI ra đề", "ramanujan": "Góc Ramanujan", "vo-han": "Luyện vô hạn", "chung-minh": "Tập viết chứng minh"
    };
    if (base !== "hoc") titleEl.textContent = titles[base] || "Toán 9";
    setActive(base);
    window.scrollTo(0, 0);

    switch (base) {
      case "lo-trinh": renderRoadmap(); break;
      case "hoc": renderLesson(parts[1]); break;
      case "flashcard": renderFlashcards(parts[1]); break;
      case "on-tap": renderReview(); break;
      case "luyen-tap": renderPractice(parts[1]); break;
      case "mentor": renderMentor(); break;
      case "thanh-tich": renderAchievements(); break;
      case "cai-dat": renderSettings(); break;
      case "session": renderSession(); break;
      case "game": renderGame(parts[1]); break;
      case "phu-huynh": renderParent(); break;
      case "tu-duy": renderThinking(parts[1]); break;
      case "loi-sai": renderMistakes(); break;
      case "ban-do": renderTree(); break;
      case "thi-thu": if (parts[1]) renderExam(parts[1]); else renderExamHub(); break;
      case "ai-de": renderAiDrill(); break;
      case "ramanujan": if (parts[1]) renderRama(parts[1]); else renderRamaHub(); break;
      case "vo-han": renderInfinite(parts[1]); break;
      case "chung-minh": renderProofs(parts[1]); break;
      case "kiem-tra": renderTest(); break;
      case "tien-bo": renderProgress(); break;
      default: renderDashboard();
    }
    refreshChrome();
  }

  /* =======================================================================
     THEME + BOOTSTRAP
     ===================================================================== */
  function applyTheme(theme, persist) {
    if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    if (persist) S.setTheme(theme);
    const tg = $("#toggle-theme");
    if (tg) tg.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  function maybeRemind() {
    // Bộ nhắc cũ đã được thay bằng lịch tuần (checkReminder) — gọi kiểm tra ngay khi mở app.
    try { checkReminder(Date.now()); } catch (e) { /* bỏ qua */ }
  }

  function boot() {
    viewEl = document.getElementById("app-view");
    titleEl = document.getElementById("view-title");

    S.load();
    initProfileChip();
    startTimebank();
    // menu nhóm: bấm tiêu đề để đóng/mở; nhớ trạng thái trong phiên
    $$(".nav-group .nav-head").forEach(h => h.onclick = () => h.parentNode.classList.toggle("collapsed"));
    // Tự render công thức KaTeX cho cả nội dung chèn động (lời giải, bước học, hook…)
    try {
      if (window.MutationObserver && viewEl) {
        let scheduled = false; const pending = new Set();
        const mo = new MutationObserver(muts => {
          muts.forEach(mu => mu.addedNodes.forEach(nd => {
            if (nd.nodeType === 1) pending.add(nd);
            else if (nd.nodeType === 3 && nd.parentNode) pending.add(nd.parentNode);
          }));
          if (scheduled) return; scheduled = true;
          const run = () => {
            scheduled = false; const nodes = Array.from(pending); pending.clear();
            mo.disconnect();
            try { nodes.forEach(nd => { if (nd.isConnected) mathifyElement(nd); }); } catch (e) {}
            mo.observe(viewEl, { childList: true, subtree: true });
          };
          (window.requestAnimationFrame || setTimeout)(run);
        });
        mo.observe(viewEl, { childList: true, subtree: true });
      }
    } catch (e) {}
    try {
      console.log("Toán 9 Feynman", APP_VERSION);
      const foot = document.querySelector(".sidebar-foot p");
      if (foot) foot.insertAdjacentHTML("beforeend", '<br /><span class="app-ver">Phiên bản ' + APP_VERSION + "</span>");
    } catch (e) {}

    // theme: ưu tiên lựa chọn đã lưu, nếu chưa thì theo hệ thống
    const saved = S.getTheme();
    const sysDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (sysDark ? "dark" : "light"), false);

    // nút dark mode trên topbar
    const tg = $("#toggle-theme");
    if (tg) tg.onclick = () => {
      const nowDark = document.documentElement.getAttribute("data-theme") !== "dark";
      applyTheme(nowDark ? "dark" : "light", true);
    };

    window.addEventListener("hashchange", route);
    if (!location.hash) location.hash = "#/dashboard";
    route();
    checkBadges();
    maybeRemind();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  App.UI = { route, refreshChrome };
})(window.App = window.App || {});
