/* =========================================================================
   engine.js — BỘ MÁY LÕI (không phụ thuộc thư viện ngoài)
   -------------------------------------------------------------------------
   Gồm các mô-đun độc lập, gắn vào App.Engine:
     • EXP / Level / Huy hiệu        (gamification)
     • Lặp lại ngắt quãng SRS         (intervals 1·3·7·14·30 ngày)
     • Bộ chấm Feynman                (so khớp từ khoá -> % phủ, không tuyệt đối)
     • AI Mentor                      (khớp từ khoá -> câu trả lời)
     • Chấm bài tập                   (mc / fill / match, chuẩn hoá đáp án)
     • Đồ thị tương tác y = ax + b    (canvas, kéo điểm + thanh trượt)
     • Biểu đồ cột                    (canvas)
     • Hiệu ứng confetti + toast
   ========================================================================= */
(function (App) {
  "use strict";

  const Storage = App.Storage;

  /* =======================================================================
     0. TIỆN ÍCH CHUNG
     ===================================================================== */
  function stripAccents(s) {
    return (s || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D");
  }
  function norm(s) { return stripAccents(String(s)).toLowerCase().trim(); }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function resolveColor(c) {
    if (!c) return "#16a34a";
    c = c.trim();
    const m = c.match(/^var\((--[a-z0-9-]+)\)$/i);
    return m ? (cssVar(m[1]) || "#16a34a") : c;
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* =======================================================================
     1. GAMIFICATION — EXP, LEVEL, HUY HIỆU
     ===================================================================== */
  const EXP = { step: 10, quizCorrect: 5, feynman: 20, flashcard: 4, lessonDone: 50, think: 8, essay: 12, record: 15 };

  // Tổng EXP cần để ĐẠT tới đầu level L (L bắt đầu từ 1) = 30·L·(L-1)
  function totalForLevel(L) { return 30 * L * (L - 1); }

  function levelInfo(exp) {
    let L = 1;
    while (totalForLevel(L + 1) <= exp) L++;
    const base = totalForLevel(L);
    const next = totalForLevel(L + 1);
    const span = next - base;
    const cur = exp - base;
    return {
      level: L,
      cur: cur,
      need: span,
      pct: Math.round((cur / span) * 100),
      title: levelTitle(L)
    };
  }
  function levelTitle(L) {
    if (L >= 12) return "Bậc thầy Toán học";
    if (L >= 9) return "Cao thủ";
    if (L >= 6) return "Thành thạo";
    if (L >= 4) return "Khá vững";
    if (L >= 2) return "Đang tiến bộ";
    return "Tân binh";
  }

  /* ---- Định nghĩa huy hiệu ---- */
  const BADGES = [
    { id: "first-step", emoji: "👣", name: "Bước đầu tiên", desc: "Hoàn thành bước học đầu tiên",
      check: () => totalStepsDone() >= 1 },
    { id: "first-lesson", emoji: "🎓", name: "Bài học trọn vẹn", desc: "Hoàn thành 1 bài học đầy đủ",
      check: () => Storage.lessonsDoneCount() >= 1 },
    { id: "streak-3", emoji: "🔥", name: "Ba ngày liền", desc: "Giữ chuỗi học 3 ngày",
      check: () => Storage.state.streak.longest >= 3 },
    { id: "streak-7", emoji: "⚡", name: "Tuần lễ vàng", desc: "Giữ chuỗi học 7 ngày",
      check: () => Storage.state.streak.longest >= 7 },
    { id: "explainer", emoji: "🗣️", name: "Người giảng giải", desc: "Tự giải thích kiểu Feynman 3 lần",
      check: () => countHistory("feynman") >= 3 },
    { id: "quiz-ace", emoji: "💯", name: "Điểm tuyệt đối", desc: "Làm đúng trọn một bộ bài tập",
      check: () => anyPerfectQuiz() },
    { id: "level-5", emoji: "🚀", name: "Lên hạng 5", desc: "Đạt Level 5",
      check: () => levelInfo(Storage.state.exp).level >= 5 },
    { id: "algebra-pro", emoji: "🧮", name: "Vua Căn thức", desc: "Hoàn thành mọi bài Chương III (Căn bậc hai & căn bậc ba)",
      check: () => chapterAllDone("chuong-3") },
    { id: "geometry-pro", emoji: "📐", name: "Trùm Đường tròn", desc: "Hoàn thành mọi bài Chương V (Đường tròn)",
      check: () => chapterAllDone("chuong-5") },
    { id: "flash-30", emoji: "🃏", name: "Ôn thẻ chăm chỉ", desc: "Ôn 30 lượt flashcard",
      check: () => countHistory("flashcard") >= 30 },
    { id: "arena-champ", emoji: "⚔️", name: "Vô địch Đấu trường", desc: "Thắng một trận Đấu trường Toán học",
      check: () => countHistory("arena-win") >= 1 },
    { id: "first-test", emoji: "📝", name: "Thử sức đầu tiên", desc: "Hoàn thành 1 bài kiểm tra định kỳ",
      check: () => (Storage.state.tests || []).length >= 1 },
    { id: "record-breaker", emoji: "📈", name: "Vượt kỷ lục", desc: "Đạt điểm kiểm tra cao hơn lần liền trước",
      check: () => {
        const t = Storage.state.tests || [];
        for (let i = 1; i < t.length; i++) {
          if (t[i].total && t[i - 1].total && t[i].score / t[i].total > t[i - 1].score / t[i - 1].total) return true;
        }
        return false;
      } },
    { id: "test-ace", emoji: "🎖️", name: "Cao thủ kiểm tra", desc: "Đạt từ 90% trong một bài kiểm tra định kỳ",
      check: () => (Storage.state.tests || []).some(x => x.total && x.score / x.total >= 0.9) },
    { id: "first-record", emoji: "🎙️", name: "Bài giảng đầu tiên", desc: "Thu âm và lưu 1 bài giảng của chính em",
      check: () => Object.keys(Storage.state.recordings || {}).length >= 1 },
    { id: "voice-teacher", emoji: "🧑‍🏫", name: "Người thầy nhí", desc: "Lưu bài giảng của em cho 3 bài học khác nhau",
      check: () => Object.keys(Storage.state.recordings || {}).length >= 3 }
  ];

  function totalStepsDone() {
    let n = 0;
    const ls = Storage.state.lessons;
    for (const id in ls) n += Object.keys(ls[id].steps || {}).filter(k => ls[id].steps[k]).length;
    return n;
  }
  function countHistory(type) {
    return Storage.state.history.filter(h => h.type === type).length;
  }
  function anyPerfectQuiz() {
    const ls = Storage.state.lessons;
    for (const id in ls) {
      const q = ls[id].quiz || {};
      for (const d in q) if (q[d].total > 0 && q[d].correct === q[d].total) return true;
    }
    return false;
  }
  function chapterAllDone(chapterId) {
    const ch = (App.DATA.chapters || []).find(c => c.id === chapterId);
    if (!ch) return false;
    return ch.lessons.every(lid => (Storage.state.lessons[lid] || {}).done);
  }

  function badgeById(id) { return BADGES.find(b => b.id === id); }

  // Quét tất cả huy hiệu, mở khoá cái mới đủ điều kiện -> trả về danh sách mới mở
  function refreshBadges() {
    const newly = [];
    for (const b of BADGES) {
      if (!Storage.hasBadge(b.id) && b.check()) {
        Storage.unlockBadge(b.id);
        newly.push(b);
      }
    }
    return newly;
  }

  /* =======================================================================
     2. SRS — LẶP LẠI NGẮT QUÃNG
     ===================================================================== */
  const SRS_INTERVALS = [1, 3, 7, 14, 30];

  function review(key, remembered) {
    const prev = Storage.srsGet(key);
    const prevBox = prev ? prev.box : -1;
    const box = remembered ? Math.min(prevBox + 1, SRS_INTERVALS.length - 1) : 0;
    const due = Storage.addDays(Storage.dateStr(), SRS_INTERVALS[box]);
    Storage.srsSet(key, box, due);
    return { box: box, interval: SRS_INTERVALS[box], due: due };
  }

  /* =======================================================================
     3. BỘ CHẤM FEYNMAN — so khớp từ khoá
     ===================================================================== */
  // Bảng đồng nghĩa nhẹ để khoan dung hơn khi học sinh dùng từ khác
  const SYN = {
    "độ dốc": ["do doc", "doc", "slope", "dốc"],
    "hệ số góc": ["he so goc", "hsg"],
    "điểm xuất phát": ["xuat phat", "ban dau", "khoi diem"],
    "cắt trục": ["cat truc", "giao truc"],
    "trung bình": ["tb", "binh quan"],
    "vô nghiệm": ["khong co nghiem", "khong nghiem"],
    "nghiệm kép": ["nghiem doi", "1 nghiem", "mot nghiem"]
  };

  function keywordHit(text, kw) {
    const t = norm(text);
    const k = norm(kw);
    if (!k) return false;
    // từ rất ngắn (a, b, Δ…): yêu cầu xuất hiện như một "token" riêng
    if (k.length <= 2) {
      const tokens = t.split(/[^a-z0-9²³√/+-]+/);
      if (tokens.indexOf(k) !== -1) return true;
    } else if (t.indexOf(k) !== -1) {
      return true;
    }
    // thử đồng nghĩa
    const syns = SYN[kw] || SYN[k];
    if (syns) for (const s of syns) if (t.indexOf(norm(s)) !== -1) return true;
    return false;
  }

  function checkFeynman(text, keywords) {
    const clean = (text || "").trim();
    if (clean.length < 12) {
      return { tooShort: true, pct: 0, hits: [], misses: keywords.slice(),
        tier: "mid",
        message: "Hãy viết thêm một chút nhé! Cứ tưởng tượng em đang giảng cho một bạn lớp 5 chưa biết gì." };
    }
    const hits = [], misses = [];
    keywords.forEach(kw => (keywordHit(clean, kw) ? hits : misses).push(kw));
    const pct = Math.round((hits.length / Math.max(1, keywords.length)) * 100);
    const tier = pct >= 60 ? "good" : "mid";
    let message;
    if (pct >= 85) {
      message = "Tuyệt vời! Em đã chạm tới gần như mọi ý quan trọng — cách giải thích rất rõ ràng. 👏";
    } else if (pct >= 60) {
      message = "Rất tốt! Em nắm được phần lớn ý chính. Thử bổ sung thêm vài điểm còn thiếu để hoàn chỉnh hơn nhé.";
    } else if (pct >= 30) {
      message = "Khởi đầu ổn rồi! Em đã có vài ý đúng. Hãy xem lại phần giải thích và thử nói thêm về những ý còn thiếu bên dưới.";
    } else {
      message = "Không sao cả — đây là lúc để học! Hãy đọc lại Bước 1 rồi diễn đạt theo cách của em. Gợi ý vài ý nên nhắc tới ở dưới.";
    }
    return { tooShort: false, pct, hits, misses, tier, message };
  }

  /* =======================================================================
     4. AI MENTOR — khớp từ khoá
     ===================================================================== */
  function askMentor(query) {
    const q = norm(query);
    let best = null, bestScore = 0;
    (App.DATA.mentor || []).forEach(entry => {
      let score = 0;
      entry.q.forEach(kw => { if (q.indexOf(norm(kw)) !== -1) score += norm(kw).length; });
      if (score > bestScore) { bestScore = score; best = entry; }
    });
    return best ? best.a : App.DATA.mentorFallback;
  }

  /* =======================================================================
     5. CHẤM BÀI TẬP
     ===================================================================== */
  function normAns(s) {
    let x = norm(s);
    x = x.replace(/\s+/g, "")
         .replace(/[−–—]/g, "-")     // các loại dấu trừ
         .replace(/,/g, ".");         // dấu phẩy thập phân -> chấm
    return x;
  }
  function toNumber(s) {
    const x = normAns(s);
    if (/^-?\d+(\.\d+)?$/.test(x)) return parseFloat(x);
    const f = x.match(/^(-?\d+)\/(\d+)$/);
    if (f) return parseInt(f[1], 10) / parseInt(f[2], 10);
    return null;
  }
  function checkFill(userVal, q) {
    const candidates = [q.answer].concat(q.accept || []);
    const u = normAns(userVal);
    for (const c of candidates) if (normAns(c) === u) return true;
    // so khớp theo giá trị số / phân số
    const un = toNumber(userVal);
    if (un !== null) {
      for (const c of candidates) {
        const cn = toNumber(c);
        if (cn !== null && Math.abs(cn - un) < 1e-9) return true;
      }
    }
    return false;
  }
  function checkMc(idx, q) { return idx === q.answer; }

  /* =======================================================================
     6. ĐỒ THỊ TƯƠNG TÁC  y = a·x + b   (canvas)
     ===================================================================== */
  // Gắn vào 1 phần tử cha (thường là .step-panel). Tự dựng DOM bên trong.
  function mountGraph(parent, opts) {
    opts = opts || {};
    let a = opts.a != null ? opts.a : 2;
    let b = opts.b != null ? opts.b : 1;

    parent.innerHTML = `
      <div class="graph-stage">
        <canvas class="graph-canvas" width="600" height="380"></canvas>
        <div class="slider-row">
          <label>Hệ số góc a</label>
          <input type="range" class="g-a" min="-5" max="5" step="0.5" value="${a}">
          <span class="val g-av">${a}</span>
        </div>
        <div class="slider-row">
          <label>Tung độ gốc b</label>
          <input type="range" class="g-b" min="-5" max="5" step="0.5" value="${b}">
          <span class="val g-bv">${b}</span>
        </div>
        <div class="equation-readout g-eq"></div>
      </div>`;

    const canvas = parent.querySelector(".graph-canvas");
    const ctx = canvas.getContext("2d");
    const aIn = parent.querySelector(".g-a");
    const bIn = parent.querySelector(".g-b");
    const aVal = parent.querySelector(".g-av");
    const bVal = parent.querySelector(".g-bv");
    const eq = parent.querySelector(".g-eq");

    const R = 6;            // phạm vi hiển thị: x,y ∈ [-R, R]
    let W = 600, H = 380, dpr = 1;

    function fit() {
      const cssW = canvas.clientWidth || 600;
      dpr = window.devicePixelRatio || 1;
      W = cssW; H = Math.round(cssW * 0.62);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const toPx = (x, y) => ({
      px: (x + R) / (2 * R) * W,
      py: H - (y + R) / (2 * R) * H
    });
    const toWorldY = (py) => (H - py) / H * (2 * R) - R;

    function draw() {
      const ink = resolveColor("var(--ink-soft)");
      const faint = resolveColor("var(--border-2)");
      const brand = resolveColor("var(--brand)");
      const accent = resolveColor("var(--accent)");
      ctx.clearRect(0, 0, W, H);

      // lưới
      ctx.lineWidth = 1; ctx.strokeStyle = faint; ctx.globalAlpha = .6;
      for (let i = -R; i <= R; i++) {
        const v = toPx(i, 0), h = toPx(0, i);
        ctx.beginPath(); ctx.moveTo(v.px, 0); ctx.lineTo(v.px, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, h.py); ctx.lineTo(W, h.py); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // trục
      ctx.lineWidth = 2; ctx.strokeStyle = ink;
      const o = toPx(0, 0);
      ctx.beginPath(); ctx.moveTo(0, o.py); ctx.lineTo(W, o.py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.px, 0); ctx.lineTo(o.px, H); ctx.stroke();

      // đường thẳng y = a x + b
      const p1 = toPx(-R, a * -R + b);
      const p2 = toPx(R, a * R + b);
      ctx.lineWidth = 4; ctx.strokeStyle = brand; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();

      // điểm cắt trục tung (kéo đổi b)
      const ptB = toPx(0, b);
      dot(ptB.px, ptB.py, accent, "b");
      // điểm độ dốc tại x = 3 (kéo đổi a)
      const ptA = toPx(3, a * 3 + b);
      dot(ptA.px, ptA.py, brand, "a");
    }
    function dot(px, py, color, label) {
      ctx.beginPath(); ctx.fillStyle = color;
      ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, px, py);
    }
    function syncReadout() {
      aIn.value = a; bIn.value = b; aVal.textContent = a; bVal.textContent = b;
      const bs = b >= 0 ? "+ " + b : "− " + Math.abs(b);
      eq.textContent = "y = " + a + "x " + bs;
    }
    function refresh() { syncReadout(); draw(); }

    // thanh trượt
    aIn.addEventListener("input", () => { a = parseFloat(aIn.value); refresh(); });
    bIn.addEventListener("input", () => { b = parseFloat(bIn.value); refresh(); });

    // kéo điểm trên canvas
    let dragging = null;
    function pointerPos(e) {
      const r = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { cx, cy };
    }
    function pick(cx, cy) {
      const ptB = toPx(0, b), ptA = toPx(3, a * 3 + b);
      if (Math.hypot(cx - ptA.px, cy - ptA.py) < 22) return "a";
      if (Math.hypot(cx - ptB.px, cy - ptB.py) < 22) return "b";
      return null;
    }
    function onDown(e) {
      const { cx, cy } = pointerPos(e);
      dragging = pick(cx, cy);
      if (dragging) e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const { cx, cy } = pointerPos(e);
      const wy = Math.max(-R, Math.min(R, toWorldY(cy)));
      if (dragging === "b") {
        b = Math.round(wy * 2) / 2;
      } else { // điểm a tại x = 3:  wy = a*3 + b  ->  a = (wy - b)/3
        a = Math.round(((wy - b) / 3) * 2) / 2;
        a = Math.max(-5, Math.min(5, a));
      }
      refresh();
    }
    function onUp() { dragging = null; }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onUp);
    window.addEventListener("resize", () => { fit(); draw(); });

    fit(); refresh();
    return { redraw: () => { fit(); draw(); } };
  }

  /* =======================================================================
     7. BIỂU ĐỒ CỘT (canvas)
     ===================================================================== */
  function drawBars(canvas, data) {
    const labels = data.labels || [];
    const values = data.values || [];
    const color = resolveColor(data.color || "var(--violet-500)");
    const ink = resolveColor("var(--ink-soft)");
    const faint = resolveColor("var(--border-2)");

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 560;
    const W = cssW, H = Math.round(cssW * 0.55);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const padL = 30, padB = 30, padT = 16, padR = 10;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const maxV = Math.max(1, ...values);
    const n = values.length;
    const gap = 12;
    const bw = (plotW - gap * (n - 1)) / n;

    // trục đáy
    ctx.strokeStyle = faint; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();

    ctx.textAlign = "center"; ctx.font = "600 11px sans-serif";
    values.forEach((v, i) => {
      const h = (v / maxV) * plotH;
      const x = padL + i * (bw + gap);
      const y = padT + plotH - h;
      // cột bo góc trên
      const r = Math.min(6, bw / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.lineTo(x + bw - r, y);
      ctx.arcTo(x + bw, y, x + bw, y + r, r);
      ctx.lineTo(x + bw, padT + plotH);
      ctx.lineTo(x, padT + plotH);
      ctx.closePath(); ctx.fill();
      // giá trị
      ctx.fillStyle = ink;
      ctx.fillText(String(v), x + bw / 2, y - 6);
      // nhãn
      ctx.fillText(labels[i] || "", x + bw / 2, padT + plotH + 16);
    });
  }

  /* =======================================================================
     8. CONFETTI
     ===================================================================== */
  function confetti() {
    const canvas = document.getElementById("confetti");
    if (!canvas || reducedMotion()) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#16a34a", "#f97316", "#f59e0b", "#0ea5e9", "#8b5cf6"].map(resolveColor);
    const N = 140;
    const parts = [];
    for (let i = 0; i < N; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - .5) * 120,
        y: innerHeight / 3,
        vx: (Math.random() - .5) * 9,
        vy: Math.random() * -9 - 4,
        g: .28 + Math.random() * .15,
        s: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * .3,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - frame / 110);
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
        ctx.restore();
      });
      frame++;
      if (frame < 110) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  /* =======================================================================
     9. TOAST
     ===================================================================== */
  function toast(msg, type) {
    let host = document.querySelector(".toast-host");
    if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.innerHTML = msg;
    host.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .3s, transform .3s";
      el.style.opacity = "0"; el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 320);
    }, 2600);
  }

  /* =======================================================================
     NHIỆM VỤ HẰNG NGÀY (giữ thói quen)
     ===================================================================== */
  const DAILY_BONUS = 25; // EXP thưởng khi hoàn thành mọi nhiệm vụ trong ngày
  const DAILY_QUESTS = [
    { id: "minutes", icon: "⏱️", name: "Học 15 phút",       metric: "minutes",    goal: 15 },
    { id: "steps",   icon: "📖", name: "Học 2 bước mới",     metric: "steps",      goal: 2 },
    { id: "flash",   icon: "🃏", name: "Ôn 5 thẻ ghi nhớ",   metric: "flashcards", goal: 5 },
    { id: "quiz",    icon: "✏️", name: "Làm 1 bộ bài tập",   metric: "quizzes",    goal: 1 }
  ];
  function dailyQuests() {
    const c = Storage.dailyCounts();
    return DAILY_QUESTS.map(q => {
      const raw = c[q.metric] || 0;
      const value = Math.min(raw, q.goal);
      return { id: q.id, icon: q.icon, name: q.name, value: value, goal: q.goal, done: raw >= q.goal };
    });
  }
  function dailyAllDone() { return dailyQuests().every(q => q.done); }

  /* =======================================================================
     XUẤT API
     ===================================================================== */
  App.Engine = {
    // tiện ích
    norm, stripAccents, resolveColor,
    // gamification
    EXP, levelInfo, levelTitle, BADGES, badgeById, refreshBadges,
    totalStepsDone,
    // nhiệm vụ ngày
    DAILY_QUESTS, DAILY_BONUS, dailyQuests, dailyAllDone,
    // SRS
    SRS_INTERVALS, review,
    // feynman + mentor
    checkFeynman, askMentor,
    // quiz
    checkFill, checkMc, normAns,
    // đồ hoạ
    mountGraph, drawBars, confetti, toast
  };
})(window.App = window.App || {});
