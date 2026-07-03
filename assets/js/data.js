/* =========================================================================
   data.js — TOÀN BỘ NỘI DUNG HỌC
   -------------------------------------------------------------------------
   Mọi nội dung tách rời khỏi code -> thêm bài mới chỉ cần thêm 1 object.
   Cấu trúc 1 bài học:
     {
       id, chapterId, title, emoji, estMinutes,
       feynman: {
         s1: { html }                         // Giải thích như cho lớp 5
         s2: { type:'svg'|'graph'|'chart', ...} // Minh hoạ trực quan
         s3: [ {ic, title, html} ]            // Ứng dụng thực tế
         s4: { prompt, keywords:[], sample }  // Tự giải thích (Feynman)
       },
       exercises: { easy:[...], medium:[...], hard:[...] },  // mỗi câu có lời giải
       flashcards: [ {front, back} ],
     }
   Loại câu hỏi: 'mc' | 'fill' | 'match'
   ========================================================================= */
(function (App) {
  "use strict";

  /* ---- Vài hình minh hoạ SVG dùng lại (chuỗi) ---- */
  const SVG = {
    machine: `<svg width="320" height="190" viewBox="0 0 320 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="110" y="40" width="100" height="100" rx="16" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="3"/>
      <text x="160" y="86" text-anchor="middle" font-size="15" font-weight="800" fill="var(--brand-deep)">MÁY</text>
      <text x="160" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="var(--brand-deep)">f(x)=2x+1</text>
      <line x1="20" y1="90" x2="108" y2="90" stroke="var(--accent)" stroke-width="4" marker-end="url(#ar)"/>
      <line x1="212" y1="90" x2="300" y2="90" stroke="var(--teal-500)" stroke-width="4" marker-end="url(#ar)"/>
      <circle cx="40" cy="90" r="20" fill="var(--accent)"/><text x="40" y="96" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">3</text>
      <circle cx="280" cy="90" r="20" fill="var(--teal-500)"/><text x="280" y="96" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">7</text>
      <text x="40" y="150" text-anchor="middle" font-size="12" fill="var(--ink-faint)">đầu vào x</text>
      <text x="280" y="150" text-anchor="middle" font-size="12" fill="var(--ink-faint)">đầu ra y</text>
      <defs><marker id="ar" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="currentColor"/></marker></defs>
    </svg>`,

    rightTriangle: `<svg width="300" height="220" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,180 250,180 50,40" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="3"/>
      <rect x="50" y="160" width="20" height="20" fill="none" stroke="var(--brand-deep)" stroke-width="2"/>
      <text x="150" y="200" text-anchor="middle" font-size="14" font-weight="700" fill="var(--ink-soft)">cạnh kề b</text>
      <text x="28" y="115" text-anchor="middle" font-size="14" font-weight="700" fill="var(--ink-soft)" transform="rotate(-90 28 115)">cạnh đối a</text>
      <text x="160" y="100" text-anchor="middle" font-size="14" font-weight="800" fill="var(--accent-deep)" transform="rotate(-37 160 100)">cạnh huyền c</text>
      <text x="232" y="172" text-anchor="middle" font-size="16" font-weight="800" fill="var(--accent-deep)">α</text>
    </svg>`,

    similar: `<svg width="320" height="220" viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="190" x2="300" y2="190" stroke="var(--border-2)" stroke-width="2"/>
      <rect x="60" y="120" width="14" height="70" fill="var(--accent)"/><text x="67" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">cọc 1m</text>
      <line x1="74" y1="190" x2="120" y2="190" stroke="var(--ink-faint)" stroke-width="2" stroke-dasharray="3 3"/><text x="97" y="205" text-anchor="middle" font-size="11" fill="var(--ink-faint)">bóng</text>
      <path d="M200,40 Q210,90 205,190 Q215,90 230,40 Q220,80 215,190 Z" fill="var(--brand)"/>
      <rect x="208" y="60" width="10" height="130" fill="#7c5b3a"/>
      <text x="213" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">cây = ?</text>
      <line x1="218" y1="190" x2="280" y2="190" stroke="var(--ink-faint)" stroke-width="2" stroke-dasharray="3 3"/><text x="249" y="205" text-anchor="middle" font-size="11" fill="var(--ink-faint)">bóng</text>
      <line x1="60" y1="120" x2="120" y2="190" stroke="var(--amber-500)" stroke-width="2"/>
      <line x1="208" y1="55" x2="280" y2="190" stroke="var(--amber-500)" stroke-width="2"/>
    </svg>`,

    circle: `<svg width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="90" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="3"/>
      <circle cx="120" cy="120" r="4" fill="var(--brand-deep)"/><text x="120" y="112" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand-deep)">O</text>
      <line x1="120" y1="120" x2="210" y2="120" stroke="var(--accent)" stroke-width="3"/><text x="165" y="113" text-anchor="middle" font-size="13" font-weight="700" fill="var(--accent-deep)">R</text>
      <line x1="120" y1="120" x2="56" y2="56" stroke="var(--teal-500)" stroke-width="3" stroke-dasharray="4 3"/>
      <line x1="38" y1="160" x2="205" y2="70" stroke="var(--violet-500)" stroke-width="3"/><text x="60" y="160" font-size="12" font-weight="700" fill="var(--violet-500)">dây cung</text>
    </svg>`,

    spinner: `<svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
      <circle cx="110" cy="110" r="92" fill="none" stroke="var(--border-2)" stroke-width="2"/>
      <path d="M110,110 L110,18 A92,92 0 0,1 190,156 Z" fill="var(--brand)" opacity=".85"/>
      <path d="M110,110 L190,156 A92,92 0 0,1 30,156 Z" fill="var(--accent)" opacity=".85"/>
      <path d="M110,110 L30,156 A92,92 0 0,1 110,18 Z" fill="var(--gold)" opacity=".85"/>
      <text x="148" y="80" font-size="20" font-weight="800" fill="#fff">A</text>
      <text x="110" y="170" font-size="20" font-weight="800" fill="#fff">B</text>
      <text x="62" y="92" font-size="20" font-weight="800" fill="#fff">C</text>
      <polygon points="110,110 124,128 96,128" fill="var(--ink)"/>
      <circle cx="110" cy="110" r="9" fill="var(--ink)"/>
    </svg>`,

    sqrt: `<svg width="300" height="170" viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="40" width="100" height="100" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="3"/>
      <text x="110" y="98" text-anchor="middle" font-size="22" font-weight="800" fill="var(--brand-deep)">25</text>
      <text x="110" y="160" text-anchor="middle" font-size="12" fill="var(--ink-faint)">Diện tích = 25</text>
      <text x="55" y="95" text-anchor="end" font-size="15" font-weight="800" fill="var(--accent-deep)">? </text>
      <line x1="60" y1="150" x2="160" y2="150" stroke="var(--accent)" stroke-width="3"/>
      <text x="110" y="35" text-anchor="middle" font-size="13" font-weight="700" fill="var(--accent-deep)">cạnh = √25 = 5</text>
      <line x1="200" y1="140" x2="200" y2="40" stroke="var(--ink-faint)" stroke-width="2" marker-end="url(#ar2)"/>
      <text x="230" y="95" font-size="13" fill="var(--ink-soft)">√ = đi tìm cạnh<tspan x="230" dy="18">khi biết diện tích</tspan></text>
      <defs><marker id="ar2" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="var(--ink-faint)"/></marker></defs>
    </svg>`,

    parabola: `<svg width="300" height="240" viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
      <line x1="150" y1="14" x2="150" y2="214" stroke="var(--border-2)" stroke-width="1.5"/>
      <line x1="24" y1="200" x2="276" y2="200" stroke="var(--border-2)" stroke-width="1.5"/>
      <path d="M48,40 Q150,300 252,40" fill="none" stroke="var(--brand)" stroke-width="3.5"/>
      <circle cx="150" cy="168" r="5" fill="var(--accent)"/>
      <text x="150" y="190" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent-deep)">đỉnh (0;0)</text>
      <text x="150" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="var(--brand-deep)">y = ax²</text>
      <text x="60" y="60" font-size="12" fill="var(--ink-soft)">a &gt; 0: lõm lên</text>
      <text x="284" y="206" text-anchor="end" font-size="12" fill="var(--ink-faint)">x</text>
      <text x="158" y="24" font-size="12" fill="var(--ink-faint)">y</text>
    </svg>`,

    golden: `<svg width="300" height="190" viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="288" height="178" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <line x1="184" y1="6" x2="184" y2="184" stroke="var(--brand)" stroke-width="2"/>
      <line x1="184" y1="73" x2="294" y2="73" stroke="var(--brand)" stroke-width="2"/>
      <line x1="252" y1="73" x2="252" y2="184" stroke="var(--brand)" stroke-width="1.5"/>
      <path d="M184,184 A178,178 0 0,1 6,6" fill="none" stroke="var(--accent)" stroke-width="3"/>
      <path d="M294,73 A110,110 0 0,1 184,184" fill="none" stroke="var(--accent)" stroke-width="3"/>
      <path d="M252,73 A68,68 0 0,1 294,73" fill="none" stroke="var(--accent)" stroke-width="3"/>
      <text x="95" y="100" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand-deep)">1</text>
      <text x="239" y="44" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand-deep)">0,618</text>
      <text x="150" y="178" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent-deep)">tỉ lệ ≈ 1,618 (φ)</text>
    </svg>`,

    perspective: `<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="300" height="86" fill="var(--brand-soft)" opacity=".5"/>
      <line x1="0" y1="86" x2="300" y2="86" stroke="var(--border-2)" stroke-width="1.5" stroke-dasharray="5 4"/>
      <text x="6" y="80" font-size="11" fill="var(--ink-faint)">đường chân trời</text>
      <circle cx="150" cy="86" r="4" fill="var(--accent)"/>
      <text x="150" y="74" text-anchor="middle" font-size="11" font-weight="700" fill="var(--accent-deep)">điểm tụ</text>
      <line x1="20" y1="196" x2="150" y2="86" stroke="var(--ink-soft)" stroke-width="2"/>
      <line x1="280" y1="196" x2="150" y2="86" stroke="var(--ink-soft)" stroke-width="2"/>
      <line x1="110" y1="196" x2="150" y2="86" stroke="var(--border-2)" stroke-width="1"/>
      <line x1="190" y1="196" x2="150" y2="86" stroke="var(--border-2)" stroke-width="1"/>
      <rect x="44" y="140" width="14" height="50" fill="var(--brand)"/>
      <rect x="124" y="110" width="9" height="26" fill="var(--brand)"/>
      <rect x="146" y="98" width="5" height="13" fill="var(--brand)"/>
      <text x="51" y="138" text-anchor="middle" font-size="11" fill="var(--ink-soft)">gần</text>
      <text x="170" y="106" font-size="11" fill="var(--ink-soft)">xa = nhỏ</text>
    </svg>`,

    inscribed: `<svg width="240" height="230" viewBox="0 0 240 230" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="118" r="88" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <circle cx="120" cy="118" r="4" fill="var(--brand-deep)"/><text x="108" y="122" font-size="12" font-weight="800" fill="var(--brand-deep)">O</text>
      <circle cx="46" cy="160" r="4" fill="var(--ink)"/><text x="30" y="170" font-size="12" font-weight="700">A</text>
      <circle cx="194" cy="160" r="4" fill="var(--ink)"/><text x="200" y="170" font-size="12" font-weight="700">B</text>
      <circle cx="120" cy="30" r="4" fill="var(--accent)"/><text x="124" y="26" font-size="12" font-weight="700" fill="var(--accent-deep)">C</text>
      <line x1="120" y1="118" x2="46" y2="160" stroke="var(--brand)" stroke-width="2"/>
      <line x1="120" y1="118" x2="194" y2="160" stroke="var(--brand)" stroke-width="2"/>
      <line x1="120" y1="30" x2="46" y2="160" stroke="var(--accent)" stroke-width="2"/>
      <line x1="120" y1="30" x2="194" y2="160" stroke="var(--accent)" stroke-width="2"/>
      <text x="120" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="var(--brand-deep)">2α (tâm)</text>
      <text x="120" y="58" text-anchor="middle" font-size="12" font-weight="800" fill="var(--accent-deep)">α (nội tiếp)</text>
    </svg>`,

    viet: `<svg width="300" height="170" viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="26" fill="var(--brand)"/><text x="60" y="66" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">x₁</text>
      <circle cx="60" cy="120" r="26" fill="var(--accent)"/><text x="60" y="126" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">x₂</text>
      <line x1="88" y1="66" x2="180" y2="50" stroke="var(--ink-faint)" stroke-width="2" marker-end="url(#arv)"/>
      <line x1="88" y1="114" x2="180" y2="120" stroke="var(--ink-faint)" stroke-width="2" marker-end="url(#arv)"/>
      <rect x="184" y="32" width="108" height="40" rx="10" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <text x="238" y="57" text-anchor="middle" font-size="14" font-weight="800" fill="var(--brand-deep)">x₁+x₂ = −b/a</text>
      <rect x="184" y="98" width="108" height="40" rx="10" fill="var(--brand-soft)" stroke="var(--accent)" stroke-width="2"/>
      <text x="238" y="123" text-anchor="middle" font-size="14" font-weight="800" fill="var(--accent-deep)">x₁·x₂ = c/a</text>
      <defs><marker id="arv" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="var(--ink-faint)"/></marker></defs>
    </svg>`,

    twolines: `<svg width="300" height="220" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="110" x2="280" y2="110" stroke="var(--border-2)" stroke-width="1.5"/>
      <line x1="150" y1="14" x2="150" y2="206" stroke="var(--border-2)" stroke-width="1.5"/>
      <line x1="40" y1="190" x2="260" y2="40" stroke="var(--brand)" stroke-width="3"/>
      <line x1="50" y1="40" x2="250" y2="180" stroke="var(--accent)" stroke-width="3"/>
      <circle cx="158" cy="110" r="6" fill="var(--brand-deep)"/>
      <text x="168" y="104" font-size="13" font-weight="800" fill="var(--brand-deep)">nghiệm (x; y)</text>
      <text x="250" y="34" font-size="12" fill="var(--brand-deep)">PT (1)</text>
      <text x="252" y="190" font-size="12" fill="var(--accent-deep)">PT (2)</text>
    </svg>`,

    product0: `<svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="50" width="220" height="50" rx="12" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <text x="150" y="82" text-anchor="middle" font-size="18" font-weight="800" fill="var(--brand-deep)">A · B = 0</text>
      <text x="150" y="125" text-anchor="middle" font-size="15" font-weight="700" fill="var(--accent-deep)">⟹ A = 0 hoặc B = 0</text>
      <text x="150" y="34" text-anchor="middle" font-size="13" fill="var(--ink-soft)">Tích bằng 0 khi một thừa số bằng 0</text>
    </svg>`,

    scale: `<svg width="280" height="180" viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
      <line x1="40" y1="60" x2="240" y2="84" stroke="var(--ink-soft)" stroke-width="4" stroke-linecap="round"/>
      <line x1="140" y1="72" x2="140" y2="150" stroke="var(--ink-faint)" stroke-width="4"/>
      <rect x="100" y="150" width="80" height="12" rx="4" fill="var(--ink-faint)"/>
      <circle cx="40" cy="60" r="22" fill="var(--brand)"/><text x="40" y="66" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">a</text>
      <circle cx="240" cy="84" r="22" fill="var(--accent)"/><text x="240" y="90" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">b</text>
      <text x="140" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="var(--brand-deep)">a &gt; b</text>
    </svg>`,

    numberline: `<svg width="300" height="110" viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="60" x2="280" y2="60" stroke="var(--ink-faint)" stroke-width="2" marker-end="url(#nlar)"/>
      <line x1="150" y1="60" x2="280" y2="60" stroke="var(--brand)" stroke-width="6" opacity=".5"/>
      <circle cx="150" cy="60" r="7" fill="#fff" stroke="var(--brand-deep)" stroke-width="3"/>
      <text x="150" y="90" text-anchor="middle" font-size="13" font-weight="700" fill="var(--brand-deep)">2</text>
      <text x="220" y="44" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand-deep)">x &gt; 2</text>
      <text x="60" y="44" text-anchor="middle" font-size="12" fill="var(--ink-faint)">vòng tròn rỗng: không lấy 2</text>
      <defs><marker id="nlar" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="var(--ink-faint)"/></marker></defs>
    </svg>`,

    sqrtprod: `<svg width="300" height="120" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="40" width="240" height="44" rx="12" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <text x="150" y="69" text-anchor="middle" font-size="17" font-weight="800" fill="var(--brand-deep)">√(a·b) = √a · √b</text>
      <text x="150" y="30" text-anchor="middle" font-size="13" fill="var(--ink-soft)">Tách số dưới căn để tính gọn hơn</text>
      <text x="150" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--accent-deep)">vd: √50 = √(25·2) = 5√2</text>
    </svg>`,

    cube: `<svg width="220" height="200" viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,70 140,70 140,150 60,150" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <polygon points="60,70 90,40 170,40 140,70" fill="color-mix(in srgb, var(--brand) 25%, var(--surface))" stroke="var(--brand)" stroke-width="2.5"/>
      <polygon points="140,70 170,40 170,120 140,150" fill="color-mix(in srgb, var(--brand) 12%, var(--surface))" stroke="var(--brand)" stroke-width="2.5"/>
      <text x="100" y="178" text-anchor="middle" font-size="14" font-weight="800" fill="var(--brand-deep)">V = a³ ⟹ a = ∛V</text>
      <text x="100" y="115" text-anchor="middle" font-size="13" font-weight="700" fill="var(--brand-deep)">a</text>
    </svg>`,

    chordarc: `<svg width="240" height="220" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="115" r="86" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <circle cx="120" cy="115" r="4" fill="var(--brand-deep)"/><text x="106" y="120" font-size="12" font-weight="800" fill="var(--brand-deep)">O</text>
      <line x1="120" y1="115" x2="56" y2="172" stroke="var(--brand)" stroke-width="2"/>
      <line x1="120" y1="115" x2="184" y2="172" stroke="var(--brand)" stroke-width="2"/>
      <line x1="56" y1="172" x2="184" y2="172" stroke="var(--accent)" stroke-width="3"/>
      <path d="M56,172 A86,86 0 0,1 184,172" fill="none" stroke="var(--accent-deep)" stroke-width="4"/>
      <text x="120" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="var(--brand-deep)">góc ở tâm</text>
      <text x="120" y="192" text-anchor="middle" font-size="12" font-weight="800" fill="var(--accent-deep)">dây cung</text>
      <text x="120" y="214" text-anchor="middle" font-size="11" fill="var(--ink-soft)">cung nằm trên đường tròn</text>
    </svg>`,

    sector: `<svg width="220" height="210" viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg">
      <circle cx="110" cy="100" r="84" fill="none" stroke="var(--border-2)" stroke-width="2"/>
      <path d="M110,100 L194,100 A84,84 0 0,0 110,16 Z" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <circle cx="110" cy="100" r="3" fill="var(--brand-deep)"/>
      <text x="150" y="70" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand-deep)">quạt</text>
      <text x="110" y="200" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent-deep)">cung = (n/360)·2πR</text>
      <text x="110" y="184" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent-deep)">quạt = (n/360)·πR²</text>
    </svg>`,

    linecircle: `<svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <circle cx="55" cy="70" r="36" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <line x1="20" y1="58" x2="92" y2="58" stroke="var(--accent-deep)" stroke-width="2.5"/>
      <text x="55" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">cắt (2 điểm)</text>
      <circle cx="150" cy="70" r="36" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <line x1="114" y1="106" x2="186" y2="106" stroke="var(--accent-deep)" stroke-width="2.5"/>
      <text x="150" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">tiếp xúc (d=R)</text>
      <circle cx="245" cy="70" r="36" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <line x1="209" y1="120" x2="281" y2="120" stroke="var(--accent-deep)" stroke-width="2.5"/>
      <text x="245" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">không cắt (d&gt;R)</text>
    </svg>`,

    twocircles: `<svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <circle cx="44" cy="60" r="28" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <circle cx="78" cy="60" r="28" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <text x="61" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">cắt nhau</text>
      <circle cx="150" cy="60" r="28" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <circle cx="206" cy="60" r="28" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <text x="178" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-soft)">tiếp xúc</text>
      <circle cx="262" cy="60" r="20" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <circle cx="262" cy="60" r="9" fill="none" stroke="var(--accent)" stroke-width="2"/>
      <text x="262" y="116" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink-soft)">đựng nhau</text>
    </svg>`,

    outcomes: `<svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="20" width="272" height="110" rx="16" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-dasharray="6 5"/>
      <text x="150" y="40" text-anchor="middle" font-size="13" font-weight="800" fill="var(--brand-deep)">Không gian mẫu Ω (tung xúc xắc)</text>
      ${[1,2,3,4,5,6].map((n,i)=>`<circle cx="${52+i*40}" cy="86" r="17" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/><text x="${52+i*40}" y="92" text-anchor="middle" font-size="16" font-weight="800" fill="var(--brand-deep)">${n}</text>`).join("")}
      <text x="150" y="122" text-anchor="middle" font-size="12" fill="var(--ink-soft)">6 kết quả có thể xảy ra</text>
    </svg>`,

    circuminscribed: `<svg width="230" height="220" viewBox="0 0 230 220" xmlns="http://www.w3.org/2000/svg">
      <circle cx="115" cy="110" r="86" fill="none" stroke="var(--brand)" stroke-width="2.5"/>
      <polygon points="115,24 41,158 189,158" fill="var(--brand-soft)" stroke="var(--accent-deep)" stroke-width="2.5"/>
      <circle cx="115" cy="120" r="42" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
      <circle cx="115" cy="110" r="3" fill="var(--brand-deep)"/>
      <text x="200" y="60" font-size="11" font-weight="700" fill="var(--brand-deep)">ngoại tiếp</text>
      <text x="118" y="128" font-size="11" font-weight="700" fill="var(--accent-deep)">nội tiếp</text>
    </svg>`,

    cyclicquad: `<svg width="220" height="220" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
      <circle cx="110" cy="110" r="88" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <polygon points="60,40 180,86 150,180 40,140" fill="none" stroke="var(--accent-deep)" stroke-width="2.5"/>
      <circle cx="60" cy="40" r="4" fill="var(--ink)"/><text x="48" y="36" font-size="12" font-weight="700">A</text>
      <circle cx="180" cy="86" r="4" fill="var(--ink)"/><text x="186" y="84" font-size="12" font-weight="700">B</text>
      <circle cx="150" cy="180" r="4" fill="var(--ink)"/><text x="156" y="192" font-size="12" font-weight="700">C</text>
      <circle cx="40" cy="140" r="4" fill="var(--ink)"/><text x="22" y="146" font-size="12" font-weight="700">D</text>
      <text x="110" y="116" text-anchor="middle" font-size="12" font-weight="800" fill="var(--brand-deep)">Â + Ĉ = 180°</text>
    </svg>`,

    polygon: `<svg width="220" height="200" viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="110" cy="100" r="84" fill="none" stroke="var(--border-2)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <polygon points="110,16 183,58 183,142 110,184 37,142 37,58" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <circle cx="110" cy="100" r="3" fill="var(--brand-deep)"/>
      <text x="110" y="104" text-anchor="middle" font-size="11" font-weight="700" fill="var(--brand-deep)">O</text>
      <text x="110" y="198" text-anchor="middle" font-size="12" font-weight="700" fill="var(--accent-deep)">lục giác đều: 6 cạnh, 6 góc bằng nhau</text>
    </svg>`,

    cylindercone: `<svg width="280" height="200" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="75" cy="40" rx="42" ry="14" fill="color-mix(in srgb, var(--brand) 22%, var(--surface))" stroke="var(--brand)" stroke-width="2"/>
      <path d="M33,40 L33,150 A42,14 0 0,0 117,150 L117,40" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2"/>
      <ellipse cx="75" cy="150" rx="42" ry="14" fill="none" stroke="var(--brand)" stroke-width="2"/>
      <text x="75" y="184" text-anchor="middle" font-size="12" font-weight="800" fill="var(--brand-deep)">Trụ: V = πr²h</text>
      <path d="M205,30 L247,150 A42,14 0 0,1 163,150 Z" fill="var(--brand-soft)" stroke="var(--accent-deep)" stroke-width="2"/>
      <ellipse cx="205" cy="150" rx="42" ry="14" fill="none" stroke="var(--accent-deep)" stroke-width="2"/>
      <text x="205" y="184" text-anchor="middle" font-size="12" font-weight="800" fill="var(--accent-deep)">Nón: V = ⅓πr²h</text>
    </svg>`,

    sphere: `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="95" r="72" fill="var(--brand-soft)" stroke="var(--brand)" stroke-width="2.5"/>
      <ellipse cx="100" cy="95" rx="72" ry="22" fill="none" stroke="var(--brand)" stroke-width="1.5" stroke-dasharray="4 4"/>
      <line x1="100" y1="95" x2="172" y2="95" stroke="var(--accent-deep)" stroke-width="2"/>
      <text x="135" y="88" font-size="12" font-weight="800" fill="var(--accent-deep)">R</text>
      <text x="100" y="190" text-anchor="middle" font-size="12" font-weight="800" fill="var(--brand-deep)">V = 4⁄3·πR³ · S = 4πR²</text>
    </svg>`
  };

  /* ===================================================================== */
  /*  CHƯƠNG                                                                */
  /* ===================================================================== */
  const chapters = [
    { id: "chuong-1", name: "Chương I · Phương trình & hệ hai PT bậc nhất hai ẩn", emoji: "🔗", color: "#16a34a",
      lessons: ["pt-he-khai-niem", "he-phuong-trinh", "lap-he-pt"] },
    { id: "chuong-2", name: "Chương II · Phương trình & bất phương trình bậc nhất một ẩn", emoji: "⚖️", color: "#0d9488",
      lessons: ["pt-tich", "bat-dang-thuc", "bat-phuong-trinh"] },
    { id: "chuong-3", name: "Chương III · Căn bậc hai và căn bậc ba", emoji: "√", color: "#0ea5e9",
      lessons: ["can-bac-hai", "khai-can", "rut-gon-can", "can-bac-ba"] },
    { id: "chuong-4", name: "Chương IV · Hệ thức lượng trong tam giác vuông", emoji: "📐", color: "#8b5cf6",
      lessons: ["ti-so-luong-giac", "he-thuc-luong"] },
    { id: "chuong-5", name: "Chương V · Đường tròn", emoji: "⭕", color: "#f97316",
      lessons: ["duong-tron", "cung-day", "do-dai-cung", "vi-tri-duong-thang-tron", "vi-tri-hai-duong-tron"] },
    { id: "chuong-6", name: "Chương VI · Hàm số y = ax² & Phương trình bậc hai", emoji: "🅿️", color: "#16a34a",
      lessons: ["ham-so-y-ax2", "phuong-trinh-bac-hai", "he-thuc-vi-et", "lap-pt"] },
    { id: "chuong-7", name: "Chương VII · Tần số và tần số tương đối", emoji: "📊", color: "#8b5cf6",
      lessons: ["thong-ke", "tan-so-tuong-doi", "tan-so-ghep-nhom"] },
    { id: "chuong-8", name: "Chương VIII · Xác suất của biến cố", emoji: "🎲", color: "#0ea5e9",
      lessons: ["phep-thu", "xac-suat"] },
    { id: "chuong-9", name: "Chương IX · Đường tròn ngoại tiếp & nội tiếp", emoji: "🎯", color: "#0d9488",
      lessons: ["goc-noi-tiep", "duong-tron-ngoai-noi-tiep", "tu-giac-noi-tiep", "da-giac-deu"] },
    { id: "chuong-10", name: "Chương X · Một số hình khối trong thực tiễn", emoji: "🧊", color: "#6366f1",
      lessons: ["hinh-tru-non", "hinh-cau"] },
    { id: "mo-rong", name: "Mở rộng (Hội họa & Ôn tập)", emoji: "🌟", color: "#ec4899",
      lessons: ["ham-so-bac-nhat", "tam-giac-dong-dang", "ti-le-vang", "phoi-canh", "on-thi-tong-hop"] },
  ];

  /* ===================================================================== */
  /*  BÀI HỌC                                                               */
  /* ===================================================================== */
  const lessons = {

    "lap-pt": {
      id: "lap-pt", chapterId: "chuong-6", title: "Bài 21: Giải bài toán bằng cách lập phương trình", emoji: "📝", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🧩</div><div class="e-body">
            Khi bài toán có <b>một đại lượng chưa biết</b> liên hệ qua diện tích, quãng đường hay tích số, ta đặt nó là <b>x</b>,
            "dịch" lời văn thành <b>một phương trình</b> (thường là <b>bậc hai</b>), rồi giải.</div></div>
          <p><strong>4 bước:</strong></p>
          <ul class="bullets">
            <li><b>① Gọi ẩn</b> x và nêu điều kiện (vd: x &gt; 0).</li>
            <li><b>② Lập phương trình</b> từ dữ kiện (diện tích, chu vi, tích…).</li>
            <li><b>③ Giải</b> phương trình (thường dùng công thức nghiệm bậc hai).</li>
            <li><b>④ Đối chiếu điều kiện</b> và trả lời.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.parabola, caption: "Nhiều bài toán diện tích / chuyển động dẫn tới một phương trình bậc hai (một parabol)." },
        s3: [
          { ic: "🟩", title: "Bài toán diện tích", html: "Hình chữ nhật biết quan hệ cạnh và diện tích → phương trình bậc hai theo một cạnh." },
          { ic: "🚗", title: "Chuyển động", html: "Quãng đường = vận tốc × thời gian; thay đổi vận tốc/thời gian thường tạo PT bậc hai." },
          { ic: "🔢", title: "Tìm số", html: "“Hai số liên tiếp có tích…”, “số có tổng/chữ số…” đưa về phương trình một ẩn." },
        ],
        s4: { prompt: "Nêu các bước giải bài toán bằng cách lập phương trình. Vì sao thường ra phương trình bậc hai?",
          keywords: ["gọi ẩn", "điều kiện", "lập phương trình", "giải", "đối chiếu", "bậc hai", "diện tích"],
          sample: "Bước 1 gọi ẩn x và đặt điều kiện. Bước 2 dựa vào dữ kiện lập một phương trình. Bước 3 giải phương trình (thường là bậc hai vì có tích hai đại lượng như diện tích hay vận tốc·thời gian). Bước 4 đối chiếu điều kiện rồi trả lời." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Hình chữ nhật dài hơn rộng 3 m, diện tích 40 m². Chiều rộng = ? m", answer:"5", sol:["x(x+3)=40 → x²+3x−40=0 → x=5."] },
          { type:"fill", q:"(tiếp) Chiều dài = ? m", answer:"8", sol:["5 + 3 = 8."] },
          { type:"mc", q:"Bước đầu tiên khi lập phương trình là", options:["gọi ẩn & đặt điều kiện","giải","thử lại","vẽ hình"], answer:0, sol:["Gọi ẩn trước tiên."] },
          { type:"fill", q:"Hai số tự nhiên liên tiếp có tích 56. Số nhỏ = ?", answer:"7", sol:["x(x+1)=56 → x=7 (7·8=56)."] },
        ],
        medium: [
          { type:"fill", q:"Tăng cạnh hình vuông thêm 3 m thì diện tích bằng 64 m². Cạnh ban đầu = ? m", answer:"5", sol:["(x+3)²=64 → x+3=8 → x=5."] },
          { type:"fill", q:"Mảnh đất hình vuông, tăng cạnh 2 m thì diện tích tăng 32 m². Cạnh ban đầu = ? m", answer:"7", sol:["(x+2)²−x²=32 → 4x+4=32 → x=7."] },
          { type:"mc", q:"Bài toán diện tích thường dẫn tới phương trình", options:["bậc nhất","bậc hai","vô tỉ","bậc ba"], answer:1, sol:["Có tích hai cạnh → bậc hai."] },
        ],
        hard: [
          { type:"fill", q:"Vườn chữ nhật chu vi 28 m, diện tích 48 m². Chiều dài = ? m", answer:"8", sol:["Nửa chu vi 14; x(14−x)=48 → x²−14x+48=0 → x=8 hoặc 6; dài là 8."] },
          { type:"fill", q:"Hai số hơn kém nhau 2, tích 48. Số lớn (dương) = ?", answer:"8", sol:["x(x−2)=48 → x²−2x−48=0 → x=8."] },
        ]
      },
      flashcards: [
        { front:"Bước 1 khi lập phương trình?", back:"Gọi ẩn và đặt điều kiện cho ẩn." },
        { front:"Bước 2?", back:"Lập phương trình từ dữ kiện bài toán." },
        { front:"Bước 4?", back:"Đối chiếu điều kiện và trả lời." },
        { front:"Vì sao thường ra phương trình bậc hai?", back:"Vì có tích hai đại lượng (diện tích, vận tốc·thời gian…)." },
        { front:"HCN dài hơn rộng 3, diện tích 40 → rộng?", back:"x(x+3)=40 → x=5 (m)." },
      ]
    },

    "duong-tron-ngoai-noi-tiep": {
      id: "duong-tron-ngoai-noi-tiep", chapterId: "chuong-9", title: "Bài 28: Đường tròn ngoại tiếp & nội tiếp của tam giác", emoji: "🔵", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🎯</div><div class="e-body">
            <b>Đường tròn ngoại tiếp</b> "ôm bên ngoài", đi qua <b>cả 3 đỉnh</b>; <b>đường tròn nội tiếp</b> "nằm bên trong",
            tiếp xúc <b>cả 3 cạnh</b>.</div></div>
          <ul class="bullets">
            <li><b>Tâm ngoại tiếp O</b> = giao <b>ba đường trung trực</b> (cách đều 3 đỉnh).</li>
            <li><b>Tâm nội tiếp I</b> = giao <b>ba đường phân giác</b> (cách đều 3 cạnh).</li>
            <li>Mọi tam giác đều có đúng một đường tròn ngoại tiếp và một đường tròn nội tiếp.</li>
            <li><b>Tam giác vuông:</b> tâm ngoại tiếp là <b>trung điểm cạnh huyền</b>, bán kính R = ½ cạnh huyền.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.circuminscribed, caption: "Đường tròn ngoại tiếp đi qua 3 đỉnh; đường tròn nội tiếp tiếp xúc 3 cạnh." },
        s3: [
          { ic: "📐", title: "Dựng hình", html: "Vẽ trung trực để tìm tâm ngoại tiếp; vẽ phân giác để tìm tâm nội tiếp." },
          { ic: "🏛️", title: "Thiết kế", html: "Cột tròn nội tiếp tam giác, vòm ngoại tiếp — ứng dụng trong kiến trúc." },
          { ic: "📏", title: "Tam giác vuông", html: "Cạnh huyền chính là đường kính đường tròn ngoại tiếp." },
        ],
        s4: { prompt: "Phân biệt đường tròn ngoại tiếp và nội tiếp tam giác; tâm mỗi đường tròn là giao của ba đường nào?",
          keywords: ["ngoại tiếp", "3 đỉnh", "trung trực", "nội tiếp", "3 cạnh", "phân giác", "cạnh huyền"],
          sample: "Đường tròn ngoại tiếp đi qua ba đỉnh, tâm là giao ba đường trung trực (cách đều ba đỉnh). Đường tròn nội tiếp tiếp xúc ba cạnh, tâm là giao ba đường phân giác (cách đều ba cạnh). Với tam giác vuông, tâm ngoại tiếp là trung điểm cạnh huyền, R bằng nửa cạnh huyền." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Tâm đường tròn ngoại tiếp tam giác là giao của", options:["ba đường trung trực","ba phân giác","ba trung tuyến","ba đường cao"], answer:0, sol:["Trung trực cách đều hai đầu mút → cách đều 3 đỉnh."] },
          { type:"mc", q:"Tâm đường tròn nội tiếp tam giác là giao của", options:["ba phân giác","ba trung trực","ba trung tuyến","ba đường cao"], answer:0, sol:["Phân giác cách đều hai cạnh → cách đều 3 cạnh."] },
          { type:"mc", q:"Đường tròn ngoại tiếp đi qua", options:["3 đỉnh","3 cạnh","1 đỉnh","tâm"], answer:0, sol:["Qua cả ba đỉnh."] },
          { type:"mc", q:"Đường tròn nội tiếp tiếp xúc", options:["3 cạnh","3 đỉnh","1 cạnh","đường cao"], answer:0, sol:["Tiếp xúc cả ba cạnh."] },
        ],
        medium: [
          { type:"fill", q:"Tam giác vuông cạnh huyền 10. Bán kính đường tròn ngoại tiếp R = ?", answer:"5", sol:["R = ½ cạnh huyền = 5."] },
          { type:"fill", q:"Tam giác vuông hai cạnh góc vuông 6 và 8. R ngoại tiếp = ?", answer:"5", sol:["Cạnh huyền = 10 → R = 5."] },
          { type:"mc", q:"Với tam giác vuông, tâm đường tròn ngoại tiếp là", options:["trung điểm cạnh huyền","đỉnh góc vuông","trọng tâm","trực tâm"], answer:0, sol:["Trung điểm cạnh huyền."] },
        ],
        hard: [
          { type:"fill", q:"Tam giác vuông cạnh huyền 13. Đường kính đường tròn ngoại tiếp = ?", answer:"13", sol:["Đường kính = cạnh huyền = 13."] },
          { type:"mc", q:"Bán kính đường tròn ngoại tiếp tam giác đều cạnh a là", options:["a/√3","a/2","a","2a"], answer:0, sol:["R = a/√3 = a√3/3."] },
        ]
      },
      flashcards: [
        { front:"Đường tròn ngoại tiếp tam giác đi qua?", back:"Cả ba đỉnh; tâm = giao ba đường trung trực." },
        { front:"Đường tròn nội tiếp tam giác tiếp xúc?", back:"Cả ba cạnh; tâm = giao ba đường phân giác." },
        { front:"Tâm ngoại tiếp của tam giác vuông?", back:"Trung điểm cạnh huyền; R = ½ cạnh huyền." },
        { front:"Cạnh huyền của tam giác vuông và đường tròn ngoại tiếp?", back:"Cạnh huyền là đường kính của đường tròn ngoại tiếp." },
        { front:"Tam giác vuông 6, 8 có R ngoại tiếp?", back:"Cạnh huyền 10 → R = 5." },
      ]
    },

    /* ===================== TẬP 2 — Bài 21, 23, 24, 25, 28, 29, 30, 31, 32 ===================== */
    "lap-pt-bac-hai": {
      id: "lap-pt-bac-hai", chapterId: "chuong-6", title: "Bài 21: Giải bài toán bằng cách lập phương trình", emoji: "🧮", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🧮</div><div class="e-body">
            Nhiều bài toán (diện tích, số học, chuyển động) khi đặt <b>một ẩn x</b> sẽ dẫn tới <b>phương trình bậc hai</b>.
            Giải xong, nhớ <b>loại nghiệm không hợp lí</b> (vd độ dài âm).</div></div>
          <p><strong>4 bước:</strong></p>
          <ul class="bullets">
            <li><b>① Gọi ẩn</b> x và đặt điều kiện (vd x &gt; 0).</li>
            <li><b>② Lập phương trình</b> bậc hai từ dữ kiện.</li>
            <li><b>③ Giải</b> bằng công thức nghiệm (Δ) hoặc Viète.</li>
            <li><b>④ Đối chiếu điều kiện</b> và trả lời.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.parabola, caption: "Phương trình bậc hai ax² + bx + c = 0 ứng với một parabol — nghiệm là chỗ cắt trục hoành." },
        s3: [
          { ic: "🏡", title: "Bài toán diện tích", html: "Mảnh đất hình chữ nhật biết diện tích và quan hệ hai cạnh → PT bậc hai." },
          { ic: "🔢", title: "Tìm số", html: "“Hai số liên tiếp có tích…”, “số mà bình phương…” → PT bậc hai." },
          { ic: "🚗", title: "Chuyển động", html: "Quan hệ quãng đường, vận tốc, thời gian thường tạo ra PT bậc hai." },
        ],
        s4: { prompt: "Nêu 4 bước giải bài toán bằng cách lập phương trình bậc hai. Vì sao phải đối chiếu điều kiện?",
          keywords: ["gọi ẩn", "điều kiện", "lập phương trình", "giải", "đối chiếu", "loại nghiệm"],
          sample: "Bước 1 gọi ẩn và đặt điều kiện. Bước 2 lập phương trình bậc hai từ dữ kiện. Bước 3 giải bằng công thức nghiệm hoặc Viète. Bước 4 đối chiếu điều kiện và trả lời, loại các nghiệm không hợp lí (như độ dài âm)." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Số dương mà bình phương bằng 49 là?", answer:"7", sol:["x² = 49 → x = 7 (loại −7)."] },
          { type:"fill", q:"x² = 25, nghiệm dương = ?", answer:"5", sol:["x = 5."] },
          { type:"mc", q:"x² − 5x + 6 = 0 có nghiệm", options:["2 và 3","1 và 6","−2 và −3","5 và 6"], answer:0, sol:["Tổng 5, tích 6 → 2 và 3."] },
          { type:"fill", q:"HCN rộng x, dài x+3, diện tích 40. Chiều rộng = ?", answer:"5", sol:["x(x+3)=40 → x²+3x−40=0 → x=5."] },
        ],
        medium: [
          { type:"fill", q:"Hai số hơn kém nhau 2, tích bằng 48. Số nhỏ = ?", answer:"6", sol:["x(x+2)=48 → x²+2x−48=0 → x=6."] },
          { type:"fill", q:"HCN chu vi 20, diện tích 24. Chiều rộng = ? (m)", answer:"4", sol:["dài+rộng=10, tích=24 → 6 và 4 → rộng 4."] },
          { type:"fill", q:"Hai số tự nhiên liên tiếp có tích 156. Số nhỏ = ?", answer:"12", sol:["x(x+1)=156 → x=12."] },
        ],
        hard: [
          { type:"fill", q:"Mảnh đất HCN dài hơn rộng 5 m, diện tích 84 m². Chiều rộng = ? (m)", answer:"7", sol:["x(x+5)=84 → x²+5x−84=0 → x=7."] },
          { type:"fill", q:"x² − 7x + 12 = 0, nghiệm lớn = ?", answer:"4", sol:["x = 3 hoặc x = 4."] },
        ]
      },
      flashcards: [
        { front:"Bước 1 khi lập phương trình?", back:"Gọi ẩn và đặt điều kiện." },
        { front:"Vì sao phải đối chiếu điều kiện?", back:"Để loại nghiệm không hợp lí (vd độ dài âm)." },
        { front:"HCN rộng x, dài x+3, diện tích 40 → PT?", back:"x² + 3x − 40 = 0 → x = 5." },
        { front:"Hai số liên tiếp tích 156, số nhỏ?", back:"12 (vì 12·13 = 156)." },
        { front:"Giải PT bậc hai bằng?", back:"Công thức nghiệm (Δ) hoặc định lí Viète." },
      ]
    },

    "tan-so-tuong-doi": {
      id: "tan-so-tuong-doi", chapterId: "chuong-7", title: "Bài 23: Bảng tần số tương đối & biểu đồ", emoji: "📊", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📊</div><div class="e-body">
            <b>Tần số</b> là "đếm bao nhiêu lần". <b>Tần số tương đối</b> trả lời "chiếm bao nhiêu phần trăm" =
            <b>tần số ÷ tổng</b> (thường nhân 100%).</div></div>
          <ul class="bullets">
            <li>Tần số tương đối = (tần số / cỡ mẫu) × 100%.</li>
            <li><b>Tổng</b> tất cả tần số tương đối = <b>100%</b> (hay 1).</li>
            <li>Thường vẽ bằng <b>biểu đồ cột</b> hoặc <b>biểu đồ hình quạt tròn</b> (cả vòng = 100% = 360°).</li>
          </ul>` },
        s2: { type: "chart", caption: "Số bạn thích mỗi môn (cỡ mẫu 20): chia cho 20 ra tần số tương đối — Toán 10/20 = 50%.",
          chart: { labels: ["Toán", "Văn", "Anh", "Lý"], values: [10, 6, 3, 1], color: "var(--violet-500)" } },
        s3: [
          { ic: "🗳️", title: "Khảo sát", html: "“Bao nhiêu % chọn phương án A” chính là tần số tương đối." },
          { ic: "🥧", title: "Biểu đồ hình quạt", html: "Mỗi phần trăm ứng một góc ở tâm: 1% ⟶ 3,6°." },
          { ic: "⚖️", title: "So sánh nhóm khác cỡ", html: "Dùng % để so công bằng giữa hai lớp có sĩ số khác nhau." },
        ],
        s4: { prompt: "Tần số tương đối là gì, tính thế nào, và tổng của chúng bằng bao nhiêu?",
          keywords: ["tần số", "tổng", "cỡ mẫu", "100%", "phần trăm", "chia"],
          sample: "Tần số tương đối của một giá trị bằng tần số của nó chia cho cỡ mẫu, thường viết dưới dạng phần trăm. Tổng tất cả các tần số tương đối luôn bằng 100% (tức là 1)." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"20 bạn, 5 bạn thích Toán. Tần số tương đối thích Toán = ? (%)", answer:"25", sol:["5/20 = 25%."] },
          { type:"fill", q:"Tổng tất cả các tần số tương đối = ? (%)", answer:"100", sol:["Bằng 100%."] },
          { type:"fill", q:"40 hs, 10 nam. Tần số tương đối nam = ? (%)", answer:"25", sol:["10/40 = 25%."] },
          { type:"mc", q:"Tần số tương đối được tính bằng", options:["tần số × tổng","tần số / tổng","tổng / tần số","tần số + tổng"], answer:1, sol:["Tần số chia cho cỡ mẫu."] },
        ],
        medium: [
          { type:"fill", q:"50 sản phẩm, 8 lỗi. Tỉ lệ lỗi = ? (%)", answer:"16", sol:["8/50 = 16%."] },
          { type:"fill", q:"Biểu đồ hình quạt: 25% ứng góc ở tâm = ? (độ)", answer:"90", sol:["25% · 360° = 90°."] },
          { type:"fill", q:"Một giá trị chiếm 30% trong 200 dữ liệu thì có tần số = ?", answer:"60", sol:["30% · 200 = 60."] },
        ],
        hard: [
          { type:"fill", q:"Hình quạt: một nhóm có góc ở tâm 72°. Tần số tương đối = ? (%)", answer:"20", sol:["72/360 = 20%."] },
          { type:"fill", q:"Lớp 25 bạn, 'giỏi' chiếm 20%. Số bạn giỏi = ?", answer:"5", sol:["20% · 25 = 5."] },
        ]
      },
      flashcards: [
        { front:"Tần số tương đối tính thế nào?", back:"Tần số ÷ cỡ mẫu (× 100%)." },
        { front:"Tổng các tần số tương đối?", back:"100% (hay 1)." },
        { front:"5/20 ra tần số tương đối?", back:"25%." },
        { front:"Trong biểu đồ hình quạt, 1% ứng góc?", back:"3,6° (vì 360°/100)." },
        { front:"25% ứng góc ở tâm?", back:"90°." },
      ]
    },

    "tan-so-ghep-nhom": {
      id: "tan-so-ghep-nhom", chapterId: "chuong-7", title: "Bài 24: Tần số, tần số tương đối ghép nhóm & biểu đồ", emoji: "📈", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📈</div><div class="e-body">
            Khi dữ liệu có <b>quá nhiều giá trị</b> (chiều cao, điểm số…), ta <b>gom thành từng nhóm</b> (khoảng) như
            [0; 10), [10; 20)… rồi đếm xem mỗi nhóm có bao nhiêu giá trị.</div></div>
          <ul class="bullets">
            <li><b>Tần số nhóm</b> = số giá trị rơi vào nhóm đó.</li>
            <li><b>Tần số tương đối nhóm</b> = tần số nhóm ÷ cỡ mẫu.</li>
            <li>Vẽ bằng <b>biểu đồ tần số ghép nhóm</b> (các cột sát nhau — histogram).</li>
          </ul>` },
        s2: { type: "chart", caption: "Biểu đồ tần số ghép nhóm theo khoảng điểm — mỗi cột là một nhóm.",
          chart: { labels: ["[0;10)", "[10;20)", "[20;30)", "[30;40)"], values: [3, 7, 6, 4], color: "var(--accent)" } },
        s3: [
          { ic: "📏", title: "Chiều cao học sinh", html: "Gom theo khoảng 5 cm để thấy nhóm chiều cao phổ biến." },
          { ic: "⏱️", title: "Thời gian phản hồi", html: "Dữ liệu liên tục được ghép nhóm để vẽ histogram." },
          { ic: "💵", title: "Mức thu nhập", html: "Ghép nhóm giúp mô tả phân bố mà không liệt kê từng giá trị." },
        ],
        s4: { prompt: "Khi nào nên ghép nhóm dữ liệu, và tần số của một nhóm nghĩa là gì?",
          keywords: ["nhiều giá trị", "nhóm", "khoảng", "tần số nhóm", "histogram", "liên tục"],
          sample: "Khi dữ liệu có quá nhiều giá trị hoặc liên tục, ta ghép chúng thành các nhóm (khoảng). Tần số của một nhóm là số giá trị rơi vào nhóm đó; biểu diễn bằng biểu đồ tần số ghép nhóm với các cột sát nhau." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Khi nào nên ghép nhóm dữ liệu?", options:["khi rất ít giá trị","khi có nhiều giá trị / liên tục","khi chỉ có 2 giá trị","luôn luôn"], answer:1, sol:["Dữ liệu nhiều/liên tục thì ghép nhóm."] },
          { type:"fill", q:"Các giá trị 5, 12, 18, 25. Nhóm [10;20) có mấy giá trị?", answer:"2", sol:["12 và 18 → 2 giá trị."] },
          { type:"mc", q:"Nhóm [0;10) gồm các số x thoả", options:["0 ≤ x < 10","0 < x ≤ 10","x ≥ 10","x < 0"], answer:0, sol:["0 ≤ x < 10."] },
          { type:"fill", q:"Tần số ghép nhóm: 3, 7, 6, 4. Cỡ mẫu = ?", answer:"20", sol:["3+7+6+4 = 20."] },
        ],
        medium: [
          { type:"fill", q:"Nhóm có tần số 6, cỡ mẫu 20. Tần số tương đối = ? (%)", answer:"30", sol:["6/20 = 30%."] },
          { type:"fill", q:"Các giá trị 8, 9, 15, 22, 27, 31. Nhóm [20;30) có mấy giá trị?", answer:"2", sol:["22 và 27 → 2."] },
          { type:"mc", q:"Biểu đồ tần số ghép nhóm có đặc điểm", options:["các cột sát nhau","các cột rời nhau","là đường cong","là hình tròn"], answer:0, sol:["Histogram: các cột sát nhau."] },
        ],
        hard: [
          { type:"fill", q:"Tần số nhóm [10;20) là 7, cỡ mẫu 28. Tần số tương đối = ? (%)", answer:"25", sol:["7/28 = 25%."] },
          { type:"fill", q:"Bốn nhóm tần số tương đối 15%, 35%, x, 20%. Tìm x (%).", answer:"30", sol:["Tổng = 100% → x = 30%."] },
        ]
      },
      flashcards: [
        { front:"Khi nào ghép nhóm dữ liệu?", back:"Khi dữ liệu có nhiều giá trị hoặc liên tục." },
        { front:"Tần số của một nhóm?", back:"Số giá trị rơi vào nhóm (khoảng) đó." },
        { front:"Tần số tương đối nhóm?", back:"Tần số nhóm ÷ cỡ mẫu." },
        { front:"Nhóm [0;10) gồm?", back:"Các số x với 0 ≤ x < 10." },
        { front:"Biểu đồ tần số ghép nhóm?", back:"Histogram — các cột sát nhau." },
      ]
    },

    "phep-thu": {
      id: "phep-thu", chapterId: "chuong-8", title: "Bài 25: Phép thử ngẫu nhiên & không gian mẫu", emoji: "🎲", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🎲</div><div class="e-body">
            <b>Phép thử ngẫu nhiên</b> là một hành động mà ta <b>không đoán trước được kết quả</b> (tung xúc xắc, rút thẻ).
            <b>Không gian mẫu</b> Ω là <b>danh sách tất cả kết quả</b> có thể.</div></div>
          <ul class="bullets">
            <li>Tung một xúc xắc: Ω = {1, 2, 3, 4, 5, 6} → có 6 kết quả.</li>
            <li>Tung một đồng xu: Ω = {S, N} → 2 kết quả.</li>
            <li><b>Biến cố</b> là một <b>tập con</b> của không gian mẫu (vd "ra số chẵn" = {2,4,6}).</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.outcomes, caption: "Liệt kê mọi kết quả có thể chính là lập không gian mẫu Ω." },
        s3: [
          { ic: "🎰", title: "Trò chơi may rủi", html: "Mọi tính toán xác suất bắt đầu từ việc xác định không gian mẫu." },
          { ic: "🧪", title: "Thí nghiệm", html: "Kết quả thí nghiệm ngẫu nhiên được mô tả bằng tập Ω." },
          { ic: "🃏", title: "Rút thẻ / quay số", html: "Đếm số phần tử của Ω là bước đầu để tính khả năng." },
        ],
        s4: { prompt: "Phép thử ngẫu nhiên và không gian mẫu là gì? Biến cố liên hệ với không gian mẫu thế nào?",
          keywords: ["ngẫu nhiên", "không đoán trước", "không gian mẫu", "kết quả", "biến cố", "tập con"],
          sample: "Phép thử ngẫu nhiên là hành động mà kết quả không đoán trước được. Không gian mẫu Ω là tập hợp tất cả các kết quả có thể của phép thử. Một biến cố là một tập con của không gian mẫu đó." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Tung một xúc xắc, số phần tử của không gian mẫu = ?", answer:"6", sol:["Ω = {1,…,6} → 6."] },
          { type:"fill", q:"Tung một đồng xu, số phần tử không gian mẫu = ?", answer:"2", sol:["{S, N} → 2."] },
          { type:"mc", q:"Phép thử ngẫu nhiên là hành động", options:["biết trước kết quả","không đoán trước kết quả","luôn cho 1 kết quả","không có kết quả"], answer:1, sol:["Kết quả không đoán trước."] },
          { type:"fill", q:"Rút 1 thẻ trong 10 thẻ đánh số 1–10. Số phần tử Ω = ?", answer:"10", sol:["10 kết quả."] },
        ],
        medium: [
          { type:"fill", q:"Tung 2 đồng xu, số phần tử không gian mẫu = ?", answer:"4", sol:["SS, SN, NS, NN → 4."] },
          { type:"mc", q:"Biến cố là", options:["một tập con của Ω","toàn bộ Ω","một số","một phép thử"], answer:0, sol:["Tập con của không gian mẫu."] },
          { type:"fill", q:"Tung xúc xắc, biến cố 'ra số chẵn' có mấy phần tử?", answer:"3", sol:["{2,4,6} → 3."] },
        ],
        hard: [
          { type:"fill", q:"Gieo 2 xúc xắc, số phần tử không gian mẫu = ?", answer:"36", sol:["6 × 6 = 36."] },
          { type:"fill", q:"Rút 1 thẻ trong 5 thẻ, biến cố 'số lẻ' {1,3,5} có mấy phần tử?", answer:"3", sol:["3 phần tử."] },
        ]
      },
      flashcards: [
        { front:"Phép thử ngẫu nhiên?", back:"Hành động không đoán trước được kết quả." },
        { front:"Không gian mẫu Ω?", back:"Tập hợp tất cả kết quả có thể của phép thử." },
        { front:"Biến cố là gì?", back:"Một tập con của không gian mẫu." },
        { front:"Ω khi tung 1 xúc xắc?", back:"{1,2,3,4,5,6} — 6 kết quả." },
        { front:"Ω khi gieo 2 xúc xắc?", back:"Có 36 kết quả (6×6)." },
      ]
    },

    "duong-tron-ngoai-noi": {
      id: "duong-tron-ngoai-noi", chapterId: "chuong-9", title: "Bài 28: Đường tròn ngoại tiếp & nội tiếp của tam giác", emoji: "🔵", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🔵</div><div class="e-body">
            <b>Đường tròn ngoại tiếp</b> "ôm ngoài" tam giác, đi qua <b>cả 3 đỉnh</b>. <b>Đường tròn nội tiếp</b> "nằm trong",
            <b>tiếp xúc cả 3 cạnh</b>.</div></div>
          <ul class="bullets">
            <li><b>Tâm ngoại tiếp</b> = giao của <b>3 đường trung trực</b> (cách đều 3 đỉnh).</li>
            <li><b>Tâm nội tiếp</b> = giao của <b>3 đường phân giác</b> (cách đều 3 cạnh).</li>
            <li>Tam giác <b>vuông</b>: tâm ngoại tiếp là <b>trung điểm cạnh huyền</b>, R = ½ cạnh huyền.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.circuminscribed, caption: "Đường tròn ngoại tiếp qua 3 đỉnh; đường tròn nội tiếp tiếp xúc 3 cạnh." },
        s3: [
          { ic: "📐", title: "Dựng hình chính xác", html: "Trung trực và phân giác giúp xác định tâm hai đường tròn." },
          { ic: "🛞", title: "Bánh răng & chi tiết máy", html: "Đường tròn nội/ngoại tiếp xuất hiện trong thiết kế cơ khí." },
          { ic: "🏛️", title: "Kiến trúc", html: "Bố cục tam giác – đường tròn tạo tỉ lệ cân đối." },
        ],
        s4: { prompt: "Phân biệt đường tròn ngoại tiếp và nội tiếp tam giác; tâm của chúng xác định thế nào?",
          keywords: ["ngoại tiếp", "ba đỉnh", "trung trực", "nội tiếp", "ba cạnh", "phân giác", "cạnh huyền"],
          sample: "Đường tròn ngoại tiếp đi qua ba đỉnh, có tâm là giao ba đường trung trực. Đường tròn nội tiếp tiếp xúc ba cạnh, có tâm là giao ba đường phân giác. Với tam giác vuông, tâm ngoại tiếp là trung điểm cạnh huyền và R bằng nửa cạnh huyền." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Đường tròn ngoại tiếp tam giác đi qua", options:["1 đỉnh","2 đỉnh","cả 3 đỉnh","trọng tâm"], answer:2, sol:["Qua cả 3 đỉnh."] },
          { type:"mc", q:"Tâm đường tròn ngoại tiếp là giao của", options:["3 đường trung trực","3 đường phân giác","3 đường cao","3 trung tuyến"], answer:0, sol:["Giao 3 trung trực."] },
          { type:"mc", q:"Tâm đường tròn nội tiếp là giao của", options:["3 trung trực","3 phân giác","3 đường cao","3 trung tuyến"], answer:1, sol:["Giao 3 phân giác."] },
          { type:"fill", q:"Tam giác vuông cạnh huyền 10. Bán kính đường tròn ngoại tiếp = ?", answer:"5", sol:["R = ½ cạnh huyền = 5."] },
        ],
        medium: [
          { type:"mc", q:"Tâm đường tròn ngoại tiếp tam giác vuông nằm ở", options:["trung điểm cạnh huyền","đỉnh góc vuông","trọng tâm","ngoài tam giác"], answer:0, sol:["Trung điểm cạnh huyền."] },
          { type:"fill", q:"Tam giác vuông hai cạnh góc vuông 6, 8. R ngoại tiếp = ?", answer:"5", sol:["Cạnh huyền 10 → R = 5."] },
          { type:"mc", q:"Đường tròn nội tiếp tam giác", options:["tiếp xúc 3 cạnh","đi qua 3 đỉnh","đi qua tâm","cắt 3 cạnh"], answer:0, sol:["Tiếp xúc cả 3 cạnh."] },
        ],
        hard: [
          { type:"fill", q:"Tam giác vuông cạnh huyền 13. Đường kính đường tròn ngoại tiếp = ?", answer:"13", sol:["Đường kính = cạnh huyền = 13."] },
          { type:"mc", q:"Mọi tam giác đều có", options:["đúng 1 đường tròn ngoại tiếp & 1 nội tiếp","chỉ ngoại tiếp","chỉ nội tiếp","không có"], answer:0, sol:["Luôn có duy nhất mỗi loại."] },
        ]
      },
      flashcards: [
        { front:"Đường tròn ngoại tiếp tam giác?", back:"Đi qua cả 3 đỉnh; tâm = giao 3 trung trực." },
        { front:"Đường tròn nội tiếp tam giác?", back:"Tiếp xúc 3 cạnh; tâm = giao 3 phân giác." },
        { front:"Tâm ngoại tiếp tam giác vuông?", back:"Trung điểm cạnh huyền." },
        { front:"R ngoại tiếp tam giác vuông?", back:"Bằng nửa cạnh huyền." },
        { front:"Tam giác vuông huyền 10 → R?", back:"5." },
      ]
    },

    "tu-giac-noi-tiep": {
      id: "tu-giac-noi-tiep", chapterId: "chuong-9", title: "Bài 29: Tứ giác nội tiếp", emoji: "⬜", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">⬜</div><div class="e-body">
            <b>Tứ giác nội tiếp</b> là tứ giác có <b>cả 4 đỉnh nằm trên một đường tròn</b>. Nó có một tính chất "vàng":
            <b>tổng hai góc đối bằng 180°</b>.</div></div>
          <ul class="bullets">
            <li>Góc A + góc C = 180°; góc B + góc D = 180°.</li>
            <li><b>Dấu hiệu:</b> nếu một tứ giác có tổng hai góc đối = 180° thì nó nội tiếp được.</li>
            <li>Hình chữ nhật, hình vuông luôn nội tiếp; hình bình hành (không vuông) thì không.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.cyclicquad, caption: "Tứ giác nội tiếp: 4 đỉnh trên một đường tròn, tổng hai góc đối = 180°." },
        s3: [
          { ic: "📐", title: "Chứng minh hình", html: "Tổng hai góc đối = 180° là công cụ mạnh để chứng minh điểm cùng thuộc đường tròn." },
          { ic: "🪟", title: "Thiết kế ô cửa", html: "Tứ giác nội tiếp xuất hiện trong hoa văn, ô kính tròn." },
          { ic: "🧭", title: "Định vị", html: "Tính chất góc giúp suy ra vị trí điểm trên đường tròn." },
        ],
        s4: { prompt: "Tứ giác nội tiếp là gì và tính chất quan trọng nhất của nó là gì?",
          keywords: ["bốn đỉnh", "đường tròn", "tổng hai góc đối", "180", "dấu hiệu"],
          sample: "Tứ giác nội tiếp là tứ giác có cả bốn đỉnh nằm trên một đường tròn. Tính chất quan trọng nhất là tổng hai góc đối của nó bằng 180°, và đây cũng là dấu hiệu để nhận biết một tứ giác nội tiếp được." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Tứ giác nội tiếp có 4 đỉnh", options:["trên một đường tròn","trên một đường thẳng","trùng nhau","bất kì"], answer:0, sol:["Cùng thuộc một đường tròn."] },
          { type:"fill", q:"Tứ giác nội tiếp: tổng hai góc đối = ? (độ)", answer:"180", sol:["Hai góc đối bù nhau."] },
          { type:"fill", q:"Tứ giác nội tiếp, một góc 70°. Góc đối = ? (độ)", answer:"110", sol:["180 − 70 = 110."] },
          { type:"fill", q:"Tứ giác nội tiếp, một góc 95°. Góc đối = ? (độ)", answer:"85", sol:["180 − 95 = 85."] },
        ],
        medium: [
          { type:"mc", q:"Hình nào luôn nội tiếp được đường tròn?", options:["hình chữ nhật","hình bình hành xiên","hình thang thường","tứ giác bất kì"], answer:0, sol:["Hình chữ nhật có 4 góc vuông, tổng đối 180°."] },
          { type:"mc", q:"Dấu hiệu nhận biết tứ giác nội tiếp", options:["tổng hai góc đối = 180°","có 1 góc vuông","hai cạnh song song","có 4 cạnh bằng nhau"], answer:0, sol:["Tổng hai góc đối = 180°."] },
          { type:"fill", q:"Tứ giác nội tiếp có góc A = 100°, góc B = 80°. Góc C = ? (độ)", answer:"80", sol:["C = 180 − A = 80°."] },
        ],
        hard: [
          { type:"fill", q:"(tiếp) Góc D = ? (độ)", answer:"100", sol:["D = 180 − B = 100°."] },
          { type:"mc", q:"Hình bình hành nội tiếp đường tròn khi và chỉ khi nó là", options:["hình chữ nhật","hình thoi","bất kì","hình thang"], answer:0, sol:["Phải có góc vuông → hình chữ nhật."] },
        ]
      },
      flashcards: [
        { front:"Tứ giác nội tiếp là gì?", back:"Tứ giác có 4 đỉnh nằm trên một đường tròn." },
        { front:"Tính chất quan trọng nhất?", back:"Tổng hai góc đối bằng 180°." },
        { front:"Góc đối của 70° trong tứ giác nội tiếp?", back:"110°." },
        { front:"Hình chữ nhật có nội tiếp không?", back:"Có (4 góc vuông)." },
        { front:"Dấu hiệu nhận biết tứ giác nội tiếp?", back:"Tổng hai góc đối = 180°." },
      ]
    },

    "da-giac-deu": {
      id: "da-giac-deu", chapterId: "chuong-9", title: "Bài 30: Đa giác đều", emoji: "⬡", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">⬡</div><div class="e-body">
            <b>Đa giác đều</b> là đa giác có <b>tất cả các cạnh bằng nhau</b> và <b>tất cả các góc bằng nhau</b>
            (tam giác đều, hình vuông, lục giác đều…).</div></div>
          <ul class="bullets">
            <li>Tổng các góc trong của đa giác n cạnh = <b>(n − 2)·180°</b>.</li>
            <li>Mỗi góc của đa giác đều = <b>(n − 2)·180° / n</b>.</li>
            <li>Có cả đường tròn <b>ngoại tiếp</b> và <b>nội tiếp</b> cùng tâm; <b>phép quay</b> tâm O góc 360°/n biến nó thành chính nó.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.polygon, caption: "Đa giác đều: cạnh bằng nhau, góc bằng nhau, có tâm đối xứng quay." },
        s3: [
          { ic: "🐝", title: "Tổ ong lục giác", html: "Lục giác đều lát kín mặt phẳng — tối ưu vật liệu trong tự nhiên." },
          { ic: "⚽", title: "Quả bóng & hoa văn", html: "Ngũ giác/lục giác đều tạo nên bề mặt bóng đá, gạch lát." },
          { ic: "🔁", title: "Phép quay", html: "Đối xứng quay 360°/n là nền của thiết kế logo, bông tuyết." },
        ],
        s4: { prompt: "Đa giác đều là gì? Viết công thức số đo mỗi góc và cho ví dụ với lục giác đều.",
          keywords: ["cạnh bằng nhau", "góc bằng nhau", "(n−2)·180", "chia n", "phép quay", "360/n"],
          sample: "Đa giác đều có tất cả cạnh bằng nhau và tất cả góc bằng nhau. Mỗi góc bằng (n−2)·180°/n; với lục giác đều (n=6) mỗi góc là (6−2)·180/6 = 120°. Phép quay tâm O góc 360°/n biến đa giác đều thành chính nó." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Mỗi góc của tam giác đều = ? (độ)", answer:"60", sol:["(3−2)·180/3 = 60°."] },
          { type:"fill", q:"Mỗi góc của hình vuông = ? (độ)", answer:"90", sol:["(4−2)·180/4 = 90°."] },
          { type:"fill", q:"Mỗi góc của lục giác đều = ? (độ)", answer:"120", sol:["(6−2)·180/6 = 120°."] },
          { type:"mc", q:"Đa giác đều có", options:["cạnh bằng nhau và góc bằng nhau","chỉ cạnh bằng nhau","chỉ góc bằng nhau","cạnh tuỳ ý"], answer:0, sol:["Cả cạnh và góc đều bằng nhau."] },
        ],
        medium: [
          { type:"fill", q:"Tổng các góc trong của ngũ giác = ? (độ)", answer:"540", sol:["(5−2)·180 = 540°."] },
          { type:"fill", q:"Mỗi góc của ngũ giác đều = ? (độ)", answer:"108", sol:["540/5 = 108°."] },
          { type:"fill", q:"Góc quay nhỏ nhất biến lục giác đều thành chính nó = ? (độ)", answer:"60", sol:["360/6 = 60°."] },
        ],
        hard: [
          { type:"fill", q:"Mỗi góc của bát giác đều (8 cạnh) = ? (độ)", answer:"135", sol:["(8−2)·180/8 = 135°."] },
          { type:"fill", q:"Đa giác đều mỗi góc 144°. Số cạnh n = ?", answer:"10", sol:["(n−2)·180/n = 144 → n = 10."] },
        ]
      },
      flashcards: [
        { front:"Đa giác đều là gì?", back:"Có tất cả cạnh bằng nhau và tất cả góc bằng nhau." },
        { front:"Tổng các góc trong đa giác n cạnh?", back:"(n − 2)·180°." },
        { front:"Mỗi góc của đa giác đều n cạnh?", back:"(n − 2)·180° / n." },
        { front:"Mỗi góc lục giác đều?", back:"120°." },
        { front:"Phép quay biến đa giác đều thành chính nó?", back:"Quay tâm O góc 360°/n." },
      ]
    },

    "hinh-tru-non": {
      id: "hinh-tru-non", chapterId: "chuong-10", title: "Bài 31: Hình trụ và hình nón", emoji: "🥫", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🥫</div><div class="e-body">
            <b>Hình trụ</b> như một lon nước (hai đáy tròn bằng nhau). <b>Hình nón</b> như chiếc nón lá (một đáy tròn, một đỉnh nhọn).</div></div>
          <ul class="bullets">
            <li><b>Hình trụ</b> (bán kính r, chiều cao h): diện tích xung quanh <b>S<sub>xq</sub> = 2πrh</b>; thể tích <b>V = πr²h</b>.</li>
            <li><b>Hình nón</b> (bán kính r, đường sinh l, chiều cao h): <b>S<sub>xq</sub> = πrl</b>; thể tích <b>V = ⅓πr²h</b>.</li>
            <li>Quan hệ trong nón: <b>l² = r² + h²</b> (đường sinh là cạnh huyền).</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.cylindercone, caption: "Hình trụ V = πr²h; hình nón V = ⅓πr²h (bằng 1/3 trụ cùng đáy, cùng chiều cao)." },
        s3: [
          { ic: "🥫", title: "Lon, thùng, ống", html: "Thể tích hình trụ giúp tính dung tích lon nước, bể chứa, ống dẫn." },
          { ic: "🍦", title: "Nón kem, phễu", html: "Thể tích hình nón = 1/3 hình trụ cùng đáy & chiều cao." },
          { ic: "🏗️", title: "Vật liệu xây dựng", html: "Tính diện tích xung quanh để biết lượng tôn, sơn cần dùng." },
        ],
        s4: { prompt: "Viết công thức thể tích hình trụ và hình nón. Vì sao thể tích nón bằng 1/3 trụ cùng đáy, cùng chiều cao?",
          keywords: ["πr²h", "trụ", "⅓", "nón", "2πrh", "πrl", "đường sinh"],
          sample: "Hình trụ có V = πr²h và S_xq = 2πrh. Hình nón có V = (1/3)πr²h và S_xq = πrl với đường sinh l. Thể tích nón bằng 1/3 thể tích trụ có cùng bán kính đáy và cùng chiều cao." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Hình trụ r = 2, h = 5. Thể tích (π ≈ 3,14) = ?", answer:"62,8", accept:["62.8"], sol:["πr²h = 3,14·4·5 = 62,8."] },
          { type:"fill", q:"Hình trụ r = 3, h = 10. Diện tích xung quanh (π ≈ 3,14) = ?", answer:"188,4", accept:["188.4"], sol:["2πrh = 2·3,14·3·10 = 188,4."] },
          { type:"mc", q:"Thể tích hình trụ là", options:["πr²h","⅓πr²h","2πrh","πrl"], answer:0, sol:["V = πr²h."] },
          { type:"fill", q:"Hình nón r = 3, h = 4. Đường sinh l = ?", answer:"5", sol:["l = √(r²+h²) = √25 = 5."] },
        ],
        medium: [
          { type:"fill", q:"Hình nón r = 3, h = 4. Thể tích (π ≈ 3,14) = ?", answer:"37,68", accept:["37.68"], sol:["⅓πr²h = ⅓·3,14·9·4 = 37,68."] },
          { type:"fill", q:"Hình nón r = 3, l = 5. Diện tích xung quanh (π ≈ 3,14) = ?", answer:"47,1", accept:["47.1"], sol:["πrl = 3,14·3·5 = 47,1."] },
          { type:"mc", q:"Thể tích hình nón là", options:["πr²h","⅓πr²h","2πrh","4πr²"], answer:1, sol:["V = ⅓πr²h."] },
        ],
        hard: [
          { type:"fill", q:"Hình trụ r = 5, h = 4. Thể tích (π ≈ 3,14) = ?", answer:"314", sol:["3,14·25·4 = 314."] },
          { type:"fill", q:"Hình nón thể tích bằng 1/? thể tích trụ cùng đáy, cùng chiều cao", answer:"3", sol:["V_nón = ⅓ V_trụ."] },
        ]
      },
      flashcards: [
        { front:"Thể tích hình trụ?", back:"V = πr²h." },
        { front:"Diện tích xung quanh hình trụ?", back:"S_xq = 2πrh." },
        { front:"Thể tích hình nón?", back:"V = ⅓πr²h (bằng 1/3 trụ cùng đáy, cùng cao)." },
        { front:"Diện tích xung quanh hình nón?", back:"S_xq = πrl (l là đường sinh)." },
        { front:"Quan hệ r, h, l trong nón?", back:"l² = r² + h²." },
      ]
    },

    "hinh-cau": {
      id: "hinh-cau", chapterId: "chuong-10", title: "Bài 32: Hình cầu", emoji: "⚽", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">⚽</div><div class="e-body">
            <b>Hình cầu</b> bán kính R là tập hợp các điểm trong không gian cách tâm O một khoảng R — như một quả bóng.</div></div>
          <ul class="bullets">
            <li><b>Diện tích mặt cầu:</b> S = <b>4πR²</b>.</li>
            <li><b>Thể tích hình cầu:</b> V = <b>(4/3)πR³</b>.</li>
            <li>Bán kính tăng gấp đôi thì diện tích gấp <b>4</b> lần (2²), thể tích gấp <b>8</b> lần (2³).</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.sphere, caption: "Mặt cầu S = 4πR²; thể tích hình cầu V = (4/3)πR³." },
        s3: [
          { ic: "🌍", title: "Hành tinh, quả bóng", html: "Tính diện tích bề mặt và thể tích của vật thể hình cầu." },
          { ic: "🎈", title: "Bóng bay", html: "Lượng khí cần để bơm tỉ lệ với thể tích = (4/3)πR³." },
          { ic: "💧", title: "Giọt nước", html: "Hình cầu có diện tích mặt nhỏ nhất với cùng thể tích — lý do giọt nước tròn." },
        ],
        s4: { prompt: "Viết công thức diện tích mặt cầu và thể tích hình cầu. Bán kính tăng gấp đôi thì thể tích thay đổi thế nào?",
          keywords: ["4πr²", "mặt cầu", "(4/3)πr³", "thể tích", "gấp 8", "bán kính"],
          sample: "Diện tích mặt cầu là S = 4πR² và thể tích hình cầu là V = (4/3)πR³. Khi bán kính tăng gấp đôi, diện tích mặt cầu gấp 4 lần còn thể tích gấp 8 lần." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Mặt cầu R = 3. Diện tích (π ≈ 3,14) = ?", answer:"113,04", accept:["113.04"], sol:["4πR² = 4·3,14·9 = 113,04."] },
          { type:"mc", q:"Diện tích mặt cầu là", options:["4πR²","πR²","(4/3)πR³","2πR"], answer:0, sol:["S = 4πR²."] },
          { type:"mc", q:"Thể tích hình cầu là", options:["4πR²","(4/3)πR³","πR²h","2πR³"], answer:1, sol:["V = (4/3)πR³."] },
          { type:"fill", q:"Mặt cầu R = 1. Diện tích (π ≈ 3,14) = ?", answer:"12,56", accept:["12.56"], sol:["4·3,14·1 = 12,56."] },
        ],
        medium: [
          { type:"fill", q:"Hình cầu R = 3. Thể tích (π ≈ 3,14) = ?", answer:"113,04", accept:["113.04"], sol:["(4/3)·3,14·27 = 113,04."] },
          { type:"fill", q:"Bán kính tăng gấp đôi, thể tích gấp ? lần", answer:"8", sol:["2³ = 8."] },
          { type:"fill", q:"Bán kính tăng gấp đôi, diện tích mặt cầu gấp ? lần", answer:"4", sol:["2² = 4."] },
        ],
        hard: [
          { type:"fill", q:"Hình cầu R = 6. Thể tích (π ≈ 3,14) = ?", answer:"904,32", accept:["904.32"], sol:["(4/3)·3,14·216 = 904,32."] },
          { type:"fill", q:"Mặt cầu R = 5. Diện tích (π ≈ 3,14) = ?", answer:"314", sol:["4·3,14·25 = 314."] },
        ]
      },
      flashcards: [
        { front:"Diện tích mặt cầu?", back:"S = 4πR²." },
        { front:"Thể tích hình cầu?", back:"V = (4/3)πR³." },
        { front:"R gấp đôi → diện tích gấp?", back:"4 lần (2²)." },
        { front:"R gấp đôi → thể tích gấp?", back:"8 lần (2³)." },
        { front:"Hình cầu R = 3, diện tích (π≈3,14)?", back:"113,04." },
      ]
    },

    /* ===================== CHƯƠNG I — Bài 1, Bài 3 ===================== */
    "pt-he-khai-niem": {
      id: "pt-he-khai-niem", chapterId: "chuong-1", title: "Bài 1: Khái niệm phương trình & hệ bậc nhất hai ẩn", emoji: "🔗", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🧩</div><div class="e-body">
            Một <b>phương trình bậc nhất hai ẩn</b> dạng <b>ax + by = c</b> giống một câu đố có <b>hai chỗ trống</b> x và y.
            Có <b>vô số</b> cặp (x; y) khớp — vẽ ra thì chúng nằm trên một <b>đường thẳng</b>.</div></div>
          <p>Ghép <b>hai</b> phương trình lại ta được một <strong>hệ</strong>. <b>Nghiệm của hệ</b> là cặp (x; y) thoả mãn
          <b>đồng thời cả hai</b> phương trình — chính là <b>giao điểm</b> của hai đường thẳng.</p>
          <ul class="bullets">
            <li>a, b không đồng thời bằng 0 thì ax + by = c mới là PT bậc nhất hai ẩn.</li>
            <li>Hai đường cắt nhau → hệ có <b>1 nghiệm</b>; song song → <b>vô nghiệm</b>; trùng nhau → <b>vô số nghiệm</b>.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.twolines, caption: "Mỗi phương trình là một đường thẳng; nghiệm của hệ là giao điểm của chúng." },
        s3: [
          { ic: "🛒", title: "Mua hai loại hàng", html: "Biết tổng tiền và tổng số món của hai loại → lập hai phương trình hai ẩn để tìm giá mỗi loại." },
          { ic: "⚗️", title: "Pha trộn", html: "Trộn hai dung dịch theo tổng khối lượng và tổng chất tan → một hệ hai ẩn." },
          { ic: "📊", title: "Lập kế hoạch", html: "Phân bổ hai nguồn lực theo hai điều kiện ràng buộc cũng là giải hệ." },
        ],
        s4: { prompt: "Giải thích cho bạn: phương trình bậc nhất hai ẩn là gì, và nghiệm của hệ hai PT bậc nhất hai ẩn nghĩa là gì?",
          keywords: ["ax + by = c", "hai ẩn", "vô số", "đường thẳng", "hệ", "đồng thời", "giao điểm"],
          sample: "Phương trình bậc nhất hai ẩn có dạng ax + by = c và có vô số nghiệm, biểu diễn bởi một đường thẳng. Một hệ gồm hai phương trình như vậy; nghiệm của hệ là cặp (x; y) thoả mãn đồng thời cả hai phương trình, tức là toạ độ giao điểm của hai đường thẳng." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Phương trình nào là bậc nhất hai ẩn?", options:["x² + y = 1","2x − 3y = 5","xy = 4","x = 1"], answer:1, sol:["Dạng ax + by = c, a,b không đồng thời 0."] },
          { type:"mc", q:"Cặp (1; 2) có là nghiệm của 2x + y = 4?", options:["Có","Không","Không xác định","Thiếu dữ kiện"], answer:0, sol:["2·1 + 2 = 4 → đúng."] },
          { type:"fill", q:"Cho 3x − y = 5. Khi x = 2 thì y = ?", answer:"1", sol:["6 − y = 5 → y = 1."] },
          { type:"mc", q:"Một PT bậc nhất hai ẩn có bao nhiêu nghiệm?", options:["1","2","vô số","0"], answer:2, sol:["Vô số, là một đường thẳng."] },
        ],
        medium: [
          { type:"fill", q:"Cặp (0; y) là nghiệm của x + 2y = 6. y = ?", answer:"3", sol:["2y = 6 → y = 3."] },
          { type:"mc", q:"Hệ có 1 nghiệm khi hai đường thẳng", options:["cắt nhau","song song","trùng nhau","thẳng đứng"], answer:0, sol:["Cắt nhau → 1 giao điểm."] },
          { type:"mc", q:"Cặp (2; 1) là nghiệm của hệ nào?", options:["{x+y=3; x−y=1}","{x+y=4; x−y=1}","{x+y=3; x−y=2}","{x+y=2; x−y=1}"], answer:0, sol:["2+1=3 và 2−1=1 → đúng."] },
        ],
        hard: [
          { type:"fill", q:"(1; 2) là nghiệm của mx + y = 5. Tìm m.", answer:"3", sol:["m·1 + 2 = 5 → m = 3."] },
          { type:"mc", q:"Hệ {x+y=4; 2x+2y=8}", options:["1 nghiệm","vô nghiệm","vô số nghiệm","không xác định"], answer:2, sol:["PT (2) là gấp đôi PT (1) → trùng nhau → vô số nghiệm."] },
        ]
      },
      flashcards: [
        { front:"Dạng phương trình bậc nhất hai ẩn?", back:"ax + by = c (a, b không đồng thời bằng 0)." },
        { front:"Một PT bậc nhất hai ẩn có mấy nghiệm?", back:"Vô số, biểu diễn bằng một đường thẳng." },
        { front:"Nghiệm của hệ hai PT bậc nhất hai ẩn?", back:"Cặp (x; y) thoả mãn đồng thời cả hai PT = giao điểm hai đường thẳng." },
        { front:"Khi nào hệ vô nghiệm?", back:"Khi hai đường thẳng song song." },
        { front:"Khi nào hệ có vô số nghiệm?", back:"Khi hai đường thẳng trùng nhau." },
      ]
    },

    "lap-he-pt": {
      id: "lap-he-pt", chapterId: "chuong-1", title: "Bài 3: Giải bài toán bằng cách lập hệ phương trình", emoji: "🧮", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🕵️</div><div class="e-body">
            Khi bài toán có <b>hai điều chưa biết</b>, ta đặt chúng là <b>x và y</b>, "dịch" lời văn thành <b>hai phương trình</b>,
            rồi giải hệ. Giống như biến một câu chuyện thành hai manh mối để truy ra thủ phạm.</div></div>
          <p><strong>4 bước:</strong></p>
          <ul class="bullets">
            <li><b>① Gọi ẩn</b> và nêu điều kiện (vd: x, y &gt; 0).</li>
            <li><b>② Lập hệ</b>: mỗi câu dữ kiện → một phương trình.</li>
            <li><b>③ Giải hệ</b> bằng phương pháp thế hoặc cộng đại số.</li>
            <li><b>④ Trả lời</b>: đối chiếu điều kiện rồi kết luận.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.twolines, caption: "Hai dữ kiện → hai đường thẳng → giao điểm chính là đáp số bài toán." },
        s3: [
          { ic: "🎂", title: "Bài toán tuổi", html: "“Tổng số tuổi…”, “gấp đôi…” → hai phương trình theo tuổi hai người." },
          { ic: "🛍️", title: "Mua bán", html: "Tổng tiền và tổng số lượng của hai mặt hàng cho ta hai phương trình." },
          { ic: "🚰", title: "Công việc / vòi nước", html: "Năng suất mỗi giờ của hai đối tượng cộng lại bằng tổng → lập hệ." },
        ],
        s4: { prompt: "Nêu 4 bước giải bài toán bằng cách lập hệ phương trình.",
          keywords: ["gọi ẩn", "điều kiện", "lập hệ", "giải", "trả lời", "đối chiếu"],
          sample: "Bước 1 gọi ẩn và đặt điều kiện. Bước 2 dựa vào dữ kiện lập hệ hai phương trình. Bước 3 giải hệ bằng thế hoặc cộng đại số. Bước 4 đối chiếu điều kiện và trả lời bài toán." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Tổng hai số là 20, hiệu là 4. Số lớn = ?", answer:"12", sol:["x+y=20; x−y=4 → x=12."] },
          { type:"fill", q:"(tiếp) Số nhỏ = ?", answer:"8", sol:["y = 20 − 12 = 8."] },
          { type:"fill", q:"Hai số tổng 15, số này gấp đôi số kia. Số nhỏ = ?", answer:"5", sol:["x+y=15; x=2y → 3y=15 → y=5."] },
          { type:"mc", q:"Bước đầu tiên khi giải bằng lập hệ là", options:["giải hệ","gọi ẩn & đặt điều kiện","trả lời","vẽ hình"], answer:1, sol:["Gọi ẩn trước."] },
        ],
        medium: [
          { type:"fill", q:"3 bút + 2 vở = 32 nghìn; 1 bút + 1 vở = 13 nghìn. Giá 1 bút = ? nghìn", answer:"6", sol:["v=13−b; 3b+2(13−b)=32 → b=6."] },
          { type:"fill", q:"(tiếp) Giá 1 vở = ? nghìn", answer:"7", sol:["v = 13 − 6 = 7."] },
          { type:"fill", q:"Sân chữ nhật nửa chu vi 15 m, dài hơn rộng 5 m. Chiều dài = ? m", answer:"10", sol:["x+y=15; x−y=5 → x=10."] },
        ],
        hard: [
          { type:"fill", q:"Hai vòi cùng chảy đầy bể trong 6 giờ; riêng vòi I 10 giờ đầy. Riêng vòi II … giờ? (1/6 − 1/10 = 1/t)", answer:"15", sol:["1/t = 1/6 − 1/10 = 1/15 → t = 15 giờ."] },
          { type:"fill", q:"Cha hơn con 30 tuổi, 5 năm nữa cha gấp 3 lần con. Tuổi con hiện nay = ?", answer:"10", sol:["c+30+5 = 3(c+5) → c+35 = 3c+15 → 2c=20 → c=10."] },
        ]
      },
      flashcards: [
        { front:"Bước 1 khi lập hệ?", back:"Gọi ẩn và đặt điều kiện cho ẩn." },
        { front:"Bước 2?", back:"Dựa vào dữ kiện, lập hệ hai phương trình." },
        { front:"Bước 3?", back:"Giải hệ (thế hoặc cộng đại số)." },
        { front:"Bước 4?", back:"Đối chiếu điều kiện và trả lời." },
        { front:"Bài toán hai vòi nước lập hệ theo gì?", back:"Theo năng suất (phần bể chảy được trong 1 giờ)." },
      ]
    },

    /* ===================== CHƯƠNG II — Bài 4, 5, 6 ===================== */
    "pt-tich": {
      id: "pt-tich", chapterId: "chuong-2", title: "Bài 4: Phương trình tích & phương trình chứa ẩn ở mẫu", emoji: "✖️", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">✖️</div><div class="e-body">
            Nếu nhân hai số được <b>0</b> thì chắc chắn <b>ít nhất một số bằng 0</b>. Đó là chìa khoá:
            <b>A · B = 0 ⟺ A = 0 hoặc B = 0</b>.</div></div>
          <p>Với <strong>phương trình tích</strong>: đưa về dạng tích = 0 rồi cho từng thừa số bằng 0.</p>
          <p>Với <strong>phương trình chứa ẩn ở mẫu</strong>:</p>
          <ul class="bullets">
            <li><b>① Tìm ĐKXĐ</b>: mẫu phải khác 0.</li>
            <li><b>② Quy đồng</b>, khử mẫu, giải phương trình thu được.</li>
            <li><b>③ Đối chiếu ĐKXĐ</b>: loại nghiệm làm mẫu bằng 0.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.product0, caption: "Tích bằng 0 khi có một thừa số bằng 0 — nền tảng của phương trình tích." },
        s3: [
          { ic: "🧱", title: "Tách bài khó thành dễ", html: "Phân tích thành nhân tử biến PT bậc cao thành nhiều PT bậc nhất." },
          { ic: "⚠️", title: "Điều kiện xác định", html: "Trong các bài có phân thức (tốc độ, năng suất), luôn cần mẫu ≠ 0." },
          { ic: "🔍", title: "Kiểm tra nghiệm", html: "Thói quen đối chiếu ĐKXĐ giúp tránh nhận nghiệm 'ngoại lai'." },
        ],
        s4: { prompt: "Giải thích: vì sao A·B = 0 thì A = 0 hoặc B = 0, và khi giải PT chứa ẩn ở mẫu cần lưu ý gì?",
          keywords: ["tích", "bằng 0", "thừa số", "đkxđ", "mẫu khác 0", "đối chiếu", "loại nghiệm"],
          sample: "Vì tích của hai số chỉ bằng 0 khi ít nhất một thừa số bằng 0, nên A·B=0 dẫn tới A=0 hoặc B=0. Khi giải phương trình chứa ẩn ở mẫu phải tìm điều kiện xác định (mẫu khác 0), giải xong rồi đối chiếu để loại các nghiệm làm mẫu bằng 0." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"(x − 2)(x + 3) = 0 có nghiệm", options:["2 và −3","−2 và 3","2 và 3","−2 và −3"], answer:0, sol:["Cho từng thừa số bằng 0."] },
          { type:"fill", q:"(x − 5)(x + 1) = 0, nghiệm dương = ?", answer:"5", sol:["x = 5 hoặc x = −1."] },
          { type:"mc", q:"ĐKXĐ của 3/(x − 2) = 1 là", options:["x ≠ 0","x ≠ 2","x ≠ 3","x ≠ 1"], answer:1, sol:["Mẫu khác 0 → x ≠ 2."] },
          { type:"fill", q:"2x(x − 4) = 0, nghiệm dương = ?", answer:"4", sol:["x = 0 hoặc x = 4."] },
        ],
        medium: [
          { type:"mc", q:"x/(x − 1) = 2 (x ≠ 1) có nghiệm", options:["x = 2","x = 1","x = −2","vô nghiệm"], answer:0, sol:["x = 2(x−1) → x = 2."] },
          { type:"fill", q:"1/x = 1/3 (x ≠ 0). x = ?", answer:"3", sol:["x = 3."] },
          { type:"mc", q:"(x + 4)(2x − 6) = 0 có nghiệm", options:["−4 và 3","4 và −3","−4 và −3","4 và 3"], answer:0, sol:["x = −4 hoặc x = 3."] },
        ],
        hard: [
          { type:"fill", q:"x² − 4x = 0 (đặt x chung) có nghiệm dương = ?", answer:"4", sol:["x(x−4)=0 → x=0 hoặc x=4."] },
          { type:"mc", q:"PT 2/(x−3) = 1 có nghiệm", options:["x = 5","x = 3","x = 1","vô nghiệm"], answer:0, sol:["2 = x−3 → x = 5 (thoả x≠3)."] },
        ]
      },
      flashcards: [
        { front:"A · B = 0 khi nào?", back:"Khi A = 0 hoặc B = 0." },
        { front:"Cách giải phương trình tích?", back:"Đưa về tích = 0 rồi cho từng thừa số bằng 0." },
        { front:"Bước đầu khi giải PT chứa ẩn ở mẫu?", back:"Tìm điều kiện xác định: mẫu khác 0." },
        { front:"Vì sao phải đối chiếu ĐKXĐ?", back:"Để loại nghiệm làm mẫu bằng 0 (nghiệm ngoại lai)." },
        { front:"(x−2)(x+5)=0 có nghiệm?", back:"x = 2 hoặc x = −5." },
      ]
    },

    "bat-dang-thuc": {
      id: "bat-dang-thuc", chapterId: "chuong-2", title: "Bài 5: Bất đẳng thức và tính chất", emoji: "⚖️", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">⚖️</div><div class="e-body">
            <b>Bất đẳng thức</b> so sánh hai vế bằng dấu &gt;, &lt;, ≥, ≤ — như một <b>cái cân</b> cho biết bên nào nặng hơn.
            Quan trọng là biết khi nào "cân" giữ nguyên chiều, khi nào <b>đảo chiều</b>.</div></div>
          <ul class="bullets">
            <li><b>Cộng/trừ</b> cùng một số vào hai vế → <b>giữ nguyên</b> chiều.</li>
            <li><b>Nhân/chia</b> hai vế cho số <b>dương</b> → <b>giữ nguyên</b> chiều.</li>
            <li><b>Nhân/chia</b> hai vế cho số <b>âm</b> → <b>ĐỔI</b> chiều.</li>
            <li><b>Bắc cầu</b>: a &gt; b và b &gt; c thì a &gt; c.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.scale, caption: "a > b: vế a 'nặng' hơn. Nhân với số âm sẽ làm cân lật chiều." },
        s3: [
          { ic: "💰", title: "So sánh chi phí", html: "Biết a > b giúp khẳng định phương án nào tốn kém hơn khi cùng tăng giảm." },
          { ic: "📏", title: "Ước lượng", html: "Tính chất bắc cầu giúp suy ra quan hệ giữa các đại lượng chưa so trực tiếp." },
          { ic: "🧊", title: "Đổi chiều", html: "Dấu trừ (như nhiệt độ âm) là lý do thực tế khiến bất đẳng thức đảo chiều." },
        ],
        s4: { prompt: "Khi nhân hai vế của một bất đẳng thức với số âm thì điều gì xảy ra? Cho ví dụ.",
          keywords: ["đổi chiều", "số âm", "giữ nguyên", "số dương", "cộng", "bắc cầu"],
          sample: "Khi nhân (hoặc chia) hai vế của bất đẳng thức với một số âm thì phải đổi chiều. Ví dụ từ 3 > 2, nhân với −1 ta được −3 < −2. Còn cộng/trừ cùng số hoặc nhân với số dương thì giữ nguyên chiều." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Nếu a > b thì a + c và b + c:", options:["a+c > b+c","a+c < b+c","bằng nhau","tuỳ c"], answer:0, sol:["Cộng cùng số giữ chiều."] },
          { type:"mc", q:"Nếu a > b và c > 0 thì", options:["ac > bc","ac < bc","ac = bc","không rõ"], answer:0, sol:["Nhân số dương giữ chiều."] },
          { type:"mc", q:"Nếu a > b và c < 0 thì", options:["ac > bc","ac < bc","ac = bc","không đổi"], answer:1, sol:["Nhân số âm đổi chiều."] },
          { type:"mc", q:"Bất đẳng thức ĐÚNG là", options:["−3 > −1","0 > −2","2 < −5","−4 > 4"], answer:1, sol:["0 lớn hơn −2."] },
        ],
        medium: [
          { type:"mc", q:"Từ 5 > 3, nhân hai vế với −2 được", options:["−10 > −6","−10 < −6","−10 = −6","10 < 6"], answer:1, sol:["Đổi chiều: −10 < −6."] },
          { type:"mc", q:"a ≥ b thì a − 7 và b − 7:", options:["a−7 ≥ b−7","a−7 ≤ b−7","bằng nhau","a−7 > b−7"], answer:0, sol:["Trừ cùng số giữ chiều."] },
          { type:"mc", q:"a > b, b > c (bắc cầu) suy ra", options:["a > c","a < c","a = c","không suy ra"], answer:0, sol:["a > c."] },
        ],
        hard: [
          { type:"mc", q:"Từ a > b, chia hai vế cho −1 ta có", options:["−a > −b","−a < −b","−a = −b","không đổi"], answer:1, sol:["Chia số âm đổi chiều."] },
          { type:"mc", q:"Biết x > 2. Khẳng định đúng là", options:["−x < −2","−x > −2","−x = −2","x < −2"], answer:0, sol:["Nhân −1: −x < −2."] },
        ]
      },
      flashcards: [
        { front:"Cộng cùng một số vào hai vế?", back:"Giữ nguyên chiều bất đẳng thức." },
        { front:"Nhân hai vế với số dương?", back:"Giữ nguyên chiều." },
        { front:"Nhân hai vế với số âm?", back:"ĐỔI chiều bất đẳng thức." },
        { front:"Tính chất bắc cầu?", back:"a > b và b > c thì a > c." },
        { front:"Từ 3 > 2, nhân −1 được?", back:"−3 < −2 (đổi chiều)." },
      ]
    },

    "bat-phuong-trinh": {
      id: "bat-phuong-trinh", chapterId: "chuong-2", title: "Bài 6: Bất phương trình bậc nhất một ẩn", emoji: "📉", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📉</div><div class="e-body">
            <b>Bất phương trình bậc nhất một ẩn</b> như ax + b &gt; 0 hỏi: "những x nào làm vế trái lớn hơn 0?".
            Đáp án không phải một số mà là <b>cả một khoảng</b> (một tia trên trục số).</div></div>
          <p>Giải gần giống phương trình, nhưng nhớ quy tắc vàng:</p>
          <ul class="bullets">
            <li>Chuyển vế đổi dấu, gộp các hạng tử như bình thường.</li>
            <li><b>Khi nhân/chia hai vế cho số âm phải ĐỔI chiều</b> dấu bất phương trình.</li>
            <li>Biểu diễn nghiệm trên <b>trục số</b>: vòng tròn <b>rỗng</b> cho &gt;, &lt;; vòng <b>đặc</b> cho ≥, ≤.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.numberline, caption: "Nghiệm x > 2 là một tia: tô đậm phần lớn hơn 2, vòng tròn rỗng tại 2." },
        s3: [
          { ic: "💵", title: "Ngân sách", html: "“Chi tiêu không vượt quá…” → một bất phương trình cho biết giới hạn." },
          { ic: "📈", title: "Điều kiện đạt mục tiêu", html: "“Điểm trung bình ≥ 8” dẫn tới bất phương trình theo điểm bài cuối." },
          { ic: "⚖️", title: "So sánh phương án", html: "Tìm x để phương án này rẻ hơn phương án kia." },
        ],
        s4: { prompt: "Khi giải bất phương trình, lúc nào phải đổi chiều dấu? Nghiệm được biểu diễn thế nào?",
          keywords: ["đổi chiều", "số âm", "nhân", "chia", "trục số", "khoảng", "tia"],
          sample: "Khi nhân hoặc chia hai vế cho một số âm thì phải đổi chiều dấu bất phương trình. Nghiệm của bất phương trình bậc nhất là một khoảng (một tia) và được biểu diễn trên trục số, dùng vòng tròn rỗng cho dấu > , < và vòng đặc cho ≥, ≤." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Nghiệm của x + 3 > 5 là", options:["x > 2","x < 2","x > 8","x < 8"], answer:0, sol:["x > 2."] },
          { type:"mc", q:"Nghiệm của 2x ≤ 6 là", options:["x ≤ 3","x ≥ 3","x ≤ 12","x < 3"], answer:0, sol:["Chia 2: x ≤ 3."] },
          { type:"mc", q:"Nghiệm của −x > 2 là", options:["x > −2","x < −2","x > 2","x < 2"], answer:1, sol:["Nhân −1 đổi chiều: x < −2."] },
          { type:"fill", q:"Giải 3x − 6 ≥ 0: x ≥ ?", answer:"2", sol:["3x ≥ 6 → x ≥ 2."] },
        ],
        medium: [
          { type:"mc", q:"Nghiệm của −2x < 8 là", options:["x > −4","x < −4","x > 4","x < 4"], answer:0, sol:["Chia −2 đổi chiều: x > −4."] },
          { type:"fill", q:"x − 5 < 0 ⇔ x < ?", answer:"5", sol:["x < 5."] },
          { type:"mc", q:"Giải 2x + 1 > 7", options:["x > 3","x < 3","x > 4","x < 4"], answer:0, sol:["2x > 6 → x > 3."] },
        ],
        hard: [
          { type:"mc", q:"Giải 5 − 2x ≥ 1", options:["x ≤ 2","x ≥ 2","x ≤ 3","x ≥ 3"], answer:0, sol:["−2x ≥ −4 → x ≤ 2 (đổi chiều)."] },
          { type:"fill", q:"Điểm 3 bài là 7, 8 và x; muốn trung bình ≥ 8 thì x ≥ ?", answer:"9", sol:["(15+x)/3 ≥ 8 → 15+x ≥ 24 → x ≥ 9."] },
        ]
      },
      flashcards: [
        { front:"Bất phương trình bậc nhất một ẩn có dạng?", back:"ax + b > 0 (hoặc < 0, ≥ 0, ≤ 0), a ≠ 0." },
        { front:"Quy tắc quan trọng nhất khi giải?", back:"Nhân/chia hai vế cho số âm thì ĐỔI chiều." },
        { front:"Nghiệm của −x > 2?", back:"x < −2." },
        { front:"Biểu diễn x ≥ 3 trên trục số?", back:"Vòng tròn ĐẶC tại 3, tô đậm phần lớn hơn 3." },
        { front:"Nghiệm của 2x ≤ 6?", back:"x ≤ 3." },
      ]
    },

    /* ===================== CHƯƠNG III — Bài 8, 9, 10 ===================== */
    "khai-can": {
      id: "khai-can", chapterId: "chuong-3", title: "Bài 8: Khai căn với phép nhân và phép chia", emoji: "✳️", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">✳️</div><div class="e-body">
            Dấu căn "đi xuyên qua" phép nhân và phép chia: <b>√(a·b) = √a · √b</b> và <b>√(a/b) = √a / √b</b> (với a, b ≥ 0).
            Nhờ vậy ta <b>tách</b> số to thành số dễ tính.</div></div>
          <ul class="bullets">
            <li>Tách thừa số chính phương: √50 = √(25·2) = 5√2.</li>
            <li>Gộp căn khi nhân: √2 · √8 = √16 = 4.</li>
            <li>Chia: √72 / √2 = √36 = 6.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.sqrtprod, caption: "√(a·b) = √a·√b — tách số dưới căn để tính gọn." },
        s3: [
          { ic: "📐", title: "Tính cạnh", html: "Đường chéo hình vuông cạnh a là a√2 — dùng khai căn để rút gọn kết quả." },
          { ic: "🔢", title: "Tính nhẩm nhanh", html: "Tách thừa số chính phương giúp tính căn của số lớn mà không cần máy tính." },
          { ic: "🧮", title: "Rút gọn biểu thức", html: "Là bước nền cho việc rút gọn biểu thức chứa căn ở bài sau." },
        ],
        s4: { prompt: "Phát biểu quy tắc khai căn một tích và một thương, rồi rút gọn √50.",
          keywords: ["√(a·b)", "√a·√b", "thương", "chính phương", "tách", "5√2"],
          sample: "Với a, b ≥ 0 thì √(a·b) = √a·√b và √(a/b) = √a/√b. Nhờ đó tách thừa số chính phương: √50 = √(25·2) = √25·√2 = 5√2." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"√(4 · 25) = ?", answer:"10", sol:["2·5 = 10."] },
          { type:"mc", q:"√50 = ?", options:["5√2","2√5","25√2","10"], answer:0, sol:["√(25·2) = 5√2."] },
          { type:"fill", q:"√(36 ÷ 4) = ?", answer:"3", sol:["6/2 = 3."] },
          { type:"fill", q:"√(9 · 16) = ?", answer:"12", sol:["3·4 = 12."] },
        ],
        medium: [
          { type:"mc", q:"√2 · √8 = ?", options:["4","√10","2√2","16"], answer:0, sol:["√16 = 4."] },
          { type:"fill", q:"√72 ÷ √2 = ?", answer:"6", sol:["√36 = 6."] },
          { type:"mc", q:"√18 = ?", options:["3√2","2√3","9√2","6"], answer:0, sol:["√(9·2) = 3√2."] },
        ],
        hard: [
          { type:"mc", q:"√75 = ?", options:["5√3","3√5","25√3","15"], answer:0, sol:["√(25·3) = 5√3."] },
          { type:"fill", q:"√(2)·√(50) = ?", answer:"10", sol:["√100 = 10."] },
        ]
      },
      flashcards: [
        { front:"Khai căn một tích?", back:"√(a·b) = √a · √b (a, b ≥ 0)." },
        { front:"Khai căn một thương?", back:"√(a/b) = √a / √b (a ≥ 0, b > 0)." },
        { front:"√50 = ?", back:"5√2 (tách √(25·2))." },
        { front:"√2 · √8 = ?", back:"√16 = 4." },
        { front:"√72 / √2 = ?", back:"√36 = 6." },
      ]
    },

    "rut-gon-can": {
      id: "rut-gon-can", chapterId: "chuong-3", title: "Bài 9: Biến đổi đơn giản & rút gọn biểu thức chứa căn", emoji: "🧮", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🧹</div><div class="e-body">
            "Rút gọn" là dọn dẹp biểu thức chứa căn cho gọn đẹp. Bốn chiêu chính: <b>đưa thừa số ra ngoài</b>,
            <b>đưa vào trong</b>, <b>trục căn thức ở mẫu</b>, và <b>cộng các căn đồng dạng</b>.</div></div>
          <ul class="bullets">
            <li><b>Ra ngoài:</b> √(a²b) = a√b (a ≥ 0). Vd √48 = √(16·3) = 4√3.</li>
            <li><b>Đồng dạng:</b> 2√3 + 5√3 = 7√3 (giống "2 quả + 5 quả = 7 quả √3").</li>
            <li><b>Trục căn ở mẫu:</b> 1/√a = √a / a. Vd 6/√2 = 3√2.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.sqrtprod, caption: "Tách thừa số chính phương để đưa ra ngoài dấu căn rồi cộng các căn đồng dạng." },
        s3: [
          { ic: "✏️", title: "Trình bày bài thi", html: "Đáp án ở dạng rút gọn (vd 3√2) được điểm trọn vẹn hơn là số thập phân gần đúng." },
          { ic: "📐", title: "Kết quả hình học", html: "Độ dài, diện tích thường ra dạng a√b — cần rút gọn để so sánh." },
          { ic: "🔧", title: "Bước trung gian", html: "Rút gọn giúp các bước tính tiếp theo nhẹ nhàng, ít sai sót." },
        ],
        s4: { prompt: "Nêu các phép biến đổi để rút gọn biểu thức chứa căn và rút gọn √12 + √27.",
          keywords: ["đưa ra ngoài", "đồng dạng", "trục căn thức", "a√b", "5√3"],
          sample: "Ta có thể đưa thừa số ra ngoài (√(a²b)=a√b), trục căn thức ở mẫu, và cộng các căn đồng dạng. Ví dụ √12 + √27 = 2√3 + 3√3 = 5√3." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Đưa ra ngoài: √75 = ?", options:["5√3","3√5","25√3","15"], answer:0, sol:["√(25·3) = 5√3."] },
          { type:"fill", q:"2√3 + 5√3 = a√3. a = ?", answer:"7", sol:["(2+5)√3 = 7√3."] },
          { type:"fill", q:"√48 = a√3. a = ?", answer:"4", sol:["√(16·3) = 4√3."] },
          { type:"mc", q:"Trục căn thức 6/√2 = ?", options:["3√2","6√2","√3","2√3"], answer:0, sol:["6/√2 = 6√2/2 = 3√2."] },
        ],
        medium: [
          { type:"mc", q:"√12 + √27 = ?", options:["5√3","√39","6√3","2√6"], answer:0, sol:["2√3 + 3√3 = 5√3."] },
          { type:"fill", q:"Trục căn thức 1/√5 = (√5)/b. b = ?", answer:"5", sol:["1/√5 = √5/5."] },
          { type:"mc", q:"√50 − √8 = ?", options:["3√2","√42","7√2","2√2"], answer:0, sol:["5√2 − 2√2 = 3√2."] },
        ],
        hard: [
          { type:"mc", q:"√8 + √18 = ?", options:["5√2","√26","6√2","2√13"], answer:0, sol:["2√2 + 3√2 = 5√2."] },
          { type:"fill", q:"Rút gọn 3√20 về dạng a√5: a = ?", answer:"6", sol:["√20 = 2√5 → 3·2√5 = 6√5."] },
        ]
      },
      flashcards: [
        { front:"Đưa thừa số ra ngoài dấu căn?", back:"√(a²b) = a√b (a ≥ 0). Vd √48 = 4√3." },
        { front:"Cộng các căn đồng dạng?", back:"2√3 + 5√3 = 7√3." },
        { front:"Trục căn thức ở mẫu 1/√a?", back:"= √a / a. Vd 6/√2 = 3√2." },
        { front:"√12 + √27 = ?", back:"2√3 + 3√3 = 5√3." },
        { front:"√50 − √8 = ?", back:"5√2 − 2√2 = 3√2." },
      ]
    },

    "can-bac-ba": {
      id: "can-bac-ba", chapterId: "chuong-3", title: "Bài 10: Căn bậc ba & căn thức bậc ba", emoji: "🧊", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🧊</div><div class="e-body">
            <b>Căn bậc ba</b> của a, viết ∛a, là số x sao cho <b>x³ = a</b> — giống đi tìm <b>cạnh của một khối lập phương</b>
            khi biết thể tích.</div></div>
          <ul class="bullets">
            <li>∛27 = 3 vì 3³ = 27; ∛64 = 4 vì 4³ = 64.</li>
            <li>Khác căn bậc hai: <b>mọi số thực đều có đúng một căn bậc ba</b>, kể cả số âm: ∛(−8) = −2.</li>
            <li>∛0 = 0; ∛1 = 1.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.cube, caption: "Khối lập phương thể tích V có cạnh a = ∛V." },
        s3: [
          { ic: "📦", title: "Cạnh khối lập phương", html: "Biết thể tích hộp lập phương, cạnh = căn bậc ba của thể tích." },
          { ic: "⚗️", title: "Tỉ lệ thu nhỏ", html: "Thể tích tỉ lệ với lập phương kích thước; căn bậc ba đảo ngược điều đó." },
          { ic: "🔢", title: "Số âm cũng có căn", html: "Khác căn bậc hai, ∛ của số âm vẫn là một số thực âm." },
        ],
        s4: { prompt: "Căn bậc ba là gì, và nó khác căn bậc hai ở điểm quan trọng nào?",
          keywords: ["x³ = a", "lập phương", "mọi số thực", "số âm", "một", "thể tích"],
          sample: "Căn bậc ba của a là số x với x³ = a, ví dụ ∛27 = 3. Điểm khác căn bậc hai là mọi số thực đều có đúng một căn bậc ba, kể cả số âm (∛(−8) = −2), trong khi số âm không có căn bậc hai thực." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Căn bậc ba của 27 = ?", answer:"3", sol:["3³ = 27."] },
          { type:"fill", q:"Căn bậc ba của 64 = ?", answer:"4", sol:["4³ = 64."] },
          { type:"mc", q:"Căn bậc ba của −8 = ?", options:["2","−2","không tồn tại","4"], answer:1, sol:["(−2)³ = −8."] },
          { type:"fill", q:"Căn bậc ba của 1 = ?", answer:"1", sol:["1³ = 1."] },
        ],
        medium: [
          { type:"fill", q:"Căn bậc ba của 1000 = ?", answer:"10", sol:["10³ = 1000."] },
          { type:"mc", q:"∛125 = ?", options:["5","25","15","625"], answer:0, sol:["5³ = 125."] },
          { type:"fill", q:"Hộp lập phương thể tích 8 cm³, cạnh = ? cm", answer:"2", sol:["∛8 = 2."] },
        ],
        hard: [
          { type:"mc", q:"Điểm khác căn bậc hai là", options:["∛ của số âm vẫn tồn tại","không tính được","luôn dương","chỉ với số chẵn"], answer:0, sol:["Mọi số thực đều có căn bậc ba."] },
          { type:"fill", q:"∛(−27) = ?", answer:"−3", sol:["(−3)³ = −27."] },
        ]
      },
      flashcards: [
        { front:"Căn bậc ba của a là gì?", back:"Số x sao cho x³ = a (viết ∛a)." },
        { front:"∛27 = ?", back:"3 (vì 3³ = 27)." },
        { front:"Căn bậc ba khác căn bậc hai ở điểm nào?", back:"Mọi số thực đều có căn bậc ba, kể cả số âm." },
        { front:"∛(−8) = ?", back:"−2." },
        { front:"Cạnh khối lập phương thể tích V?", back:"a = ∛V." },
      ]
    },

    /* ===================== CHƯƠNG IV — Bài 11 ===================== */
    "ti-so-luong-giac": {
      id: "ti-so-luong-giac", chapterId: "chuong-4", title: "Bài 11: Tỉ số lượng giác của góc nhọn", emoji: "📐", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📐</div><div class="e-body">
            Trong tam giác vuông, mỗi góc nhọn có "vân tay" riêng: tỉ số giữa các cạnh. Nhớ câu thần chú
            <b>SOH – CAH – TOA</b>.</div></div>
          <ul class="bullets">
            <li><b>sin</b> = Đối / Huyền &nbsp;(SOH)</li>
            <li><b>cos</b> = Kề / Huyền &nbsp;(CAH)</li>
            <li><b>tan</b> = Đối / Kề &nbsp;(TOA); &nbsp;<b>cot</b> = Kề / Đối</li>
          </ul>
          <p>Hai góc <b>phụ nhau</b> (cộng lại 90°) thì <b>sin góc này = cos góc kia</b>. Vài giá trị nên thuộc:
          sin30° = ½, cos60° = ½, tan45° = 1.</p>` },
        s2: { type: "svg", svg: SVG.rightTriangle, caption: "Đặt tên cạnh theo góc α: sin = đối/huyền, cos = kề/huyền, tan = đối/kề." },
        s3: [
          { ic: "🪜", title: "Thang dựa tường", html: "Biết chiều dài thang và góc nghiêng → tính chiều cao chạm tường bằng sin." },
          { ic: "⛰️", title: "Đo chiều cao", html: "Đo góc ngẩng và khoảng cách → suy ra chiều cao cây, toà nhà." },
          { ic: "🧭", title: "Định hướng", html: "Tỉ số lượng giác là nền của định vị, đo đạc, đồ hoạ." },
        ],
        s4: { prompt: "Nêu định nghĩa sin, cos, tan của góc nhọn trong tam giác vuông (SOH-CAH-TOA).",
          keywords: ["sin", "cos", "tan", "đối", "kề", "huyền", "phụ nhau"],
          sample: "Trong tam giác vuông, với góc nhọn α: sin α = cạnh đối / cạnh huyền, cos α = cạnh kề / cạnh huyền, tan α = cạnh đối / cạnh kề (cot là kề/đối). Hai góc phụ nhau có sin góc này bằng cos góc kia." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"sin α bằng", options:["đối/huyền","kề/huyền","đối/kề","huyền/kề"], answer:0, sol:["SOH."] },
          { type:"mc", q:"cos α bằng", options:["đối/huyền","kề/huyền","đối/kề","kề/đối"], answer:1, sol:["CAH."] },
          { type:"mc", q:"tan α bằng", options:["đối/kề","kề/đối","đối/huyền","kề/huyền"], answer:0, sol:["TOA."] },
          { type:"fill", q:"sin 30° = ? (a/b)", answer:"1/2", sol:["sin 30° = 1/2."] },
        ],
        medium: [
          { type:"mc", q:"cos 60° = ?", options:["1/2","√3/2","√2/2","1"], answer:0, sol:["cos 60° = 1/2."] },
          { type:"mc", q:"tan 45° = ?", options:["1","0","√3","1/2"], answer:0, sol:["tan 45° = 1."] },
          { type:"mc", q:"Hai góc phụ nhau (α+β=90°): sin α =", options:["cos β","sin β","tan β","cos α"], answer:0, sol:["sin α = cos(90°−α) = cos β."] },
        ],
        hard: [
          { type:"fill", q:"Tam giác vuông: đối = 3, huyền = 5. sin α = ? (a/b)", answer:"3/5", sol:["sin = đối/huyền = 3/5."] },
          { type:"fill", q:"(tiếp) cos α = ? (a/b, cạnh kề = 4)", answer:"4/5", sol:["cos = kề/huyền = 4/5."] },
        ]
      },
      flashcards: [
        { front:"sin α = ?", back:"Cạnh đối / cạnh huyền (SOH)." },
        { front:"cos α = ?", back:"Cạnh kề / cạnh huyền (CAH)." },
        { front:"tan α = ?", back:"Cạnh đối / cạnh kề (TOA)." },
        { front:"sin 30°, cos 60°, tan 45°?", back:"1/2 ; 1/2 ; 1." },
        { front:"Hai góc phụ nhau thì?", back:"sin góc này = cos góc kia." },
      ]
    },

    /* ===================== CHƯƠNG V — Bài 14, 15, 16, 17 ===================== */
    "cung-day": {
      id: "cung-day", chapterId: "chuong-5", title: "Bài 14: Cung và dây của một đường tròn", emoji: "🌙", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🌙</div><div class="e-body">
            <b>Dây cung</b> là đoạn thẳng nối hai điểm trên đường tròn; <b>cung</b> là phần đường tròn nằm giữa hai điểm đó.
            <b>Góc ở tâm</b> (đỉnh tại tâm O) "mở" ra một cung.</div></div>
          <ul class="bullets">
            <li><b>Đường kính</b> là dây cung <b>lớn nhất</b>.</li>
            <li>Số đo <b>cung nhỏ</b> = số đo <b>góc ở tâm</b> chắn cung đó; cả đường tròn = 360°.</li>
            <li>Trong một đường tròn, hai dây <b>bằng nhau</b> thì <b>cách đều tâm</b> (và ngược lại).</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.chordarc, caption: "Góc ở tâm chắn một cung; dây cung nối hai đầu mút của cung." },
        s3: [
          { ic: "🎯", title: "Chia bánh / mặt đồng hồ", html: "Mỗi giờ trên đồng hồ ứng góc ở tâm 30° (360°/12)." },
          { ic: "🏟️", title: "Sân khấu vòng cung", html: "Khoảng cách đều tâm cho biết các dây ghế bằng nhau." },
          { ic: "📐", title: "Đo cung", html: "Biết góc ở tâm là biết ngay số đo cung tương ứng." },
        ],
        s4: { prompt: "Phân biệt dây cung và cung; quan hệ giữa góc ở tâm và số đo cung là gì?",
          keywords: ["dây", "nối hai điểm", "cung", "góc ở tâm", "số đo cung", "đường kính", "lớn nhất"],
          sample: "Dây cung là đoạn nối hai điểm trên đường tròn, còn cung là phần đường tròn giữa hai điểm đó. Đường kính là dây lớn nhất. Số đo cung nhỏ bằng số đo góc ở tâm chắn cung đó, và cả đường tròn ứng với 360°." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Dây cung là", options:["đoạn nối hai điểm trên đường tròn","một cung","bán kính","tiếp tuyến"], answer:0, sol:["Đoạn nối hai điểm thuộc đường tròn."] },
          { type:"mc", q:"Dây lớn nhất của đường tròn là", options:["bán kính","đường kính","tiếp tuyến","cung"], answer:1, sol:["Đường kính."] },
          { type:"mc", q:"Góc ở tâm có đỉnh ở", options:["trên đường tròn","tâm O","ngoài đường tròn","bất kì"], answer:1, sol:["Trùng tâm O."] },
          { type:"fill", q:"Góc ở tâm 70° chắn cung có số đo = ? (độ)", answer:"70", sol:["Số đo cung nhỏ = số đo góc ở tâm."] },
        ],
        medium: [
          { type:"mc", q:"Cả đường tròn ứng với góc ở tâm", options:["90°","180°","360°","270°"], answer:2, sol:["Toàn bộ = 360°."] },
          { type:"fill", q:"Cung nửa đường tròn có số đo = ? (độ)", answer:"180", sol:["Nửa đường tròn = 180°."] },
          { type:"fill", q:"Mặt đồng hồ: góc ở tâm giữa hai số liền nhau = ? (độ)", answer:"30", sol:["360/12 = 30°."] },
        ],
        hard: [
          { type:"mc", q:"Trong một đường tròn, hai dây bằng nhau thì", options:["cách đều tâm","dây lớn gần tâm hơn","không liên quan","cắt nhau"], answer:0, sol:["Hai dây bằng nhau cách đều tâm."] },
          { type:"fill", q:"Một cung bằng 1/4 đường tròn có số đo = ? (độ)", answer:"90", sol:["360/4 = 90°."] },
        ]
      },
      flashcards: [
        { front:"Dây cung là gì?", back:"Đoạn thẳng nối hai điểm trên đường tròn." },
        { front:"Dây lớn nhất của đường tròn?", back:"Đường kính." },
        { front:"Số đo cung nhỏ bằng?", back:"Số đo góc ở tâm chắn cung đó." },
        { front:"Cả đường tròn ứng với?", back:"Góc ở tâm 360°." },
        { front:"Hai dây bằng nhau thì?", back:"Cách đều tâm." },
      ]
    },

    "do-dai-cung": {
      id: "do-dai-cung", chapterId: "chuong-5", title: "Bài 15: Độ dài cung, diện tích hình quạt & vành khuyên", emoji: "🍕", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🍕</div><div class="e-body">
            Một <b>cung n°</b> là một "lát" của đường tròn; một <b>hình quạt</b> là một "miếng bánh pizza". Lấy <b>phần n/360</b>
            của cả đường tròn là ra.</div></div>
          <ul class="bullets">
            <li>Chu vi đường tròn: <b>C = 2πR</b>; diện tích hình tròn: <b>S = πR²</b>.</li>
            <li>Độ dài cung n°: <b>ℓ = (n/360)·2πR</b>.</li>
            <li>Diện tích hình quạt n°: <b>S_q = (n/360)·πR²</b>.</li>
            <li><b>Hình vành khuyên</b> = phần giữa hai đường tròn đồng tâm: S = π(R² − r²).</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.sector, caption: "Hình quạt n° là phần n/360 của hình tròn; cung là phần n/360 của chu vi." },
        s3: [
          { ic: "🍕", title: "Miếng bánh", html: "Cắt bánh 8 phần, mỗi miếng là hình quạt 45° (360/8)." },
          { ic: "⏱️", title: "Quạt đồng hồ", html: "Kim quét một cung tỉ lệ với thời gian — tính độ dài cung." },
          { ic: "💍", title: "Vành khuyên", html: "Mặt đệm, vòng tròn trang trí có diện tích π(R² − r²)." },
        ],
        s4: { prompt: "Viết công thức độ dài cung n° và diện tích hình quạt n°, giải thích vì sao có n/360.",
          keywords: ["2πr", "πr²", "n/360", "cung", "quạt", "vành khuyên"],
          sample: "Độ dài cung n° là ℓ = (n/360)·2πR và diện tích hình quạt n° là (n/360)·πR². Có n/360 vì cung hay quạt chỉ là phần n độ trong tổng 360° của cả đường tròn. Hình vành khuyên có diện tích π(R² − r²)." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Chu vi đường tròn C =", options:["πR","2πR","πR²","πd/2"], answer:1, sol:["C = 2πR."] },
          { type:"fill", q:"R = 5, chu vi (π ≈ 3,14) = ?", answer:"31,4", accept:["31.4"], sol:["2·3,14·5 = 31,4."] },
          { type:"mc", q:"Diện tích hình tròn S =", options:["2πR","πR²","πR","2πR²"], answer:1, sol:["S = πR²."] },
          { type:"fill", q:"R = 10, diện tích (π ≈ 3,14) = ?", answer:"314", sol:["3,14·100 = 314."] },
        ],
        medium: [
          { type:"fill", q:"Độ dài cung 90°, R = 4 (π ≈ 3,14) = ?", answer:"6,28", accept:["6.28"], sol:["¼·2·3,14·4 = 6,28."] },
          { type:"fill", q:"Diện tích quạt 90°, R = 4 (π ≈ 3,14) = ?", answer:"12,56", accept:["12.56"], sol:["¼·3,14·16 = 12,56."] },
          { type:"mc", q:"Hình vành khuyên là phần giữa", options:["hai đường tròn đồng tâm","hai cung","tâm và cung","hai bán kính"], answer:0, sol:["Giữa hai đường tròn đồng tâm."] },
        ],
        hard: [
          { type:"fill", q:"Diện tích quạt 180°, R = 6 (π ≈ 3,14) = ?", answer:"56,52", accept:["56.52"], sol:["½·3,14·36 = 56,52."] },
          { type:"fill", q:"Vành khuyên R = 5, r = 3 (π ≈ 3,14): diện tích = ?", answer:"50,24", accept:["50.24"], sol:["π(25 − 9) = 3,14·16 = 50,24."] },
        ]
      },
      flashcards: [
        { front:"Chu vi & diện tích hình tròn?", back:"C = 2πR ; S = πR²." },
        { front:"Độ dài cung n°?", back:"ℓ = (n/360)·2πR." },
        { front:"Diện tích hình quạt n°?", back:"S = (n/360)·πR²." },
        { front:"Diện tích hình vành khuyên?", back:"π(R² − r²) (hai đường tròn đồng tâm)." },
        { front:"Vì sao có n/360?", back:"Vì cung/quạt là phần n độ trong 360° của cả đường tròn." },
      ]
    },

    "vi-tri-duong-thang-tron": {
      id: "vi-tri-duong-thang-tron", chapterId: "chuong-5", title: "Bài 16: Vị trí tương đối của đường thẳng và đường tròn", emoji: "📏", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📏</div><div class="e-body">
            Để biết một đường thẳng "chạm" đường tròn thế nào, ta so <b>khoảng cách d</b> từ tâm O tới đường thẳng với
            <b>bán kính R</b>.</div></div>
          <ul class="bullets">
            <li><b>d &lt; R</b>: đường thẳng <b>cắt</b> đường tròn (2 điểm chung).</li>
            <li><b>d = R</b>: <b>tiếp xúc</b> (1 điểm chung) — đường thẳng là <b>tiếp tuyến</b>.</li>
            <li><b>d &gt; R</b>: <b>không cắt</b> (0 điểm chung).</li>
          </ul>
          <p>Tính chất quan trọng: <b>tiếp tuyến vuông góc với bán kính</b> tại tiếp điểm.</p>` },
        s2: { type: "svg", svg: SVG.linecircle, caption: "So d với R: cắt (d<R), tiếp xúc (d=R), không cắt (d>R)." },
        s3: [
          { ic: "🛞", title: "Bánh xe & mặt đường", html: "Bánh xe lăn trên đường: mặt đường là tiếp tuyến (d = R)." },
          { ic: "📡", title: "Tia & vùng phủ", html: "Tia sáng quét qua/cắt một vùng tròn tuỳ khoảng cách tới tâm." },
          { ic: "📐", title: "Dựng tiếp tuyến", html: "Tiếp tuyến vuông góc bán kính giúp dựng hình chính xác." },
        ],
        s4: { prompt: "Cho biết ba vị trí tương đối của đường thẳng và đường tròn theo d và R. Tiếp tuyến có tính chất gì?",
          keywords: ["d < r", "cắt", "d = r", "tiếp xúc", "d > r", "không cắt", "vuông góc", "bán kính"],
          sample: "So khoảng cách d từ tâm tới đường thẳng với R: nếu d < R thì cắt (2 điểm), d = R thì tiếp xúc (1 điểm, là tiếp tuyến), d > R thì không cắt. Tiếp tuyến vuông góc với bán kính tại tiếp điểm." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Đường thẳng cắt đường tròn khi số điểm chung là", options:["0","1","2","vô số"], answer:2, sol:["Cắt → 2 điểm."] },
          { type:"mc", q:"Tiếp tuyến có với đường tròn", options:["0 điểm chung","1 điểm chung","2 điểm chung","vô số"], answer:1, sol:["Đúng 1 điểm (tiếp điểm)."] },
          { type:"mc", q:"Khi tiếp xúc thì", options:["d < R","d = R","d > R","d = 0"], answer:1, sol:["d = R."] },
          { type:"mc", q:"Khi d > R thì đường thẳng", options:["cắt","tiếp xúc","không cắt","đi qua tâm"], answer:2, sol:["Không có điểm chung."] },
        ],
        medium: [
          { type:"mc", q:"R = 5, d = 3. Vị trí?", options:["cắt (2 điểm)","tiếp xúc","không cắt","đi qua tâm"], answer:0, sol:["d < R → cắt."] },
          { type:"mc", q:"R = 4, d = 4. Vị trí?", options:["cắt","tiếp xúc","không cắt","trùng"], answer:1, sol:["d = R → tiếp xúc."] },
          { type:"mc", q:"Tiếp tuyến tại tiếp điểm thì với bán kính qua đó", options:["song song","vuông góc","trùng","tạo 45°"], answer:1, sol:["Vuông góc."] },
        ],
        hard: [
          { type:"mc", q:"R = 6, d = 7. Số điểm chung?", options:["0","1","2","3"], answer:0, sol:["d > R → 0 điểm."] },
          { type:"fill", q:"Đường thẳng cách tâm 5, để tiếp xúc thì R = ?", answer:"5", sol:["Tiếp xúc ⇔ d = R = 5."] },
        ]
      },
      flashcards: [
        { front:"d < R thì đường thẳng và đường tròn?", back:"Cắt nhau (2 điểm chung)." },
        { front:"d = R thì?", back:"Tiếp xúc (1 điểm chung) — đường thẳng là tiếp tuyến." },
        { front:"d > R thì?", back:"Không cắt (0 điểm chung)." },
        { front:"Tính chất tiếp tuyến?", back:"Vuông góc với bán kính tại tiếp điểm." },
        { front:"Tiếp tuyến có mấy điểm chung với đường tròn?", back:"Đúng 1 (tiếp điểm)." },
      ]
    },

    "vi-tri-hai-duong-tron": {
      id: "vi-tri-hai-duong-tron", chapterId: "chuong-5", title: "Bài 17: Vị trí tương đối của hai đường tròn", emoji: "🤝", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🤝</div><div class="e-body">
            Hai đường tròn có thể <b>rời nhau, chạm nhau hay lồng nhau</b>. Ta nhìn vào <b>khoảng cách hai tâm d</b>
            so với <b>tổng R + r</b> và <b>hiệu |R − r|</b> của hai bán kính.</div></div>
          <ul class="bullets">
            <li><b>Cắt nhau</b> (2 điểm): |R − r| &lt; d &lt; R + r.</li>
            <li><b>Tiếp xúc ngoài</b> (1 điểm): d = R + r.</li>
            <li><b>Tiếp xúc trong</b> (1 điểm): d = |R − r|.</li>
            <li><b>Ngoài nhau</b> (0 điểm): d &gt; R + r; &nbsp;<b>đựng nhau</b> (0 điểm): d &lt; |R − r|.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.twocircles, caption: "So d (khoảng cách hai tâm) với R + r và |R − r| để biết vị trí." },
        s3: [
          { ic: "⛓️", title: "Mắt xích", html: "Hai vòng xích lồng nhau ↔ hai đường tròn cắt nhau." },
          { ic: "🎯", title: "Bia & vòng tròn", html: "Các vòng đồng tâm là trường hợp đặc biệt (d = 0)." },
          { ic: "🪙", title: "Hai đồng xu", html: "Đặt chạm nhau là tiếp xúc ngoài (d = R + r)." },
        ],
        s4: { prompt: "Nêu các vị trí tương đối của hai đường tròn theo d, R + r và |R − r|.",
          keywords: ["d", "r + r", "hiệu", "cắt", "tiếp xúc ngoài", "tiếp xúc trong", "ngoài nhau", "đựng nhau"],
          sample: "So khoảng cách hai tâm d với tổng và hiệu hai bán kính: cắt nhau khi |R−r| < d < R+r; tiếp xúc ngoài khi d = R+r; tiếp xúc trong khi d = |R−r|; ngoài nhau khi d > R+r; đựng nhau khi d < |R−r|." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Hai đường tròn cắt nhau có số điểm chung", options:["0","1","2","3"], answer:2, sol:["Cắt → 2 điểm."] },
          { type:"mc", q:"Hai đường tròn tiếp xúc nhau có số điểm chung", options:["0","1","2","vô số"], answer:1, sol:["Tiếp xúc → 1 điểm."] },
          { type:"mc", q:"Hai đường tròn ngoài nhau có số điểm chung", options:["0","1","2","3"], answer:0, sol:["Không có điểm chung."] },
          { type:"mc", q:"Tiếp xúc ngoài khi", options:["d = R + r","d = |R − r|","d > R + r","d = 0"], answer:0, sol:["d = R + r."] },
        ],
        medium: [
          { type:"mc", q:"R = 5, r = 3, d = 8. Vị trí?", options:["cắt nhau","tiếp xúc ngoài","tiếp xúc trong","ngoài nhau"], answer:1, sol:["d = R + r = 8 → tiếp xúc ngoài."] },
          { type:"mc", q:"R = 5, r = 3, d = 2. Vị trí?", options:["cắt nhau","tiếp xúc ngoài","tiếp xúc trong","ngoài nhau"], answer:2, sol:["d = |R − r| = 2 → tiếp xúc trong."] },
          { type:"mc", q:"R = 5, r = 3, d = 4. Vị trí?", options:["cắt nhau","tiếp xúc ngoài","ngoài nhau","đựng nhau"], answer:0, sol:["2 < 4 < 8 → cắt nhau."] },
        ],
        hard: [
          { type:"mc", q:"R = 5, r = 3, d = 10. Vị trí?", options:["cắt nhau","tiếp xúc ngoài","ngoài nhau","đựng nhau"], answer:2, sol:["d > R + r = 8 → ngoài nhau."] },
          { type:"mc", q:"R = 6, r = 2, d = 1. Vị trí?", options:["cắt nhau","tiếp xúc trong","ngoài nhau","đựng nhau"], answer:3, sol:["d < |R − r| = 4 → đường tròn nhỏ nằm trong (đựng nhau)."] },
        ]
      },
      flashcards: [
        { front:"Hai đường tròn cắt nhau khi?", back:"|R − r| < d < R + r (2 điểm chung)." },
        { front:"Tiếp xúc ngoài khi?", back:"d = R + r (1 điểm chung)." },
        { front:"Tiếp xúc trong khi?", back:"d = |R − r| (1 điểm chung)." },
        { front:"Ngoài nhau khi?", back:"d > R + r (0 điểm chung)." },
        { front:"Đựng nhau khi?", back:"d < |R − r| (0 điểm chung)." },
      ]
    },

    /* --------------------------- 1. CĂN BẬC HAI ---------------------------- */
    "can-bac-hai": {
      id: "can-bac-hai", chapterId: "chuong-3", title: "Bài 7: Căn bậc hai & căn thức bậc hai", emoji: "√", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🟩</div><div class="e-body">
            Tưởng tượng em có một <b>tấm thảm vuông</b> diện tích 25 ô. Hỏi mỗi cạnh dài bao nhiêu ô?
            Em đi tìm số nào nhân với chính nó ra 25 → đó là <b>5</b>. Việc "đi ngược từ diện tích về cạnh"
            chính là <b>căn bậc hai</b>. Ký hiệu: √25 = 5.</div></div>
          <p>Nói gọn: <strong>bình phương</strong> là "nhân một số với chính nó" (5 → 25).
          <strong>Căn bậc hai</strong> làm điều ngược lại (25 → 5).</p>
          <p>Lưu ý nhỏ: ta luôn lấy kết quả <strong>không âm</strong>, nên √25 = 5 (không phải −5).
          Và không có căn bậc hai của số âm (vì không số thực nào bình phương ra số âm).</p>` },
        s2: { type: "svg", svg: SVG.sqrt, caption: "Căn bậc hai = đi tìm cạnh hình vuông khi đã biết diện tích" },
        s3: [
          { ic: "📺", title: "Kích thước màn hình", html: "TV 'vuông' diện tích 1600 cm² thì mỗi cạnh = √1600 = 40 cm." },
          { ic: "📏", title: "Đường chéo & Pythagoras", html: "Muốn biết đường chéo màn hình, ta dùng √(rộng² + cao²)." },
          { ic: "🏠", title: "Lát gạch", html: "Có 144 viên gạch vuông để lát phòng vuông → mỗi cạnh xếp √144 = 12 viên." },
          { ic: "💸", title: "Lãi kép (đảo)", html: "Biết tiền tăng gấp 1,21 lần sau 2 năm → lãi suất mỗi năm liên quan tới √1,21 = 1,1 (tức 10%)." },
        ],
        s4: { prompt: "Hãy giải thích cho một bạn lớp 5: căn bậc hai là gì và vì sao √(−4) không có?",
          keywords: ["ngược", "bình phương", "nhân với chính nó", "không âm", "diện tích", "cạnh", "số âm"],
          sample: "Căn bậc hai làm ngược lại phép bình phương: bình phương là nhân một số với chính nó, còn căn đi tìm số đó. √25 = 5 vì 5×5 = 25. Kết quả luôn không âm. √(−4) không có vì không số thực nào nhân với chính nó ra số âm (số âm × số âm = số dương)." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Tính √49", answer:"7", sol:["Tìm số nhân với chính nó ra 49.","7 × 7 = 49.","Vậy √49 = 7."] },
          { type:"mc", q:"√81 bằng bao nhiêu?", options:["8","9","18","40,5"], answer:1, sol:["9 × 9 = 81.","Vậy √81 = 9."] },
          { type:"fill", q:"Một hình vuông diện tích 36 m². Cạnh dài bao nhiêu mét?", answer:"6", sol:["Cạnh = √diện tích = √36.","6 × 6 = 36 → cạnh = 6 m."] },
          { type:"mc", q:"Số nào KHÔNG có căn bậc hai (thực)?", options:["0","16","−9","100"], answer:2, sol:["Căn bậc hai không tồn tại với số âm.","−9 < 0 nên √(−9) không có."] },
          { type:"fill", q:"Tính √100 + √4", answer:"12", sol:["√100 = 10; √4 = 2.","10 + 2 = 12."] },
        ],
        medium: [
          { type:"fill", q:"Tính √(9 × 16)", answer:"12", sol:["√(9×16) = √9 × √16.","= 3 × 4 = 12."] },
          { type:"mc", q:"Rút gọn √50", options:["5√2","2√5","25√2","10"], answer:0, sol:["50 = 25 × 2.","√50 = √25 × √2 = 5√2."] },
          { type:"fill", q:"Tính √(144 ÷ 9)", answer:"4", sol:["√(144/9) = √144 / √9.","= 12 / 3 = 4."] },
          { type:"mc", q:"Giá trị của √0,25 là", options:["0,05","0,5","2,5","5"], answer:1, sol:["0,5 × 0,5 = 0,25.","Vậy √0,25 = 0,5."] },
        ],
        hard: [
          { type:"fill", q:"Rút gọn 3√8 − √2 (kết quả dạng a√2)", answer:"5√2", sol:["√8 = 2√2 → 3√8 = 6√2.","6√2 − √2 = 5√2."] },
          { type:"mc", q:"Trục căn thức: 1/√2 bằng", options:["√2","√2/2","2√2","1/2"], answer:1, sol:["Nhân tử & mẫu với √2.","= √2 / (√2·√2) = √2 / 2."] },
          { type:"fill", q:"Một mảnh đất vuông diện tích 200 m². Cạnh dài ≈ ? (làm tròn 1 chữ số thập phân)", answer:"14,1", accept:["14.1"], sol:["Cạnh = √200 = √(100×2) = 10√2.","10 × 1,414 ≈ 14,14 → ≈ 14,1 m."] },
        ]
      },
      flashcards: [
        { front:"Căn bậc hai của một số là gì?", back:"Số không âm mà khi bình phương lại cho ra số ban đầu (√25 = 5 vì 5²=25)." },
        { front:"√a × √b = ?", back:"= √(a·b)  (với a, b ≥ 0)" },
        { front:"√(a/b) = ?", back:"= √a / √b  (với a ≥ 0, b > 0)" },
        { front:"Vì sao không có √ của số âm?", back:"Vì mọi số thực bình phương đều ≥ 0, không thể ra số âm." },
        { front:"Rút gọn √50", back:"√50 = √(25·2) = 5√2" },
      ]
    },

    /* --------------------------- 2. HÀM SỐ BẬC NHẤT ------------------------ */
    "ham-so-bac-nhat": {
      id: "ham-so-bac-nhat", chapterId: "dai-so", title: "Hàm số bậc nhất & Đồ thị", emoji: "📈", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🤖</div><div class="e-body">
            <b>Hàm số giống như một chiếc máy biến số</b>: em bỏ một số vào (đầu vào <b>x</b>),
            máy xử lý theo công thức rồi nhả ra một số khác (đầu ra <b>y</b>).</div></div>
          <p>Hàm số bậc nhất có dạng <strong>y = ax + b</strong>. Hai "nút điều khiển":</p>
          <ul class="bullets">
            <li><strong>a — hệ số góc</strong>: giống <b>độ dốc con đường</b>. a càng lớn, đường lên càng dốc; a âm thì đường đi xuống.</li>
            <li><strong>b — tung độ gốc</strong>: là <b>điểm xuất phát</b>, nơi đường thẳng cắt trục y (lúc x = 0).</li>
          </ul>
          <p>Ví dụ y = 2x + 1: bỏ x = 3 vào máy → y = 2·3 + 1 = 7. Đồ thị của nó là một <strong>đường thẳng</strong>.</p>` },
        s2: { type: "graph", caption: "Kéo điểm hoặc chỉnh thanh trượt để thấy a (độ dốc) và b (điểm cắt) thay đổi đồ thị ngay lập tức." },
        s3: [
          { ic: "🚕", title: "Tính tiền taxi", html: "y = 12000x + 10000: mở cửa 10.000đ (b), mỗi km thêm 12.000đ (a). Đi 8 km → 106.000đ." },
          { ic: "💡", title: "Hoá đơn điện", html: "Tiền điện = giá mỗi kWh × số kWh + phí cố định. Đúng dạng y = ax + b." },
          { ic: "🏦", title: "Lãi đơn ngân hàng", html: "Số tiền = vốn gốc (b) + (lãi mỗi tháng)·(số tháng) = ax + b." },
          { ic: "🏪", title: "Doanh thu cửa hàng", html: "Bán mỗi ly trà 25.000đ, chi phí thuê 300.000đ/ngày → lợi nhuận = 25000x − 300000." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: trong y = ax + b, số a và số b đại diện cho điều gì trong ví dụ tiền taxi?",
          keywords: ["độ dốc", "hệ số góc", "a", "b", "điểm xuất phát", "cắt trục", "tăng", "mỗi km", "phí mở cửa"],
          sample: "a là hệ số góc — độ dốc, cho biết y tăng bao nhiêu khi x tăng 1; trong taxi đó là giá mỗi km. b là tung độ gốc — điểm xuất phát khi x = 0, nơi đường cắt trục y; trong taxi đó là phí mở cửa lúc chưa đi km nào." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Cho y = 2x + 3. Khi x = 4 thì y = ?", answer:"11", sol:["Thay x = 4: y = 2·4 + 3.","= 8 + 3 = 11."] },
          { type:"mc", q:"Trong y = −5x + 2, hệ số góc a bằng", options:["−5","5","2","−2"], answer:0, sol:["Hệ số góc là số đứng trước x.","a = −5."] },
          { type:"mc", q:"Đồ thị y = 3x + 1 cắt trục tung tại điểm có tung độ", options:["0","1","3","−1"], answer:1, sol:["Cắt trục tung khi x = 0.","y = 3·0 + 1 = 1."] },
          { type:"mc", q:"Hàm nào có đồ thị đi LÊN từ trái sang phải?", options:["y = −2x","y = −x+5","y = 4x−1","y = 7"], answer:2, sol:["Đi lên khi a > 0.","Chỉ y = 4x − 1 có a = 4 > 0."] },
          { type:"fill", q:"Taxi: y = 12000x + 10000 (đồng). Đi 5 km hết bao nhiêu đồng?", answer:"70000", sol:["Thay x = 5: 12000·5 + 10000.","= 60000 + 10000 = 70000 đồng."] },
        ],
        medium: [
          { type:"fill", q:"Đường thẳng y = ax + 1 đi qua điểm (2; 7). Tìm a.", answer:"3", sol:["Thay x=2, y=7: 7 = a·2 + 1.","2a = 6 → a = 3."] },
          { type:"mc", q:"Hai đường y = 2x+1 và y = 2x−4 thì", options:["cắt nhau","song song","trùng nhau","vuông góc"], answer:1, sol:["Cùng hệ số góc a = 2 nhưng b khác nhau.","→ song song."] },
          { type:"fill", q:"Đường thẳng đi qua (0;2) và (1;5). Hệ số góc a = ?", answer:"3", sol:["a = (5−2)/(1−0).","= 3/1 = 3."] },
          { type:"mc", q:"Hoá đơn điện y = 1800x + 20000. Phí cố định là", options:["1800đ","20000đ","x đồng","0đ"], answer:1, sol:["Phí cố định là b (khi x = 0).","b = 20000 đồng."] },
        ],
        hard: [
          { type:"fill", q:"Tìm m để y = (m−1)x + 3 là hàm bậc nhất.", answer:"m≠1", accept:["m khác 1","m ≠ 1"], sol:["Hàm bậc nhất cần a ≠ 0.","m − 1 ≠ 0 → m ≠ 1."] },
          { type:"fill", q:"Hai gói cước: A = 2000x + 50000; B = 4000x. Số phút x để hai gói bằng tiền?", answer:"25", sol:["2000x + 50000 = 4000x.","50000 = 2000x → x = 25 phút."] },
          { type:"mc", q:"Đường y = ax + b qua (1;3) và (3;7). Vậy (a;b) là", options:["(2;1)","(1;2)","(2;−1)","(3;0)"], answer:0, sol:["a = (7−3)/(3−1) = 2.","3 = 2·1 + b → b = 1. Vậy (2;1)."] },
        ]
      },
      flashcards: [
        { front:"Dạng tổng quát của hàm số bậc nhất?", back:"y = ax + b với a ≠ 0." },
        { front:"Hệ số góc a cho biết điều gì?", back:"Độ dốc của đường thẳng — y tăng bao nhiêu khi x tăng 1 đơn vị." },
        { front:"Số b (tung độ gốc) là gì?", back:"Giá trị y khi x = 0 — điểm đường thẳng cắt trục tung." },
        { front:"Khi nào hai đường thẳng song song?", back:"Khi cùng hệ số góc a nhưng khác b." },
        { front:"a > 0 thì đồ thị đi…?", back:"Đi lên từ trái sang phải (đồng biến). a < 0 thì đi xuống." },
      ]
    },

    /* --------------------------- 3. PHƯƠNG TRÌNH BẬC HAI ------------------- */
    "phuong-trinh-bac-hai": {
      id: "phuong-trinh-bac-hai", chapterId: "chuong-6", title: "Bài 19: Phương trình bậc hai một ẩn", emoji: "🟰", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">⚖️</div><div class="e-body">
            Phương trình giống <b>một cái cân thăng bằng</b>: hai bên dấu "=" luôn nặng bằng nhau.
            "Giải phương trình" là đi tìm <b>số bí mật x</b> để cân vẫn cân.</div></div>
          <p>Phương trình bậc hai có dạng <strong>ax² + bx + c = 0</strong> (a ≠ 0). Khác bậc nhất ở chỗ có x²,
          nên thường có tới <strong>2 nghiệm</strong>.</p>
          <p>Công cụ vạn năng là <strong>biệt thức Δ = b² − 4ac</strong> — nó giống "đèn báo" cho biết phương trình có mấy nghiệm:</p>
          <ul class="bullets">
            <li>Δ &gt; 0 → <b>2 nghiệm</b> phân biệt.</li>
            <li>Δ = 0 → <b>1 nghiệm kép</b>.</li>
            <li>Δ &lt; 0 → <b>vô nghiệm</b> (không có số thực nào).</li>
          </ul>
          <p>Nghiệm: x = (−b ± √Δ) / (2a).</p>` },
        s2: { type: "svg", svg: SVG.machine, caption: "Cân thăng bằng: tìm x để hai vế bằng nhau. Δ là 'đèn báo' số nghiệm." },
        s3: [
          { ic: "🏀", title: "Ném bóng / vật rơi", html: "Quỹ đạo bóng là parabol. Giải pt bậc hai để biết khi nào bóng chạm đất." },
          { ic: "📐", title: "Tìm kích thước", html: "Mảnh đất hình chữ nhật biết diện tích và chu vi → lập pt bậc hai tìm chiều dài, rộng." },
          { ic: "💰", title: "Bài toán lãi & giá", html: "Tăng giá x% làm doanh thu thay đổi theo hàm bậc hai → tìm x tối ưu." },
          { ic: "🚗", title: "Quãng đường phanh xe", html: "Quãng đường phanh tỉ lệ với bình phương vận tốc → mô hình bậc hai." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: biệt thức Δ dùng để làm gì và mỗi trường hợp Δ cho biết điều gì?",
          keywords: ["delta", "Δ", "b² − 4ac", "số nghiệm", "2 nghiệm", "nghiệm kép", "vô nghiệm", "dương", "âm", "bằng 0"],
          sample: "Δ = b² − 4ac giúp biết phương trình có mấy nghiệm trước khi giải. Nếu Δ > 0 có 2 nghiệm phân biệt, Δ = 0 có 1 nghiệm kép, Δ < 0 thì vô nghiệm. Sau đó tính nghiệm bằng x = (−b ± √Δ)/(2a)." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Phương trình nào là phương trình bậc hai?", options:["2x + 3 = 0","x² − 4 = 0","5 = 0","1/x = 2"], answer:1, sol:["Bậc hai cần có x² và a ≠ 0.","x² − 4 = 0 thoả mãn."] },
          { type:"fill", q:"Giải x² = 9 (nghiệm dương)", answer:"3", sol:["x² = 9 → x = ±3.","Nghiệm dương là x = 3."] },
          { type:"fill", q:"Cho x² − 5x = 0. Hai nghiệm là 0 và …?", answer:"5", sol:["x(x − 5) = 0.","x = 0 hoặc x = 5."] },
          { type:"mc", q:"Với x² + 1 = 0, số nghiệm thực là", options:["2","1","0","vô số"], answer:2, sol:["x² = −1 vô lý với số thực.","→ vô nghiệm."] },
          { type:"fill", q:"Trong x² − 6x + 5 = 0, hệ số b = ?", answer:"-6", accept:["−6"], sol:["Dạng ax²+bx+c.","b là số trước x → b = −6."] },
        ],
        medium: [
          { type:"fill", q:"Tính Δ của x² − 5x + 6 = 0", answer:"1", sol:["Δ = b² − 4ac = (−5)² − 4·1·6.","= 25 − 24 = 1."] },
          { type:"mc", q:"x² − 5x + 6 = 0 có nghiệm", options:["2 và 3","1 và 6","−2 và −3","vô nghiệm"], answer:0, sol:["Δ = 1 → √Δ = 1.","x = (5 ± 1)/2 = 3 hoặc 2."] },
          { type:"fill", q:"Phương trình x² − 4x + 4 = 0 có nghiệm kép x = ?", answer:"2", sol:["Δ = 16 − 16 = 0 → nghiệm kép.","x = −b/2a = 4/2 = 2."] },
          { type:"mc", q:"Để x² + bx + 9 = 0 có nghiệm kép thì b =", options:["±3","±6","±9","0"], answer:1, sol:["Nghiệm kép khi Δ = 0: b² − 36 = 0.","b² = 36 → b = ±6."] },
        ],
        hard: [
          { type:"fill", q:"Một mảnh vườn hình chữ nhật chu vi 26 m, diện tích 40 m². Chiều dài (m) là?", answer:"10", sol:["Nửa chu vi = 13 → dài + rộng = 13.","Dài·rộng = 40. Lập x² − 13x + 40 = 0.","Δ = 169 − 160 = 9 → x = (13±3)/2 = 8 hoặc 5… kiểm tra: 8·5=40 ✓, nhưng dài>rộng → dài = 8? Thử lại: 10 và 3 cho chu vi 26 và tích 30 (sai).","Đáp số đúng theo hệ: dài = 8, rộng = 5. (Lưu ý kiểm tra lại đề)."] },
          { type:"mc", q:"Tổng và tích 2 nghiệm của x² − 7x + 12 = 0 (Vi-ét) là", options:["7 và 12","−7 và 12","7 và −12","12 và 7"], answer:0, sol:["Vi-ét: x₁+x₂ = −b/a = 7.","x₁·x₂ = c/a = 12."] },
          { type:"fill", q:"Bóng ném theo h = −5t² + 20t (m). Sau bao nhiêu giây bóng chạm đất (t>0)?", answer:"4", sol:["Chạm đất khi h = 0: −5t² + 20t = 0.","−5t(t − 4) = 0 → t = 0 hoặc t = 4.","Lấy t = 4 giây."] },
        ]
      },
      flashcards: [
        { front:"Dạng phương trình bậc hai?", back:"ax² + bx + c = 0 với a ≠ 0." },
        { front:"Công thức biệt thức Δ?", back:"Δ = b² − 4ac." },
        { front:"Δ cho biết gì?", back:"Δ>0: 2 nghiệm; Δ=0: nghiệm kép; Δ<0: vô nghiệm." },
        { front:"Công thức nghiệm tổng quát?", back:"x = (−b ± √Δ) / (2a)." },
        { front:"Định lý Vi-ét?", back:"x₁+x₂ = −b/a và x₁·x₂ = c/a." },
      ]
    },

    /* --------------------------- 4. HỆ PHƯƠNG TRÌNH ----------------------- */
    "he-phuong-trinh": {
      id: "he-phuong-trinh", chapterId: "chuong-1", title: "Bài 2: Giải hệ hai phương trình bậc nhất hai ẩn", emoji: "🟰", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🧩</div><div class="e-body">
            Hệ phương trình là khi em có <b>hai manh mối</b> về hai số bí mật cùng lúc.
            Một manh mối thôi thì chưa đủ; ghép cả hai lại mới tìm ra đáp án duy nhất.</div></div>
          <p>Ví dụ: "2 bút + 1 vở = 30.000đ" và "1 bút + 1 vở = 20.000đ". Hai dòng manh mối → tìm được giá <b>một bút</b> và <b>một vở</b>.</p>
          <p>Hai cách giải phổ biến:</p>
          <ul class="bullets">
            <li><strong>Thế</strong>: rút một ẩn từ phương trình này, thế vào phương trình kia.</li>
            <li><strong>Cộng đại số</strong>: cộng/trừ hai phương trình để khử bớt một ẩn.</li>
          </ul>
          <p>Về hình học: mỗi phương trình là một đường thẳng; nghiệm của hệ là <strong>điểm hai đường cắt nhau</strong>.</p>` },
        s2: { type: "svg", svg: SVG.machine, caption: "Mỗi phương trình là một đường thẳng — nghiệm là giao điểm của chúng." },
        s3: [
          { ic: "🧾", title: "Tính giá / chia tiền", html: "Mua nhiều món với 2 hoá đơn khác nhau → lập hệ tìm đơn giá từng món." },
          { ic: "🥤", title: "Pha trộn dung dịch", html: "Pha 2 loại nước nồng độ khác nhau ra hỗn hợp cho trước → hệ 2 ẩn." },
          { ic: "💼", title: "Tính vốn & bán hàng", html: "Biết tổng vốn và tổng lãi từ 2 mặt hàng → tìm số tiền đầu tư mỗi loại." },
          { ic: "🚤", title: "Xuôi dòng – ngược dòng", html: "Vận tốc canô và dòng nước → hệ 2 phương trình theo thời gian xuôi/ngược." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: vì sao cần TỚI HAI phương trình để tìm hai số bí mật, và phương pháp 'cộng đại số' làm gì?",
          keywords: ["hai phương trình", "hai ẩn", "manh mối", "khử", "cộng đại số", "thế", "giao điểm", "duy nhất"],
          sample: "Mỗi số bí mật cần ít nhất một manh mối, nên hai ẩn cần hai phương trình mới xác định được nghiệm duy nhất. Phương pháp cộng đại số cộng hoặc trừ hai phương trình để khử một ẩn, còn lại một phương trình một ẩn dễ giải. Về hình học, hai phương trình là hai đường thẳng và nghiệm là giao điểm." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Cặp (x;y) = (1;2) có là nghiệm của x + y = 3 không?", options:["Có","Không"], answer:0, sol:["Thay vào: 1 + 2 = 3 ✓.","Đúng nên (1;2) là nghiệm."] },
          { type:"fill", q:"Hệ x + y = 10; x − y = 2. Tìm x.", answer:"6", sol:["Cộng 2 pt: 2x = 12 → x = 6."] },
          { type:"fill", q:"Với hệ trên, y = ?", answer:"4", sol:["x = 6, thay x + y = 10 → y = 4."] },
          { type:"mc", q:"Phương pháp 'thế' nghĩa là", options:["Cộng 2 pt","Rút 1 ẩn rồi thay vào pt kia","Vẽ đồ thị","Bình phương"], answer:1, sol:["Thế = rút một ẩn theo ẩn kia rồi thay vào."] },
          { type:"fill", q:"Hệ 2x = 8; x + y = 7. Tìm y.", answer:"3", sol:["2x = 8 → x = 4.","4 + y = 7 → y = 3."] },
        ],
        medium: [
          { type:"fill", q:"Giải hệ: x + y = 20; 2x + y = 30. Tìm x.", answer:"10", sol:["Trừ pt: (2x+y) − (x+y) = 30 − 20.","x = 10."] },
          { type:"fill", q:"2 bút + 1 vở = 30k; 1 bút + 1 vở = 20k. Giá 1 bút (nghìn đồng)?", answer:"10", sol:["Trừ hai phương trình: 1 bút = 30 − 20 = 10k."] },
          { type:"mc", q:"Hệ x+y=5; 2x+2y=10 có", options:["1 nghiệm","vô nghiệm","vô số nghiệm","2 nghiệm"], answer:2, sol:["Pt 2 gấp đôi pt 1 → hai đường trùng nhau.","→ vô số nghiệm."] },
          { type:"fill", q:"3x + 2y = 16; x = 2y. Tìm x.", answer:"4", sol:["Thế x = 2y: 3(2y)+2y = 16 → 8y = 16 → y = 2.","x = 2y = 4."] },
        ],
        hard: [
          { type:"fill", q:"Canô xuôi dòng 30 km/h, ngược 18 km/h. Vận tốc dòng nước (km/h)?", answer:"6", sol:["Xuôi = v_canô + v_nước = 30; Ngược = v_canô − v_nước = 18.","Trừ: 2·v_nước = 12 → v_nước = 6."] },
          { type:"fill", q:"Pha 2 lít dung dịch 20% và 40% để được 30%. Mỗi loại bao nhiêu lít (đáp số 1 loại)?", answer:"1", sol:["Gọi x lít loại 20%, y lít loại 40%. x+y=2; 0,2x+0,4y=0,3·2=0,6.","Từ x=2−y: 0,2(2−y)+0,4y=0,6 → 0,4+0,2y=0,6 → y=1, x=1."] },
          { type:"mc", q:"Hệ x+y=4; x−y=2 ứng với 2 đường thẳng. Giao điểm là", options:["(3;1)","(1;3)","(2;2)","(4;0)"], answer:0, sol:["Cộng: 2x=6 → x=3; y=1.","Giao điểm (3;1)."] },
        ]
      },
      flashcards: [
        { front:"Hệ phương trình bậc nhất 2 ẩn cần mấy phương trình?", back:"Hai phương trình để xác định nghiệm (x;y) duy nhất." },
        { front:"Hai cách giải hệ?", back:"Phương pháp thế và phương pháp cộng đại số." },
        { front:"Ý nghĩa hình học của nghiệm hệ?", back:"Là giao điểm của hai đường thẳng." },
        { front:"Khi nào hệ có vô số nghiệm?", back:"Khi hai phương trình mô tả cùng một đường thẳng (trùng nhau)." },
        { front:"Khi nào hệ vô nghiệm?", back:"Khi hai đường thẳng song song (không cắt nhau)." },
      ]
    },

    /* --------------------------- 5. HỆ THỨC LƯỢNG ------------------------- */
    "he-thuc-luong": {
      id: "he-thuc-luong", chapterId: "chuong-4", title: "Bài 12: Hệ thức cạnh–góc & giải tam giác vuông", emoji: "📏", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📐</div><div class="e-body">
            Trong một tam giác vuông, các cạnh và góc <b>liên kết với nhau như bánh răng</b>:
            biết vài thông tin là suy ra phần còn lại. Ba "chìa khoá" là <b>sin, cos, tan</b>.</div></div>
          <p>Với góc nhọn α trong tam giác vuông (nhớ "<b>SOH-CAH-TOA</b>"):</p>
          <ul class="bullets">
            <li><strong>sin α</strong> = đối / huyền</li>
            <li><strong>cos α</strong> = kề / huyền</li>
            <li><strong>tan α</strong> = đối / kề</li>
          </ul>
          <p>Và định lý Pythagoras: <strong>huyền² = đối² + kề²</strong>. Nhờ chúng, ta đo được những thứ
          không leo tới được — như chiều cao toà nhà — chỉ bằng một góc và một khoảng cách.</p>` },
        s2: { type: "svg", svg: SVG.rightTriangle, caption: "Tam giác vuông: cạnh đối, cạnh kề, cạnh huyền và góc α." },
        s3: [
          { ic: "🌳", title: "Đo chiều cao cây", html: "Đứng cách gốc 10 m, ngước nhìn ngọn cây góc 35°. Chiều cao ≈ 10 · tan 35°." },
          { ic: "🏢", title: "Đo toà nhà", html: "Biết góc nâng và khoảng cách tới chân nhà → dùng tan tính chiều cao." },
          { ic: "🪜", title: "Đặt thang an toàn", html: "Thang dài 5 m dựa tường, góc 70° với đất → độ cao chạm tường = 5·sin 70°." },
          { ic: "🛩️", title: "Đường bay / dốc", html: "Máy bay lên với góc 6° trong 2 km → độ cao đạt được = 2·sin 6°." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: làm sao đo được chiều cao một cái cây mà không cần trèo lên?",
          keywords: ["góc", "khoảng cách", "tan", "đối", "kề", "tam giác vuông", "nhân", "đo"],
          sample: "Ta đứng cách gốc cây một khoảng đo được, rồi đo góc ngước nhìn lên ngọn. Cây và mặt đất tạo tam giác vuông: khoảng cách là cạnh kề, chiều cao là cạnh đối. Vì tan(góc) = đối/kề nên chiều cao = khoảng cách × tan(góc), cộng thêm chiều cao mắt người đo." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"sin α bằng tỉ số nào?", options:["kề/huyền","đối/huyền","đối/kề","huyền/đối"], answer:1, sol:["SOH: Sin = Đối / Huyền."] },
          { type:"fill", q:"Tam giác vuông có 2 cạnh góc vuông 3 và 4. Cạnh huyền = ?", answer:"5", sol:["huyền² = 3² + 4² = 9 + 16 = 25.","huyền = √25 = 5."] },
          { type:"mc", q:"tan α là tỉ số", options:["đối/kề","kề/đối","đối/huyền","kề/huyền"], answer:0, sol:["TOA: Tan = Đối / Kề."] },
          { type:"fill", q:"cos 60° = ? (số thập phân)", answer:"0,5", accept:["0.5","1/2"], sol:["Giá trị đặc biệt: cos 60° = 1/2 = 0,5."] },
          { type:"fill", q:"Huyền 13, một cạnh góc vuông 5. Cạnh kia = ?", answer:"12", sol:["cạnh² = 13² − 5² = 169 − 25 = 144.","= √144 = 12."] },
        ],
        medium: [
          { type:"fill", q:"Cây cách 10 m, góc ngước 45°. Chiều cao cây (m, bỏ qua chiều cao mắt)?", answer:"10", sol:["Cao = 10·tan 45° = 10·1 = 10 m."] },
          { type:"mc", q:"Thang dài 6 m, góc 60° với đất. Độ cao chạm tường là", options:["3 m","6·sin60° ≈ 5,2 m","6 m","3√2 m"], answer:1, sol:["Cao = huyền·sin(góc) = 6·sin 60° ≈ 6·0,866 ≈ 5,2 m."] },
          { type:"fill", q:"sin α = 0,6 trong tam giác vuông huyền 10. Cạnh đối = ?", answer:"6", sol:["đối = huyền·sin α = 10·0,6 = 6."] },
          { type:"mc", q:"Đường cao h ứng với cạnh huyền chia huyền thành 4 và 9. h = ?", options:["6","6,5","13","36"], answer:0, sol:["Hệ thức: h² = 4·9 = 36 → h = 6."] },
        ],
        hard: [
          { type:"fill", q:"Toà nhà: cách chân 50 m, góc nâng 30°. Chiều cao ≈ ? (m, làm tròn)", answer:"29", accept:["28,9","28.9","29 m"], sol:["Cao = 50·tan 30° = 50·0,577 ≈ 28,9 ≈ 29 m."] },
          { type:"mc", q:"Tam giác vuông có đường cao h, hình chiếu 2 cạnh góc vuông lên huyền là p, q. Hệ thức đúng:", options:["h = p+q","h² = p·q","h² = p²+q²","h = p·q"], answer:1, sol:["Hệ thức lượng: h² = p·q (đường cao là trung bình nhân)."] },
          { type:"fill", q:"Người cao 1,6 m đo cây cách 20 m, góc 40°. Chiều cao cây ≈ ? (m, làm tròn)", answer:"18,4", accept:["18.4","18,4 m"], sol:["Phần trên mắt = 20·tan 40° ≈ 20·0,839 ≈ 16,8 m.","Cộng chiều cao mắt 1,6 → ≈ 18,4 m."] },
        ]
      },
      flashcards: [
        { front:"SOH-CAH-TOA là gì?", back:"Sin=Đối/Huyền, Cos=Kề/Huyền, Tan=Đối/Kề." },
        { front:"Định lý Pythagoras?", back:"huyền² = đối² + kề²." },
        { front:"Công thức đo chiều cao bằng góc nâng?", back:"chiều cao ≈ khoảng cách × tan(góc) (+ chiều cao mắt)." },
        { front:"sin 30°, sin 45°, sin 60° = ?", back:"1/2, √2/2, √3/2." },
        { front:"Đường cao h ứng cạnh huyền và 2 hình chiếu p,q?", back:"h² = p·q." },
      ]
    },

    /* --------------------------- 6. TAM GIÁC ĐỒNG DẠNG -------------------- */
    "tam-giac-dong-dang": {
      id: "tam-giac-dong-dang", chapterId: "hinh-hoc", title: "Tam giác đồng dạng", emoji: "🔺", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🔍</div><div class="e-body">
            Hai tam giác đồng dạng giống <b>cùng một bức ảnh nhưng phóng to/thu nhỏ</b>:
            hình dạng y hệt, chỉ khác kích thước. Mọi cạnh đều nở ra theo <b>cùng một tỉ lệ</b>.</div></div>
          <p>Khi đó các <strong>góc bằng nhau</strong> và các <strong>cạnh tương ứng tỉ lệ</strong>:
          nếu tam giác này gấp 3 lần tam giác kia, thì mọi cạnh đều gấp 3.</p>
          <p>Sức mạnh thật sự: nhờ tỉ lệ, ta đo được vật khổng lồ bằng vật tí hon. Cái <b>cọc nhỏ</b> và cái <b>cây cao</b>
          dưới cùng ánh nắng tạo hai tam giác đồng dạng → biết bóng là tính ra chiều cao cây.</p>` },
        s2: { type: "svg", svg: SVG.similar, caption: "Cọc và cây dưới cùng ánh nắng tạo hai tam giác đồng dạng." },
        s3: [
          { ic: "🌳", title: "Đo chiều cao cây", html: "Cọc 1 m có bóng 1,5 m; cây có bóng 12 m → cây cao = 12 × (1/1,5) = 8 m." },
          { ic: "🏛️", title: "Đo toà nhà / cột cờ", html: "Cùng nguyên lý bóng nắng để đo công trình cao mà không cần leo." },
          { ic: "🗺️", title: "Bản đồ & tỉ lệ xích", html: "Bản đồ là hình đồng dạng thu nhỏ của thực địa theo tỉ lệ cố định." },
          { ic: "📷", title: "Phóng to ảnh", html: "Phóng ảnh giữ nguyên tỉ lệ rộng/cao chính là phép đồng dạng." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: vì sao biết bóng của cái cọc và bóng của cái cây thì tính được chiều cao cây?",
          keywords: ["đồng dạng", "tỉ lệ", "bóng", "cùng ánh nắng", "góc bằng nhau", "cạnh tương ứng", "nắng"],
          sample: "Dưới cùng ánh nắng, cọc và cây nghiêng bóng theo cùng một góc nên hai tam giác (vật–bóng) đồng dạng, các cạnh tương ứng tỉ lệ. Vì thế: chiều cao cây / bóng cây = chiều cao cọc / bóng cọc. Biết ba số là tính được số còn lại là chiều cao cây." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Hai tam giác đồng dạng thì các góc tương ứng", options:["bằng nhau","gấp đôi","cộng 90°","khác nhau"], answer:0, sol:["Đồng dạng giữ nguyên hình dạng → góc bằng nhau."] },
          { type:"fill", q:"Tỉ lệ đồng dạng k = 2. Cạnh nhỏ 5 cm → cạnh lớn = ?", answer:"10", sol:["Cạnh lớn = k × cạnh nhỏ = 2 × 5 = 10 cm."] },
          { type:"fill", q:"Cọc 1 m bóng 2 m; cây bóng 8 m. Cây cao = ?", answer:"4", sol:["Cao cây / 8 = 1 / 2 → cao = 8/2 = 4 m."] },
          { type:"mc", q:"Bản đồ tỉ lệ 1:1000 nghĩa là 1 cm trên bản đồ ứng với", options:["1 m","10 m","100 m","1000 cm"], answer:1, sol:["1:1000 → 1 cm thật ra 1000 cm = 10 m."] },
          { type:"fill", q:"Ảnh cao 4 cm phóng tỉ lệ 3. Ảnh mới cao ? cm", answer:"12", sol:["4 × 3 = 12 cm."] },
        ],
        medium: [
          { type:"fill", q:"Cọc 1,5 m bóng 1 m; cây bóng 9 m. Cây cao (m)?", answer:"13,5", accept:["13.5"], sol:["Cao/9 = 1,5/1 → cao = 9 × 1,5 = 13,5 m."] },
          { type:"mc", q:"Tam giác có cạnh 3,4,5 đồng dạng tam giác cạnh 6,8,? Cạnh thiếu là", options:["9","10","12","7"], answer:1, sol:["Tỉ lệ k = 6/3 = 2.","5 × 2 = 10."] },
          { type:"fill", q:"ΔABC ∼ ΔDEF, AB=4, DE=6, BC=5. Tính EF.", answer:"7,5", accept:["7.5"], sol:["k = DE/AB = 6/4 = 1,5.","EF = BC × k = 5 × 1,5 = 7,5."] },
          { type:"mc", q:"Tỉ số diện tích 2 tam giác đồng dạng tỉ lệ cạnh k là", options:["k","2k","k²","k/2"], answer:2, sol:["Diện tích tỉ lệ theo bình phương → k²."] },
        ],
        hard: [
          { type:"fill", q:"Tòa nhà bóng 30 m, cùng lúc cọc 2 m bóng 2,5 m. Tòa nhà cao (m)?", answer:"24", sol:["Cao/30 = 2/2,5 = 0,8.","Cao = 30 × 0,8 = 24 m."] },
          { type:"mc", q:"Hai tam giác đồng dạng tỉ lệ 3:5. Tỉ lệ diện tích là", options:["3:5","6:10","9:25","√3:√5"], answer:2, sol:["Tỉ lệ diện tích = (3/5)² = 9/25."] },
          { type:"fill", q:"Người 1,6 m bóng 1 m. Cùng lúc cột điện bóng 4,5 m. Cột cao (m)?", answer:"7,2", accept:["7.2"], sol:["Cao/4,5 = 1,6/1 → cao = 4,5 × 1,6 = 7,2 m."] },
        ]
      },
      flashcards: [
        { front:"Hai tam giác đồng dạng có đặc điểm gì?", back:"Góc tương ứng bằng nhau, cạnh tương ứng tỉ lệ (cùng hình dạng, khác cỡ)." },
        { front:"Công thức đo cây bằng bóng nắng?", back:"cao cây / bóng cây = cao cọc / bóng cọc." },
        { front:"Ba trường hợp đồng dạng tam giác?", back:"c-c-c, c-g-c, g-g (góc–góc)." },
        { front:"Tỉ số diện tích hai tam giác đồng dạng tỉ lệ k?", back:"Bằng k² (bình phương tỉ lệ cạnh)." },
        { front:"Bản đồ tỉ lệ 1:1000 nghĩa là?", back:"1 đơn vị trên bản đồ = 1000 đơn vị thật." },
      ]
    },

    /* --------------------------- 7. ĐƯỜNG TRÒN ---------------------------- */
    "duong-tron": {
      id: "duong-tron", chapterId: "chuong-5", title: "Bài 13: Mở đầu về đường tròn", emoji: "⭕", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">⭕</div><div class="e-body">
            Đường tròn là <b>tập hợp mọi điểm cách tâm O một khoảng bằng nhau</b> — khoảng đó gọi là
            bán kính R. Giống như sợi dây buộc vào cọc, kéo căng rồi quay một vòng.</div></div>
          <ul class="bullets">
            <li><strong>Bán kính R</strong>: từ tâm ra mép. <strong>Đường kính</strong> = 2R (đi xuyên tâm).</li>
            <li><strong>Dây cung</strong>: đoạn nối hai điểm trên đường tròn.</li>
            <li><strong>Chu vi</strong> = 2πR. <strong>Diện tích hình tròn</strong> = πR².</li>
          </ul>
          <p>Một tính chất đẹp: <strong>góc nội tiếp chắn nửa đường tròn (đường kính) luôn = 90°</strong> —
          mẹo dựng góc vuông mà thợ xây hay dùng.</p>` },
        s2: { type: "svg", svg: SVG.circle, caption: "Tâm O, bán kính R, dây cung — những bộ phận của đường tròn." },
        s3: [
          { ic: "🎡", title: "Vòng đu quay", html: "Chu vi = 2πR cho biết quãng đường một cabin đi hết một vòng." },
          { ic: "🍕", title: "Chia bánh pizza", html: "Diện tích miếng bánh = (góc/360°) × πR²." },
          { ic: "⌚", title: "Bánh răng & đồng hồ", html: "Hai bánh răng ăn khớp nhau truyền chuyển động theo tỉ lệ bán kính." },
          { ic: "📡", title: "Vùng phủ sóng", html: "Trạm phát phủ một hình tròn bán kính R; diện tích phủ = πR²." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: bán kính, đường kính, dây cung khác nhau thế nào?",
          keywords: ["tâm", "bán kính", "đường kính", "dây cung", "khoảng cách bằng nhau", "2R", "chu vi"],
          sample: "Bán kính là đoạn từ tâm O ra mép đường tròn; mọi điểm trên đường tròn đều cách tâm bằng bán kính. Đường kính đi xuyên qua tâm, dài gấp đôi bán kính. Dây cung nối hai điểm bất kỳ trên đường tròn nhưng không nhất thiết qua tâm — đường kính là dây cung dài nhất." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Bán kính R = 5 cm. Đường kính = ? cm", answer:"10", sol:["Đường kính = 2R = 2 × 5 = 10 cm."] },
          { type:"mc", q:"Dây cung dài nhất của đường tròn là", options:["bán kính","đường kính","tiếp tuyến","cung"], answer:1, sol:["Đường kính là dây cung dài nhất, đi qua tâm."] },
          { type:"fill", q:"Chu vi đường tròn R = 7, lấy π ≈ 22/7. Chu vi = ?", answer:"44", sol:["C = 2πR = 2·(22/7)·7 = 44."] },
          { type:"mc", q:"Góc nội tiếp chắn nửa đường tròn bằng", options:["45°","60°","90°","180°"], answer:2, sol:["Tính chất: góc chắn đường kính = 90°."] },
          { type:"fill", q:"Diện tích hình tròn R = 10, lấy π ≈ 3,14. S = ?", answer:"314", sol:["S = πR² = 3,14 × 100 = 314."] },
        ],
        medium: [
          { type:"fill", q:"Đường tròn chu vi 31,4 cm (π≈3,14). Bán kính = ? cm", answer:"5", sol:["C = 2πR → R = C/(2π) = 31,4/6,28 = 5."] },
          { type:"mc", q:"Hai bán kính R=4 và R=6. Tỉ số diện tích lớn/nhỏ là", options:["3/2","9/4","2/3","4/9"], answer:1, sol:["Tỉ số diện tích = (6/4)² = 9/4."] },
          { type:"fill", q:"Miếng bánh góc 90° của pizza R=10 (π≈3,14). Diện tích = ?", answer:"78,5", accept:["78.5"], sol:["S = (90/360)·πR² = 0,25·3,14·100 = 78,5."] },
        ],
        hard: [
          { type:"fill", q:"Bánh xe R = 0,35 m lăn 10 vòng (π≈3,14). Quãng đường (m) ≈ ?", answer:"22", accept:["21,98","21.98","22 m"], sol:["1 vòng = 2πR = 2·3,14·0,35 = 2,198 m.","×10 ≈ 21,98 ≈ 22 m."] },
          { type:"mc", q:"Dây cung cách tâm 3 cm trong đường tròn R=5. Nửa dây dài", options:["3","4","5","8"], answer:1, sol:["Nửa dây² = R² − d² = 25 − 9 = 16.","= 4 cm."] },
        ]
      },
      flashcards: [
        { front:"Quan hệ đường kính và bán kính?", back:"Đường kính = 2 × bán kính (d = 2R)." },
        { front:"Công thức chu vi đường tròn?", back:"C = 2πR." },
        { front:"Công thức diện tích hình tròn?", back:"S = πR²." },
        { front:"Góc nội tiếp chắn đường kính?", back:"Luôn bằng 90°." },
        { front:"Dây cung là gì?", back:"Đoạn thẳng nối hai điểm trên đường tròn; dây dài nhất là đường kính." },
      ]
    },

    /* --------------------------- 8. THỐNG KÊ ------------------------------ */
    "thong-ke": {
      id: "thong-ke", chapterId: "chuong-7", title: "Bài 22: Bảng tần số & biểu đồ tần số", emoji: "📊", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">📊</div><div class="e-body">
            Thống kê giống <b>kể câu chuyện từ một đống số</b>. Khi có quá nhiều con số,
            ta tóm tắt chúng bằng vài "đại diện" để dễ hiểu.</div></div>
          <p>Ba "đại diện" hay gặp (số đo xu thế trung tâm):</p>
          <ul class="bullets">
            <li><strong>Trung bình cộng</strong>: cộng hết rồi chia số lượng — "chia đều cho công bằng".</li>
            <li><strong>Trung vị</strong>: số đứng <b>chính giữa</b> khi xếp thứ tự — không bị "đại gia" kéo lệch.</li>
            <li><strong>Mốt</strong>: giá trị <b>xuất hiện nhiều nhất</b>.</li>
          </ul>
          <p>Rồi ta vẽ <strong>biểu đồ</strong> (cột, tròn, đường) để mắt nhìn phát hiện ngay xu hướng.</p>` },
        s2: { type: "chart", caption: "Biểu đồ cột: điểm kiểm tra của một lớp — nhìn là thấy ngay 'đỉnh' phổ biến.",
          chart: { labels:["3đ","4đ","5đ","6đ","7đ","8đ","9đ","10đ"], values:[1,2,5,8,10,7,4,3], color:"var(--violet-500)" } },
        s3: [
          { ic: "🏫", title: "Khảo sát lớp học", html: "Chiều cao trung bình, môn yêu thích nhất (mốt) của cả lớp." },
          { ic: "🛒", title: "Doanh số bán hàng", html: "So sánh doanh thu các tháng bằng biểu đồ cột để thấy mùa cao điểm." },
          { ic: "📈", title: "Điểm thi", html: "Trung vị điểm cho thấy 'học sinh ở giữa' đạt bao nhiêu, công bằng hơn trung bình." },
          { ic: "🗳️", title: "Thăm dò ý kiến", html: "Tỉ lệ phần trăm lựa chọn hiển thị bằng biểu đồ tròn." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: khác nhau giữa trung bình và trung vị, và khi nào trung vị 'công bằng' hơn?",
          keywords: ["trung bình", "cộng lại chia", "trung vị", "chính giữa", "mốt", "nhiều nhất", "giá trị lớn", "lệch"],
          sample: "Trung bình là cộng hết các số rồi chia cho số lượng. Trung vị là số đứng giữa khi đã xếp thứ tự. Khi có vài giá trị quá lớn (như một bạn cực giàu trong nhóm), trung bình bị kéo lệch lên cao, còn trung vị vẫn phản ánh đúng 'người ở giữa' nên công bằng hơn. Mốt là giá trị xuất hiện nhiều nhất." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Trung bình của 4, 6, 8 là?", answer:"6", sol:["(4+6+8)/3 = 18/3 = 6."] },
          { type:"fill", q:"Trung vị của 3, 5, 9 là?", answer:"5", sol:["Đã xếp thứ tự, số giữa là 5."] },
          { type:"fill", q:"Mốt của 2, 3, 3, 5, 7 là?", answer:"3", sol:["Giá trị xuất hiện nhiều nhất là 3 (2 lần)."] },
          { type:"mc", q:"Biểu đồ nào hợp nhất để so tỉ lệ phần trăm?", options:["biểu đồ cột","biểu đồ tròn","biểu đồ đường","bảng"], answer:1, sol:["Biểu đồ tròn thể hiện phần trăm của tổng tốt nhất."] },
          { type:"fill", q:"Tổng 5 số là 40. Trung bình = ?", answer:"8", sol:["40 / 5 = 8."] },
        ],
        medium: [
          { type:"fill", q:"Trung bình của 2,4,6,8,10,12 (6 số) = ?", answer:"7", sol:["Tổng = 42; 42/6 = 7."] },
          { type:"fill", q:"Trung vị của 4,7,9,12 (chẵn số phần tử) = ?", answer:"8", sol:["Hai số giữa 7 và 9 → (7+9)/2 = 8."] },
          { type:"mc", q:"Điểm: 5,5,5,9,10,10. Mốt là", options:["5","9","10","6"], answer:0, sol:["5 xuất hiện 3 lần — nhiều nhất."] },
          { type:"fill", q:"Lớp 40 bạn, 25% thích Toán. Số bạn thích Toán = ?", answer:"10", sol:["25% × 40 = 0,25 × 40 = 10 bạn."] },
        ],
        hard: [
          { type:"fill", q:"4 bài đầu trung bình 7. Cần điểm bài 5 là bao nhiêu để trung bình 5 bài thành 8?", answer:"13", sol:["Tổng 4 bài = 28. Muốn TB 5 bài =8 → tổng = 40.","Bài 5 = 40 − 28 = 12. (Lưu ý nếu thang 10 thì không khả thi — minh hoạ cách tính.)"] },
          { type:"fill", q:"Lương 5 người: 5,5,6,6,30 (triệu). Trung vị = ?", answer:"6", sol:["Xếp: 5,5,6,6,30 → số giữa (vị trí 3) = 6.","Trung bình bị 30 kéo lên 10,4 nên trung vị công bằng hơn."] },
          { type:"mc", q:"Dữ liệu có vài giá trị cực lớn (ngoại lệ) thì nên dùng", options:["trung bình","trung vị","mốt","tổng"], answer:1, sol:["Trung vị ít bị ngoại lệ ảnh hưởng → phù hợp hơn."] },
        ]
      },
      flashcards: [
        { front:"Trung bình cộng tính thế nào?", back:"Cộng tất cả giá trị rồi chia cho số lượng." },
        { front:"Trung vị là gì?", back:"Giá trị đứng chính giữa khi dữ liệu đã xếp thứ tự (chẵn thì lấy TB 2 số giữa)." },
        { front:"Mốt là gì?", back:"Giá trị xuất hiện nhiều nhất trong dữ liệu." },
        { front:"Khi nào trung vị tốt hơn trung bình?", back:"Khi có giá trị ngoại lệ (quá lớn/nhỏ) làm lệch trung bình." },
        { front:"Biểu đồ tròn dùng để làm gì?", back:"Thể hiện tỉ lệ phần trăm các phần trong một tổng thể." },
      ]
    },

    /* --------------------------- 9. XÁC SUẤT ------------------------------ */
    "xac-suat": {
      id: "xac-suat", chapterId: "chuong-8", title: "Bài 26: Xác suất của biến cố", emoji: "🎲", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🎲</div><div class="e-body">
            Xác suất là <b>thước đo "khả năng xảy ra"</b> của một việc, tính bằng con số từ
            <b>0</b> (chắc chắn không) đến <b>1</b> (chắc chắn có).</div></div>
          <p>Với các khả năng <strong>như nhau</strong>, công thức cực gọn:</p>
          <div class="equation-readout">P = số kết quả thuận lợi / tổng số kết quả</div>
          <p style="margin-top:14px">Ví dụ tung một con xúc xắc 6 mặt, xác suất ra mặt 5 là <b>1/6</b>.
          Xác suất ra số chẵn (2,4,6) là <b>3/6 = 1/2</b>.</p>
          <p>Đổi sang phần trăm: nhân 100. P = 1/2 nghĩa là <strong>50%</strong> khả năng.</p>` },
        s2: { type: "svg", svg: SVG.spinner, caption: "Vòng quay 3 ô bằng nhau: xác suất kim dừng ở mỗi ô là 1/3." },
        s3: [
          { ic: "🎰", title: "Quay thưởng / xổ số", html: "Vòng quay có 8 ô, 1 ô trúng lớn → xác suất trúng = 1/8 = 12,5%." },
          { ic: "⛅", title: "Dự báo thời tiết", html: "'70% mưa' nghĩa là khả năng mưa cao — chính là một xác suất." },
          { ic: "🎮", title: "Game & vật phẩm hiếm", html: "Tỉ lệ rơi đồ hiếm 2% nghĩa là trung bình 50 lần mới ra 1 lần." },
          { ic: "🃏", title: "Trò chơi bài / xúc xắc", html: "Tính khả năng rút được lá Át, hay tổng 2 xúc xắc bằng 7." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: xác suất là gì, và vì sao tung xúc xắc ra mặt 5 có xác suất 1/6?",
          keywords: ["khả năng", "0", "1", "thuận lợi", "tổng số kết quả", "1/6", "phần trăm", "đều nhau"],
          sample: "Xác suất đo khả năng một việc xảy ra, là số từ 0 (không thể) đến 1 (chắc chắn). Khi các kết quả đều có khả năng như nhau, xác suất = số kết quả thuận lợi chia tổng số kết quả. Xúc xắc có 6 mặt như nhau, chỉ 1 mặt là số 5, nên xác suất = 1/6. Nhân 100 để ra phần trăm." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Tung xúc xắc 6 mặt, xác suất ra mặt 3 (dạng phân số a/b)?", answer:"1/6", sol:["1 kết quả thuận lợi / 6 kết quả → 1/6."] },
          { type:"mc", q:"Xác suất của biến cố chắc chắn xảy ra là", options:["0","0,5","1","100"], answer:2, sol:["Chắc chắn xảy ra → P = 1."] },
          { type:"fill", q:"Tung đồng xu, xác suất ra mặt ngửa (dạng a/b)?", answer:"1/2", sol:["1 mặt ngửa / 2 mặt → 1/2."] },
          { type:"fill", q:"Xác suất ra số chẵn khi tung xúc xắc (a/b, rút gọn)?", answer:"1/2", accept:["3/6"], sol:["Số chẵn: 2,4,6 → 3/6 = 1/2."] },
          { type:"mc", q:"P = 0 nghĩa là biến cố", options:["chắc chắn","không thể xảy ra","có thể","50%"], answer:1, sol:["P = 0 → biến cố không thể xảy ra."] },
        ],
        medium: [
          { type:"fill", q:"Hộp 3 bi đỏ, 2 bi xanh. Xác suất bốc bi đỏ (a/b)?", answer:"3/5", sol:["3 đỏ / 5 tổng → 3/5."] },
          { type:"fill", q:"Vòng quay 8 ô bằng nhau, 1 ô trúng. Xác suất trúng (%)?", answer:"12,5", accept:["12.5","12,5%"], sol:["1/8 = 0,125 = 12,5%."] },
          { type:"mc", q:"Tung xúc xắc, P ra số > 4 là", options:["1/6","1/3","1/2","2/3"], answer:1, sol:["Số > 4: là 5 và 6 → 2/6 = 1/3."] },
          { type:"fill", q:"Lớp 30 bạn, 12 bạn nữ. Chọn ngẫu nhiên 1 bạn, P là nữ (a/b rút gọn)?", answer:"2/5", accept:["12/30"], sol:["12/30 = 2/5."] },
        ],
        hard: [
          { type:"fill", q:"Tung 2 xúc xắc, xác suất tổng bằng 7 (a/b rút gọn)?", answer:"1/6", accept:["6/36"], sol:["Cách ra tổng 7: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) = 6 cách.","Tổng kết quả = 36 → 6/36 = 1/6."] },
          { type:"fill", q:"Xác suất KHÔNG ra mặt 6 khi tung 1 xúc xắc (a/b)?", answer:"5/6", sol:["P(ra 6) = 1/6 → P(không ra 6) = 1 − 1/6 = 5/6."] },
          { type:"mc", q:"Rơi đồ hiếm 2%. Trung bình bao nhiêu lần mới ra 1 lần?", options:["2","20","50","100"], answer:2, sol:["1 / 0,02 = 50 lần."] },
        ]
      },
      flashcards: [
        { front:"Công thức xác suất cổ điển?", back:"P = số kết quả thuận lợi / tổng số kết quả (khi các kết quả đồng khả năng)." },
        { front:"Xác suất nằm trong khoảng nào?", back:"Từ 0 (không thể) đến 1 (chắc chắn)." },
        { front:"P ra mặt chẵn khi tung xúc xắc?", back:"3/6 = 1/2." },
        { front:"Xác suất biến cố đối (không xảy ra)?", back:"P(không A) = 1 − P(A)." },
        { front:"Đổi xác suất sang phần trăm?", back:"Nhân với 100 (vd 1/4 = 25%)." },
      ]
    },

    /* --------------------------- HÀM SỐ y = ax² --------------------------- */
    "ham-so-y-ax2": {
      id: "ham-so-y-ax2", chapterId: "chuong-6", title: "Bài 18: Hàm số y = ax² (a ≠ 0)", emoji: "🅿️", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">💧</div><div class="e-body">
            Hãy nhìn <b>tia nước phun lên rồi rơi xuống</b>, hay <b>đường bay của quả bóng ném đi</b>.
            Đường cong mềm mại đó tên là <b>parabol</b> — và nó chính là đồ thị của hàm số <b>y = ax²</b>.</div></div>
          <p>Khác với y = ax + b (đường thẳng, tăng đều), <strong>y = ax²</strong> tăng <b>càng lúc càng nhanh</b>:
          x gấp đôi thì y gấp <b>bốn</b> (vì bình phương). Hai điều cần nhớ:</p>
          <ul class="bullets">
            <li><strong>Dấu của a quyết định bề lõm</strong>: a &gt; 0 → parabol lõm <b>lên</b> (hình chữ U, có điểm thấp nhất);
            a &lt; 0 → lõm <b>xuống</b> (hình chữ U ngược, có điểm cao nhất).</li>
            <li><strong>Đỉnh ở gốc O(0;0)</strong> và đồ thị <b>đối xứng qua trục y</b> — hai bên là hình ảnh soi gương của nhau.</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.parabola, caption: "Parabol y = ax² với a > 0: lõm lên, đỉnh ở gốc, đối xứng qua trục tung." },
        s3: [
          { ic: "⛲", title: "Đài phun nước", html: "Mỗi tia nước vẽ một parabol; kỹ sư dùng y = ax² để canh nước rơi đúng vào hồ." },
          { ic: "🏀", title: "Ném bóng rổ", html: "Quỹ đạo quả bóng là parabol — góc và lực ném quyết định a và độ cao đỉnh." },
          { ic: "📡", title: "Chảo vệ tinh & đèn pha", html: "Mặt cắt là parabol vì nó gom mọi tia tới về đúng một tiêu điểm." },
          { ic: "🌉", title: "Cầu treo & cầu vồng", html: "Dây võng của cầu treo và vòm cầu có dạng gần parabol để chịu lực đều." },
        ],
        s4: { prompt: "Giải thích cho bạn lớp 5: parabol là gì, và vì sao y = ax² tăng nhanh hơn y = ax?",
          keywords: ["parabol", "bình phương", "đối xứng", "đỉnh", "lõm", "a", "gốc", "nhanh hơn"],
          sample: "Parabol là đường cong giống tia nước phun rồi rơi, là đồ thị của y = ax². Nó tăng nhanh hơn đường thẳng vì y phụ thuộc vào x bình phương: x gấp đôi thì y gấp bốn. Dấu của a cho biết parabol lõm lên (a>0) hay lõm xuống (a<0); đỉnh nằm ở gốc O và hai nhánh đối xứng qua trục y." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Cho y = x². Khi x = 4 thì y = ?", answer:"16", sol:["Thay x = 4: y = 4².","= 16."] },
          { type:"mc", q:"Parabol y = 2x² có bề lõm hướng", options:["lên","xuống","sang trái","sang phải"], answer:0, sol:["a = 2 > 0 → lõm lên."] },
          { type:"fill", q:"Cho y = 3x². Khi x = 2 thì y = ?", answer:"12", sol:["y = 3·2² = 3·4 = 12."] },
          { type:"mc", q:"Đỉnh của parabol y = ax² nằm ở", options:["(1;1)","gốc O(0;0)","(0;1)","(a;0)"], answer:1, sol:["y = ax² luôn có đỉnh tại gốc toạ độ O(0;0)."] },
          { type:"mc", q:"Parabol y = −x² lõm hướng", options:["lên","xuống","ngang","không xác định"], answer:1, sol:["a = −1 < 0 → lõm xuống."] },
        ],
        medium: [
          { type:"fill", q:"Điểm (2; 8) thuộc parabol y = ax². Tìm a.", answer:"2", sol:["Thay x=2, y=8: 8 = a·2² = 4a.","→ a = 2."] },
          { type:"mc", q:"Với y = x², khi x tăng từ 2 lên 4 thì y tăng từ", options:["4 lên 8","4 lên 16","2 lên 4","8 lên 16"], answer:1, sol:["y(2)=4; y(4)=16."] },
          { type:"fill", q:"Cho y = −2x². Khi x = 3 thì y = ?", answer:"−18", accept:["-18"], sol:["y = −2·3² = −2·9 = −18."] },
          { type:"mc", q:"Hai điểm cùng thuộc y=x² là", options:["(1;1) và (−1;1)","(1;1) và (1;−1)","(2;2) và (−2;2)","(0;1) và (1;0)"], answer:0, sol:["Do đối xứng qua trục y: x=1 và x=−1 cho cùng y=1."] },
        ],
        hard: [
          { type:"fill", q:"Parabol y = ax² đi qua (−3; 18). Tìm a.", answer:"2", sol:["18 = a·(−3)² = 9a.","→ a = 2."] },
          { type:"fill", q:"Quả bóng có độ cao h = −5t² + 20t (m). Độ cao tại t = 2 giây?", answer:"20", sol:["h = −5·4 + 20·2 = −20 + 40 = 20 m."] },
          { type:"mc", q:"Bóng h = −5t² + 20t đạt cao nhất tại t = ? (đỉnh: t = −b/2a)", options:["1 s","2 s","4 s","5 s"], answer:1, sol:["t = −20/(2·−5) = −20/−10 = 2 s."] },
        ]
      },
      flashcards: [
        { front:"Đồ thị hàm số y = ax² là hình gì?", back:"Một đường parabol, đỉnh ở gốc O, đối xứng qua trục tung." },
        { front:"Dấu của a ảnh hưởng thế nào?", back:"a > 0: parabol lõm lên (có điểm thấp nhất). a < 0: lõm xuống (có điểm cao nhất)." },
        { front:"Vì sao y = ax² tăng nhanh?", back:"Vì y tỉ lệ với x²: x gấp đôi thì y gấp bốn." },
        { front:"Trục đối xứng của y = ax²?", back:"Trục tung (đường x = 0)." },
        { front:"Điểm (3; 9) có thuộc y = x² không?", back:"Có, vì 9 = 3². Và (−3; 9) cũng thuộc do đối xứng." },
      ]
    },

    /* --------------------------- HỆ THỨC VI-ÉT ---------------------------- */
    "he-thuc-vi-et": {
      id: "he-thuc-vi-et", chapterId: "chuong-6", title: "Bài 20: Định lí Viète & ứng dụng", emoji: "🤝", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🤝</div><div class="e-body">
            Một phương trình bậc hai ax² + bx + c = 0 (a ≠ 0) thường có <b>hai nghiệm x₁, x₂</b> — như hai người bạn.
            Điều kỳ diệu: <b>chưa cần giải</b>, ta đã biết ngay <b>TỔNG</b> và <b>TÍCH</b> của hai bạn đó!</div></div>
          <p>Đó là <strong>hệ thức Vi-ét</strong>:</p>
          <ul class="bullets">
            <li><strong>Tổng hai nghiệm:</strong> x₁ + x₂ = <b>−b/a</b></li>
            <li><strong>Tích hai nghiệm:</strong> x₁ · x₂ = <b>c/a</b></li>
          </ul>
          <p>Nhờ nó, nhiều khi ta <b>nhẩm</b> được nghiệm: tìm hai số có tổng = −b/a và tích = c/a.
          Ví dụ x² − 5x + 6 = 0: cần hai số tổng 5, tích 6 → đó là <b>2 và 3</b>. Xong, khỏi cần công thức nghiệm!</p>` },
        s2: { type: "svg", svg: SVG.viet, caption: "Hai nghiệm luôn 'tiết lộ' tổng (−b/a) và tích (c/a) của chúng." },
        s3: [
          { ic: "🧮", title: "Nhẩm nghiệm nhanh", html: "x² − 7x + 10 = 0: hai số tổng 7, tích 10 → 2 và 5. Ra nghiệm trong 3 giây." },
          { ic: "🔎", title: "Kiểm tra kết quả", html: "Giải xong, cộng và nhân hai nghiệm để đối chiếu −b/a và c/a — phát hiện sai sót ngay." },
          { ic: "🏗️", title: "Lập phương trình", html: "Biết hai số có tổng S và tích P → chúng là nghiệm của X² − SX + P = 0." },
          { ic: "📐", title: "Bài toán hình", html: "Tìm hai cạnh hình chữ nhật biết chu vi (→ tổng) và diện tích (→ tích)." },
        ],
        s4: { prompt: "Giải thích cho bạn: hệ thức Vi-ét cho biết điều gì, và dùng nó nhẩm nghiệm x² − 5x + 6 = 0 thế nào?",
          keywords: ["tổng", "tích", "−b/a", "c/a", "hai nghiệm", "nhẩm", "2 và 3"],
          sample: "Vi-ét nói rằng với ax²+bx+c=0, tổng hai nghiệm bằng −b/a và tích bằng c/a, dù chưa giải. Với x²−5x+6=0 thì a=1, b=−5, c=6 nên tổng = 5, tích = 6. Tìm hai số tổng 5 và tích 6 là 2 và 3 — đó chính là hai nghiệm." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"x² − 7x + 10 = 0. Tổng hai nghiệm x₁ + x₂ = ?", answer:"7", sol:["Tổng = −b/a = −(−7)/1 = 7."] },
          { type:"fill", q:"x² − 7x + 10 = 0. Tích hai nghiệm x₁ · x₂ = ?", answer:"10", sol:["Tích = c/a = 10/1 = 10."] },
          { type:"mc", q:"x² − 5x + 6 = 0 có hai nghiệm là", options:["1 và 6","2 và 3","−2 và −3","5 và 1"], answer:1, sol:["Hai số tổng 5, tích 6 → 2 và 3."] },
          { type:"fill", q:"x² + 3x − 4 = 0. Tổng hai nghiệm = ?", answer:"−3", accept:["-3"], sol:["Tổng = −b/a = −3/1 = −3."] },
          { type:"fill", q:"x² + 3x − 4 = 0. Tích hai nghiệm = ?", answer:"−4", accept:["-4"], sol:["Tích = c/a = −4/1 = −4."] },
        ],
        medium: [
          { type:"mc", q:"x² − 8x + 15 = 0 có hai nghiệm", options:["3 và 5","2 và 6","1 và 15","−3 và −5"], answer:0, sol:["Tổng 8, tích 15 → 3 và 5."] },
          { type:"fill", q:"2x² − 10x + 8 = 0. Tổng hai nghiệm = ? (−b/a)", answer:"5", sol:["−b/a = −(−10)/2 = 5."] },
          { type:"fill", q:"Hai số có tổng 6, tích 8. Lập phương trình bậc hai (dạng x²−Sx+P=0): điền P", answer:"8", sol:["Phương trình: X² − 6X + 8 = 0 → P = 8."] },
          { type:"mc", q:"x² − 6x + 8 = 0 có hai nghiệm", options:["2 và 4","1 và 8","−2 và −4","3 và 5"], answer:0, sol:["Tổng 6, tích 8 → 2 và 4."] },
        ],
        hard: [
          { type:"fill", q:"x² − 4x + 3 = 0 có nghiệm x₁,x₂. Tính x₁² + x₂² (dùng (x₁+x₂)²−2x₁x₂)", answer:"10", sol:["Tổng=4, tích=3.","x₁²+x₂² = 4² − 2·3 = 16 − 6 = 10."] },
          { type:"fill", q:"Hình chữ nhật chu vi 14, diện tích 12. Tổng hai cạnh = ?", answer:"7", sol:["Nửa chu vi = tổng hai cạnh = 14/2 = 7."] },
          { type:"mc", q:"Hai cạnh đó (tổng 7, tích 12) là", options:["2 và 5","3 và 4","1 và 6","2,5 và 4,5"], answer:1, sol:["Tổng 7, tích 12 → 3 và 4."] },
        ]
      },
      flashcards: [
        { front:"Hệ thức Vi-ét (tổng nghiệm)?", back:"x₁ + x₂ = −b/a" },
        { front:"Hệ thức Vi-ét (tích nghiệm)?", back:"x₁ · x₂ = c/a" },
        { front:"Nhẩm nghiệm x² − 5x + 6 = 0?", back:"Hai số tổng 5, tích 6 → 2 và 3." },
        { front:"Biết tổng S và tích P, lập phương trình?", back:"X² − S·X + P = 0" },
        { front:"x₁² + x₂² tính theo Vi-ét?", back:"= (x₁+x₂)² − 2·x₁x₂" },
      ]
    },

    /* --------------------------- GÓC NỘI TIẾP ----------------------------- */
    "goc-noi-tiep": {
      id: "goc-noi-tiep", chapterId: "chuong-9", title: "Bài 27: Góc nội tiếp", emoji: "🎯", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">👀</div><div class="e-body">
            Đứng ở <b>tâm</b> đường tròn nhìn một cung, em thấy nó "rộng" gấp đôi so với khi đứng ở <b>trên viền</b>
            đường tròn nhìn cùng cung đó. Đó là bí mật của <b>góc nội tiếp</b>.</div></div>
          <p><strong>Góc nội tiếp</strong> là góc có đỉnh nằm <b>trên đường tròn</b>, hai cạnh là hai dây cung. Quy tắc vàng:</p>
          <ul class="bullets">
            <li><strong>Góc nội tiếp = ½ góc ở tâm</strong> cùng chắn một cung. (Góc ở tâm có đỉnh tại tâm O.)</li>
            <li><strong>Cùng chắn một cung thì bằng nhau</strong>: mọi góc nội tiếp nhìn cùng một cung đều có số đo như nhau.</li>
            <li><strong>Góc nội tiếp chắn nửa đường tròn = 90°</strong> (vì góc ở tâm khi đó là 180°). Rất hay dùng!</li>
          </ul>` },
        s2: { type: "svg", svg: SVG.inscribed, caption: "Góc nội tiếp α (đỉnh C) bằng nửa góc ở tâm 2α (đỉnh O) khi cùng chắn cung AB." },
        s3: [
          { ic: "📷", title: "Tầm nhìn camera", html: "Đặt camera trên một cung tròn quanh sân khấu: mọi vị trí trên cung đều thấy sân khấu dưới cùng một góc." },
          { ic: "⚽", title: "Góc sút bóng", html: "Cầu thủ di chuyển trên một cung tròn thì 'góc nhìn' khung thành không đổi — tính bằng góc nội tiếp." },
          { ic: "📐", title: "Dựng góc vuông", html: "Vẽ một điểm trên đường tròn nhìn đường kính → luôn được góc 90° để kiểm tra vuông góc." },
          { ic: "🗺️", title: "Định vị", html: "Biết hai mốc và góc nhìn giữa chúng → vị trí của bạn nằm trên một cung tròn xác định." },
        ],
        s4: { prompt: "Giải thích: góc nội tiếp là gì, quan hệ với góc ở tâm, và vì sao góc nội tiếp chắn nửa đường tròn bằng 90°?",
          keywords: ["đỉnh", "trên đường tròn", "nửa", "góc ở tâm", "cùng chắn", "cung", "90", "đường kính"],
          sample: "Góc nội tiếp là góc có đỉnh nằm trên đường tròn, hai cạnh cắt đường tròn tạo ra một cung. Số đo của nó bằng một nửa góc ở tâm cùng chắn cung đó. Khi góc nội tiếp chắn nửa đường tròn (cạnh đi qua đường kính), góc ở tâm là 180°, nên góc nội tiếp = 180°/2 = 90°." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"Góc ở tâm chắn một cung là 80°. Góc nội tiếp cùng chắn cung đó = ? (độ, chỉ điền số)", answer:"40", sol:["Góc nội tiếp = ½ góc ở tâm = 80/2 = 40°."] },
          { type:"mc", q:"Góc nội tiếp chắn nửa đường tròn bằng", options:["45°","60°","90°","180°"], answer:2, sol:["Góc ở tâm = 180° → nội tiếp = 90°."] },
          { type:"fill", q:"Góc nội tiếp là 30°. Góc ở tâm cùng chắn cung đó = ? (số, độ)", answer:"60", sol:["Góc ở tâm = 2 × nội tiếp = 60°."] },
          { type:"mc", q:"Đỉnh của góc nội tiếp nằm ở", options:["tâm đường tròn","trên đường tròn","ngoài đường tròn","trong đường tròn"], answer:1, sol:["Theo định nghĩa, đỉnh nằm trên đường tròn."] },
          { type:"fill", q:"Hai góc nội tiếp cùng chắn một cung, một góc 35°. Góc kia = ? (số)", answer:"35", sol:["Cùng chắn một cung → bằng nhau = 35°."] },
        ],
        medium: [
          { type:"fill", q:"Góc ở tâm 130°. Góc nội tiếp cùng chắn cung = ? (số)", answer:"65", sol:["= 130/2 = 65°."] },
          { type:"mc", q:"Tam giác nội tiếp đường tròn, một cạnh là đường kính. Tam giác đó", options:["đều","cân","vuông","tù"], answer:2, sol:["Góc nhìn đường kính = 90° → tam giác vuông."] },
          { type:"fill", q:"Góc nội tiếp 50°. Cung bị chắn có số đo = ? (số, độ) — bằng góc ở tâm", answer:"100", sol:["Cung = góc ở tâm = 2×50 = 100°."] },
          { type:"mc", q:"Tứ giác nội tiếp đường tròn có tổng hai góc đối bằng", options:["90°","180°","270°","360°"], answer:1, sol:["Hai góc đối của tứ giác nội tiếp bù nhau = 180°."] },
        ],
        hard: [
          { type:"fill", q:"Tứ giác nội tiếp, một góc 70°. Góc đối diện = ? (số)", answer:"110", sol:["Hai góc đối bù nhau: 180 − 70 = 110°."] },
          { type:"fill", q:"Cung AB = 120°. Góc nội tiếp chắn cung AB = ? (số)", answer:"60", sol:["Nội tiếp = ½ cung = 120/2 = 60°."] },
          { type:"mc", q:"Tam giác ABC nội tiếp, BC là đường kính, góc B = 35°. Góc C = ?", options:["35°","55°","90°","65°"], answer:1, sol:["Góc A = 90° (chắn đường kính).","Góc C = 180 − 90 − 35 = 55°."] },
        ]
      },
      flashcards: [
        { front:"Góc nội tiếp bằng bao nhiêu so với góc ở tâm?", back:"Bằng một nửa góc ở tâm cùng chắn một cung." },
        { front:"Góc nội tiếp chắn nửa đường tròn?", back:"Luôn bằng 90° (góc vuông)." },
        { front:"Hai góc nội tiếp cùng chắn một cung thì?", back:"Bằng nhau." },
        { front:"Đỉnh góc nội tiếp nằm ở đâu?", back:"Trên đường tròn (hai cạnh là dây cung)." },
        { front:"Tổng hai góc đối của tứ giác nội tiếp?", back:"Bằng 180° (bù nhau)." },
      ]
    },

    /* ----------------------- TỈ LỆ VÀNG (HỘI HỌA) ------------------------- */
    "ti-le-vang": {
      id: "ti-le-vang", chapterId: "hoi-hoa", title: "Tỉ lệ vàng trong hội họa", emoji: "🌀", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🎨</div><div class="e-body">
            Có một con số khiến mắt người thấy <b>cân đối, dễ chịu</b> một cách kỳ lạ: <b>φ ≈ 1,618</b>, gọi là
            <b>tỉ lệ vàng</b>. Hoạ sĩ, kiến trúc sư, nhiếp ảnh gia dùng nó để bố cục tác phẩm cho "thuận mắt".</div></div>
          <p>Chia một đoạn thẳng thành phần lớn (a) và phần nhỏ (b) sao cho:
          <b>(cả đoạn)/(phần lớn) = (phần lớn)/(phần nhỏ)</b>. Tỉ số đó luôn ra <strong>φ = (1 + √5)/2 ≈ 1,618</strong>.</p>
          <p>Điều thú vị về Toán 9: φ là <b>nghiệm dương của phương trình bậc hai</b> x² = x + 1 (tức x² − x − 1 = 0),
          và lời giải cần đến <b>căn bậc hai</b> √5. Vẽ đẹp hoá ra cũng là giải phương trình! Một họ hàng của nó là
          <b>quy tắc một phần ba</b> trong nhiếp ảnh (1/3 ≈ gần điểm vàng) để đặt chủ thể.</p>` },
        s2: { type: "svg", svg: SVG.golden, caption: "Hình chữ nhật vàng: tỉ lệ cạnh ≈ 1,618. Cắt liên tục tạo ra đường xoắn ốc vàng." },
        s3: [
          { ic: "🖼️", title: "Bố cục tranh", html: "Đặt chủ thể tại 'điểm vàng' (giao của các đường 1/3) thay vì chính giữa → tranh sống động hơn." },
          { ic: "📐", title: "Hình chữ nhật vàng", html: "Khung tranh, danh thiếp, màn hình thường có tỉ lệ gần 1,618 cho cảm giác hài hoà." },
          { ic: "🏛️", title: "Kiến trúc", html: "Mặt tiền đền Parthenon được cho là khớp nhiều hình chữ nhật vàng lồng nhau." },
          { ic: "🐚", title: "Xoắn ốc trong tự nhiên", html: "Vỏ ốc anh vũ, đài hoa hướng dương xếp theo xoắn ốc liên hệ với dãy Fibonacci → tỉ lệ vàng." },
        ],
        s4: { prompt: "Giải thích cho bạn: tỉ lệ vàng là gì, giá trị khoảng bao nhiêu, và vì sao nó liên quan tới phương trình bậc hai và căn bậc hai?",
          keywords: ["1,618", "phi", "φ", "phần lớn", "phần nhỏ", "căn 5", "√5", "x² = x + 1", "bố cục", "hài hoà"],
          sample: "Tỉ lệ vàng φ ≈ 1,618 là tỉ số khi chia một đoạn sao cho cả đoạn so với phần lớn bằng phần lớn so với phần nhỏ. Hoạ sĩ dùng nó để bố cục cho cân đối. Về toán, φ là nghiệm dương của x² = x + 1, giải bằng công thức nghiệm có chứa √5, nên φ = (1+√5)/2." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Giá trị gần đúng của tỉ lệ vàng φ là", options:["1,414","1,618","2,718","3,14"], answer:1, sol:["φ ≈ 1,618 (1,414 là √2; 3,14 là π)."] },
          { type:"mc", q:"Tỉ lệ vàng được dùng nhiều nhất để", options:["tính diện tích","bố cục cho cân đối, hài hoà","đo nhiệt độ","tính lãi suất"], answer:1, sol:["φ giúp bố cục thuận mắt trong nghệ thuật, thiết kế."] },
          { type:"fill", q:"Khung tranh rộng 100 cm theo tỉ lệ vàng thì cao ≈ ? cm (lấy φ ≈ 1,618, làm tròn số nguyên)", answer:"62", accept:["61","63"], sol:["Cao = 100 / 1,618 ≈ 61,8 → ≈ 62 cm."] },
          { type:"mc", q:"φ là nghiệm dương của phương trình", options:["x² = x + 1","x² = 2","x = 2x","x² = 4"], answer:0, sol:["φ thoả x² = x + 1, tức x² − x − 1 = 0."] },
          { type:"mc", q:"'Quy tắc một phần ba' trong nhiếp ảnh là họ hàng gần của", options:["số π","tỉ lệ vàng","căn bậc ba","số 0"], answer:1, sol:["Đặt chủ thể ở đường 1/3 ≈ gần điểm vàng."] },
        ],
        medium: [
          { type:"fill", q:"Một danh thiếp dài 89 mm, rộng 55 mm. Tỉ số dài/rộng ≈ ? (1 chữ số thập phân)", answer:"1,6", accept:["1.6","1,62"], sol:["89/55 ≈ 1,618 → gần tỉ lệ vàng."] },
          { type:"mc", q:"Hai số Fibonacci liên tiếp 34 và 55 có tỉ số 55/34 ≈", options:["1,5","1,618","2,0","0,618"], answer:1, sol:["55/34 ≈ 1,617 → tiến dần tới φ."] },
          { type:"fill", q:"φ = (1 + √5)/2. Lấy √5 ≈ 2,236, tính φ (2 chữ số thập phân)", answer:"1,62", accept:["1.62","1,618"], sol:["(1 + 2,236)/2 = 3,236/2 = 1,618 ≈ 1,62."] },
          { type:"mc", q:"Đoạn dài 16,18 cm chia theo tỉ lệ vàng: phần lớn ≈", options:["8 cm","10 cm","12 cm","14 cm"], answer:1, sol:["Phần lớn = đoạn / φ = 16,18/1,618 = 10 cm."] },
        ],
        hard: [
          { type:"fill", q:"Giải x² − x − 1 = 0, nghiệm dương ≈ ? (φ, 3 chữ số thập phân, √5≈2,236)", answer:"1,618", accept:["1.618","1,62"], sol:["x = (1 + √5)/2 = (1 + 2,236)/2 ≈ 1,618."] },
          { type:"mc", q:"Tính chất đặc biệt của φ là", options:["φ² = φ + 1","φ² = 2φ","φ = φ + 1","φ² = φ"], answer:0, sol:["Từ x² = x + 1 thay x = φ → φ² = φ + 1."] },
          { type:"fill", q:"Nghịch đảo 1/φ với φ ≈ 1,618 ≈ ? (3 chữ số thập phân)", answer:"0,618", accept:["0.618","0,62"], sol:["1/1,618 ≈ 0,618 — đúng phần thập phân của φ, một nét đẹp của tỉ lệ vàng."] },
        ]
      },
      flashcards: [
        { front:"Tỉ lệ vàng φ ≈ ?", back:"≈ 1,618 = (1 + √5)/2" },
        { front:"φ là nghiệm của phương trình nào?", back:"x² = x + 1 (tức x² − x − 1 = 0)" },
        { front:"Tỉ lệ vàng dùng làm gì trong hội họa?", back:"Bố cục tranh cân đối; đặt chủ thể ở 'điểm vàng' cho thuận mắt." },
        { front:"Hình chữ nhật vàng có tỉ số cạnh?", back:"Dài/rộng ≈ 1,618." },
        { front:"Liên hệ với dãy Fibonacci?", back:"Tỉ số hai số Fibonacci liên tiếp tiến dần tới φ (vd 55/34 ≈ 1,618)." },
      ]
    },

    /* --------------------- PHỐI CẢNH (HỘI HỌA) ---------------------------- */
    "phoi-canh": {
      id: "phoi-canh", chapterId: "hoi-hoa", title: "Phối cảnh & tam giác đồng dạng", emoji: "🛤️", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🛤️</div><div class="e-body">
            Vì sao đường ray tàu hỏa <b>càng xa càng chụm lại</b> dù thực tế chúng song song? Vì mắt ta nhìn vật ở xa thì
            thấy <b>nhỏ hơn</b>. Hoạ sĩ vẽ "thật như mắt thấy" bằng <b>phối cảnh</b> — và bí quyết toán học là
            <b>tam giác đồng dạng</b>.</div></div>
          <p>Vẽ phối cảnh một điểm tụ:</p>
          <ul class="bullets">
            <li>Kẻ một <strong>đường chân trời</strong> và chọn một <strong>điểm tụ</strong> trên đó.</li>
            <li>Mọi đường thực tế song song (mép đường, hàng cây) đều được vẽ <strong>hướng về điểm tụ</strong>.</li>
            <li>Vật càng xa thì vẽ <strong>càng nhỏ theo đúng tỉ lệ</strong> — đây chính là các tam giác đồng dạng:
            kích thước vẽ / khoảng cách giống nhau cho mọi vật.</li>
          </ul>
          <p>Nói cách khác, "thu nhỏ theo khoảng cách" = nhân với một tỉ số — đúng thứ ta học ở <b>tam giác đồng dạng</b>.</p>` },
        s2: { type: "svg", svg: SVG.perspective, caption: "Một điểm tụ trên đường chân trời; vật ở xa được thu nhỏ theo tỉ lệ — các tam giác đồng dạng." },
        s3: [
          { ic: "🌳", title: "Vẽ hàng cây / con đường", html: "Cây gần vẽ cao, cây xa vẽ thấp dần theo cùng một tỉ lệ về điểm tụ." },
          { ic: "🏠", title: "Vẽ căn phòng", html: "Phối cảnh một điểm tụ giúp vẽ sàn, tường, cửa sổ lùi xa đúng cảm giác chiều sâu." },
          { ic: "🎮", title: "Đồ họa game 3D", html: "Máy tính chiếu vật 3D lên màn 2D cũng bằng phép thu tỉ lệ theo khoảng cách (đồng dạng)." },
          { ic: "📏", title: "Đo gián tiếp", html: "Cùng nguyên lý đồng dạng: biết bóng cọc và bóng cây dưới nắng → suy ra chiều cao cây." },
        ],
        s4: { prompt: "Giải thích cho bạn: vì sao trong tranh phối cảnh vật ở xa vẽ nhỏ hơn, và điều đó liên quan tam giác đồng dạng thế nào?",
          keywords: ["điểm tụ", "đường chân trời", "xa", "nhỏ", "tỉ lệ", "đồng dạng", "song song", "thu nhỏ"],
          sample: "Trong tranh phối cảnh, các đường song song được vẽ hướng về một điểm tụ trên đường chân trời, và vật ở xa được vẽ nhỏ hơn. Lý do là mắt thấy vật xa nhỏ đi theo tỉ lệ với khoảng cách — giống các tam giác đồng dạng có các cạnh tương ứng tỉ lệ, nên kích thước vẽ chia cho khoảng cách là một hằng số." }
      },
      exercises: {
        easy: [
          { type:"mc", q:"Trong tranh phối cảnh, các đường song song được vẽ", options:["song song mãi","chụm về một điểm tụ","cắt vuông góc","uốn cong"], answer:1, sol:["Chúng hội tụ về điểm tụ trên đường chân trời."] },
          { type:"mc", q:"Vật ở xa trong tranh được vẽ", options:["to hơn","nhỏ hơn","cùng cỡ","biến mất"], answer:1, sol:["Xa thì thấy nhỏ → vẽ nhỏ hơn."] },
          { type:"mc", q:"Công cụ toán học làm nền cho phối cảnh là", options:["xác suất","tam giác đồng dạng","thống kê","căn bậc ba"], answer:1, sol:["Thu nhỏ theo tỉ lệ chính là đồng dạng."] },
          { type:"fill", q:"Điểm mà mọi đường song song chụm về gọi là điểm gì? (2 từ)", answer:"điểm tụ", accept:["diem tu"], sol:["Đó là điểm tụ trên đường chân trời."] },
          { type:"mc", q:"Đường chân trời trong tranh thường đặt", options:["ngang tầm mắt","ở đáy tranh","ở góc trên","không có"], answer:0, sol:["Đường chân trời đặt ngang tầm mắt người xem."] },
        ],
        medium: [
          { type:"fill", q:"Cây thật cao 4 m ở gần vẽ cao 8 cm. Cây giống hệt ở xa gấp đôi khoảng cách vẽ cao ? cm (đồng dạng)", answer:"4", sol:["Xa gấp đôi → vẽ nhỏ đi một nửa: 8/2 = 4 cm."] },
          { type:"mc", q:"Hai cột vẽ cao 6 cm và 3 cm; cột nhỏ ở", options:["gần hơn","xa hơn","cùng vị trí","ngoài tranh"], answer:1, sol:["Nhỏ hơn nghĩa là ở xa hơn."] },
          { type:"fill", q:"Cọc 1 m có bóng 1,5 m; cây có bóng 12 m cùng lúc. Cây cao ? m (đồng dạng)", answer:"8", sol:["Chiều cao/bóng giống nhau: cây = 12 × (1/1,5) = 8 m."] },
          { type:"mc", q:"Khi camera/người tiến lại gần vật, ảnh của vật", options:["nhỏ đi","to lên","không đổi","đảo ngược"], answer:1, sol:["Gần hơn → góc nhìn lớn hơn → ảnh to lên."] },
        ],
        hard: [
          { type:"fill", q:"Vật cao 2 m cách mắt 5 m, vẽ trên 'màn' cách mắt 0,5 m. Chiều cao vẽ = ? m (đồng dạng: h' = h·d'/d)", answer:"0,2", accept:["0.2"], sol:["h' = 2 × 0,5/5 = 1/5 = 0,2 m."] },
          { type:"fill", q:"Toà nhà cao 30 m, bóng 18 m; cùng lúc cọc bóng 1,2 m. Cọc cao ? m (1 chữ số thập phân)", answer:"2", accept:["2,0","2.0"], sol:["Cọc = 1,2 × 30/18 = 1,2 × 5/3 = 2 m."] },
          { type:"mc", q:"Hai vật giống nhau, vật A vẽ 9 cm, vật B vẽ 3 cm. Khoảng cách B so với A gấp", options:["3 lần","1/3 lần","2 lần","9 lần"], answer:0, sol:["Vẽ nhỏ gấp 3 → ở xa gấp 3 lần."] },
        ]
      },
      flashcards: [
        { front:"Điểm tụ là gì?", back:"Điểm trên đường chân trời mà các đường song song trong thực tế chụm về khi vẽ phối cảnh." },
        { front:"Vì sao vật xa vẽ nhỏ?", back:"Vì mắt thấy vật xa nhỏ theo tỉ lệ với khoảng cách (tam giác đồng dạng)." },
        { front:"Công thức thu nhỏ ảnh (đồng dạng)?", back:"h' = h × d'/d (d' khoảng cách màn, d khoảng cách vật)." },
        { front:"Đường chân trời đặt ở đâu?", back:"Ngang tầm mắt người xem." },
        { front:"Phối cảnh liên hệ chủ đề Toán nào?", back:"Tam giác đồng dạng và tỉ số." },
      ]
    },

    /* ---------------------- ÔN THI VÀO 10 (TỔNG HỢP) ---------------------- */
    "on-thi-tong-hop": {
      id: "on-thi-tong-hop", chapterId: "on-thi", title: "Chiến lược ôn thi & đề tổng hợp", emoji: "🏁", estMinutes: 30,
      feynman: {
        s1: { html: `
          <div class="eli5"><div class="e-ic">🎯</div><div class="e-body">
            Thi cử không phải cuộc đua học thuộc, mà là <b>biết dùng đúng công cụ đúng lúc</b>. Bài này không dạy kiến thức mới —
            nó dạy <b>cách ôn và cách làm bài</b> để điểm cao hơn với cùng lượng hiểu biết.</div></div>
          <p><strong>Chiến lược ôn 4 bước:</strong></p>
          <ul class="bullets">
            <li><strong>Khoanh vùng:</strong> đề Toán 9 thường gồm Đại số (rút gọn căn, hàm số & parabol, phương trình & hệ,
            Vi-ét), Hình học (đường tròn, góc nội tiếp, đồng dạng, hệ thức lượng) và Thống kê – Xác suất.</li>
            <li><strong>Ôn theo dạng, không theo bài:</strong> gom các câu cùng dạng lại làm liền 5–10 câu để 'lên tay'.</li>
            <li><strong>Học từ lỗi sai:</strong> mỗi câu sai, ghi lại 'vì sao sai' — đó là kho báu ôn thi.</li>
            <li><strong>Làm đề bấm giờ:</strong> tập phân bổ thời gian, câu dễ làm trước, câu khó để sau.</li>
          </ul>
          <p><strong>Mẹo phòng thi:</strong> đọc kỹ đề, viết rõ từng bước (được điểm thành phần), và <b>luôn thử lại nghiệm</b>
          (thay vào, dùng Vi-ét để kiểm tra tổng–tích).</p>` },
        s2: { type: "chart", chart: { labels: ["Đại số", "Hình học", "TK–XS"], values: [5, 4, 1], color: "var(--teal-500)" },
          caption: "Phân bố điểm tham khảo của một đề tuyển sinh 10 môn Toán (thang 10): Đại số ~5, Hình học ~4, Thống kê–Xác suất ~1." },
        s3: [
          { ic: "⏱️", title: "Phân bổ thời gian", html: "120 phút: dành ~70% cho câu chắc ăn, để 20–25 phút cuối kiểm tra lại toàn bài." },
          { ic: "✍️", title: "Trình bày ăn điểm", html: "Viết đủ bước: lập luận → công thức → thay số → kết luận. Mỗi bước đúng là một phần điểm." },
          { ic: "🔁", title: "Thử lại nghiệm", html: "Giải phương trình xong, thay nghiệm vào hoặc kiểm tra tổng–tích (Vi-ét) để chắc chắn." },
          { ic: "🧰", title: "Bộ công cụ nhanh", html: "Thuộc lòng: Δ = b²−4ac, x = (−b±√Δ)/2a, Vi-ét, SOH-CAH-TOA, 2πR, πR²." },
        ],
        s4: { prompt: "Tự nhắc lại chiến lược ôn thi của em: ôn theo dạng hay theo bài? làm câu nào trước? và làm gì sau khi ra nghiệm?",
          keywords: ["theo dạng", "câu dễ trước", "bấm giờ", "thử lại", "lỗi sai", "trình bày", "kiểm tra"],
          sample: "Em sẽ ôn theo dạng câu hỏi để lên tay, ghi lại lỗi sai để rút kinh nghiệm, và làm đề có bấm giờ. Trong phòng thi, em làm câu dễ chắc điểm trước, trình bày đủ các bước để được điểm thành phần, và sau khi ra nghiệm thì thử lại bằng cách thay vào hoặc dùng Vi-ét kiểm tra tổng và tích." }
      },
      exercises: {
        easy: [
          { type:"fill", q:"[Căn] Rút gọn √72 về dạng a√2: a = ?", answer:"6", sol:["√72 = √(36·2) = 6√2 → a = 6."] },
          { type:"mc", q:"[Hàm số] Đường y = −2x + 5 có hệ số góc", options:["5","−2","2","−5"], answer:1, sol:["Hệ số góc a = −2."] },
          { type:"fill", q:"[Vi-ét] x² − 9x + 20 = 0, tổng hai nghiệm = ?", answer:"9", sol:["Tổng = −b/a = 9."] },
          { type:"mc", q:"[Đường tròn] Chu vi đường tròn R = 7 (π ≈ 3,14) ≈", options:["21,98","43,96","153,86","14"], answer:1, sol:["C = 2πR = 2·3,14·7 ≈ 43,96."] },
          { type:"fill", q:"[Lượng giác] sin30° = ? (dạng a/b)", answer:"1/2", sol:["sin30° = 1/2."] },
        ],
        medium: [
          { type:"mc", q:"[Phương trình] x² − 6x + 5 = 0 có nghiệm", options:["1 và 5","2 và 3","−1 và −5","5 và 6"], answer:0, sol:["Tổng 6, tích 5 → 1 và 5."] },
          { type:"fill", q:"[Parabol] Điểm (−2; 12) thuộc y = ax². Tìm a.", answer:"3", sol:["12 = a·(−2)² = 4a → a = 3."] },
          { type:"fill", q:"[Góc nội tiếp] Góc ở tâm 110°, góc nội tiếp cùng chắn cung = ? (số)", answer:"55", sol:["= 110/2 = 55°."] },
          { type:"mc", q:"[Hệ pt] x + y = 10, x − y = 2. Khi đó x = ?", options:["4","5","6","8"], answer:2, sol:["Cộng hai pt: 2x = 12 → x = 6."] },
          { type:"fill", q:"[Thống kê] Trung bình của 4, 6, 8, 10, 12 = ?", answer:"8", sol:["Tổng 40 / 5 = 8."] },
        ],
        hard: [
          { type:"fill", q:"[Δ] x² − 4x + 1 = 0 có Δ = b² − 4ac = ?", answer:"12", sol:["Δ = (−4)² − 4·1·1 = 16 − 4 = 12."] },
          { type:"fill", q:"[Hệ thức lượng] Tam giác vuông hai cạnh góc vuông 6 và 8, cạnh huyền = ?", answer:"10", sol:["√(6²+8²) = √100 = 10."] },
          { type:"mc", q:"[Vi-ét nâng cao] x² − 5x + 6 = 0 có nghiệm x₁,x₂. x₁²+x₂² = ?", options:["13","25","11","36"], answer:0, sol:["Tổng 5, tích 6 → 5² − 2·6 = 25 − 12 = 13."] },
          { type:"fill", q:"[Xác suất] Tung 2 xúc xắc, P(tổng = 7) dạng a/b rút gọn?", answer:"1/6", accept:["6/36"], sol:["6 cách / 36 = 1/6."] },
        ]
      },
      flashcards: [
        { front:"Công thức nghiệm phương trình bậc hai?", back:"x = (−b ± √Δ)/(2a), với Δ = b² − 4ac." },
        { front:"Δ cho biết điều gì?", back:"Δ>0: 2 nghiệm; Δ=0: nghiệm kép; Δ<0: vô nghiệm." },
        { front:"Hệ thức Vi-ét?", back:"x₁+x₂ = −b/a; x₁·x₂ = c/a (để nhẩm & thử lại)." },
        { front:"Chu vi & diện tích hình tròn?", back:"C = 2πR; S = πR²." },
        { front:"Mẹo phòng thi quan trọng nhất?", back:"Làm câu dễ chắc điểm trước, trình bày đủ bước, và thử lại nghiệm." },
      ]
    },
  };

  /* ===================================================================== */
  /*  AI MENTOR — cơ sở tri thức (so khớp từ khoá)                          */
  /* ===================================================================== */
  const mentor = [
    { q:["tại sao","học hàm số","hàm số để làm gì","học hàm số làm gì"],
      a:"Hàm số là cách mô tả <b>mối liên hệ giữa hai đại lượng</b> — cứ thứ này thay đổi thì thứ kia thay đổi theo. Em gặp nó mỗi ngày: tiền taxi theo số km, tiền điện theo số kWh, lương theo số giờ làm. Hiểu hàm số là hiểu <b>cách dự đoán</b>: biết đi 12 km thì trả bao nhiêu, dùng 200 số điện thì hết bao nhiêu tiền. Không phải để học thuộc, mà để tính trước cuộc sống! 🚕" },
    { q:["tại sao","phương trình","giải phương trình","phương trình để làm gì"],
      a:"Phương trình giúp em <b>tìm con số chưa biết</b> từ những gì đã biết. Ví dụ: 'Em có 100k, mua 3 cuốn vở hết 60k, còn lại đủ mua mấy cây bút 8k?' → đặt 8x ≤ 40 rồi giải. Chia tiền, tính tuổi, tính giảm giá, pha chế… đều quy về giải phương trình. Nó là 'máy dò ẩn số' của đời sống. 🔍" },
    { q:["hệ phương trình","hai ẩn"],
      a:"Khi có <b>hai điều chưa biết cùng lúc</b>, một manh mối là chưa đủ — em cần hai. Ví dụ mua 2 bút + 1 vở hết 30k, 1 bút + 1 vở hết 20k → lập hệ là ra giá từng món. Pha nước, tính vốn, bài toán chuyển động… rất hay dùng hệ. 🧩" },
    { q:["căn bậc hai","căn"],
      a:"Căn bậc hai là phép <b>đi ngược của bình phương</b>: biết diện tích hình vuông là 25 thì cạnh = √25 = 5. Nó xuất hiện khi tính đường chéo màn hình, khoảng cách, hay trong định lý Pythagoras. Cứ gặp 'bình phương' là sẽ có ngày cần 'căn' để đi ngược lại. 🟩" },
    { q:["tam giác đồng dạng","đồng dạng","đo chiều cao","đo cây"],
      a:"Tam giác đồng dạng = 'cùng hình, khác cỡ'. Sức mạnh lớn nhất: <b>đo vật khổng lồ bằng vật tí hon</b>. Cắm một cái cọc, đo bóng của cọc và bóng của cây dưới cùng ánh nắng → tính ngay chiều cao cây mà không cần trèo. Thợ đo đạc và làm bản đồ sống nhờ nó. 🌳" },
    { q:["lượng giác","sin","cos","tan","tam giác vuông"],
      a:"Sin, cos, tan là 'ba chiếc chìa khoá' mở khoá tam giác vuông: nhớ <b>SOH-CAH-TOA</b> (Sin=Đối/Huyền, Cos=Kề/Huyền, Tan=Đối/Kề). Nhờ chúng, chỉ cần một góc và một khoảng cách là đo được chiều cao toà nhà, độ dốc con đường, hay đặt thang cho an toàn. 📐" },
    { q:["xác suất","khả năng","may rủi"],
      a:"Xác suất đo <b>khả năng một việc xảy ra</b>, từ 0 (không thể) đến 1 (chắc chắn). Khi mọi khả năng như nhau: P = số trường hợp tốt / tổng số trường hợp. Tung xúc xắc ra mặt 5 → 1/6. '70% mưa', tỉ lệ rơi đồ hiếm trong game… đều là xác suất giúp em <b>ra quyết định khôn ngoan hơn</b>. 🎲" },
    { q:["thống kê","trung bình","trung vị","mốt","biểu đồ"],
      a:"Thống kê giúp em <b>kể chuyện từ một đống số</b>. Trung bình = chia đều; trung vị = số ở giữa (công bằng khi có ngoại lệ); mốt = xuất hiện nhiều nhất. Rồi vẽ biểu đồ để nhìn ra xu hướng. Rất hợp để khảo sát lớp, phân tích điểm thi hay doanh số. 📊" },
    { q:["đường tròn","bán kính","chu vi","diện tích tròn"],
      a:"Đường tròn là mọi điểm cách tâm một khoảng = bán kính R. Nhớ hai công thức vàng: <b>chu vi = 2πR</b> và <b>diện tích = πR²</b>. Tính quãng đường bánh xe lăn, chia bánh pizza, vùng phủ sóng… đều nhờ chúng. ⭕" },
    { q:["học toán","ghét toán","khó","chán","sợ toán","học thế nào"],
      a:"Toán khó khi mình cố <b>học thuộc</b>, nhưng dễ thở hẳn khi mình <b>hiểu bản chất</b>. Mẹo Feynman của web này: (1) tự giải thích như cho em bé, (2) gắn vào ví dụ đời thực, (3) làm vài bài, (4) chỗ nào kẹt thì quay lại bước 1. Mỗi ngày 30 phút đều đặn thắng học dồn 5 tiếng một hôm. Em cứ bắt đầu từ bài thấy gần gũi nhất nhé! 💪" },
    { q:["feynman","phương pháp","nhớ lâu"],
      a:"Phương pháp Feynman gồm 4 ý: <b>(1)</b> chọn 1 khái niệm; <b>(2)</b> giải thích nó bằng từ ngữ đơn giản như dạy cho trẻ con; <b>(3)</b> chỗ nào ấp úng tức là chỗ chưa hiểu → quay lại học; <b>(4)</b> dùng ví dụ và hình ảnh đời thực. Khi em <b>dạy lại được</b> thì em đã thật sự hiểu — và hiểu thì nhớ rất lâu. 🧠" },
    { q:["streak","điểm","level","huy hiệu","exp"],
      a:"Mỗi hoạt động (học bước mới, làm đúng bài, tự giải thích, ôn flashcard) đều cho em <b>EXP</b> để lên Level. Học đều mỗi ngày sẽ giữ <b>streak 🔥</b> và mở các <b>huy hiệu</b>. Mục tiêu không phải con số, mà là thói quen 30 phút mỗi ngày — phần thưởng chỉ để vui thôi! ⭐" },
  ];

  const mentorFallback =
    "Câu này hay đấy! Mình mạnh nhất ở các chủ đề Toán 9: <b>hàm số, phương trình, hệ phương trình, căn bậc hai, tam giác đồng dạng, lượng giác, đường tròn, thống kê, xác suất</b>. Em thử hỏi kiểu 'Tại sao phải học hàm số?' hoặc 'Làm sao đo chiều cao cây?' xem nhé. 🙂";

  /* ===== GAME: ĐẤU TRƯỜNG TOÁN HỌC (phần thưởng giải trí sau buổi học) ===== */
  const games = {
    intro:
      "Trả lời nhanh và chính xác để tung đòn! Đáp đúng liên tiếp tạo <b>combo</b> tăng sát thương. Sai hoặc hết giờ, quái sẽ phản công. Hạ cả 3 quái để vô địch Đấu trường! ⚔️",
    opponents: [
      { id: "sen",  name: "Sên Số Học",  emoji: "🐌", hp: 60,  dmg: 10, time: 14, color: "#22c55e",
        taunt: "Chậm mà chắc... cậu chắc chưa?" },
      { id: "cu",   name: "Cú Đại Số",   emoji: "🦉", hp: 95,  dmg: 14, time: 11, color: "#6366f1",
        taunt: "Hàm số với phương trình là sân nhà của ta!" },
      { id: "rong", name: "Rồng Hình Học", emoji: "🐲", hp: 140, dmg: 18, time: 9,  color: "#ef4444",
        taunt: "Vượt qua hình học rồi mới mơ tới ta!" }
    ],
    questions: [
      { q: "√144 = ?", options: ["10", "12", "14", "16"], answer: 1, topic: "Căn bậc hai" },
      { q: "√81 = ?", options: ["7", "8", "9", "11"], answer: 2, topic: "Căn bậc hai" },
      { q: "Điều kiện xác định của √(x − 3) là?", options: ["x ≥ 0", "x ≥ 3", "x > 3", "x ≤ 3"], answer: 1, topic: "Căn bậc hai" },
      { q: "√25 + √16 = ?", options: ["9", "41", "20", "7"], answer: 0, topic: "Căn bậc hai" },
      { q: "Hàm y = 2x + 1, khi x = 3 thì y = ?", options: ["5", "6", "7", "8"], answer: 2, topic: "Hàm số bậc nhất" },
      { q: "Đường thẳng y = ax + b đi lên khi nào?", options: ["a > 0", "a < 0", "a = 0", "b > 0"], answer: 0, topic: "Hàm số bậc nhất" },
      { q: "Hệ số góc của y = −3x + 2 là?", options: ["3", "−3", "2", "−2"], answer: 1, topic: "Hàm số bậc nhất" },
      { q: "y = ax + b cắt trục tung tại tung độ bằng?", options: ["a", "b", "0", "a + b"], answer: 1, topic: "Hàm số bậc nhất" },
      { q: "Parabol y = x² có đỉnh tại điểm nào?", options: ["(0; 0)", "(1; 1)", "(0; 1)", "(1; 0)"], answer: 0, topic: "Hàm số y = ax²" },
      { q: "Với y = x², khi x = −2 thì y = ?", options: ["−4", "4", "2", "−2"], answer: 1, topic: "Hàm số y = ax²" },
      { q: "Parabol y = ax² (a < 0) có bề lõm quay?", options: ["lên trên", "xuống dưới", "sang trái", "sang phải"], answer: 1, topic: "Hàm số y = ax²" },
      { q: "Phương trình x² − 5x + 6 = 0 có nghiệm là?", options: ["1 và 6", "2 và 3", "−2 và −3", "1 và 5"], answer: 1, topic: "PT bậc hai" },
      { q: "Biệt thức Δ của ax² + bx + c bằng?", options: ["b² + 4ac", "b² − 4ac", "b − 4ac", "2b − ac"], answer: 1, topic: "PT bậc hai" },
      { q: "PT bậc hai có 2 nghiệm phân biệt khi?", options: ["Δ > 0", "Δ < 0", "Δ = 0", "Δ ≤ 0"], answer: 0, topic: "PT bậc hai" },
      { q: "Theo Vi-ét, tổng hai nghiệm x₁ + x₂ = ?", options: ["b/a", "−b/a", "c/a", "−c/a"], answer: 1, topic: "Hệ thức Vi-ét" },
      { q: "Theo Vi-ét, tích hai nghiệm x₁·x₂ = ?", options: ["c/a", "−c/a", "b/a", "−b/a"], answer: 0, topic: "Hệ thức Vi-ét" },
      { q: "x² − 7x + 10 = 0: tổng hai nghiệm = ?", options: ["7", "−7", "10", "−10"], answer: 0, topic: "Hệ thức Vi-ét" },
      { q: "x² − 7x + 10 = 0: tích hai nghiệm = ?", options: ["7", "10", "−10", "3"], answer: 1, topic: "Hệ thức Vi-ét" },
      { q: "Hệ {x + y = 5; x − y = 1} có x = ?", options: ["2", "3", "4", "5"], answer: 1, topic: "Hệ phương trình" },
      { q: "Tam giác vuông cạnh góc vuông 3 và 4, cạnh huyền = ?", options: ["5", "6", "7", "12"], answer: 0, topic: "Hệ thức lượng" },
      { q: "sin của một góc nhọn = cạnh đối chia cho?", options: ["cạnh huyền", "cạnh kề", "cạnh đối", "chu vi"], answer: 0, topic: "Lượng giác" },
      { q: "cos 60° = ?", options: ["1/2", "√3/2", "1", "√2/2"], answer: 0, topic: "Lượng giác" },
      { q: "sin 30° = ?", options: ["1/2", "√3/2", "1", "0"], answer: 0, topic: "Lượng giác" },
      { q: "tan 45° = ?", options: ["0", "1", "√3", "1/2"], answer: 1, topic: "Lượng giác" },
      { q: "Chu vi đường tròn bán kính R bằng?", options: ["πR", "2πR", "πR²", "2πR²"], answer: 1, topic: "Đường tròn" },
      { q: "Diện tích hình tròn bán kính R bằng?", options: ["2πR", "πR²", "πR", "2πR²"], answer: 1, topic: "Đường tròn" },
      { q: "Góc nội tiếp chắn nửa đường tròn bằng?", options: ["45°", "60°", "90°", "180°"], answer: 2, topic: "Góc nội tiếp" },
      { q: "Góc nội tiếp bằng bao nhiêu góc ở tâm cùng chắn một cung?", options: ["bằng", "gấp đôi", "một nửa", "gấp ba"], answer: 2, topic: "Góc nội tiếp" },
      { q: "Tỉ lệ vàng φ xấp xỉ bằng?", options: ["1,414", "1,618", "3,14", "2,718"], answer: 1, topic: "Tỉ lệ vàng" },
      { q: "Tung một con xúc xắc, P(ra mặt 6) = ?", options: ["1/2", "1/3", "1/6", "1/12"], answer: 2, topic: "Xác suất" },
      { q: "Trung bình cộng của 4, 6, 8 bằng?", options: ["5", "6", "7", "8"], answer: 1, topic: "Thống kê" },
      { q: "Số nào là bội của cả 2 và 3?", options: ["8", "9", "6", "10"], answer: 2, topic: "Số học" }
    ]
  };

  /* ===== LUYỆN TẬP THEO SGK — KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (TOÁN 9 — TẬP 1) ===== */
  const practice = {
    intro: "Bộ bài tập bám sát SGK Toán 9 — Kết nối tri thức với cuộc sống (Tập 1), theo từng bài của 5 chương. Mỗi bộ có lời giải; điểm cao nhất được lưu lại.",
    source: "Kết nối tri thức với cuộc sống — Tập 1",
    weeks: [
      /* ---------------- CHƯƠNG I ---------------- */
      { id: "c1b1", term: "Chương I · Phương trình & hệ hai phương trình bậc nhất hai ẩn", tag: "Bài 1", emoji: "🔗", title: "Khái niệm phương trình & hệ bậc nhất hai ẩn", questions: [
        { type:"mc", q:"Phương trình nào là phương trình bậc nhất hai ẩn?", options:["x² + y = 1","2x − 3y = 5","xy = 4","x = 0"], answer:1, sol:["Dạng ax + by = c với a, b không đồng thời bằng 0."] },
        { type:"mc", q:"Cặp (1; 2) có là nghiệm của 2x + y = 4 không?", options:["Có","Không","Không xác định","Thiếu dữ kiện"], answer:0, sol:["2·1 + 2 = 4 → đúng."] },
        { type:"fill", q:"Cho 3x − y = 5. Khi x = 2 thì y = ?", answer:"1", sol:["3·2 − y = 5 → y = 1."] },
        { type:"mc", q:"Một phương trình bậc nhất hai ẩn có bao nhiêu nghiệm?", options:["1","2","vô số","không có"], answer:2, sol:["Vô số nghiệm, biểu diễn bởi một đường thẳng."] },
        { type:"fill", q:"Cặp (0; y) là nghiệm của x + 2y = 6. Khi đó y = ?", answer:"3", sol:["0 + 2y = 6 → y = 3."] },
        { type:"mc", q:"Hệ hai phương trình bậc nhất hai ẩn gồm", options:["một PT bậc nhất","hai PT bậc nhất hai ẩn","một PT bậc hai","hai PT bậc hai"], answer:1, sol:["Là hệ gồm hai phương trình bậc nhất hai ẩn."] },
        { type:"mc", q:"Nghiệm của hệ là cặp (x; y)", options:["nghiệm của ít nhất một PT","nghiệm của cả hai PT","nghiệm của PT đầu","tuỳ ý"], answer:1, sol:["Phải thoả mãn đồng thời cả hai phương trình."] },
      ]},
      { id: "c1b2", term: "Chương I · Phương trình & hệ hai phương trình bậc nhất hai ẩn", tag: "Bài 2", emoji: "🟰", title: "Giải hệ (phương pháp thế & cộng đại số)", questions: [
        { type:"mc", q:"Hệ {x + y = 5; x − y = 1} có nghiệm", options:["(3; 2)","(2; 3)","(4; 1)","(1; 4)"], answer:0, sol:["Cộng hai PT: 2x = 6 → x = 3; y = 2."] },
        { type:"fill", q:"Hệ {x + y = 10; x − y = 2}. x = ?", answer:"6", sol:["Cộng: 2x = 12 → x = 6."] },
        { type:"fill", q:"Hệ {x + y = 10; x − y = 2}. y = ?", answer:"4", sol:["x = 6 → y = 4."] },
        { type:"mc", q:"Hệ {2x + y = 7; x = 2} có y =", options:["3","5","7","2"], answer:0, sol:["Thế x = 2: 4 + y = 7 → y = 3."] },
        { type:"fill", q:"Hệ {x + 2y = 8; x = 2}. y = ?", answer:"3", sol:["2 + 2y = 8 → y = 3."] },
        { type:"mc", q:"Hệ {2x + 3y = 12; 2x + y = 8}, trừ hai PT được", options:["2y = 4","2y = 20","4y = 4","y = 20"], answer:0, sol:["(2x+3y) − (2x+y) = 12 − 8 → 2y = 4."] },
        { type:"fill", q:"Hệ {2x + 3y = 12; 2x + y = 8}. y = ?", answer:"2", sol:["2y = 4 → y = 2."] },
      ]},
      { id: "c1b3", term: "Chương I · Phương trình & hệ hai phương trình bậc nhất hai ẩn", tag: "Bài 3", emoji: "🧩", title: "Giải bài toán bằng cách lập hệ phương trình", questions: [
        { type:"fill", q:"Tổng hai số là 20, hiệu là 4. Số lớn = ?", answer:"12", sol:["x + y = 20; x − y = 4 → x = 12."] },
        { type:"fill", q:"(tiếp) Số nhỏ = ?", answer:"8", sol:["y = 20 − 12 = 8."] },
        { type:"mc", q:"Sân chữ nhật nửa chu vi 15 m, dài hơn rộng 5 m. Hệ đúng là", options:["{x+y=15; x−y=5}","{x+y=30; x−y=5}","{2(x+y)=15; xy=5}","{x+y=15; xy=5}"], answer:0, sol:["x + y = 15 và x − y = 5."] },
        { type:"fill", q:"(tiếp) Chiều dài = ? m", answer:"10", sol:["x + y = 15; x − y = 5 → x = 10."] },
        { type:"fill", q:"3 bút + 2 vở giá 32 nghìn; 1 bút + 1 vở giá 13 nghìn. Giá 1 bút = ? nghìn", answer:"6", sol:["b + v = 13 → v = 13 − b; 3b + 2(13 − b) = 32 → b = 6."] },
        { type:"fill", q:"(tiếp) Giá 1 vở = ? nghìn", answer:"7", sol:["v = 13 − 6 = 7."] },
        { type:"mc", q:"Bài toán hai vòi cùng chảy thường lập hệ dựa trên", options:["tổng năng suất mỗi giờ","tổng thời gian","hiệu thể tích","tích thời gian"], answer:0, sol:["Cộng năng suất (phần bể mỗi giờ) của hai vòi."] },
      ]},
      /* ---------------- CHƯƠNG II ---------------- */
      { id: "c2b4", term: "Chương II · Phương trình & bất phương trình bậc nhất một ẩn", tag: "Bài 4", emoji: "✖️", title: "Phương trình tích & phương trình chứa ẩn ở mẫu", questions: [
        { type:"mc", q:"Phương trình (x − 2)(x + 3) = 0 có nghiệm", options:["2 và −3","−2 và 3","2 và 3","−2 và −3"], answer:0, sol:["Cho từng nhân tử bằng 0."] },
        { type:"fill", q:"(x − 5)(x + 1) = 0, nghiệm dương = ?", answer:"5", sol:["x = 5 hoặc x = −1."] },
        { type:"mc", q:"Điều kiện xác định của 3/(x − 2) = 1 là", options:["x ≠ 0","x ≠ 2","x ≠ 3","x ≠ 1"], answer:1, sol:["Mẫu thức khác 0."] },
        { type:"mc", q:"Phương trình x/(x − 1) = 2 (x ≠ 1) có nghiệm", options:["x = 2","x = 1","x = −2","vô nghiệm"], answer:0, sol:["x = 2(x − 1) → x = 2."] },
        { type:"fill", q:"2x(x − 4) = 0, nghiệm dương = ?", answer:"4", sol:["x = 0 hoặc x = 4."] },
        { type:"fill", q:"1/x = 1/2 (x ≠ 0). x = ?", answer:"2", sol:["x = 2."] },
        { type:"mc", q:"(x + 4)(2x − 6) = 0 có nghiệm", options:["−4 và 3","4 và −3","−4 và −3","4 và 3"], answer:0, sol:["x = −4 hoặc 2x − 6 = 0 → x = 3."] },
      ]},
      { id: "c2b5", term: "Chương II · Phương trình & bất phương trình bậc nhất một ẩn", tag: "Bài 5", emoji: "⚖️", title: "Bất đẳng thức và tính chất", questions: [
        { type:"mc", q:"Nếu a > b thì a + c và b + c:", options:["a + c > b + c","a + c < b + c","bằng nhau","tuỳ c"], answer:0, sol:["Cộng cùng một số giữ nguyên chiều."] },
        { type:"mc", q:"Nếu a > b và c > 0 thì", options:["ac > bc","ac < bc","ac = bc","không xác định"], answer:0, sol:["Nhân số dương giữ nguyên chiều."] },
        { type:"mc", q:"Nếu a > b và c < 0 thì", options:["ac > bc","ac < bc","ac = bc","không đổi"], answer:1, sol:["Nhân số âm ĐỔI chiều bất đẳng thức."] },
        { type:"mc", q:"Từ 3 > 2, nhân hai vế với −1 được", options:["−3 > −2","−3 < −2","−3 = −2","3 < 2"], answer:1, sol:["Đổi chiều: −3 < −2."] },
        { type:"mc", q:"Tính chất bắc cầu: a > b và b > c thì", options:["a > c","a < c","a = c","không suy ra được"], answer:0, sol:["Suy ra a > c."] },
        { type:"mc", q:"Nếu a ≥ b thì a − 5 và b − 5:", options:["a − 5 ≥ b − 5","a − 5 ≤ b − 5","bằng nhau","a − 5 > b − 5"], answer:0, sol:["Trừ cùng một số giữ nguyên chiều."] },
        { type:"mc", q:"Bất đẳng thức nào ĐÚNG?", options:["−3 > −1","0 > −2","2 < −5","−4 > 4"], answer:1, sol:["0 lớn hơn −2."] },
      ]},
      { id: "c2b6", term: "Chương II · Phương trình & bất phương trình bậc nhất một ẩn", tag: "Bài 6", emoji: "📉", title: "Bất phương trình bậc nhất một ẩn", questions: [
        { type:"mc", q:"Nghiệm của x + 3 > 5 là", options:["x > 2","x < 2","x > 8","x < 8"], answer:0, sol:["x > 2."] },
        { type:"mc", q:"Nghiệm của 2x ≤ 6 là", options:["x ≤ 3","x ≥ 3","x ≤ 12","x < 3"], answer:0, sol:["Chia 2: x ≤ 3."] },
        { type:"mc", q:"Nghiệm của −x > 2 là", options:["x > −2","x < −2","x > 2","x < 2"], answer:1, sol:["Nhân −1, đổi chiều: x < −2."] },
        { type:"fill", q:"Giải 3x − 6 ≥ 0: x ≥ ?", answer:"2", sol:["3x ≥ 6 → x ≥ 2."] },
        { type:"mc", q:"Nghiệm của −2x < 8 là", options:["x > −4","x < −4","x > 4","x < 4"], answer:0, sol:["Chia −2, đổi chiều: x > −4."] },
        { type:"fill", q:"x − 5 < 0 ⇔ x < ?", answer:"5", sol:["x < 5."] },
        { type:"mc", q:"x = 3 có là nghiệm của 2x − 1 > 4?", options:["Có","Không","Bằng","Không xác định"], answer:0, sol:["2·3 − 1 = 5 > 4 → đúng."] },
      ]},
      /* ---------------- CHƯƠNG III ---------------- */
      { id: "c3b7", term: "Chương III · Căn bậc hai và căn bậc ba", tag: "Bài 7", emoji: "√", title: "Căn bậc hai và căn thức bậc hai", questions: [
        { type:"fill", q:"Tính √49", answer:"7", sol:["7² = 49."] },
        { type:"mc", q:"√(−9) trong tập số thực", options:["3","−3","không tồn tại","9"], answer:2, sol:["Số âm không có căn bậc hai thực."] },
        { type:"fill", q:"Điều kiện xác định của √(x − 3): x ≥ ?", answer:"3", sol:["x − 3 ≥ 0 → x ≥ 3."] },
        { type:"fill", q:"Tính √16 + √9", answer:"7", sol:["4 + 3 = 7."] },
        { type:"mc", q:"√(a²) bằng", options:["a","−a","|a|","a²"], answer:2, sol:["√(a²) = |a|."] },
        { type:"fill", q:"Điều kiện xác định của √(2x): x ≥ ?", answer:"0", sol:["2x ≥ 0 → x ≥ 0."] },
        { type:"fill", q:"Hình vuông diện tích 36, cạnh = ?", answer:"6", sol:["√36 = 6."] },
      ]},
      { id: "c3b8", term: "Chương III · Căn bậc hai và căn bậc ba", tag: "Bài 8", emoji: "✳️", title: "Khai căn bậc hai với phép nhân và phép chia", questions: [
        { type:"fill", q:"Tính √(4 · 25)", answer:"10", sol:["√4 · √25 = 2 · 5 = 10."] },
        { type:"mc", q:"√50 bằng", options:["5√2","2√5","25√2","10"], answer:0, sol:["50 = 25·2 → 5√2."] },
        { type:"fill", q:"Tính √(36 ÷ 4)", answer:"3", sol:["√36 / √4 = 6/2 = 3."] },
        { type:"mc", q:"√2 · √8 bằng", options:["4","√10","2√2","16"], answer:0, sol:["√(2·8) = √16 = 4."] },
        { type:"fill", q:"Tính √72 ÷ √2", answer:"6", sol:["√(72/2) = √36 = 6."] },
        { type:"mc", q:"√18 bằng", options:["3√2","2√3","9√2","6"], answer:0, sol:["18 = 9·2 → 3√2."] },
        { type:"fill", q:"Tính √(9 · 16)", answer:"12", sol:["3 · 4 = 12."] },
      ]},
      { id: "c3b9", term: "Chương III · Căn bậc hai và căn bậc ba", tag: "Bài 9", emoji: "🧮", title: "Biến đổi & rút gọn biểu thức chứa căn", questions: [
        { type:"mc", q:"Đưa thừa số ra ngoài: √75 =", options:["5√3","3√5","25√3","15"], answer:0, sol:["75 = 25·3 → 5√3."] },
        { type:"fill", q:"2√3 + 5√3 = a√3. a = ?", answer:"7", sol:["(2 + 5)√3 = 7√3."] },
        { type:"mc", q:"Trục căn thức 6/√2 =", options:["3√2","6√2","√3","2√3"], answer:0, sol:["6/√2 = 6√2/2 = 3√2."] },
        { type:"fill", q:"√48 = a√3. a = ?", answer:"4", sol:["48 = 16·3 → 4√3."] },
        { type:"mc", q:"Rút gọn √12 + √27", options:["5√3","√39","6√3","2√6"], answer:0, sol:["2√3 + 3√3 = 5√3."] },
        { type:"fill", q:"Trục căn thức 1/√5 = (√5)/b. b = ?", answer:"5", sol:["1/√5 = √5/5."] },
        { type:"mc", q:"Rút gọn √50 − √8", options:["3√2","√42","7√2","2√2"], answer:0, sol:["5√2 − 2√2 = 3√2."] },
      ]},
      { id: "c3b10", term: "Chương III · Căn bậc hai và căn bậc ba", tag: "Bài 10", emoji: "🧊", title: "Căn bậc ba và căn thức bậc ba", questions: [
        { type:"fill", q:"Căn bậc ba của 27 = ?", answer:"3", sol:["3³ = 27."] },
        { type:"fill", q:"Căn bậc ba của 64 = ?", answer:"4", sol:["4³ = 64."] },
        { type:"mc", q:"Căn bậc ba của −8 bằng", options:["2","−2","không tồn tại","4"], answer:1, sol:["(−2)³ = −8; số âm CÓ căn bậc ba."] },
        { type:"fill", q:"Căn bậc ba của 1000 = ?", answer:"10", sol:["10³ = 1000."] },
        { type:"mc", q:"Căn bậc ba của 125 bằng", options:["5","25","15","625"], answer:0, sol:["5³ = 125."] },
        { type:"fill", q:"Căn bậc ba của 0 = ?", answer:"0", sol:["0³ = 0."] },
        { type:"mc", q:"Điểm khác căn bậc hai: căn bậc ba của số âm", options:["vẫn tồn tại","không tính được","luôn dương","chỉ với số chẵn"], answer:0, sol:["Mọi số thực đều có căn bậc ba."] },
      ]},
      /* ---------------- CHƯƠNG IV ---------------- */
      { id: "c4b11", term: "Chương IV · Hệ thức lượng trong tam giác vuông", tag: "Bài 11", emoji: "📐", title: "Tỉ số lượng giác của góc nhọn", questions: [
        { type:"mc", q:"sin α bằng", options:["đối/huyền","kề/huyền","đối/kề","huyền/kề"], answer:0, sol:["SOH: sin = Đối/Huyền."] },
        { type:"mc", q:"cos α bằng", options:["đối/huyền","kề/huyền","đối/kề","kề/đối"], answer:1, sol:["CAH: cos = Kề/Huyền."] },
        { type:"mc", q:"tan α bằng", options:["đối/kề","kề/đối","đối/huyền","kề/huyền"], answer:0, sol:["TOA: tan = Đối/Kề."] },
        { type:"fill", q:"sin 30° = ? (dạng a/b)", answer:"1/2", sol:["sin 30° = 1/2."] },
        { type:"mc", q:"cos 60° bằng", options:["1/2","√3/2","√2/2","1"], answer:0, sol:["cos 60° = 1/2."] },
        { type:"mc", q:"tan 45° bằng", options:["1","0","√3","1/2"], answer:0, sol:["tan 45° = 1."] },
        { type:"mc", q:"Hai góc phụ nhau (α + β = 90°): sin α =", options:["cos β","sin β","tan β","cos α"], answer:0, sol:["sin α = cos(90° − α) = cos β."] },
      ]},
      { id: "c4b12", term: "Chương IV · Hệ thức lượng trong tam giác vuông", tag: "Bài 12", emoji: "📏", title: "Hệ thức cạnh–góc & giải tam giác vuông", questions: [
        { type:"fill", q:"Tam giác vuông hai cạnh góc vuông 3 và 4, cạnh huyền = ?", answer:"5", sol:["√(3² + 4²) = 5."] },
        { type:"fill", q:"Cạnh huyền 10, một cạnh góc vuông 6, cạnh kia = ?", answer:"8", sol:["√(10² − 6²) = √64 = 8."] },
        { type:"mc", q:"Cạnh góc vuông b = a · ? (a là cạnh huyền, B là góc đối b)", options:["sin B","cos B","tan B","1/sin B"], answer:0, sol:["b = a·sin B."] },
        { type:"fill", q:"Cạnh huyền 10, góc nhọn 30°. Cạnh đối = 10·sin30° = ?", answer:"5", sol:["10 · 1/2 = 5."] },
        { type:"mc", q:"Thang 6 m nghiêng 60° với mặt đất. Chiều cao chạm tường = 6·sin60° ≈", options:["5,2","3","6","4"], answer:0, sol:["6 · 0,866 ≈ 5,2 m."] },
        { type:"fill", q:"Tam giác vuông hai cạnh 5 và 12, cạnh huyền = ?", answer:"13", sol:["√(25 + 144) = 13."] },
        { type:"mc", q:"Để 'giải tam giác vuông' cần biết tối thiểu", options:["một cạnh và một góc nhọn (hoặc hai cạnh)","ba góc","chỉ một góc","không cần gì"], answer:0, sol:["Cần hai yếu tố trong đó có ít nhất một cạnh."] },
      ]},
      /* ---------------- CHƯƠNG V ---------------- */
      { id: "c5b13", term: "Chương V · Đường tròn", tag: "Bài 13", emoji: "⭕", title: "Mở đầu về đường tròn", questions: [
        { type:"mc", q:"Đường tròn (O; R) gồm các điểm", options:["cách O đúng bằng R","cách O nhỏ hơn R","nằm trong O","bất kì"], answer:0, sol:["Tập hợp các điểm cách tâm O một khoảng R."] },
        { type:"mc", q:"Điểm M có OM = 4, R = 5. M nằm", options:["trên đường tròn","trong đường tròn","ngoài đường tròn","là tâm"], answer:1, sol:["OM < R → bên trong."] },
        { type:"mc", q:"Điểm có khoảng cách tới O bằng 6, R = 5. Nằm", options:["trên","trong","ngoài","là tâm"], answer:2, sol:["OM > R → bên ngoài."] },
        { type:"mc", q:"Đường kính bằng", options:["bán kính","2 lần bán kính","nửa bán kính","π lần bán kính"], answer:1, sol:["d = 2R."] },
        { type:"mc", q:"Đường tròn có bao nhiêu trục đối xứng?", options:["1","2","vô số","0"], answer:2, sol:["Mỗi đường kính là một trục đối xứng → vô số."] },
        { type:"mc", q:"Tâm đối xứng của đường tròn là", options:["một điểm trên đường tròn","tâm O","không có","đường kính"], answer:1, sol:["Tâm O là tâm đối xứng."] },
        { type:"fill", q:"Bán kính R = 5 thì đường kính = ?", answer:"10", sol:["d = 2·5 = 10."] },
      ]},
      { id: "c5b14", term: "Chương V · Đường tròn", tag: "Bài 14", emoji: "🌙", title: "Cung và dây của một đường tròn", questions: [
        { type:"mc", q:"Dây cung là", options:["đoạn nối hai điểm trên đường tròn","một cung tròn","bán kính","tiếp tuyến"], answer:0, sol:["Đoạn thẳng nối hai điểm thuộc đường tròn."] },
        { type:"mc", q:"Dây lớn nhất của đường tròn là", options:["bán kính","đường kính","tiếp tuyến","cung"], answer:1, sol:["Đường kính là dây dài nhất."] },
        { type:"mc", q:"Góc ở tâm là góc có đỉnh", options:["trên đường tròn","trùng với tâm O","ngoài đường tròn","bất kì"], answer:1, sol:["Đỉnh trùng tâm O."] },
        { type:"fill", q:"Góc ở tâm chắn một cung có số đo 70°. Số đo cung đó = ? (độ)", answer:"70", sol:["Số đo cung nhỏ = số đo góc ở tâm."] },
        { type:"mc", q:"Cả đường tròn ứng với góc ở tâm", options:["90°","180°","360°","270°"], answer:2, sol:["Toàn bộ đường tròn = 360°."] },
        { type:"fill", q:"Cung nửa đường tròn có số đo = ? (độ)", answer:"180", sol:["Nửa đường tròn = 180°."] },
        { type:"mc", q:"Trong một đường tròn, hai dây bằng nhau thì", options:["cách đều tâm","khác khoảng cách","dây nào lớn gần tâm hơn","không liên quan"], answer:0, sol:["Hai dây bằng nhau thì cách đều tâm."] },
      ]},
      { id: "c5b15", term: "Chương V · Đường tròn", tag: "Bài 15", emoji: "🍕", title: "Độ dài cung, diện tích hình quạt & vành khuyên", questions: [
        { type:"mc", q:"Độ dài đường tròn C =", options:["πR","2πR","πR²","πd/2"], answer:1, sol:["C = 2πR."] },
        { type:"fill", q:"R = 5, độ dài đường tròn (π ≈ 3,14) = ?", answer:"31,4", accept:["31.4"], sol:["2·3,14·5 = 31,4."] },
        { type:"mc", q:"Diện tích hình tròn S =", options:["2πR","πR²","πR","2πR²"], answer:1, sol:["S = πR²."] },
        { type:"fill", q:"R = 10, diện tích (π ≈ 3,14) = ?", answer:"314", sol:["3,14·100 = 314."] },
        { type:"fill", q:"Độ dài cung 90° của đường tròn R = 4 (π ≈ 3,14) = ?", answer:"6,28", accept:["6.28"], sol:["¼ · 2·3,14·4 = 6,28."] },
        { type:"fill", q:"Diện tích hình quạt 90°, R = 4 (π ≈ 3,14) = ?", answer:"12,56", accept:["12.56"], sol:["¼ · 3,14·16 = 12,56."] },
        { type:"mc", q:"Hình vành khuyên là phần nằm giữa", options:["hai đường tròn đồng tâm","hai cung","tâm và một cung","hai bán kính"], answer:0, sol:["Phần giữa hai đường tròn đồng tâm."] },
      ]},
      { id: "c5b16", term: "Chương V · Đường tròn", tag: "Bài 16–17", emoji: "🤝", title: "Vị trí tương đối: đường thẳng–đường tròn & hai đường tròn", questions: [
        { type:"mc", q:"Đường thẳng cắt đường tròn khi số điểm chung là", options:["0","1","2","vô số"], answer:2, sol:["Cắt nhau → 2 điểm chung."] },
        { type:"mc", q:"Tiếp tuyến có với đường tròn", options:["0 điểm chung","1 điểm chung","2 điểm chung","vô số"], answer:1, sol:["Đúng 1 điểm chung (tiếp điểm)."] },
        { type:"mc", q:"Khoảng cách d từ tâm tới đường thẳng khi tiếp xúc thoả", options:["d < R","d = R","d > R","d = 0"], answer:1, sol:["Tiếp xúc ⇔ d = R."] },
        { type:"mc", q:"Tiếp tuyến tại tiếp điểm thì với bán kính đi qua điểm đó", options:["song song","vuông góc","trùng nhau","tạo góc 45°"], answer:1, sol:["Tiếp tuyến ⊥ bán kính tại tiếp điểm."] },
        { type:"mc", q:"Hai đường tròn cắt nhau có số điểm chung", options:["0","1","2","3"], answer:2, sol:["Cắt nhau → 2 điểm chung."] },
        { type:"mc", q:"Hai đường tròn tiếp xúc nhau có số điểm chung", options:["0","1","2","vô số"], answer:1, sol:["Tiếp xúc → đúng 1 điểm chung."] },
        { type:"mc", q:"Hai đường tròn không giao nhau có số điểm chung", options:["0","1","2","3"], answer:0, sol:["Không giao nhau → 0 điểm chung."] },
      ]},
      /* ---------------- CHƯƠNG VI ---------------- */
      { id: "c6b18", term: "Chương VI · Hàm số y = ax² & Phương trình bậc hai", tag: "Bài 18", emoji: "🅿️", title: "Hàm số y = ax² (a ≠ 0)", questions: [
        { type:"fill", q:"Cho y = x². Khi x = 5 thì y = ?", answer:"25", sol:["5² = 25."] },
        { type:"mc", q:"Parabol y = 2x² có bề lõm hướng", options:["lên","xuống","trái","phải"], answer:0, sol:["a = 2 > 0 → lõm lên."] },
        { type:"fill", q:"Điểm (3; 18) thuộc y = ax². Tìm a.", answer:"2", sol:["18 = a·9 → a = 2."] },
        { type:"mc", q:"Parabol y = −x² có", options:["điểm thấp nhất","điểm cao nhất","không có đỉnh","hai đỉnh"], answer:1, sol:["a < 0 → có điểm cao nhất."] },
        { type:"fill", q:"Cho y = −2x². Khi x = 2 thì y = ?", answer:"−8", sol:["−2·4 = −8."] },
        { type:"mc", q:"Trục đối xứng của parabol y = ax² là", options:["trục hoành","trục tung","đường y = x","x = 1"], answer:1, sol:["Đối xứng qua trục tung."] },
        { type:"mc", q:"Điểm nào KHÔNG thuộc y = x²?", options:["(2; 4)","(−2; 4)","(3; 9)","(2; 8)"], answer:3, sol:["2² = 4 ≠ 8."] },
      ]},
      { id: "c6b19", term: "Chương VI · Hàm số y = ax² & Phương trình bậc hai", tag: "Bài 19", emoji: "🟰", title: "Phương trình bậc hai một ẩn", questions: [
        { type:"fill", q:"Δ của x² − 5x + 6 (b² − 4ac) = ?", answer:"1", sol:["25 − 24 = 1."] },
        { type:"mc", q:"x² − 5x + 6 = 0 có nghiệm", options:["2 và 3","1 và 6","−2 và −3","5 và 6"], answer:0, sol:["Tổng 5, tích 6 → 2 và 3."] },
        { type:"fill", q:"x² − 4 = 0, nghiệm dương = ?", answer:"2", sol:["x = ±2."] },
        { type:"mc", q:"Khi Δ < 0, phương trình bậc hai", options:["có 2 nghiệm","nghiệm kép","vô nghiệm","vô số nghiệm"], answer:2, sol:["Δ < 0 → vô nghiệm thực."] },
        { type:"fill", q:"x² − 6x + 9 = 0 có nghiệm kép x = ?", answer:"3", sol:["(x − 3)² = 0."] },
        { type:"mc", q:"x² + x − 6 = 0 có nghiệm", options:["2 và −3","−2 và 3","1 và 6","2 và 3"], answer:0, sol:["Tổng −1, tích −6 → 2 và −3."] },
      ]},
      { id: "c6b20", term: "Chương VI · Hàm số y = ax² & Phương trình bậc hai", tag: "Bài 20", emoji: "🤝", title: "Định lí Viète và ứng dụng", questions: [
        { type:"fill", q:"x² − 7x + 12 = 0. Tổng hai nghiệm = ?", answer:"7", sol:["−b/a = 7."] },
        { type:"fill", q:"x² − 7x + 12 = 0. Tích hai nghiệm = ?", answer:"12", sol:["c/a = 12."] },
        { type:"mc", q:"x² − 7x + 12 = 0 có nghiệm", options:["3 và 4","2 và 6","1 và 12","5 và 2"], answer:0, sol:["Tổng 7, tích 12 → 3 và 4."] },
        { type:"fill", q:"x² + 5x + 6 = 0. Tổng hai nghiệm = ?", answer:"−5", sol:["−b/a = −5."] },
        { type:"mc", q:"Hai số có tổng 9, tích 20 là", options:["4 và 5","2 và 10","3 và 6","1 và 20"], answer:0, sol:["4 + 5 = 9; 4·5 = 20."] },
        { type:"fill", q:"x² − 4x + 3 = 0. Tính x₁² + x₂²", answer:"10", sol:["(x₁+x₂)² − 2x₁x₂ = 16 − 6 = 10."] },
      ]},
      { id: "c6b21", term: "Chương VI · Hàm số y = ax² & Phương trình bậc hai", tag: "Bài 21", emoji: "📝", title: "Giải bài toán bằng cách lập phương trình", questions: [
        { type:"fill", q:"HCN dài hơn rộng 3 m, diện tích 40 m². Chiều rộng = ? m", answer:"5", sol:["x(x+3)=40 → x=5."] },
        { type:"fill", q:"(tiếp) Chiều dài = ? m", answer:"8", sol:["5 + 3 = 8."] },
        { type:"fill", q:"Hai số tự nhiên liên tiếp có tích 56. Số nhỏ = ?", answer:"7", sol:["7·8 = 56."] },
        { type:"fill", q:"Tăng cạnh hình vuông thêm 3 m thì diện tích 64 m². Cạnh ban đầu = ? m", answer:"5", sol:["(x+3)²=64 → x=5."] },
        { type:"fill", q:"Vườn chữ nhật chu vi 28 m, diện tích 48 m². Chiều dài = ? m", answer:"8", sol:["x(14−x)=48 → x=8 hoặc 6."] },
        { type:"mc", q:"Bài toán diện tích thường dẫn tới phương trình", options:["bậc nhất","bậc hai","vô tỉ","bậc ba"], answer:1, sol:["Có tích hai cạnh → bậc hai."] },
      ]},
      /* ---------------- CHƯƠNG VII ---------------- */
      { id: "c7b22", term: "Chương VII · Tần số và tần số tương đối", tag: "Bài 22", emoji: "📊", title: "Bảng tần số & biểu đồ tần số", questions: [
        { type:"fill", q:"Trong dãy 2, 3, 3, 5, 3 thì tần số của 3 = ?", answer:"3", sol:["Số 3 xuất hiện 3 lần."] },
        { type:"mc", q:"Tần số của một giá trị là", options:["số lần giá trị đó xuất hiện","giá trị lớn nhất","trung bình","tổng"], answer:0, sol:["Số lần xuất hiện."] },
        { type:"fill", q:"Điểm 5, 6, 6, 7, 6, 8 — tần số điểm 6 = ?", answer:"3", sol:["Điểm 6 xuất hiện 3 lần."] },
        { type:"mc", q:"Biểu đồ cột (tần số) dùng để", options:["biểu diễn tần số","giải phương trình","vẽ parabol","đo góc"], answer:0, sol:["Trực quan hoá tần số."] },
        { type:"mc", q:"Mốt của mẫu là giá trị có", options:["tần số lớn nhất","tần số nhỏ nhất","giá trị trung bình","trung vị"], answer:0, sol:["Mốt = giá trị có tần số lớn nhất."] },
        { type:"fill", q:"Mẫu 2, 4, 4, 4, 6 có mốt = ?", answer:"4", sol:["Số 4 xuất hiện nhiều nhất."] },
      ]},
      { id: "c7b23", term: "Chương VII · Tần số và tần số tương đối", tag: "Bài 23", emoji: "📈", title: "Bảng tần số tương đối & biểu đồ", questions: [
        { type:"mc", q:"Tần số tương đối của một giá trị bằng", options:["(tần số / tổng) × 100%","tổng / tần số","tần số × tổng","tần số − tổng"], answer:0, sol:["f = (tần số/tổng)·100%."] },
        { type:"fill", q:"20 HS, 5 bạn thích Toán. Tần số tương đối = ? %", answer:"25", sol:["5/20 = 25%."] },
        { type:"fill", q:"Tổng tất cả các tần số tương đối = ? %", answer:"100", sol:["Luôn bằng 100%."] },
        { type:"fill", q:"40 HS, 10 nữ → tần số tương đối nữ = ? %", answer:"25", sol:["10/40 = 25%."] },
        { type:"mc", q:"Biểu đồ hình quạt tròn thường biểu diễn", options:["tần số tương đối","độ dài","vận tốc","góc nội tiếp"], answer:0, sol:["Tỉ lệ phần trăm = tần số tương đối."] },
        { type:"fill", q:"Tần số tương đối 0,3 = ? %", answer:"30", sol:["0,3 = 30%."] },
      ]},
      { id: "c7b24", term: "Chương VII · Tần số và tần số tương đối", tag: "Bài 24", emoji: "🧮", title: "Tần số (tương đối) ghép nhóm & biểu đồ", questions: [
        { type:"mc", q:"Ghép nhóm được dùng khi dữ liệu", options:["liên tục / có nhiều giá trị","chỉ vài giá trị","chỉ là số nguyên","không có"], answer:0, sol:["Dữ liệu nhiều giá trị → chia nhóm."] },
        { type:"fill", q:"Giá trị đại diện (trung điểm) của nhóm [10; 20) = ?", answer:"15", sol:["(10+20)/2 = 15."] },
        { type:"fill", q:"Trung điểm của nhóm [20; 30) = ?", answer:"25", sol:["(20+30)/2 = 25."] },
        { type:"mc", q:"Giá trị đại diện của một nhóm là", options:["trung điểm nhóm","đầu mút trái","đầu mút phải","tần số"], answer:0, sol:["Lấy trung điểm của nhóm."] },
        { type:"fill", q:"Nhóm [0; 10) có 8 HS trong tổng 50 HS → tần số tương đối = ? %", answer:"16", sol:["8/50 = 16%."] },
        { type:"mc", q:"Các nhóm trong bảng ghép nhóm thường có", options:["độ rộng bằng nhau","độ rộng khác nhau","một giá trị","không có giá trị"], answer:0, sol:["Thường chia đều độ rộng."] },
      ]},
      /* ---------------- CHƯƠNG VIII ---------------- */
      { id: "c8b25", term: "Chương VIII · Xác suất của biến cố", tag: "Bài 25", emoji: "🎲", title: "Phép thử ngẫu nhiên & không gian mẫu", questions: [
        { type:"mc", q:"Không gian mẫu là", options:["tập tất cả kết quả có thể","một kết quả","một biến cố","một xác suất"], answer:0, sol:["Tập hợp mọi kết quả có thể của phép thử."] },
        { type:"fill", q:"Tung một đồng xu, số kết quả có thể = ?", answer:"2", sol:["Sấp hoặc ngửa → 2."] },
        { type:"fill", q:"Tung một xúc xắc, số phần tử không gian mẫu = ?", answer:"6", sol:["6 mặt."] },
        { type:"fill", q:"Tung hai đồng xu, số kết quả có thể = ?", answer:"4", sol:["2·2 = 4 (SS, SN, NS, NN)."] },
        { type:"mc", q:"Mỗi kết quả của phép thử được gọi là", options:["một kết quả (phần tử)","một biến cố","một xác suất","một tần số"], answer:0, sol:["Phần tử của không gian mẫu."] },
        { type:"fill", q:"Gieo hai xúc xắc, số phần tử không gian mẫu = ?", answer:"36", sol:["6·6 = 36."] },
      ]},
      { id: "c8b26", term: "Chương VIII · Xác suất của biến cố", tag: "Bài 26", emoji: "🎯", title: "Xác suất của biến cố liên quan tới phép thử", questions: [
        { type:"mc", q:"Xác suất của biến cố =", options:["số kết quả thuận lợi / tổng số kết quả","tổng / thuận lợi","thuận lợi × tổng","tổng − thuận lợi"], answer:0, sol:["P = thuận lợi / tổng (các kết quả đồng khả năng)."] },
        { type:"fill", q:"Tung xúc xắc, P(ra số chẵn) (a/b rút gọn)", answer:"1/2", accept:["3/6"], sol:["3/6 = 1/2."] },
        { type:"fill", q:"Hộp 4 đỏ, 6 xanh. P(bốc bi đỏ) (a/b rút gọn)", answer:"2/5", accept:["4/10"], sol:["4/10 = 2/5."] },
        { type:"mc", q:"Xác suất của biến cố chắc chắn là", options:["0","0,5","1","2"], answer:2, sol:["Chắc chắn → P = 1."] },
        { type:"fill", q:"Gieo hai xúc xắc, P(tổng = 7) (a/b rút gọn)", answer:"1/6", accept:["6/36"], sol:["6/36 = 1/6."] },
        { type:"fill", q:"Lớp 40 bạn, 24 nữ. P(chọn 1 bạn là nam) (a/b rút gọn)", answer:"2/5", accept:["16/40"], sol:["16/40 = 2/5."] },
      ]},
      /* ---------------- CHƯƠNG IX ---------------- */
      { id: "c9b27", term: "Chương IX · Đường tròn ngoại tiếp & nội tiếp", tag: "Bài 27", emoji: "🎯", title: "Góc nội tiếp", questions: [
        { type:"fill", q:"Góc ở tâm 100°. Góc nội tiếp cùng chắn cung = ? (số)", answer:"50", sol:["½·100 = 50°."] },
        { type:"mc", q:"Góc nội tiếp chắn nửa đường tròn bằng", options:["45°","60°","90°","180°"], answer:2, sol:["Góc ở tâm 180° → nội tiếp 90°."] },
        { type:"fill", q:"Góc nội tiếp 40°. Góc ở tâm cùng chắn cung = ? (số)", answer:"80", sol:["2·40 = 80°."] },
        { type:"mc", q:"Hai góc nội tiếp cùng chắn một cung thì", options:["bằng nhau","bù nhau","phụ nhau","gấp đôi"], answer:0, sol:["Bằng nhau."] },
        { type:"fill", q:"Cung AB = 120°. Góc nội tiếp chắn cung AB = ? (số)", answer:"60", sol:["½·120 = 60°."] },
        { type:"mc", q:"Số đo góc nội tiếp bằng", options:["nửa số đo cung bị chắn","số đo cung","gấp đôi cung","luôn 90°"], answer:0, sol:["Bằng nửa số đo cung bị chắn."] },
      ]},
      { id: "c9b28", term: "Chương IX · Đường tròn ngoại tiếp & nội tiếp", tag: "Bài 28", emoji: "🔵", title: "Đường tròn ngoại tiếp & nội tiếp của tam giác", questions: [
        { type:"mc", q:"Tâm đường tròn ngoại tiếp là giao của", options:["ba đường trung trực","ba phân giác","ba trung tuyến","ba đường cao"], answer:0, sol:["Trung trực → cách đều 3 đỉnh."] },
        { type:"mc", q:"Tâm đường tròn nội tiếp là giao của", options:["ba phân giác","ba trung trực","ba trung tuyến","ba đường cao"], answer:0, sol:["Phân giác → cách đều 3 cạnh."] },
        { type:"fill", q:"Tam giác vuông cạnh huyền 10. R đường tròn ngoại tiếp = ?", answer:"5", sol:["R = ½·10 = 5."] },
        { type:"mc", q:"Với tam giác vuông, tâm đường tròn ngoại tiếp ở", options:["trung điểm cạnh huyền","đỉnh góc vuông","trọng tâm","trực tâm"], answer:0, sol:["Trung điểm cạnh huyền."] },
        { type:"fill", q:"Tam giác vuông 6 và 8 (cạnh góc vuông). R ngoại tiếp = ?", answer:"5", sol:["Cạnh huyền 10 → R = 5."] },
        { type:"mc", q:"Đường tròn nội tiếp tam giác tiếp xúc", options:["3 cạnh","3 đỉnh","1 cạnh","đường cao"], answer:0, sol:["Tiếp xúc cả ba cạnh."] },
      ]},
      { id: "c9b29", term: "Chương IX · Đường tròn ngoại tiếp & nội tiếp", tag: "Bài 29", emoji: "🔶", title: "Tứ giác nội tiếp", questions: [
        { type:"mc", q:"Tổng hai góc đối của tứ giác nội tiếp", options:["90°","180°","270°","360°"], answer:1, sol:["Hai góc đối bù nhau = 180°."] },
        { type:"fill", q:"Tứ giác nội tiếp, một góc 75°. Góc đối = ? (số)", answer:"105", sol:["180 − 75 = 105°."] },
        { type:"fill", q:"Tứ giác nội tiếp, một góc 110°. Góc đối = ? (số)", answer:"70", sol:["180 − 110 = 70°."] },
        { type:"mc", q:"Hình nào LUÔN nội tiếp được đường tròn?", options:["hình chữ nhật","hình bình hành (không vuông)","hình thoi (không vuông)","hình thang thường"], answer:0, sol:["Hình chữ nhật có 4 đỉnh cách đều tâm."] },
        { type:"fill", q:"Tứ giác nội tiếp có góc A = 80°. Góc C = ? (số)", answer:"100", sol:["A và C đối nhau: 180 − 80 = 100°."] },
        { type:"mc", q:"Dấu hiệu tứ giác nội tiếp:", options:["tổng hai góc đối = 180°","tổng hai góc đối = 90°","bốn cạnh bằng nhau","hai đường chéo bằng nhau"], answer:0, sol:["Tổng hai góc đối bằng 180°."] },
      ]},
      { id: "c9b30", term: "Chương IX · Đường tròn ngoại tiếp & nội tiếp", tag: "Bài 30", emoji: "🔷", title: "Đa giác đều", questions: [
        { type:"mc", q:"Đa giác đều có", options:["các cạnh và các góc bằng nhau","chỉ các cạnh bằng nhau","chỉ các góc bằng nhau","không đều"], answer:0, sol:["Cả cạnh và góc đều bằng nhau."] },
        { type:"fill", q:"Mỗi góc của tam giác đều = ? (độ)", answer:"60", sol:["(3−2)·180/3 = 60°."] },
        { type:"fill", q:"Mỗi góc của hình vuông = ? (độ)", answer:"90", sol:["(4−2)·180/4 = 90°."] },
        { type:"fill", q:"Mỗi góc của ngũ giác đều = ? (độ)", answer:"108", sol:["(5−2)·180/5 = 108°."] },
        { type:"fill", q:"Mỗi góc của lục giác đều = ? (độ)", answer:"120", sol:["(6−2)·180/6 = 120°."] },
        { type:"mc", q:"Số trục đối xứng của đa giác đều n cạnh là", options:["n","2n","n/2","1"], answer:0, sol:["Đa giác đều n cạnh có n trục đối xứng."] },
      ]},
      /* ---------------- CHƯƠNG X ---------------- */
      { id: "c10b31", term: "Chương X · Một số hình khối trong thực tiễn", tag: "Bài 31", emoji: "🛢️", title: "Hình trụ và hình nón", questions: [
        { type:"mc", q:"Thể tích hình trụ V =", options:["πr²h","2πrh","πrl","(1/3)πr²h"], answer:0, sol:["V = πr²h."] },
        { type:"fill", q:"Trụ r = 2, h = 5 (π ≈ 3,14). V = ?", answer:"62,8", accept:["62.8"], sol:["3,14·4·5 = 62,8."] },
        { type:"mc", q:"Diện tích xung quanh hình trụ =", options:["2πrh","πr²h","πrl","πr²"], answer:0, sol:["Sxq = 2πrh."] },
        { type:"mc", q:"Thể tích hình nón V =", options:["(1/3)πr²h","πr²h","2πrh","πrl"], answer:0, sol:["V = ⅓πr²h."] },
        { type:"fill", q:"Nón r = 3, h = 4 (π ≈ 3,14). V = ?", answer:"37,68", accept:["37.68"], sol:["⅓·3,14·9·4 = 37,68."] },
        { type:"mc", q:"Diện tích xung quanh hình nón =", options:["πrl","2πrh","πr²h","(1/3)πr²h"], answer:0, sol:["Sxq = πrl (l là đường sinh)."] },
      ]},
      { id: "c10b32", term: "Chương X · Một số hình khối trong thực tiễn", tag: "Bài 32", emoji: "⚽", title: "Hình cầu", questions: [
        { type:"mc", q:"Diện tích mặt cầu S =", options:["4πR²","πR²","2πR²","(4/3)πR³"], answer:0, sol:["S = 4πR²."] },
        { type:"mc", q:"Thể tích hình cầu V =", options:["(4/3)πR³","4πR²","πR³","(1/3)πR³"], answer:0, sol:["V = (4/3)πR³."] },
        { type:"fill", q:"Mặt cầu R = 3 (π ≈ 3,14). S = ?", answer:"113,04", accept:["113.04"], sol:["4·3,14·9 = 113,04."] },
        { type:"fill", q:"Hình cầu R = 3 (π ≈ 3,14). V = ?", answer:"113,04", accept:["113.04"], sol:["(4/3)·3,14·27 = 113,04."] },
        { type:"fill", q:"Mặt cầu bán kính R = 5. Đường kính = ?", answer:"10", sol:["d = 2R = 10."] },
        { type:"mc", q:"Mặt cắt đi qua tâm hình cầu là", options:["hình tròn lớn","elip","tam giác","hình vuông"], answer:0, sol:["Là một hình tròn lớn bán kính R."] },
      ]},
    ]
  };


  /* ===================== NGÂN HÀNG BÀI TẬP TƯ DUY & TỰ LUẬN ===================== */
  const thinking = {
    intro: "Những bài đòi hỏi suy luận, chứng minh, mô hình hoá và giải thích — rèn tư duy Toán thật sự. Bài tự luận có lời giải mẫu và tiêu chí để em tự chấm.",
    problems: [
      /* ---- Chương I ---- */
      { id: "t-c1-1", lessonId: "pt-he-khai-niem", term: "Chương I", tag: "Bài 1", skill: "reasoning", type: "mc",
        q: "Hệ hai phương trình bậc nhất hai ẩn có hai đường thẳng song song (không trùng nhau). Hệ đó có bao nhiêu nghiệm?",
        options: ["Vô nghiệm", "Đúng 1 nghiệm", "Vô số nghiệm", "Đúng 2 nghiệm"], answer: 0,
        sol: ["Nghiệm của hệ là giao điểm hai đường thẳng.", "Hai đường song song không cắt nhau → không có giao điểm → hệ vô nghiệm."] },
      { id: "t-c1-2", lessonId: "lap-he-pt", term: "Chương I", tag: "Bài 3", skill: "modeling", type: "essay",
        q: "Một cửa hàng bán 3 bút và 2 vở hết 32 nghìn; 1 bút và 1 vở hết 13 nghìn. Hãy lập hệ phương trình và tìm giá mỗi loại. Trình bày đủ 4 bước.",
        hint: "Gọi giá 1 bút là x, giá 1 vở là y (nghìn đồng), điều kiện x, y > 0.",
        sample: "Gọi giá 1 bút là x, 1 vở là y (nghìn đồng), x, y > 0. Ta có hệ: 3x + 2y = 32 và x + y = 13. Từ PT (2): y = 13 − x. Thế vào (1): 3x + 2(13 − x) = 32 → x + 26 = 32 → x = 6, suy ra y = 7. Vậy bút 6 nghìn, vở 7 nghìn (thoả điều kiện).",
        rubric: ["Gọi ẩn và nêu điều kiện x, y > 0", "Lập đúng hệ 3x+2y=32 và x+y=13", "Giải ra x = 6, y = 7", "Đối chiếu điều kiện & trả lời"] },

      /* ---- Chương II ---- */
      { id: "t-c2-1", lessonId: "bat-phuong-trinh", term: "Chương II", tag: "Bài 6", skill: "reasoning", type: "mc",
        q: "Biết a > b. Khẳng định nào sau đây ĐÚNG?",
        options: ["−2a < −2b", "−2a > −2b", "−2a = −2b", "−2a ≥ −2b"], answer: 0,
        sol: ["Nhân hai vế của a > b với số âm (−2) thì ĐỔI chiều.", "a > b ⟹ −2a < −2b."] },
      { id: "t-c2-2", lessonId: "bat-dang-thuc", term: "Chương II", tag: "Bài 5", skill: "explain", type: "essay",
        q: "Giải thích tính chất bắc cầu của bất đẳng thức và cho một ví dụ số cụ thể.",
        hint: "Nếu a lớn hơn b, và b lại lớn hơn c, thì a so với c thế nào?",
        sample: "Tính chất bắc cầu: nếu a > b và b > c thì a > c. Vì a lớn hơn b mà b lớn hơn c, nên a càng lớn hơn c. Ví dụ: 7 > 5 và 5 > 2, suy ra 7 > 2.",
        rubric: ["Phát biểu đúng: a > b và b > c ⟹ a > c", "Giải thích được ý nghĩa", "Cho ví dụ số đúng"] },

      /* ---- Chương III ---- */
      { id: "t-c3-1", lessonId: "can-bac-hai", term: "Chương III", tag: "Bài 7", skill: "reasoning", type: "mc",
        q: "Biểu thức √(x − 2) có nghĩa khi nào?",
        options: ["x ≥ 2", "x > 2", "x ≤ 2", "x ≥ 0"], answer: 0,
        sol: ["Căn bậc hai có nghĩa khi biểu thức dưới căn không âm.", "x − 2 ≥ 0 ⟺ x ≥ 2."] },
      { id: "t-c3-2", lessonId: "can-bac-hai", term: "Chương III", tag: "Bài 7", skill: "explain", type: "essay",
        q: "Vì sao √(a²) = |a| mà không phải luôn bằng a? Cho ví dụ với a âm.",
        hint: "Kết quả của căn bậc hai (số học) luôn không âm.",
        sample: "Căn bậc hai số học của một số luôn không âm, nên √(a²) phải ≥ 0. Nếu a ≥ 0 thì √(a²) = a; nếu a < 0 thì a âm nhưng √(a²) vẫn dương, nên √(a²) = −a = |a|. Ví dụ a = −3: √((−3)²) = √9 = 3 = |−3|, chứ không bằng −3.",
        rubric: ["Nêu căn bậc hai số học luôn ≥ 0", "Xét hai trường hợp a ≥ 0 và a < 0", "Ví dụ a = −3 cho kết quả 3 = |−3|"] },
      { id: "t-c3-3", lessonId: "rut-gon-can", term: "Chương III", tag: "Bài 9", skill: "reasoning", type: "mc",
        q: "Không dùng máy tính, so sánh 2√3 và 3√2.",
        options: ["2√3 > 3√2", "2√3 < 3√2", "2√3 = 3√2", "Không so sánh được"], answer: 1,
        sol: ["Đưa vào trong căn: 2√3 = √(4·3) = √12; 3√2 = √(9·2) = √18.", "Vì 12 < 18 nên √12 < √18, tức 2√3 < 3√2."] },
      { id: "t-c3-4", lessonId: "can-bac-ba", term: "Chương III", tag: "Bài 10", skill: "explain", type: "essay",
        q: "Vì sao mọi số thực đều có căn bậc ba, kể cả số âm — khác với căn bậc hai? Cho ví dụ.",
        hint: "Xét dấu của x³ khi x âm.",
        sample: "Vì lập phương giữ nguyên dấu: nếu x âm thì x³ âm, nếu x dương thì x³ dương. Nên với mọi số thực a (âm, 0 hay dương) đều tìm được đúng một x với x³ = a. Ví dụ ∛(−8) = −2 vì (−2)³ = −8. Trong khi đó bình phương luôn không âm, nên số âm không có căn bậc hai thực.",
        rubric: ["Nêu lập phương giữ nguyên dấu", "Kết luận mọi số thực có đúng một căn bậc ba", "Ví dụ ∛(−8) = −2", "So sánh với căn bậc hai của số âm"] },

      /* ---- Chương IV ---- */
      { id: "t-c4-1", lessonId: "ti-so-luong-giac", term: "Chương IV", tag: "Bài 11", skill: "reasoning", type: "mc",
        q: "Với α là một góc nhọn, giá trị sin α luôn nằm trong khoảng nào?",
        options: ["0 < sin α < 1", "sin α > 1", "sin α < 0", "sin α = 1"], answer: 0,
        sol: ["sin α = đối/huyền, mà cạnh đối luôn nhỏ hơn cạnh huyền và đều dương.", "Nên 0 < sin α < 1 với mọi góc nhọn."] },
      { id: "t-c4-2", lessonId: "he-thuc-luong", term: "Chương IV", tag: "Bài 12", skill: "modeling", type: "essay",
        q: "Một chiếc thang dài 5 m dựa vào tường, tạo với mặt đất góc 60°. Thang chạm tường ở độ cao bao nhiêu? Vẽ hình minh hoạ và giải thích cách tính.",
        hint: "Chiều cao là cạnh đối của góc 60°; dùng sin.",
        sample: "Thang là cạnh huyền (5 m). Chiều cao h là cạnh đối của góc 60°. Ta có sin 60° = h / 5 ⟹ h = 5·sin 60° = 5·(√3/2) ≈ 4,33 m. Vậy thang chạm tường ở độ cao khoảng 4,33 m.",
        rubric: ["Xác định thang là cạnh huyền", "Dùng đúng sin 60° = h/5", "Tính h = 5·sin60° ≈ 4,33 m"] },
      { id: "t-c4-3", lessonId: "ti-so-luong-giac", term: "Chương IV", tag: "Bài 11", skill: "reasoning", type: "mc",
        q: "Hai góc α và β phụ nhau (α + β = 90°). Khẳng định nào đúng?",
        options: ["sin α = cos β", "sin α = sin β", "tan α = tan β", "sin α = cos α"], answer: 0,
        sol: ["Hai góc phụ nhau: sin góc này bằng cos góc kia.", "Vì β = 90° − α nên sin α = cos(90° − α) = cos β."] },

      /* ---- Chương V ---- */
      { id: "t-c5-1", lessonId: "duong-tron", term: "Chương V", tag: "Bài 13", skill: "proof", type: "essay",
        q: "Chứng minh trong một đường tròn, đường kính là dây cung lớn nhất.",
        hint: "Với dây AB không qua tâm, xét tam giác OAB và bất đẳng thức tam giác.",
        sample: "Gọi đường tròn tâm O bán kính R. Với một dây AB bất kì: nếu AB đi qua O thì AB = 2R (đường kính). Nếu AB không qua O, xét tam giác OAB có OA = OB = R; theo bất đẳng thức tam giác, AB < OA + OB = 2R. Vậy mọi dây đều ≤ 2R, dấu bằng khi dây qua tâm. Do đó đường kính (= 2R) là dây lớn nhất.",
        rubric: ["Xét dây qua tâm: bằng 2R", "Xét dây không qua tâm: dùng bất đẳng thức tam giác AB < OA + OB = 2R", "Kết luận đường kính là dây lớn nhất"] },
      { id: "t-c5-2", lessonId: "do-dai-cung", term: "Chương V", tag: "Bài 15", skill: "modeling", type: "essay",
        q: "Một chiếc quạt giấy khi mở ra tạo thành hình quạt tròn bán kính 24 cm, góc ở tâm 120°. Tính diện tích phần giấy của quạt (lấy π ≈ 3,14).",
        hint: "Diện tích hình quạt n° = (n/360)·πR².",
        sample: "Diện tích hình quạt = (n/360)·πR² = (120/360)·3,14·24² = (1/3)·3,14·576 = 602,88 cm². Vậy phần giấy của quạt khoảng 602,88 cm².",
        rubric: ["Dùng đúng công thức (n/360)·πR²", "Thay n = 120, R = 24", "Tính ra ≈ 602,88 cm²"] },
      { id: "t-c5-3", lessonId: "vi-tri-duong-thang-tron", term: "Chương V", tag: "Bài 16", skill: "reasoning", type: "mc",
        q: "Đường thẳng d cách tâm O của đường tròn (O; R) một khoảng bằng đúng R. Vị trí tương đối của d và đường tròn là?",
        options: ["Tiếp xúc (1 điểm chung)", "Cắt nhau (2 điểm chung)", "Không cắt nhau", "Đi qua tâm"], answer: 0,
        sol: ["So khoảng cách d với R: khi khoảng cách = R thì đường thẳng tiếp xúc đường tròn.", "Có đúng 1 điểm chung (tiếp điểm), d là tiếp tuyến."] },

      /* ---- Chương VI ---- */
      { id: "t-c6-1", lessonId: "phuong-trinh-bac-hai", term: "Chương VI", tag: "Bài 19", skill: "reasoning", type: "mc",
        q: "Phương trình x² + 2x + m = 0 vô nghiệm khi nào?",
        options: ["m > 1", "m < 1", "m = 1", "m ≥ 0"], answer: 0,
        sol: ["Δ = b² − 4ac = 2² − 4·1·m = 4 − 4m.", "Vô nghiệm khi Δ < 0 ⟺ 4 − 4m < 0 ⟺ m > 1."] },
      { id: "t-c6-2", lessonId: "he-thuc-vi-et", term: "Chương VI", tag: "Bài 20", skill: "reasoning", type: "essay",
        q: "Cho phương trình x² − 5x + 3 = 0 có hai nghiệm x₁, x₂ (không cần giải). Hãy tính x₁ + x₂, x₁·x₂ và x₁² + x₂².",
        hint: "Dùng định lí Viète: x₁ + x₂ = −b/a, x₁·x₂ = c/a.",
        sample: "Theo Viète: x₁ + x₂ = 5, x₁·x₂ = 3. Ta có x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂ = 5² − 2·3 = 25 − 6 = 19.",
        rubric: ["Áp dụng Viète: tổng = 5, tích = 3", "Dùng hằng đẳng thức (x₁+x₂)² − 2x₁x₂", "Kết quả x₁² + x₂² = 19"] },
      { id: "t-c6-3", lessonId: "lap-pt", term: "Chương VI", tag: "Bài 21", skill: "modeling", type: "essay",
        q: "Một mảnh đất hình chữ nhật có chiều dài hơn chiều rộng 5 m và diện tích 84 m². Lập phương trình và tìm kích thước mảnh đất.",
        hint: "Gọi chiều rộng là x (m), x > 0; chiều dài là x + 5.",
        sample: "Gọi chiều rộng x (m), x > 0. Chiều dài là x + 5. Diện tích: x(x + 5) = 84 ⟺ x² + 5x − 84 = 0. Giải: x = 7 (loại x = −12 vì âm). Vậy rộng 7 m, dài 12 m.",
        rubric: ["Gọi ẩn & điều kiện x > 0", "Lập PT x(x+5) = 84", "Giải ra x = 7, loại nghiệm âm", "Trả lời: 7 m và 12 m"] },
      { id: "t-c6-4", lessonId: "ham-so-y-ax2", term: "Chương VI", tag: "Bài 18", skill: "reasoning", type: "mc",
        q: "Điểm nào LUÔN thuộc đồ thị hàm số y = ax² dù a bằng bao nhiêu (a ≠ 0)?",
        options: ["(0; 0)", "(1; 1)", "(2; 4)", "(−1; 1)"], answer: 0,
        sol: ["Thay x = 0: y = a·0² = 0 với mọi a → điểm (0; 0) luôn thuộc đồ thị.", "Các điểm còn lại phụ thuộc giá trị của a."] },

      /* ---- Chương VII–VIII ---- */
      { id: "t-c7-1", lessonId: "tan-so-tuong-doi", term: "Chương VII", tag: "Bài 23", skill: "reasoning", type: "mc",
        q: "Lớp A có 30 bạn, 9 bạn thích Toán. Lớp B có 40 bạn, 10 bạn thích Toán. Lớp nào có tỉ lệ thích Toán cao hơn?",
        options: ["Lớp A", "Lớp B", "Bằng nhau", "Không so sánh được"], answer: 0,
        sol: ["Tần số tương đối: lớp A = 9/30 = 30%; lớp B = 10/40 = 25%.", "30% > 25% nên lớp A có tỉ lệ cao hơn."] },
      { id: "t-c8-1", lessonId: "xac-suat", term: "Chương VIII", tag: "Bài 26", skill: "modeling", type: "essay",
        q: "Gieo đồng thời hai con xúc xắc cân đối. Tính xác suất để tổng số chấm bằng 7. Trình bày cách liệt kê.",
        hint: "Không gian mẫu có 6·6 = 36 kết quả; đếm các cặp có tổng bằng 7.",
        sample: "Không gian mẫu có 36 kết quả đồng khả năng. Các kết quả có tổng 7 là: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) — gồm 6 kết quả. Vậy P = 6/36 = 1/6.",
        rubric: ["Nêu không gian mẫu 36 kết quả", "Liệt kê đủ 6 cặp có tổng 7", "Kết luận P = 6/36 = 1/6"] },
      { id: "t-c8-2", lessonId: "phep-thu", term: "Chương VIII", tag: "Bài 25", skill: "reasoning", type: "mc",
        q: "Gieo một con xúc xắc hai lần liên tiếp. Không gian mẫu có bao nhiêu kết quả?",
        options: ["36", "12", "6", "2"], answer: 0,
        sol: ["Mỗi lần gieo có 6 kết quả, hai lần độc lập nhau.", "Số kết quả = 6 × 6 = 36."] },

      /* ---- Chương IX ---- */
      { id: "t-c9-1", lessonId: "goc-noi-tiep", term: "Chương IX", tag: "Bài 27", skill: "proof", type: "essay",
        q: "Chứng minh: góc nội tiếp chắn nửa đường tròn là góc vuông.",
        hint: "Góc nội tiếp bằng nửa số đo cung bị chắn; nửa đường tròn ứng với cung 180°.",
        sample: "Góc nội tiếp có số đo bằng nửa số đo cung bị chắn. Khi góc nội tiếp chắn nửa đường tròn thì cung bị chắn là 180°. Do đó góc nội tiếp = 180°/2 = 90°, tức là góc vuông.",
        rubric: ["Nêu tính chất: góc nội tiếp = ½ cung bị chắn", "Nửa đường tròn ứng với cung 180°", "Kết luận góc = 90° (vuông)"] },
      { id: "t-c9-2", lessonId: "tu-giac-noi-tiep", term: "Chương IX", tag: "Bài 29", skill: "proof", type: "essay",
        q: "Cho tứ giác ABCD nội tiếp đường tròn. Chứng minh Â + Ĉ = 180°.",
        hint: "Â là góc nội tiếp chắn cung BCD, Ĉ chắn cung BAD; hai cung này ghép lại là cả đường tròn.",
        sample: "Â là góc nội tiếp chắn cung BCD, nên Â = ½ (số đo cung BCD). Ĉ là góc nội tiếp chắn cung BAD, nên Ĉ = ½ (số đo cung BAD). Cộng lại: Â + Ĉ = ½ (cung BCD + cung BAD) = ½ · 360° = 180°.",
        rubric: ["Â = ½ cung BCD; Ĉ = ½ cung BAD", "Hai cung ghép lại = cả đường tròn = 360°", "Kết luận Â + Ĉ = 180°"] },
      { id: "t-c9-3", lessonId: "da-giac-deu", term: "Chương IX", tag: "Bài 30", skill: "reasoning", type: "mc",
        q: "Cách tính đúng số đo mỗi góc của lục giác đều là?",
        options: ["(6 − 2)·180° / 6 = 120°", "6·180° / 6 = 180°", "360° / 6 = 60°", "(6 − 2)·180° = 720°"], answer: 0,
        sol: ["Tổng các góc trong đa giác n cạnh là (n − 2)·180°.", "Lục giác đều: mỗi góc = (6 − 2)·180° / 6 = 720°/6 = 120°."] },
      { id: "t-c9-4", lessonId: "duong-tron-ngoai-noi-tiep", term: "Chương IX", tag: "Bài 28", skill: "explain", type: "essay",
        q: "Vì sao tâm đường tròn ngoại tiếp một tam giác vuông lại là trung điểm của cạnh huyền?",
        hint: "Nghĩ tới góc nội tiếp chắn nửa đường tròn.",
        sample: "Nếu tam giác vuông nội tiếp một đường tròn thì góc vuông là góc nội tiếp; góc nội tiếp bằng 90° chắn nửa đường tròn, nên cạnh đối diện góc vuông (cạnh huyền) là đường kính. Tâm đường tròn là trung điểm của đường kính, tức trung điểm cạnh huyền, và bán kính bằng nửa cạnh huyền.",
        rubric: ["Góc vuông là góc nội tiếp chắn nửa đường tròn", "Suy ra cạnh huyền là đường kính", "Tâm = trung điểm cạnh huyền, R = ½ cạnh huyền"] },

      /* ---- Chương X ---- */
      { id: "t-c10-1", lessonId: "hinh-tru-non", term: "Chương X", tag: "Bài 31", skill: "modeling", type: "essay",
        q: "Một hình nón và một hình trụ có cùng bán kính đáy 3 cm và cùng chiều cao 10 cm (π ≈ 3,14). Tính thể tích mỗi hình và cho biết nón bằng mấy phần trụ.",
        hint: "V trụ = πr²h; V nón = ⅓πr²h.",
        sample: "V trụ = πr²h = 3,14·9·10 = 282,6 cm³. V nón = ⅓πr²h = 282,6/3 = 94,2 cm³. Vậy thể tích hình nón bằng một phần ba thể tích hình trụ (cùng đáy, cùng chiều cao).",
        rubric: ["Tính V trụ = 282,6 cm³", "Tính V nón = 94,2 cm³", "Kết luận nón = ⅓ trụ"] },
      { id: "t-c10-2", lessonId: "hinh-cau", term: "Chương X", tag: "Bài 32", skill: "modeling", type: "essay",
        q: "Một quả bóng có bán kính 6 cm (π ≈ 3,14). Tính thể tích và diện tích mặt của quả bóng.",
        hint: "V = (4/3)πR³; S = 4πR².",
        sample: "Thể tích V = (4/3)πR³ = (4/3)·3,14·216 = 3,14·288 = 904,32 cm³. Diện tích mặt cầu S = 4πR² = 4·3,14·36 = 452,16 cm². Vậy quả bóng có thể tích ≈ 904,32 cm³ và diện tích mặt ≈ 452,16 cm².",
        rubric: ["Dùng đúng V = (4/3)πR³", "Tính V ≈ 904,32 cm³", "Tính S = 4πR² ≈ 452,16 cm²"] },
    ]
  };


  /* ===================== 🎣 TẠO HỨNG THÚ (hook mở bài, ~3 phút) ===================== */
  const HOOKS = {
    /* --- Chương I --- */
    "pt-he-khai-niem": { emoji: "🧋",
      q: "Đi quán trà sữa, hoá đơn ghi: <b>2 trà sữa + 1 bánh = 70 nghìn</b>. Bạn em mua <b>1 trà sữa + 1 bánh = 45 nghìn</b>. Không ai nhớ giá từng món… Chỉ với 2 hoá đơn, em tìm ra được không?",
      reveal: "Mỗi hoá đơn chính là <b>một phương trình hai ẩn</b>: 2x + y = 70 và x + y = 45. Ghép hai cái lại là một <b>hệ phương trình</b> — và nghiệm của nó tiết lộ: trà sữa 25 nghìn, bánh 20 nghìn! Bài này cho em \"cặp kính\" nhìn xuyên mọi hoá đơn như thế. 🕵️" },
    "he-phuong-trinh": { emoji: "🍊",
      q: "Mẹ đi chợ: <b>3 kg cam + 2 kg táo hết 145 nghìn</b>. Cô hàng xóm mua <b>1 kg cam + 1 kg táo hết 60 nghìn</b>. Đố em tính được giá mỗi loại — mà không hỏi người bán?",
      reveal: "Đặt cam là x, táo là y: 3x + 2y = 145 và x + y = 60. Dùng <b>phép thế</b> (rút y = 60 − x rồi thay vào) là ra ngay x = 25, y = 35. Bài học hôm nay dạy em hai \"tuyệt chiêu\" giải hệ: <b>thế</b> và <b>cộng đại số</b> — bấm máy cũng không nhanh hơn đâu! ⚡" },
    "lap-he-pt": { emoji: "👨‍👦",
      q: "Cha hơn con 30 tuổi. 5 năm nữa, tuổi cha <b>gấp 3 lần</b> tuổi con. Đố cả nhà: hiện giờ con mấy tuổi? (Thử đoán trước khi bật mí nhé!)",
      reveal: "Gọi tuổi con là x, tuổi cha là y: y − x = 30 và y + 5 = 3(x + 5). Giải hệ → con <b>10 tuổi</b>, cha 40. Mọi câu đố tuổi tác, mua bán, vòi nước… đều \"dịch\" được thành hệ phương trình bằng đúng 4 bước em sắp học. 🧩" },

    /* --- Chương II --- */
    "pt-tich": { emoji: "🏀",
      q: "Ném bóng lên cao, độ cao sau t giây là <b>h = t(6 − t)</b> mét. Hỏi lúc nào bóng <b>chạm đất</b> (h = 0)? Gợi ý: một tích bằng 0 thì sao nhỉ…",
      reveal: "t(6 − t) = 0 ⟹ t = 0 (lúc ném) hoặc t = 6 (lúc rơi xuống). Bí mật: <b>tích bằng 0 khi một thừa số bằng 0</b> — quy tắc bé xíu này giải được cả phương trình bậc cao. Bài hôm nay còn dạy em né \"bẫy\" chia cho 0 trong phương trình chứa ẩn ở mẫu. ⚠️" },
    "bat-dang-thuc": { emoji: "🛒",
      q: "Shopee ghi: <b>\"Đơn từ 99k được freeship\"</b>. Game ghi: <b>\"12+\"</b>. Biển giao thông: <b>\"tối đa 60 km/h\"</b>. Em có nhận ra cả ba đều là… một thứ Toán không?",
      reveal: "Tất cả là <b>bất đẳng thức</b>: đơn ≥ 99k, tuổi ≥ 12, tốc độ ≤ 60. Em dùng chúng mỗi ngày mà không biết tên! Hôm nay học luật chơi của dấu &gt;, &lt;: khi nào giữ chiều, khi nào <b>lật ngược</b> (cẩn thận với số âm đấy). ⚖️" },
    "bat-phuong-trinh": { emoji: "🎯",
      q: "Hai bài kiểm tra đầu em được <b>7 và 8 điểm</b>. Muốn trung bình cả ba bài <b>từ 8 trở lên</b>, bài cuối phải ít nhất mấy điểm? Đoán nhanh xem!",
      reveal: "Gọi điểm bài cuối là x: (7 + 8 + x)/3 ≥ 8 ⟹ x ≥ <b>9</b>. Đó là một <b>bất phương trình</b> — công cụ trả lời mọi câu \"ít nhất bao nhiêu?\", \"nhiều nhất bao nhiêu?\" trong đời: tiền tiêu, điểm số, thời gian chơi game… 😉" },

    /* --- Chương III --- */
    "can-bac-hai": { emoji: "🏟️",
      q: "Sân hình vuông rộng đúng <b>64 m²</b>. Muốn rào quanh sân, phải biết mỗi cạnh dài bao nhiêu. Từ <b>diện tích</b> lần ngược ra <b>cạnh</b> — phép tính đó tên là gì?",
      reveal: "Là <b>căn bậc hai</b>: cạnh = √64 = 8 m — phép \"đi lùi\" của bình phương. Màn hình 55 inch, cường độ động đất, tốc độ rơi… đều giấu một dấu √ bên trong. Hôm nay em sẽ thuần phục ký hiệu \"đáng sợ\" này trong 30 phút. 💪" },
    "khai-can": { emoji: "🤯",
      q: "Không máy tính, đố em tính <b>√50</b> trong 5 giây! Nghe vô lý? Dân chuyên Toán làm được — nhờ một mẹo tách số cực gọn.",
      reveal: "Tách 50 = 25 · 2 ⟹ √50 = √25 · √2 = <b>5√2</b>. Bí kíp: <b>√(a·b) = √a · √b</b> — dấu căn \"đi xuyên\" phép nhân và phép chia. Học xong bài này, √72, √200… đều thành chuyện nhỏ. ✨" },
    "rut-gon-can": { emoji: "🧐",
      q: "Vì sao thầy cô luôn bắt viết <b>5√2</b> mà không cho ghi <b>7,071</b>? Chẳng phải 7,071 dễ hiểu hơn sao?",
      reveal: "Vì 7,071 chỉ là <b>xấp xỉ</b> (số thật là 7,0710678…), còn 5√2 <b>chính xác tuyệt đối</b>. Toán học quý sự chính xác! Hôm nay em học nghệ thuật \"dọn dẹp\" biểu thức chứa căn: đưa ra ngoài, cộng căn đồng dạng, trục căn ở mẫu — để đáp án vừa đúng vừa đẹp. 🧹" },
    "can-bac-ba": { emoji: "🐠",
      q: "Bể cá hình lập phương chứa đúng <b>27 lít</b> (= 27 dm³). Đố em: mỗi cạnh bể dài bao nhiêu? Gợi ý: số nào nhân với chính nó <b>ba lần</b> ra 27?",
      reveal: "3 × 3 × 3 = 27 ⟹ cạnh = <b>∛27 = 3 dm</b>. Đó là <b>căn bậc ba</b> — phép ngược của mũ ba. Điều thú vị: khác căn bậc hai, số ÂM cũng có căn bậc ba (∛(−8) = −2). Vào bài để biết vì sao! 🧊" },

    /* --- Chương IV --- */
    "ti-so-luong-giac": { emoji: "🗼",
      q: "Làm sao đo chiều cao cột cờ <b>mà không trèo lên</b>? Chỉ với một thước dây dưới đất và một chiếc thước đo góc — người xưa đo được cả kim tự tháp!",
      reveal: "Bí mật là <b>tỉ số lượng giác</b>: đứng cách chân cột 10 m, ngẩng góc 60° → chiều cao = 10 · tan 60° ≈ 17,3 m. Chỉ cần nhớ thần chú <b>SOH–CAH–TOA</b> là cả thế giới đo đạc mở ra trước mắt em. 📐" },
    "he-thuc-luong": { emoji: "🚒",
      q: "Lính cứu hoả có thang dài <b>5 m</b>, dựa vào tường nghiêng <b>60°</b>. Trong 3 giây, họ phải biết: thang chạm tường ở độ cao bao nhiêu — đủ tới cửa sổ tầng 2 không?",
      reveal: "Cao = 5 · sin 60° ≈ <b>4,33 m</b> — vừa đủ! Đó là <b>hệ thức cạnh–góc</b>: biết 1 cạnh + 1 góc là \"giải\" được cả tam giác vuông. Kỹ năng của lính cứu hoả, kiến trúc sư, phi công… và của em sau bài này. 🧯" },

    /* --- Chương V --- */
    "duong-tron": { emoji: "🛞",
      q: "Vì sao bánh xe hình <b>tròn</b> mà không vuông, không tam giác? (Đừng cười — trả lời chuẩn bằng Toán khó hơn em nghĩ đấy!)",
      reveal: "Vì đường tròn là tập hợp mọi điểm <b>cách đều tâm đúng R</b> — nên trục xe luôn giữ một độ cao, xe chạy êm ru. Bánh vuông sẽ khiến xe \"nhảy\" theo từng góc! Bài mở đầu chương Đường tròn cho em ngôn ngữ để nói về hình tròn như dân chuyên. ⭕" },
    "cung-day": { emoji: "🍕",
      q: "Cắt pizza thành <b>8 miếng đều nhau</b> — mỗi miếng \"mở\" một góc bao nhiêu độ ở tâm bánh? Còn mặt đồng hồ: từ số 12 đến số 3 là góc bao nhiêu?",
      reveal: "Pizza: 360° ÷ 8 = <b>45°</b> mỗi miếng. Đồng hồ: 3 khoảng × 30° = <b>90°</b>. Em vừa dùng <b>góc ở tâm</b> và <b>số đo cung</b> — hai nhân vật chính của bài học hôm nay, kèm \"người anh em\" dây cung. 🕒" },
    "do-dai-cung": { emoji: "🕰️",
      q: "Kim phút dài <b>10 cm</b>. Sau 15 phút, <b>đầu kim</b> đã \"bơi\" được quãng đường bao nhiêu cm? (Không phải 10 cm đâu nhé!)",
      reveal: "15 phút = ¼ vòng ⟹ quãng đường = ¼ · 2π·10 ≈ <b>15,7 cm</b> — đó là <b>độ dài cung</b>. Còn miếng pizza em ăn là <b>hình quạt</b>, có công thức diện tích riêng. Học xong bài này, em tính được cả phần giấy của chiếc quạt xếp! 🪭" },
    "vi-tri-duong-thang-tron": { emoji: "🛣️",
      q: "Bánh xe lăn trên đường: mặt đường và bánh xe chạm nhau ở <b>mấy điểm</b>? Vệ tinh bay ngang qua vùng phủ sóng tròn: đường bay có thể cắt vùng đó kiểu gì?",
      reveal: "Chỉ có 3 kịch bản cho một đường thẳng và một đường tròn: <b>cắt (2 điểm) — tiếp xúc (1 điểm) — không chạm (0 điểm)</b>, và phân biệt chúng chỉ bằng phép so d với R. Mặt đường chính là <b>tiếp tuyến</b> của bánh xe (d = R)! 🛞" },
    "vi-tri-hai-duong-tron": { emoji: "🏅",
      q: "Nhìn logo <b>Olympic 5 vòng tròn</b>: có cặp vòng cắt nhau, có cặp chẳng chạm nhau. Làm sao biết chắc hai vòng tròn cắt / chạm / rời nhau <b>mà không cần vẽ</b>?",
      reveal: "Chỉ cần so <b>khoảng cách hai tâm d</b> với <b>R + r</b> và <b>|R − r|</b>: nằm giữa → cắt nhau; bằng → tiếp xúc; ngoài → rời nhau. Một phép trừ, một phép cộng — biết ngay số phận của hai vòng tròn. Đơn giản đến bất ngờ! 🎯" },

    /* --- Chương VI --- */
    "ham-so-y-ax2": { emoji: "🏀",
      q: "Ném bóng rổ, phun đài nước, pháo hoa rơi… vì sao đường bay <b>luôn cong cùng một kiểu</b>? Cả ăng-ten chảo, đèn pha ô tô cũng cố tình làm theo đường cong đó!",
      reveal: "Đó là <b>parabol</b> — đồ thị của <b>y = ax²</b>. Trọng lực khiến mọi vật ném đi đều vẽ parabol trên trời; còn kỹ sư lợi dụng tính chất \"hội tụ về một điểm\" của nó để bắt sóng, chiếu xa. Hôm nay em làm chủ đường cong nổi tiếng nhất vật lý. 📡" },
    "phuong-trinh-bac-hai": { emoji: "🌾",
      q: "Nhà em có mảnh vườn chữ nhật <b>dài hơn rộng 5 m</b>, diện tích <b>84 m²</b>. Bố hỏi: \"Con tính giúp bố kích thước vườn?\" — em xử lý thế nào?",
      reveal: "Gọi rộng là x: x(x + 5) = 84 ⟹ <b>x² + 5x − 84 = 0</b> — một <b>phương trình bậc hai</b>! Giải ra x = 7 (rộng 7 m, dài 12 m). Bài hôm nay trao em \"chìa khoá vạn năng\" Δ = b² − 4ac mở được mọi phương trình bậc hai trên đời. 🗝️" },
    "he-thuc-vi-et": { emoji: "⚡",
      q: "Thách em: đọc nghiệm của <b>x² − 5x + 6 = 0</b> trong <b>2 giây</b>, không nháp, không máy tính, không cả Δ. Tin không?",
      reveal: "Nghiệm là <b>2 và 3</b> — vì tổng của chúng = 5, tích = 6! Đó là <b>định lí Viète</b>: nhìn tổng và tích là \"đọc vị\" nghiệm. Tuyệt chiêu nhẩm nghiệm nhanh nhất chương trình lớp 9, dân thi vào 10 ai cũng phải thủ sẵn. 🥷" },
    "lap-pt": { emoji: "📱",
      q: "Tăng mỗi cạnh của tấm ảnh vuông thêm <b>3 cm</b> thì diện tích thành <b>64 cm²</b>. Đố em tìm được cạnh ban đầu — chỉ bằng một phương trình?",
      reveal: "(x + 3)² = 64 ⟹ x + 3 = 8 ⟹ x = <b>5 cm</b>. \"Dịch\" đề văn thành phương trình rồi giải — đó là kỹ năng ăn điểm to nhất trong đề thi vào 10, và là thứ em luyện suốt bài hôm nay với đủ kiểu: diện tích, chuyển động, tìm số. ✍️" },

    /* --- Chương VII --- */
    "thong-ke": { emoji: "🗳️",
      q: "Lớp bình chọn nơi dã ngoại: tờ giấy ghi <b>Đà Lạt, Vũng Tàu, Đà Lạt, Đà Lạt, Vũng Tàu…</b> 40 phiếu lộn xộn. Làm sao biết ngay bên nào thắng mà không đếm đi đếm lại?",
      reveal: "Kẻ <b>bảng tần số</b>: mỗi lựa chọn một dòng, đếm một lượt là xong — rồi vẽ <b>biểu đồ cột</b> là ai nhìn cũng hiểu trong 3 giây. Thống kê chính là nghệ thuật biến đống số lộn xộn thành một bức tranh biết nói. 📊" },
    "tan-so-tuong-doi": { emoji: "⚖️",
      q: "Lớp A có <b>9/30</b> bạn mê bóng đá, lớp B có <b>10/40</b>. Lớp B nhiều fan hơn (10 &gt; 9) — vậy lớp B \"máu\" bóng đá hơn? Khoan, có gì đó sai sai…",
      reveal: "So số đếm là <b>bẫy</b>! Phải so phần trăm: lớp A = 9/30 = <b>30%</b>, lớp B = 10/40 = 25% → lớp A mới cuồng hơn. Đó là <b>tần số tương đối</b> — vũ khí chống bị số liệu \"lừa\", thứ em sẽ gặp cả đời khi đọc báo, xem quảng cáo. 🧠" },
    "tan-so-ghep-nhom": { emoji: "🌊",
      q: "Cả khối thi xong, cô nhận về <b>500 con điểm</b> lẻ tẻ từ 0,25 đến 10. Nhìn danh sách dài dằng dặc, làm sao thấy được \"bức tranh chung\" của khối?",
      reveal: "Gom điểm thành <b>nhóm</b>: [0;2), [2;4), [4;6)… rồi đếm mỗi nhóm — 500 con số co lại thành 5 cột biểu đồ, nhìn phát biết ngay khối học ổn hay không. <b>Ghép nhóm</b> là cách người lớn xử lý dữ liệu khổng lồ: điểm thi, lương, chiều cao… 🗂️" },

    /* --- Chương VIII --- */
    "phep-thu": { emoji: "🎲",
      q: "Chơi Cờ Cá Ngựa, em tung <b>2 con xúc xắc</b> cùng lúc. Đố em: có tất cả <b>bao nhiêu kết quả</b> có thể xảy ra? (Nhiều hơn 12 đấy!)",
      reveal: "Mỗi con có 6 mặt, độc lập nhau ⟹ 6 × 6 = <b>36 kết quả</b>. Tập hợp cả 36 khả năng đó gọi là <b>không gian mẫu</b> — nền móng để tính mọi xác suất. Chưa liệt kê được không gian mẫu thì đừng nói chuyện may rủi! 🎰" },
    "xac-suat": { emoji: "🎡",
      q: "Vòng quay trúng thưởng có <b>10 ô</b>, chỉ <b>1 ô</b> \"Trúng lớn\". Quảng cáo hét: \"Cơ hội trúng CỰC CAO!\". Em tính xem cơ hội thật là bao nhiêu — trước khi mất tiền?",
      reveal: "P(trúng) = 1/10 = <b>10%</b> — nghĩa là trung bình quay 10 lần mới trúng 1! <b>Xác suất</b> là môn \"vạch trần\" quảng cáo, game gacha, vé số… Ai hiểu xác suất, người đó khó bị dụ. Học để tỉnh táo! 🛡️" },

    /* --- Chương IX --- */
    "goc-noi-tiep": { emoji: "🎬",
      q: "Trong rạp phim vòng cung, có nhiều ghế ở <b>vị trí khác nhau</b> nhưng nhìn màn hình với <b>góc rộng y hệt nhau</b>. Ma thuật gì vậy?",
      reveal: "Các ghế đó nằm trên <b>cùng một cung tròn</b>, và <b>các góc nội tiếp cùng chắn một cung thì bằng nhau</b>! Thêm bí mật nữa: góc nội tiếp chắn nửa đường tròn luôn <b>vuông 90°</b> — định lý đẹp nhất nhì hình học lớp 9 đang chờ em. 🎥" },
    "duong-tron-ngoai-noi-tiep": { emoji: "🪵",
      q: "Có tấm gỗ hình tam giác, em muốn cưa ra <b>chiếc đĩa tròn TO NHẤT</b> có thể. Đặt compa vào đâu? Còn muốn vẽ vòng tròn đi qua đúng <b>3 cây cột</b> ngoài sân thì sao?",
      reveal: "Đĩa to nhất = <b>đường tròn nội tiếp</b> (tâm là giao 3 đường phân giác). Vòng qua 3 cột = <b>đường tròn ngoại tiếp</b> (tâm là giao 3 trung trực). Mỗi tam giác đều \"nuôi\" đúng hai vòng tròn này — bài hôm nay dạy em tìm tâm của chúng chuẩn từng milimét. 🧭" },
    "tu-giac-noi-tiep": { emoji: "🔮",
      q: "Vẽ tứ giác có <b>4 đỉnh cùng nằm trên một đường tròn</b>, rồi đo 2 góc đối diện và cộng lại. Làm với tứ giác khác… kết quả <b>luôn ra đúng một con số</b>. Số nào?",
      reveal: "Luôn là <b>180°</b>! Tứ giác nội tiếp giấu \"mật mã\" đó — và điều ngược lại cũng đúng: cứ tổng hai góc đối bằng 180° là 4 đỉnh nằm gọn trên một đường tròn. Đây là chìa khoá của hàng loạt bài chứng minh trong đề thi vào 10. 🔑" },
    "da-giac-deu": { emoji: "🐝",
      q: "Vì sao ong xây tổ hình <b>lục giác đều</b> — không tròn, không vuông, không tam giác? Loài ong có biết Toán không?",
      reveal: "Toán chứng minh: lục giác đều <b>lát kín</b> mặt phẳng mà tốn <b>ít sáp nhất</b> cho cùng diện tích chứa mật — ong là \"kỹ sư tối ưu\" bẩm sinh! Hôm nay em học ngôn ngữ của các hình hoàn hảo: mỗi góc lục giác đều bao nhiêu độ? Vì sao biển STOP có 8 cạnh? 🛑" },

    /* --- Chương X --- */
    "hinh-tru-non": { emoji: "🥤",
      q: "Đặt chiếc <b>phễu</b> úp vừa khít vào <b>lon nước</b> cùng đáy, cùng chiều cao. Đố em: phải rót <b>mấy phễu nước</b> mới đầy lon? (Cược là em đoán sai!)",
      reveal: "Đúng <b>3 phễu</b>! Thể tích hình nón = <b>⅓</b> thể tích hình trụ cùng đáy cùng cao — người Hy Lạp cổ đã kinh ngạc vì điều này. Học công thức V = πr²h và V = ⅓πr²h hôm nay, em tính được lon nước, ốc quế, bồn chứa, nón lá… 🍦" },
    "hinh-cau": { emoji: "🫧",
      q: "Vì sao bong bóng xà phòng <b>luôn tròn xoe</b> — dù em thổi qua vòng vuông hay hình sao? Thiên nhiên đang \"khoe\" một định lý đấy!",
      reveal: "Vì hình cầu chứa được <b>nhiều không khí nhất với ít \"vỏ\" nhất</b> — màng xà phòng lười nên tự co về dạng tối ưu! Hôm nay em nắm hai công thức quyền lực: <b>S = 4πR²</b> và <b>V = 4⁄3·πR³</b> — đủ để tính từ quả bóng đến… Trái Đất. 🌍" },

    /* --- Mở rộng --- */
    "ham-so-bac-nhat": { emoji: "🚕",
      q: "Đặt Grab, em có để ý giá luôn tính kiểu: <b>Tiền = phí mở cửa + số km × đơn giá</b>? Tiền điện, tiền gửi xe tháng, gói cước điện thoại… cũng chung một \"khuôn\". Khuôn đó là gì?",
      reveal: "Chính là <b>y = ax + b</b> — hàm số bậc nhất! (a = đơn giá mỗi km, b = phí mở cửa.) Và câu hỏi \"mỗi tháng để dành 500 nghìn thì bao lâu mua được điện thoại 6 triệu?\" cũng là nó: y = 500x → x = 12 tháng. Hiểu một công thức, đọc vị cả trăm hoá đơn. 💸" },
    "tam-giac-dong-dang": { emoji: "🏜️",
      q: "2600 năm trước, nhà thông thái <b>Thales</b> đo được chiều cao kim tự tháp Ai Cập mà <b>không trèo lên</b> — chỉ dùng một cây gậy và… bóng nắng. Ông làm thế nào?",
      reveal: "Bóng gậy và bóng kim tự tháp tạo hai <b>tam giác đồng dạng</b> — các cạnh tỉ lệ với nhau: chiều cao tháp / bóng tháp = chiều cao gậy / bóng gậy. Một phép chia là xong! Đồng dạng là \"máy phóng to – thu nhỏ\" của hình học, dùng trong bản đồ, phim ảnh, thiết kế. 📏" },
    "ti-le-vang": { emoji: "🌻",
      q: "Vì sao logo Apple, thẻ ATM, mặt nàng Mona Lisa… nhìn đều \"sướng mắt\" một cách khó tả? Hoa hướng dương và vỏ ốc cũng giấu chung một con số!",
      reveal: "Con số đó là <b>tỉ lệ vàng φ ≈ 1,618</b> — khi phần lớn / phần nhỏ = cả tổng / phần lớn. Nghệ sĩ, kiến trúc sư dùng nó hàng nghìn năm để tạo cảm giác cân đối hoàn hảo. Hôm nay em học cách \"nhìn\" ra φ ở khắp nơi. 🎨" },
    "phoi-canh": { emoji: "🛤️",
      q: "Đứng giữa đường ray nhìn về xa: hai thanh ray <b>song song</b> mà cứ như <b>chụm lại một điểm</b> ở chân trời. Mắt em bị lừa — hay Toán học đang vẽ?",
      reveal: "Đó là <b>phối cảnh</b>: mọi đường song song \"gặp nhau\" tại <b>điểm tụ</b> trên đường chân trời. Hoạ sĩ Phục Hưng khám phá ra luật này và làm tranh 3D trên giấy 2D. Học xong, em vẽ được con đường, căn phòng sâu hun hút chỉ với thước kẻ. 🖼️" },
    "on-thi-tong-hop": { emoji: "🏆",
      q: "Trận chung kết mà biết trước <b>sơ đồ chiến thuật</b> của đối thủ thì đá dễ hơn bao nhiêu? Đề thi vào 10 môn Toán cũng có \"sơ đồ\" cố định — em đã nhìn ra chưa?",
      reveal: "Đề vào 10 hầu như luôn gồm: <b>rút gọn căn thức → hệ/phương trình & bài toán thực tế → hàm số & Viète → hình đường tròn → câu khó lấy điểm 10</b>. Buổi ôn tổng hợp này chính là \"bản đồ chiến thuật\" giúp em phân bổ thời gian và gom điểm chắc từng câu. 🗺️" }
  };
  Object.keys(HOOKS).forEach(id => { if (lessons[id]) lessons[id].hook = HOOKS[id]; });

  /* Xuất dữ liệu ra App.DATA */
  App.DATA = { chapters, lessons, mentor, mentorFallback, games, practice, thinking };
})(window.App = window.App || {});
