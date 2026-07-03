/* =========================================================================
   storage.js — LỚP LƯU TRỮ (LocalStorage)
   -------------------------------------------------------------------------
   Mọi tiến độ của người học được lưu cục bộ trên trình duyệt (không server).
   Hàm bao quanh localStorage có try/catch để không bao giờ làm sập app
   (vd: chế độ ẩn danh, hết dung lượng…). Tất cả khoá nằm dưới "toan9:*".

   Hình dạng dữ liệu (App.Storage.state):
   {
     profile:   { name },
     theme:     "light" | "dark" | null(theo hệ thống),
     exp:       số điểm kinh nghiệm tích luỹ,
     goalMin:   mục tiêu phút mỗi ngày (mặc định 30),
     goalDays:  mục tiêu số ngày học trong tuần (mặc định 5),
     streak:    { current, longest, lastStudyDate, calendar: { 'YYYY-MM-DD': phút } },
     lessons:   { [lessonId]: { steps:{1:true…}, done:bool,
                                quiz:{ easy:{correct,total}, medium:{…}, hard:{…} } } },
     srs:       { [cardKey]: { box, due:'YYYY-MM-DD', seen } },
     notes:     { [lessonId]: "ghi chú" },
     badges:    [ id… ],            // huy hiệu đã mở
     history:   [ { t, type, info } ] // nhật ký hoạt động (mới nhất ở đầu)
   }
   ========================================================================= */
(function (App) {
  "use strict";

  const BASE = "toan9:";
  /* ---------- Hồ sơ thành viên (tối đa 3, dữ liệu tách riêng) ---------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function profilesList() {
    try { const p = JSON.parse(lsGet(BASE + "profiles") || "null"); if (Array.isArray(p) && p.length) return p; } catch (e) {}
    return [{ id: "default", name: "Học sinh", emoji: "🦊" }];
  }
  function profilesSave(list) { lsSet(BASE + "profiles", JSON.stringify(list)); }
  function activeProfileId() {
    const id = lsGet(BASE + "active") || "default";
    return profilesList().some(p => p.id === id) ? id : "default";
  }
  function setActiveProfile(id) { lsSet(BASE + "active", id); }
  function currentProfile() {
    const id = activeProfileId();
    return profilesList().find(p => p.id === id) || profilesList()[0];
  }
  function profileAdd(name, emoji) {
    const list = profilesList();
    if (list.length >= 3) return null;
    const id = "p" + Date.now().toString(36);
    list.push({ id: id, name: name || ("Thành viên " + (list.length + 1)), emoji: emoji || "🐼" });
    profilesSave(list);
    return id;
  }
  function profileRemove(id) {
    if (id === "default") return false;
    profilesSave(profilesList().filter(p => p.id !== id));
    // xoá dữ liệu của hồ sơ đó
    const pre = BASE + "p:" + id + ":";
    try {
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf(pre) === 0) kill.push(k); }
      kill.forEach(lsDel);
    } catch (e) {}
    if (activeProfileId() === id) setActiveProfile("default");
    return true;
  }
  // Hồ sơ "default" dùng đúng khoá cũ ("toan9:") → dữ liệu hiện có không mất
  const PID = activeProfileId();
  const NS = PID === "default" ? BASE : (BASE + "p:" + PID + ":");
  const ROOT_KEY = NS + "state";
  const SCHEMA = 1;

  /* ---------- Tiện ích ngày tháng (theo giờ địa phương) ---------- */
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function addDays(str, n) {
    const [y, m, d] = str.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return dateStr(dt);
  }
  function diffDays(a, b) { // số ngày từ a -> b (b - a)
    const da = new Date(a), db = new Date(b);
    return Math.round((db - da) / 86400000);
  }

  /* ---------- Trạng thái mặc định ---------- */
  function defaults() {
    return {
      schema: SCHEMA,
      profile: { name: "Bạn học" },
      theme: null,
      exp: 0,
      goalMin: 30,
      goalDays: 5,
      streak: { current: 0, longest: 0, lastStudyDate: null, calendar: {} },
      lessons: {},
      srs: {},
      notes: {},
      badges: [],
      history: [],
      daily: { date: null, steps: 0, flashcards: 0, quizzes: 0, minutes: 0, arenaWins: 0, claimed: false },
      freezes: 2,
      lastFreezeWeek: null,
      reminder: { enabled: false, time: "19:00", lastNotified: null },
      practice: {},
      topics: {},
      think: {},
      tests: [],
      tts: { persona: "co", rate: 1, voice: "" },
      recordings: {},
      assign: { pin: "", minutesGoal: 30, tasks: [] }
    };
  }

  /* ---------- Đọc / ghi an toàn ---------- */
  let state = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(ROOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // gộp nông với mặc định để không thiếu khoá khi nâng cấp
        state = Object.assign(defaults(), parsed);
        // bảo đảm các nhánh con tồn tại
        const d = defaults();
        for (const k of ["profile", "streak", "lessons", "srs", "notes", "daily", "reminder", "practice", "topics", "think", "tts", "recordings", "assign"]) {
          state[k] = Object.assign(d[k], state[k] || {});
        }
        if (!Array.isArray(state.badges)) state.badges = [];
        if (!Array.isArray(state.history)) state.history = [];
        if (!Array.isArray(state.tests)) state.tests = [];
        if (!state.streak.calendar) state.streak.calendar = {};
        if (typeof state.freezes !== "number") state.freezes = 2;
      }
    } catch (e) {
      console.warn("[storage] không đọc được, dùng mặc định:", e);
      state = defaults();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(ROOT_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn("[storage] không ghi được:", e);
      return false;
    }
  }

  /* ---------- Hồ sơ & cài đặt ---------- */
  function getTheme() { return state.theme; }
  function setTheme(t) { state.theme = t; save(); }

  function getGoals() { return { min: state.goalMin, days: state.goalDays }; }
  function setGoals(min, days) {
    if (min) state.goalMin = min;
    if (days) state.goalDays = days;
    save();
  }

  /* ---------- Lịch sử hoạt động ---------- */
  function log(type, info) {
    state.history.unshift({ t: Date.now(), type: type, info: info || null });
    if (state.history.length > 120) state.history.length = 120;
    // gắn vào nhiệm vụ hằng ngày
    if (type === "flashcard") bumpDaily("flashcards", 1);
    else if (type === "arena-win") bumpDaily("arenaWins", 1);
  }

  /* ---------- Phút học + Streak + Lịch ---------- */
  function recordStudyMinutes(min) {
    if (!min || min < 0) return;
    ensureDaily();
    const today = dateStr();
    const cal = state.streak.calendar;
    cal[today] = (cal[today] || 0) + min;
    state.daily.minutes += min;

    // cập nhật streak một lần cho mỗi ngày học đầu tiên
    const last = state.streak.lastStudyDate;
    if (last !== today) {
      if (!last) {
        state.streak.current = 1;
      } else {
        const gap = diffDays(last, today);
        if (gap === 1) {
          state.streak.current += 1;                 // học liên tiếp
        } else {
          const missed = gap - 1;                    // số ngày đã lỡ
          if (missed >= 1 && state.freezes >= missed) {
            state.freezes -= missed;                 // dùng Bùa giữ chuỗi để cứu
            state.streak.current += 1;
            log("freeze-used", missed);
          } else {
            state.streak.current = 1;                // chuỗi đứt, bắt đầu lại
          }
        }
      }
      state.streak.lastStudyDate = today;
      state.streak.longest = Math.max(state.streak.longest, state.streak.current);

      // Thưởng 1 Bùa khi đạt mục tiêu số ngày trong tuần (mỗi tuần 1 lần)
      const wk = weekKey();
      if (daysStudiedThisWeek() >= (state.goalDays || 5) && state.lastFreezeWeek !== wk) {
        state.lastFreezeWeek = wk;
        addFreeze(1, 5);
        log("freeze-earned", "week");
      }
    }
    save();
  }

  // Streak "hiệu lực": còn sống nếu học hôm nay/hôm qua, HOẶC số ngày lỡ vẫn cứu được bằng Bùa
  function effectiveStreak() {
    const last = state.streak.lastStudyDate;
    if (!last) return 0;
    const gap = diffDays(last, dateStr());
    if (gap <= 1) return state.streak.current;       // hôm nay hoặc hôm qua
    const missed = gap - 1;
    if (state.freezes >= missed) return state.streak.current; // Bùa còn cứu được
    return 0;
  }

  /* ---------- Thói quen: nhiệm vụ ngày, Bùa giữ chuỗi, nhắc học ---------- */
  function weekKey() {
    // khoá tuần = ngày Thứ Hai của tuần hiện tại
    const today = dateStr();
    const dow = (new Date(today).getDay() + 6) % 7; // 0 = Thứ Hai
    return addDays(today, -dow);
  }
  function ensureDaily() {
    const today = dateStr();
    if (!state.daily || state.daily.date !== today) {
      state.daily = { date: today, steps: 0, flashcards: 0, quizzes: 0, minutes: 0, arenaWins: 0, claimed: false };
      save();
    }
  }
  function bumpDaily(metric, n) {
    ensureDaily();
    state.daily[metric] = (state.daily[metric] || 0) + (n || 1);
    save();
  }
  function dailyCounts() { ensureDaily(); return state.daily; }
  function dailyClaimed() { ensureDaily(); return !!state.daily.claimed; }
  function claimDailyBonus() {
    ensureDaily();
    if (state.daily.claimed) return false;
    state.daily.claimed = true;
    addFreeze(1, 5);                 // hoàn thành mọi nhiệm vụ → +1 Bùa
    save();
    return true;
  }
  function getFreezes() { return state.freezes || 0; }
  function addFreeze(n, cap) {
    state.freezes = Math.min(cap || 5, (state.freezes || 0) + (n || 1));
    save();
    return state.freezes;
  }
  function isStudiedToday() { return (state.streak.calendar[dateStr()] || 0) > 0; }
  function streakStatus() {
    const v = effectiveStreak();
    const studiedToday = isStudiedToday();
    return {
      value: v,
      studiedToday: studiedToday,
      atRisk: v > 0 && !studiedToday,   // chuỗi còn sống nhưng hôm nay chưa học
      freezes: getFreezes()
    };
  }
  function getReminder() {
    if (!state.reminder) state.reminder = { enabled: false, time: "19:00", lastNotified: null };
    if (!state.reminder.times) {
      state.reminder.times = { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "" };
      // di trú từ bản cũ: giờ chung cho T2–T6
      if (state.reminder.time) { for (let d = 1; d <= 5; d++) state.reminder.times[d] = state.reminder.time; }
    }
    return state.reminder;
  }
  function setReminderDay(dow, val) {
    getReminder().times[dow] = val || "";
    save();
  }
  function reminderMark(key) { getReminder().lastNotified = key; save(); }
  function setReminder(enabled, time) {
    if (!state.reminder) state.reminder = { enabled: false, time: "19:00", lastNotified: null };
    if (enabled != null) state.reminder.enabled = !!enabled;
    if (time) state.reminder.time = time;
    save();
  }
  function markReminded() {
    if (!state.reminder) return;
    state.reminder.lastNotified = dateStr();
    save();
  }

  function minutesToday() { return state.streak.calendar[dateStr()] || 0; }

  // Lịch n ngày gần nhất: [{date, minutes, state:'done'|'partial'|'empty'|'today'}]
  function calendarLast(nDays) {
    const out = [];
    const goal = state.goalMin || 30;
    const today = dateStr();
    for (let i = nDays - 1; i >= 0; i--) {
      const ds = addDays(today, -i);
      const m = state.streak.calendar[ds] || 0;
      let st = "empty";
      if (m >= goal) st = "done";
      else if (m > 0) st = "partial";
      out.push({ date: ds, minutes: m, state: st, isToday: ds === today });
    }
    return out;
  }

  function daysStudiedThisWeek() {
    // tính từ Thứ Hai
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // 0 = Thứ Hai
    let count = 0;
    for (let i = 0; i <= dow; i++) {
      const ds = addDays(dateStr(), -i);
      if ((state.streak.calendar[ds] || 0) > 0) count++;
    }
    return count;
  }

  /* ---------- EXP ---------- */
  function addExp(n) {
    state.exp += n;
    save();
    return state.exp;
  }

  /* ---------- Tiến độ bài học ---------- */
  function lesson(id) {
    if (!state.lessons[id]) state.lessons[id] = { steps: {}, done: false, quiz: {} };
    return state.lessons[id];
  }
  function isStepDone(id, step) { return !!lesson(id).steps[step]; }
  function setStepDone(id, step) {
    const L = lesson(id);
    const was = !!L.steps[step];
    L.steps[step] = true;
    if (!was) bumpDaily("steps", 1);
    save();
    return !was; // true nếu đây là lần đầu hoàn thành bước này
  }
  function setLessonDone(id) {
    const L = lesson(id);
    const was = L.done;
    L.done = true;
    save();
    return !was;
  }
  function recordQuiz(id, diff, correct, total) {
    const L = lesson(id);
    const prev = L.quiz[diff];
    if (!prev || correct > prev.correct) L.quiz[diff] = { correct: correct, total: total };
    bumpDaily("quizzes", 1);
    save();
  }
  function lessonCompletionPct(id, totalSteps) {
    const L = lesson(id);
    const done = Object.keys(L.steps).filter(k => L.steps[k]).length;
    return Math.round((done / (totalSteps || 5)) * 100);
  }
  function lessonsDoneCount() {
    return Object.values(state.lessons).filter(l => l.done).length;
  }

  /* ---------- Ghi chú ---------- */
  function getNote(id) { return state.notes[id] || ""; }
  function setNote(id, text) { state.notes[id] = text; save(); }

  /* ---------- Lặp lại ngắt quãng (SRS) ---------- */
  // intervals do engine quyết định; ở đây chỉ lưu box & ngày đến hạn.
  function srsGet(key) { return state.srs[key] || null; }
  function srsAll() { return state.srs; }
  function srsSet(key, box, dueDateStr) {
    state.srs[key] = { box: box, due: dueDateStr, seen: (state.srs[key] ? state.srs[key].seen + 1 : 1) };
    save();
  }
  function srsDueKeys() {
    const today = dateStr();
    return Object.keys(state.srs).filter(k => diffDays(state.srs[k].due, today) >= 0);
  }
  function srsDueCount() { return srsDueKeys().length; }

  /* ---------- Luyện tập 12 tuần ---------- */
  function practiceGet(id) { return state.practice[id] || null; }
  function practiceRecord(id, correct, total) {
    const prev = state.practice[id];
    if (!prev || correct > prev.best) state.practice[id] = { best: correct, total: total, ts: Date.now() };
    bumpDaily("quizzes", 1);
    save();
  }
  function practiceDoneCount() {
    return Object.values(state.practice).filter(p => p.total && p.best / p.total >= 0.5).length;
  }

  /* ---------- Giao bài & Góc phụ huynh ---------- */
  function assignData() {
    if (!state.assign) state.assign = { pin: "", minutesGoal: 30, tasks: [] };
    if (!Array.isArray(state.assign.tasks)) state.assign.tasks = [];
    return state.assign;
  }
  function assignGet() { return assignData(); }
  function assignSetMinutesGoal(min) { assignData().minutesGoal = Math.max(5, min | 0); save(); }
  function assignHasPin() { return !!assignData().pin; }
  function assignSetPin(pin) { assignData().pin = ("" + pin).trim(); save(); }
  function assignClearPin() { assignData().pin = ""; save(); }
  function assignVerifyPin(pin) { const p = assignData().pin; return !p || ("" + pin).trim() === p; }
  function assignAddTask(task) {
    const a = assignData();
    if (a.tasks.some(t => t.type === task.type && t.ref === task.ref)) return false;
    a.tasks.push({ type: task.type, ref: task.ref, label: task.label || task.ref });
    save();
    return true;
  }
  function assignRemoveTask(type, ref) {
    const a = assignData();
    a.tasks = a.tasks.filter(t => !(t.type === type && t.ref === ref));
    save();
  }
  function assignClearTasks() { assignData().tasks = []; save(); }
  // Một nhiệm vụ coi là "xong": bài học -> đã hoàn thành; luyện tập -> đã đạt (>=50%)
  function taskDone(task) {
    if (task.type === "lesson") return !!(state.lessons[task.ref] && state.lessons[task.ref].done);
    if (task.type === "practice") {
      const r = state.practice[task.ref];
      return !!(r && r.total && r.best / r.total >= 0.5);
    }
    return false;
  }
  function assignDoneCount() {
    const a = assignData();
    return a.tasks.filter(taskDone).length;
  }

  /* ---------- Theo dõi chủ đề yếu ---------- */
  function topicsData() { if (!state.topics) state.topics = {}; return state.topics; }
  function recordTopic(lessonId, correct) {
    if (!lessonId) return;
    const T = topicsData();
    const t = T[lessonId] || (T[lessonId] = { hit: 0, miss: 0, ts: 0 });
    if (correct) t.hit++; else t.miss++;
    t.ts = Date.now();
    save();
  }
  function topicStat(lessonId) {
    const t = topicsData()[lessonId];
    if (!t) return null;
    const total = t.hit + t.miss;
    return { lessonId: lessonId, hit: t.hit, miss: t.miss, total: total, acc: total ? t.hit / total : 1, ts: t.ts };
  }
  // Trả về các chủ đề yếu: đã làm >= minAttempts câu và độ chính xác < threshold
  function weakTopics(minAttempts, threshold) {
    minAttempts = minAttempts || 3; threshold = threshold == null ? 0.6 : threshold;
    const T = topicsData();
    return Object.keys(T).map(topicStat)
      .filter(s => s && s.total >= minAttempts && s.acc < threshold)
      .sort((a, b) => a.acc - b.acc || b.miss - a.miss);
  }

  /* ---------- Rèn tư duy & tự luận ---------- */
  function thinkData() { if (!state.think) state.think = {}; return state.think; }
  function thinkGet(id) { return thinkData()[id] || null; }
  function thinkDone(id) { return !!thinkData()[id]; }
  function thinkRecord(id, rate) {
    if (!id) return;
    thinkData()[id] = { rate: rate || "got", ts: Date.now() };
    save();
  }
  function thinkDoneCount() { return Object.keys(thinkData()).length; }

  /* ---------- Bài giảng thu âm của học sinh ---------- */
  function recMetaAll() { if (!state.recordings) state.recordings = {}; return state.recordings; }
  function recKey(lessonId) { return NS + "rec." + lessonId; }
  function recSave(lessonId, dataUrl, dur) {
    try { localStorage.setItem(recKey(lessonId), dataUrl); }
    catch (e) { console.warn("[storage] không lưu được bản thu:", e); return false; }
    recMetaAll()[lessonId] = { t: Date.now(), dur: dur || 0, size: dataUrl.length };
    save();
    return true;
  }
  function recGet(lessonId) {
    try { return localStorage.getItem(recKey(lessonId)); } catch (e) { return null; }
  }
  function recDelete(lessonId) {
    try { localStorage.removeItem(recKey(lessonId)); } catch (e) {}
    delete recMetaAll()[lessonId];
    save();
  }
  function recList() {
    const m = recMetaAll();
    return Object.keys(m).map(id => Object.assign({ lessonId: id }, m[id])).sort((a, b) => b.t - a.t);
  }
  function recCount() { return Object.keys(recMetaAll()).length; }

  /* ---------- Cờ đạt mục tiêu trong ngày ---------- */
  function goalDayGet() { return state.goalDay || ""; }
  function goalDaySet() { state.goalDay = dateStr(); save(); }

  /* ---------- Sao lưu / chuyển máy ---------- */
  function exportState() {
    return JSON.stringify({ app: "toan9-feynman", schema: SCHEMA, profile: currentProfile().name, t: Date.now(), state: state }, null, 1);
  }
  function importState(json) {
    let obj;
    try { obj = JSON.parse(json); } catch (e) { return { ok: false, msg: "Tệp không đúng định dạng." }; }
    const st = obj && obj.app === "toan9-feynman" && obj.state ? obj.state : (obj && obj.exp !== undefined && obj.lessons ? obj : null);
    if (!st || typeof st !== "object" || st.lessons === undefined) return { ok: false, msg: "Tệp này không phải bản sao lưu của app." };
    const ok = lsSet(ROOT_KEY, JSON.stringify(st));
    return ok ? { ok: true } : { ok: false, msg: "Không ghi được vào bộ nhớ trình duyệt." };
  }

  /* ---------- Giọng đọc (TTS) ---------- */
  function ttsGet() { if (!state.tts) state.tts = { persona: "co", rate: 1, voice: "" }; return state.tts; }
  function ttsSet(patch) { Object.assign(ttsGet(), patch || {}); save(); }

  /* ---------- Kiểm tra định kỳ ---------- */
  function testsData() { if (!Array.isArray(state.tests)) state.tests = []; return state.tests; }
  function testRecord(score, total, seconds) {
    testsData().push({ t: Date.now(), score: score, total: total, sec: seconds || 0 });
    if (state.tests.length > 50) state.tests = state.tests.slice(-50);
    save();
  }
  function testList() { return testsData().slice(); }
  function testBestPct() {
    return testsData().reduce((m, x) => Math.max(m, x.total ? x.score / x.total : 0), 0);
  }

  /* ---------- Huy hiệu ---------- */
  function hasBadge(id) { return state.badges.indexOf(id) !== -1; }
  function unlockBadge(id) {
    if (hasBadge(id)) return false;
    state.badges.push(id);
    save();
    return true;
  }

  /* ---------- Đặt lại ---------- */
  function resetAll() {
    state = defaults();
    save();
  }

  /* ---------- Xuất API ---------- */
  App.Storage = {
    // vòng đời
    load, save, defaults,
    get state() { return state; },
    // ngày
    dateStr, addDays, diffDays,
    // cài đặt
    getTheme, setTheme, getGoals, setGoals,
    // streak / lịch / phút
    recordStudyMinutes, effectiveStreak, minutesToday,
    setReminderDay, reminderMark, goalDayGet, goalDaySet,
    calendarLast, daysStudiedThisWeek,
    // thói quen: nhiệm vụ ngày, Bùa giữ chuỗi, nhắc học
    ensureDaily, dailyCounts, dailyClaimed, claimDailyBonus,
    getFreezes, addFreeze, isStudiedToday, streakStatus,
    getReminder, setReminder, markReminded,
    // exp
    addExp,
    // bài học
    lesson, isStepDone, setStepDone, setLessonDone, recordQuiz,
    lessonCompletionPct, lessonsDoneCount,
    // ghi chú
    getNote, setNote,
    // SRS
    srsGet, srsAll, srsSet, srsDueKeys, srsDueCount,
    // luyện tập
    practiceGet, practiceRecord, practiceDoneCount,
    // chủ đề yếu
    recordTopic, topicStat, weakTopics,
    // rèn tư duy
    thinkGet, thinkDone, thinkRecord, thinkDoneCount,
    // kiểm tra định kỳ
    testRecord, testList, testBestPct,
    // giọng đọc
    ttsGet, ttsSet,
    // bài giảng thu âm
    recSave, recGet, recDelete, recList, recCount,
    // hồ sơ thành viên
    profilesList, currentProfile, activeProfileId, setActiveProfile, profileAdd, profileRemove,
    // sao lưu / chuyển máy
    exportState, importState,
    // giao bài & phụ huynh
    assignGet, assignSetMinutesGoal, assignHasPin, assignSetPin, assignClearPin,
    assignVerifyPin, assignAddTask, assignRemoveTask, assignClearTasks, taskDone, assignDoneCount,
    // huy hiệu
    hasBadge, unlockBadge,
    // nhật ký
    log,
    // reset
    resetAll
  };
})(window.App = window.App || {});
