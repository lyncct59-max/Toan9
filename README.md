# Toán 9 · Học theo phương pháp Feynman 🧠

Một website học **Toán lớp 9** hiện đại, chạy hoàn toàn trong trình duyệt — **không cần server, không cần cài đặt**. Mục tiêu: học 30 phút mỗi ngày để **hiểu bản chất và nhớ thật lâu**, thay vì học vẹt công thức.

Mọi tiến độ (streak, điểm, EXP, bài đã học, flashcard, ghi chú…) được lưu cục bộ bằng **LocalStorage** ngay trên máy bạn.

---

## 🚀 Cách chạy

**Cách 1 — Mở trực tiếp (đơn giản nhất).**
Nhấp đúp vào `index.html`, hoặc kéo nó vào trình duyệt (Chrome, Edge, Firefox, Safari). Trang web chạy ngay, kể cả khi không có mạng.

**Cách 2 — Chạy qua máy chủ cục bộ (khuyến nghị nếu font không tải).**
Mở terminal tại thư mục dự án rồi gõ:

```bash
python -m http.server 8000
```

Sau đó mở `http://localhost:8000` trong trình duyệt.

> 💡 Cả hai cách đều hoạt động. Dùng máy chủ cục bộ giúp tải font Google ổn định hơn; nếu offline, web tự dùng font hệ thống thay thế.

---

## 🪜 Phương pháp Feynman — mỗi bài đúng 5 bước

Mỗi bài học được thiết kế theo đúng quy trình Feynman để hiểu sâu:

1. **Giải thích đơn giản** — như đang kể cho học sinh lớp 5, dùng ẩn dụ gần gũi (ví dụ *"hàm số là chiếc máy biến số"*, *"hệ số góc là độ dốc con đường"*).
2. **Nhìn thấy tận mắt** — minh họa bằng hình SVG, đồ thị hoặc biểu đồ.
3. **Dùng trong đời thực** — ứng dụng cụ thể (tiền taxi, giá điện, đo cây bằng bóng nắng, pha nước, xác suất trò chơi…).
4. **Tự giảng lại** — bạn viết lại bài bằng lời của mình; hệ thống đối chiếu với các ý chính, gợi ý chỗ còn thiếu (**không chấm đúng/sai tuyệt đối**).
5. **Luyện tập** — bài tập chia 3 mức **Dễ · Trung bình · Nâng cao**, mỗi câu có lời giải từng bước.

---

## ✨ Tính năng

- **Trang chủ:** chuỗi ngày học 🔥, lịch học, vòng tròn mục tiêu 30 phút/ngày, tiến độ từng chương.
- **Lộ trình:** các chương được mở khóa dần — xong bài này mới mở bài kế.
- **Buổi học 30 phút:** chia 4 giai đoạn (ôn cũ · học mới · luyện tập · tự giảng) kèm đồng hồ đếm.
- **Đồ thị tương tác:** kéo thanh trượt `a`, `b` để thấy đường thẳng `y = ax + b` và phương trình thay đổi trực tiếp.
- **Flashcard:** thẻ lật 3D tự sinh từ mỗi bài.
- **Ôn tập ngắt quãng (SRS):** nhắc ôn lại sau **1 · 3 · 7 · 14 · 30 ngày** để nhớ lâu.
- **Trò chơi hóa:** EXP, Level, huy hiệu, bảng thành tích, hiệu ứng pháo giấy khi hoàn thành.
- **AI Mentor:** trò chuyện hỏi đáp, trả lời bằng ví dụ thực tế thay vì lý thuyết khô khan.
- **Nhiều dạng bài:** trắc nghiệm, điền đáp án, ghép cặp.
- **Giao diện sáng/tối**, responsive cho cả điện thoại và máy tính.

---

## 📂 Cấu trúc thư mục

```
toan9-feynman/
├── index.html              # Khung trang + nạp script theo thứ tự
├── README.md               # Tài liệu này
└── assets/
    ├── css/
    │   └── styles.css      # Toàn bộ hệ thống thiết kế (sáng + tối)
    └── js/
        ├── data.js         # Nội dung: chương, bài học, bài tập, mentor
        ├── storage.js      # Lớp lưu trữ LocalStorage (App.Storage)
        ├── engine.js       # Lõi: EXP/level, huy hiệu, SRS, đồ thị, mentor…
        └── app.js          # Giao diện, điều hướng (router), khởi động
```

Thứ tự nạp script là cố định: `data.js → storage.js → engine.js → app.js`. Mỗi file gắn mô-đun vào không gian tên chung `window.App`.

---

## 🏗️ Kiến trúc & lựa chọn thiết kế

- **HTML/CSS/JS thuần — không phụ thuộc thư viện ngoài.** Không Tailwind, không Chart.js. Đồ thị và biểu đồ được vẽ trực tiếp bằng `<canvas>` / SVG. Nhờ vậy chỉ cần mở `index.html` là chạy được, kể cả offline, và rất ít rủi ro lỗi.
- **Không dùng module ES6 / `fetch`.** Mọi dữ liệu nằm sẵn trong `data.js` dưới dạng đối tượng JavaScript, nên website chạy tốt cả khi mở bằng giao thức `file://` (không vướng lỗi CORS).
- **"AI" không cần server.** Bước 4 (tự giảng) và AI Mentor hoạt động theo cơ chế **đối chiếu từ khóa**: đo mức độ bao phủ các ý chính và gợi ý phần còn thiếu, thay vì gọi API bên ngoài.

> 🔧 Muốn nâng cấp? Bạn có thể thay phần vẽ đồ thị bằng Chart.js, hoặc nối bước 4 / Mentor với một API thật — cấu trúc đã tách mô-đun sẵn để dễ mở rộng.

---

## ➕ Cách thêm bài học mới

Toàn bộ nội dung nằm trong `assets/js/data.js`. Hệ thống hỗ trợ đầy đủ cấu trúc **5 bài dễ / 5 trung bình / 5 nâng cao** — bạn chỉ cần thêm câu vào các mảng tương ứng.

**Bước 1.** Thêm `id` của bài vào đúng chương trong `chapters`:

```js
{ id: "dai-so", name: "Đại số", emoji: "🧮", color: "#16a34a",
  lessons: ["can-bac-hai", "ham-so-bac-nhat", /* …, */ "bai-moi-cua-ban"] }
```

**Bước 2.** Thêm bài vào đối tượng `lessons` theo khuôn mẫu:

```js
"bai-moi-cua-ban": {
  id: "bai-moi-cua-ban",
  chapterId: "dai-so",
  title: "Tên bài học",
  emoji: "📘",
  estMinutes: 30,

  feynman: {
    s1: { html: `<p>Giải thích đơn giản…</p>
                 <div class="eli5">Ẩn dụ dễ nhớ cho học sinh lớp 5.</div>` },

    // Bước 2 chọn MỘT trong ba kiểu:
    s2: { type: "svg",   svg: App.DATA._svg.machine, caption: "Chú thích hình." },
    // s2: { type: "graph", caption: "Kéo a, b để xem y = ax + b đổi." },   // đồ thị tương tác
    // s2: { type: "chart", chart: { labels:["A","B"], values:[3,5], color:"#16a34a" } },

    s3: [
      { ic: "🚕", title: "Ứng dụng 1", html: "<p>Mô tả tình huống thực tế.</p>" }
    ],

    s4: {
      prompt: "Hãy tự giải thích lại bài này bằng lời của em.",
      keywords: ["ý chính 1", "ý chính 2", "ý chính 3"],
      sample: "Một đoạn mẫu để học sinh đối chiếu sau khi tự viết."
    }
  },

  exercises: {
    easy: [
      // Trắc nghiệm: answer là CHỈ SỐ của đáp án đúng trong options (bắt đầu từ 0)
      { type: "mc", q: "Câu hỏi?", options: ["A","B","C","D"], answer: 1,
        sol: ["Bước giải 1.", "Bước giải 2."] },

      // Điền đáp án: answer là đáp án chuẩn, accept là các cách viết được chấp nhận
      { type: "fill", q: "Tính …", answer: "7", accept: ["7.0", "bảy"],
        sol: ["Giải thích từng bước."] }
    ],
    medium: [
      // Ghép cặp: mỗi phần tử pairs là [trái, phải]
      { type: "match", q: "Nối cho đúng:", pairs: [["x²","bình phương"], ["√x","căn bậc hai"]],
        sol: ["Giải thích cách ghép."] }
    ],
    hard: [ /* … */ ]
  },

  flashcards: [
    { front: "Mặt trước thẻ", back: "Mặt sau thẻ" }
  ]
}
```

**Ba dạng bài tập được hỗ trợ:**

| `type`  | Trường bắt buộc                         | Ghi chú |
|---------|------------------------------------------|---------|
| `mc`    | `options` (mảng), `answer` (chỉ số)      | Trắc nghiệm một đáp án |
| `fill`  | `answer`; tùy chọn `accept` (mảng)       | So khớp có chuẩn hóa (bỏ dấu cách thừa, không phân biệt hoa/thường) |
| `match` | `pairs` (mảng các cặp `[trái, phải]`)    | Bấm chọn để nối, hợp với điện thoại |

Mọi câu nên có `sol` — mảng các bước giải hiển thị sau khi làm xong.

---

## 🎮 Cách tính điểm & lên hạng

- **EXP nhận được:** hoàn thành 1 bước `+10`, làm đúng 1 câu `+5`, tự giảng (Feynman) `+20`, ôn 1 thẻ `+4`, hoàn thành trọn bài `+50`.
- **Level:** tổng EXP cần để đạt đầu Level *L* là `30·L·(L−1)` — càng lên cao càng cần nhiều EXP. Danh hiệu đổi dần: *Tân binh → Đang tiến bộ → Khá vững → Thành thạo → Cao thủ → Bậc thầy Toán học*.
- **Huy hiệu:** mở khóa theo cột mốc (bước đầu tiên, giữ chuỗi 3/7 ngày, làm đúng trọn bộ bài tập, hoàn thành cả chương Đại số / Hình học…).
- **Ôn tập ngắt quãng:** thẻ đã "nhớ" được đẩy sang khoảng cách dài hơn theo dãy **1 · 3 · 7 · 14 · 30 ngày**; thẻ "chưa nhớ" quay lại từ đầu.

---

## 💾 Lưu trữ & lưu ý

- Dữ liệu nằm trong **LocalStorage của trình duyệt** (khóa bắt đầu bằng `toan9:`). Mỗi trình duyệt / thiết bị có tiến độ riêng và không đồng bộ với nhau.
- **Xóa dữ liệu duyệt web** hoặc dùng chế độ ẩn danh sẽ làm mất tiến độ.
- Muốn làm lại từ đầu: vào **Cài đặt → Xóa toàn bộ dữ liệu**.
- **Giao diện sáng/tối:** lần đầu tự chọn theo cài đặt hệ thống; sau đó ghi nhớ lựa chọn của bạn. Đổi bằng nút 🌙 trên thanh trên cùng (máy tính) hoặc trong Cài đặt (điện thoại).

---

Chúc bạn học vui và nhớ lâu! 🎯

---

## 🆕 Bản mở rộng

**Lộ trình bám sát SGK Toán 9** — bổ sung các bài: Hàm số y = ax², Hệ thức Vi-ét, Góc nội tiếp (kèm hình SVG minh hoạ riêng).

**Chương "🎯 Ôn thi vào 10"** — bài *Ôn thi tổng hợp* gom dạng bài trọng tâm + bộ bài tập 3 mức độ kèm lời giải.

**Chương "🎨 Toán & Hội hoạ"** — ứng dụng Toán 9 vào nghệ thuật:
- *Tỉ lệ vàng (φ ≈ 1,618)* — vì sao bố cục đẹp.
- *Phối cảnh & điểm tụ* — đường thẳng, tỉ lệ trong tranh 3 chiều.

**Flashcard** — mỗi bài mới đều có 5 thẻ; tất cả tự động vào hệ thống ôn tập ngắt quãng (SRS).

**⚔️ Đấu trường Toán học (game phần thưởng)** — sau khi học đủ **30 phút**, mở khoá chế độ giải trí:
- Đấu 3 quái (🐌 Sên Số Học → 🦉 Cú Đại Số → 🐲 Rồng Hình Học), HP & độ khó tăng dần.
- Trả lời trắc nghiệm nhanh có **đồng hồ đếm ngược**; đúng + nhanh → **combo** tăng sát thương; sai/hết giờ → mất máu, reset combo.
- Thắng cả 3 quái: +40 EXP, hiệu ứng pháo giấy và huy hiệu **⚔️ Vô địch Đấu trường**.
- Vào bất cứ lúc nào qua mục **Đấu trường** ở thanh điều hướng. Ngân hàng ~30 câu hỏi đa chủ đề, xáo trộn mỗi ván.

> Toàn bộ vẫn chạy offline, không backend. Bản 1 tệp `toan9-feynman.html` đã gộp sẵn nội dung mới.

---

## 🔁 Nâng cấp duy trì thói quen học tập

Thiết kế theo vòng lặp thói quen **gợi ý → hành động → phần thưởng**, và đặc biệt **giảm trừng phạt khi lỡ ngày** — nguyên nhân số 1 khiến người học bỏ cuộc.

**Nhiệm vụ hằng ngày** — 4 nhiệm vụ tự reset mỗi ngày, tự động cập nhật từ thao tác thật của học sinh:
- ⏱️ Học 15 phút · 📖 Học 2 bước mới · 🃏 Ôn 5 thẻ · ✏️ Làm 1 bộ bài tập.
- Hoàn thành cả 4 → nút **Nhận thưởng**: +25 EXP và +1 🧊 Bùa giữ chuỗi.

**🧊 Bùa giữ chuỗi (streak freeze)** — nếu lỡ một ngày, hệ thống **tự dùng Bùa** để chuỗi không bị đứt (mỗi Bùa cứu 1 ngày). Kiếm Bùa bằng cách hoàn thành nhiệm vụ ngày và đạt mục tiêu số ngày/tuần. Chuỗi vẫn hiển thị "đang sống" khi còn Bùa cứu được.

**🗓️ Kế hoạch hôm nay & Bắt đầu nhanh** — trang chủ nay có khối nhiệm vụ + nút *Học tiếp*, *Ôn tập (số thẻ đến hạn)*, *Đấu trường*. Khi chuỗi sắp đứt sẽ có dải nhắc nổi bật để học sinh hành động ngay.

**⏰ Nhắc học mỗi ngày** — trong Cài đặt, bật nhắc và chọn giờ; khi mở web sau giờ đó mà hôm ấy chưa học sẽ hiện lời nhắc (kèm thông báo trình duyệt nếu được cấp quyền).

> Tất cả vẫn offline, lưu cục bộ. Logic đã được kiểm thử: nhiệm vụ cập nhật đúng, thưởng chỉ nhận một lần/ngày, Bùa cứu được khi lỡ ngày và chuỗi đứt đúng lúc hết Bùa.


---

## 📘 Cập nhật theo SGK Kết nối tri thức (Toán 9 – Tập 1)

Khu **Luyện tập** đã được dựng lại bám đúng cấu trúc sách *Kết nối tri thức với cuộc sống – Toán 9, Tập 1*: **5 chương, theo từng bài (Bài 1–17)**, mỗi bài một bộ bài tập theo nội dung sách, nhóm rõ theo chương.

- **Chương I.** Phương trình & hệ hai phương trình bậc nhất hai ẩn — Bài 1, 2, 3
- **Chương II.** Phương trình & bất phương trình bậc nhất một ẩn — Bài 4 (PT tích, PT chứa ẩn ở mẫu), 5 (bất đẳng thức), 6 (bất phương trình)
- **Chương III.** Căn bậc hai và căn bậc ba — Bài 7, 8 (khai căn), 9 (rút gọn, trục căn thức), 10 (căn bậc ba)
- **Chương IV.** Hệ thức lượng trong tam giác vuông — Bài 11 (tỉ số lượng giác), 12 (giải tam giác vuông)
- **Chương V.** Đường tròn — Bài 13 (mở đầu), 14 (cung & dây, góc ở tâm), 15 (độ dài cung, hình quạt, vành khuyên), 16–17 (vị trí tương đối)

Tổng **112 câu** trắc nghiệm/điền số, **có lời giải**, lưu điểm cao nhất mỗi bài, có thanh tiến độ và đánh dấu ✅ bài đạt. Bổ sung các chủ đề trước đây chưa có: hệ phương trình (thế/cộng đại số), phương trình tích & chứa ẩn ở mẫu, bất đẳng thức & bất phương trình, khai căn – rút gọn căn thức, căn bậc ba, cung & dây, độ dài cung – hình quạt – vành khuyên, vị trí tương đối của đường thẳng/đường tròn.

> Toàn bộ 112 đáp án đã được kiểm thử tự động khớp bộ chấm; giao diện nhóm theo chương, chạy được cả khi trình duyệt chặn lưu trữ.

---

## 🗂️ Lộ trình sắp theo đúng SGK Kết nối tri thức – Tập 1

M��c **Lộ trình** nay gồm **đúng 5 chương Tập 1** với **17 bài** (đầy đủ phương pháp Feynman: ẩn dụ ELI5, hình minh hoạ, ứng dụng thực tế, tự giảng lại, bài tập 3 mức + flashcard):

- **Chương I.** Bài 1 (Khái niệm PT & hệ bậc nhất hai ẩn) · Bài 2 (Giải hệ: thế & cộng đại số) · Bài 3 (Giải toán bằng lập hệ)
- **Chương II.** Bài 4 (PT tích & PT chứa ẩn ở mẫu) · Bài 5 (Bất đẳng thức) · Bài 6 (Bất phương trình bậc nhất một ẩn)
- **Chương III.** Bài 7 (Căn bậc hai) · Bài 8 (Khai căn nhân/chia) · Bài 9 (Rút gọn căn thức) · Bài 10 (Căn bậc ba)
- **Chương IV.** Bài 11 (Tỉ số lượng giác) · Bài 12 (Hệ thức cạnh–góc & giải tam giác vuông)
- **Chương V.** Bài 13 (Mở đầu đường tròn) · Bài 14 (Cung & dây) · Bài 15 (Độ dài cung, hình quạt, vành khuyên) · Bài 16 (Vị trí đường thẳng–đường tròn) · Bài 17 (Vị trí hai đường tròn)

Đã **bổ sung 13 bài Feynman mới** cho các bài còn thiếu (với 9 hình minh hoạ SVG mới và 117 bài tập có lời giải). Các nội dung Tập 2 và Hội họa (parabol, phương trình bậc hai, Vi-ét, thống kê, xác suất, tỉ lệ vàng, phối cảnh, ôn thi) được gom vào nhóm **🌟 Mở rộng** để không mất, đặt sau 5 chương chính.

> Kiểm thử tự động: 117/117 đáp án bài mới khớp bộ chấm; mọi bài đủ 5 bước + flashcard; lộ trình hiển thị đủ 5 chương và chạy được cả khi trình duyệt chặn lưu trữ.

---

## 📗 Thêm trọn bộ Tập 2 (Kết nối tri thức) — Chương VI–X

Đã tra cứu mục lục **Toán 9 KNTT Tập 2** và thêm đầy đủ vào **cả Lộ trình lẫn Luyện tập**:

- **Chương VI.** Hàm số y = ax² & Phương trình bậc hai — Bài 18, 19, 20 (Viète), 21 (giải toán bằng lập phương trình)
- **Chương VII.** Tần số và tần số tương đối — Bài 22, 23 (tần số tương đối), 24 (ghép nhóm)
- **Chương VIII.** Xác suất của biến cố — Bài 25 (phép thử & không gian mẫu), 26
- **Chương IX.** Đường tròn ngoại tiếp & nội tiếp — Bài 27 (góc nội tiếp), 28 (ngoại/nội tiếp tam giác), 29 (tứ giác nội tiếp), 30 (đa giác đều)
- **Chương X.** Một số hình khối trong thực tiễn — Bài 31 (hình trụ & nón), 32 (hình cầu)

Lộ trình giờ có **10 chương + nhóm Mở rộng**, tổng **39 bài** học Feynman. Luyện tập có **31 bộ / 203 câu** trải đều Chương I–X, nhóm theo chương, có lời giải và lưu điểm. Công thức hình khối dùng đúng SGK: trụ V = πr²h, Sxq = 2πrh; nón V = ⅓πr²h, Sxq = πrl; cầu S = 4πR², V = (4/3)πR³.

> Kiểm thử tự động: 39/39 bài đủ 5 bước + flashcard, 203/203 đáp án luyện tập khớp bộ chấm, lộ trình hiển thị đủ 10 chương, mở bài & luyện tập Tập 2 chạy đúng, 0 lỗi và vẫn chạy khi trình duyệt chặn lưu trữ.

---

## 👨‍👩‍👧 Giao bài · Góc phụ huynh · Gợi ý lý thuyết

Ba nâng cấp giúp quản lý việc học và tạo thói quen:

**1. Giao bài bắt buộc.** Trong **Cài đặt → Phụ huynh & giao bài → Mở** (hoặc `#/phu-huynh`), bố mẹ chọn bài học hoặc bộ luyện tập để **giao cho con**. Các bài này hiện ngay trên trang chính của con ở thẻ **“📌 Bài tập được giao”** kèm thanh tiến độ và nút **“Làm ngay”**; tự đánh dấu ✅ khi con hoàn thành bài học (xong 5 bước) hoặc đạt bộ luyện tập (≥ 50%).

**2. Góc phụ huynh theo dõi.** Một trang riêng cho bố mẹ:
- Tổng quan: chuỗi ngày học, số bài đã hoàn thành, số bộ luyện tập đạt.
- **Biểu đồ số phút học 7 ngày** (cột xanh = đạt mục tiêu ngày đó) + đặt **mục tiêu phút/ngày**.
- **Nhật ký hoạt động gần đây** của con (hoàn thành bài, luyện tập, huy hiệu, thắng Đấu trường…).
- **Khóa PIN**: đặt mã PIN để chỉ phụ huynh mở được khu vực này.
- Dữ liệu lưu trên thiết bị (không cần internet); phù hợp khi con và bố mẹ dùng chung máy/điện thoại.

**3. Gợi ý lý thuyết khi luyện tập.** Mỗi bộ luyện tập có nút **“💡 Gợi ý lý thuyết (mở ra khi quên)”** — bung ra phần nhắc nhanh kiến thức của đúng bài đó, kèm nút **“📖 Mở bài học đầy đủ”** để ôn lại ngay mà không rời mạch làm bài.

> Kiểm thử tự động: mở Góc phụ huynh, giao bài (hiện trên dashboard), hoàn thành → tự đánh dấu xong, đặt/kiểm tra PIN, gợi ý lý thuyết trỏ đúng bài — tất cả chạy đúng, 0 lỗi, vẫn hoạt động khi trình duyệt chặn lưu trữ.

---

## 🧭 Lời giải từng bước + Phát hiện chủ đề yếu để nhắc ôn

Hai nâng cấp trọng tâm về **học tập** (không phải giao diện):

**1. Lời giải từng bước.** Sau mỗi câu, lời giải hiện thành các **bước đánh số** ("Bước 1 → Bước 2 → …") thay vì một dòng đáp án — giúp học sinh theo được mạch suy luận. Với câu nhiều bước còn có nút **"💡 Gợi ý"** hé lộ **riêng bước 1** *trước khi* làm, khuyến khích tự nghĩ thay vì xem ngay đáp án. Áp dụng cho cả bài tập trong bài học lẫn phần Luyện tập.

**2. Phát hiện chủ đề yếu để nhắc ôn.** Mỗi lần trả lời đúng/sai được ghi nhận theo **từng bài**. Khi một bài có tỉ lệ đúng thấp (đã làm ≥ 3 câu, đúng < 60%), trang chính hiện thẻ **"🎯 Cần ôn lại"** liệt kê tối đa 3 phần yếu nhất kèm % đúng và số câu sai, với hai nút:
- **📖 Ôn lý thuyết** → mở lại đúng bài học đó.
- **📒 Luyện lại** → mở lại bộ luyện tập tương ứng.

Giọng nhắc mang tính khích lệ ("Vài phần em còn hay nhầm — ôn nhanh rồi luyện lại là chắc kiến thức ngay!"), không chê bai; dữ liệu lưu trên thiết bị.

> Kiểm thử tự động: lời giải tách đúng thành nhiều "Bước", nút gợi ý hiện bước 1, ghi nhận đúng/sai theo bài, phát hiện chủ đề yếu (vd 20% → vào thẻ Cần ôn lại), hai nút điều hướng đúng bài học & bộ luyện tập — 0 lỗi, vẫn chạy khi trình duyệt chặn lưu trữ.

---

## 🧠 Bài tập tư duy · Tự luận · Cá nhân hoá

M��t khu mới **"Rèn tư duy & Tự luận"** (menu bên trái, hoặc `#/tu-duy`) — nâng phần học từ "làm đúng đáp án" lên "biết suy luận và trình bày".

**Bài tập tư duy (27 bài).** Bốn loại kỹ năng, gắn nhãn rõ: 🧩 **Suy luận**, 📐 **Chứng minh**, 🌍 **Mô hình hoá**, 💬 **Giải thích** — trải đều Chương I–X. Trắc nghiệm suy luận có **lời giải từng bước**; ví dụ "vì sao nhân số âm thì đổi chiều", "so sánh 2√3 và 3√2 không dùng máy tính", "khi nào phương trình bậc hai vô nghiệm".

**Tự luận có tự chấm.** Bài tự luận (chứng minh, giải thích, bài toán thực tế) cho học sinh **viết bài làm vào ô soạn thảo** (viết ra để nhớ lâu), sau đó bấm **"Xem lời giải mẫu & tự chấm"** để hiện **lời giải mẫu** và **bảng tiêu chí (rubric)** tick từng ý đã làm được, rồi **tự đánh giá** (Làm được / Gần đúng / Chưa được). Cách này rèn kỹ năng trình bày — thứ trắc nghiệm không rèn được — mà không cần máy chấm.

**Cá nhân hoá.** Khu này **ưu tiên đúng phần học sinh còn yếu**: dựa trên dữ liệu đúng/sai đã tích luỹ, mục **"✨ Đề xuất cho em"** đưa lên đầu các bài thuộc chủ đề hay nhầm (gắn nhãn **★ nên ôn**), và mỗi bài làm xong lại gợi ý **"Bài tiếp theo"** phù hợp. Kết quả tự chấm quay lại cập nhật **hồ sơ điểm yếu** → khép kín vòng học: làm sai → được nhắc ôn → luyện đúng chỗ yếu.

M��i bài có nút **📖 Ôn lý thuyết** mở lại đúng bài học liên quan. Làm bài được cộng EXP (suy luận +8, tự luận +12).

> Kiểm thử tự động: 27 bài (12 trắc nghiệm suy luận chấm đúng + 15 tự luận có mẫu & tiêu chí), đề xuất ưu tiên đúng chủ đề yếu (★ nên ôn), lời giải từng bước, tự chấm cập nhật hồ sơ điểm yếu, điều hướng "Bài tiếp theo" & "Ôn lý thuyết" — 0 lỗi, vẫn chạy khi trình duyệt chặn lưu trữ.

---

## 📈 Kiểm tra định kỳ & Trang Tiến bộ — đo sự tiến bộ để giữ động lực

Động lực bền vững nhất không phải điểm thưởng, mà là **nhìn thấy mình giỏi lên**. Bản này bổ sung "vòng đo tiến bộ":

**Kiểm tra định kỳ tính giờ** (menu Tiến bộ hoặc `#/kiem-tra`): mỗi đề **12 câu trộn đều các chương, 12 phút**, sinh ngẫu nhiên nên làm lại nhiều lần không trùng. Trong bài kiểm tra **nút gợi ý bị tắt** (đo thực lực). Nộp bài xong hiện: điểm & %, thời gian làm, **so sánh với lần liền trước** ("📈 Tăng +17% so với lần trước!"), và **phân tích theo chương** để biết hổng ở đâu. Câu sai được ghi vào hồ sơ điểm yếu → tự nối vào thẻ "Cần ôn lại" và khu Rèn tư duy.

**Trang Tiến bộ** (`#/tien-bo`): bảng điều khiển dành cho học sinh (và bố mẹ xem cùng):
- **Biểu đồ điểm các lần kiểm tra** theo thời gian — cột sau cao hơn cột trước chính là bằng chứng tiến bộ.
- **Phút học 7 ngày** + so với tuần trước ("Nhiều hơn tuần trước +45 phút 🔥").
- **Điểm mạnh** (chủ đề ≥ 80% đúng) và **Cần cố gắng** (chủ đề < 60%) — khen trước, nhắc sau.
- Tổng quan: số bài học xong, bộ luyện + bài tư duy đã làm, chuỗi ngày dài nhất.

**Huy hiệu gắn với tiến bộ** (không chỉ chăm chỉ): 📝 *Thử sức đầu tiên* (làm 1 bài kiểm tra), 📈 *Vượt kỷ lục* (điểm cao hơn lần liền trước), 🎖️ *Cao thủ kiểm tra* (đạt ≥ 90%).

Cơ chế giữ chân tổng thể của app giờ đủ 3 tầng: **thói quen hằng ngày** (chuỗi 🔥, nhiệm vụ ngày, bùa giữ chuỗi, nhắc học, bài được giao) → **phần thưởng** (EXP, cấp độ, huy hiệu, Đấu trường) → **bằng chứng tiến bộ** (kiểm tra định kỳ, biểu đồ, so tuần, vượt kỷ lục). Lời nhắn khi điểm giảm được viết tử tế ("phần sai đã được ghi lại để ôn đúng chỗ — cố lên 🌱"), tránh làm học sinh nản.

> Kiểm thử tự động: đề 12 câu trộn chương, đồng hồ 12:00 đếm ngược, gợi ý bị tắt trong bài kiểm tra, nộp bài lưu điểm + phân tích chương + huy hiệu "Thử sức đầu tiên", lần 2 điểm cao hơn mở "Vượt kỷ lục", trang Tiến bộ vẽ 2 biểu đồ + điểm mạnh/yếu + so tuần — 0 lỗi, vẫn chạy khi trình duyệt chặn lưu trữ.

---

## 📋 Báo cáo tuần gửi phụ huynh (qua Zalo)

Nút **"📋 Báo cáo tuần"** có ở hai nơi: trang **Tiến bộ** (học sinh) và **Góc phụ huynh**. Bấm là app tự tổng hợp một đoạn văn bản gọn để **sao chép & dán vào Zalo/Messenger**, gồm: thời gian học trong tuần (so với tuần trước), chuỗi ngày 🔥, số bài học hoàn thành, số bộ luyện đạt, kết quả kiểm tra định kỳ (kèm tăng/giảm % so lần trước), tiến độ bài được giao, **điểm mạnh** và **phần cần kèm thêm**, huy hiệu mới — kết bằng một lời nhắn phù hợp (khen khi học đều, gợi ý bố mẹ động viên khi có phần yếu, nhắc mở app khi cả tuần chưa học).

Đây là cách để bố mẹ theo dõi **từ xa** dù app chạy hoàn toàn trên máy của con: mỗi tuần con (hoặc bố mẹ mở Góc phụ huynh) bấm một nút, gửi một tin nhắn — thành "nghi thức" duy trì thói quen.

> Kiểm thử tự động: báo cáo sinh đủ 8/8 mục với dữ liệu mẫu, nút Sao chép hoạt động (kèm phương án dự phòng cho trình duyệt cũ), hiển thị ở cả hai trang — 0 lỗi.

---

## 🔊 Giọng thầy/cô giảng bài (không cần mạng)

Phần lý thuyết giờ có **giọng giảng bài**: nút **"🔊 Nghe giảng"** xuất hiện ở **cả 4 bước lý thuyết** của mỗi bài học (① Giải thích ELI5 — đọc cả bài giảng, ② Hình minh hoạ — đọc chú thích, ③ Ứng dụng đời thực — đọc lần lượt từng ví dụ, ④ Tự giảng lại — đọc yêu cầu) và trong **"Gợi ý lý thuyết"** của phần Luyện tập (đọc phần nhắc nhanh kiến thức).

- Mở đầu thân thiện: *"Cô giảng nhé…"* / *"Thầy giảng nhé…"* (chọn xưng hô trong Cài đặt).
- **Đọc đúng kí hiệu Toán**: tự chuyển √ → "căn", x² → "x bình phương", ∛ → "căn bậc ba", π → "pi", ⟹ → "suy ra", ≥/≤/≠, Δ → "đen-ta", ° → "độ", ⅓ → "một phần ba"… nên nghe tự nhiên như cô giảng thật.
- **Điều khiển**: bấm lần nữa để Tạm dừng ⏸ / Nghe tiếp ▶; tự dừng khi chuyển bước hoặc chuyển trang; nút nhấp nháy nhẹ khi đang đọc.
- **Cài đặt → Giọng giảng bài**: chọn Cô/Thầy, tốc độ (Chậm/Vừa/Nhanh), chọn giọng tiếng Việt có trên thiết bị, và nút Nghe thử.
- Chạy bằng **giọng đọc có sẵn của trình duyệt/điện thoại (Web Speech API)** — offline, không tốn phí. Nếu trình duyệt không hỗ trợ, app báo nhẹ nhàng và mọi thứ khác vẫn hoạt động. Mẹo: trên điện thoại Android/iOS cài thêm giọng tiếng Việt trong cài đặt Text-to-Speech để giọng hay hơn.

> Kiểm thử tự động: nút hiện đủ ở 4 bước + gợi ý luyện tập, xưng Cô/Thầy đúng, kí hiệu Toán được đọc thành lời (căn, bình phương…), tạm dừng/nghe tiếp, tự hủy khi chuyển bước/trang, chọn giọng + tốc độ trong Cài đặt có hiệu lực, trình duyệt không hỗ trợ chỉ hiện thông báo — 0 lỗi.

---

## 🔊 Sửa giọng đọc trên Windows: chỉ dùng giọng tiếng Việt + hướng dẫn cài miễn phí

Trước đây trên Windows (Chrome) app rơi về giọng tiếng Anh vì máy chưa có giọng Việt. Bản này sửa triệt để:

- **Không bao giờ tự đọc bằng giọng Anh nữa.** App chỉ chọn trong các giọng tiếng Việt, xếp hạng ưu tiên: giọng **Natural của Edge (HoaiMy/NamMinh)** → Google → Microsoft An. Danh sách giọng trong Cài đặt cũng chỉ hiện giọng Việt.
- **Chờ danh sách giọng nạp xong** (Chrome/Edge nạp không đồng bộ) rồi mới quyết định — hết cảnh bấm sớm bị đọc sai giọng.
- **Thiếu giọng Việt → hiện bảng hướng dẫn cài MIỄN PHÍ** ngay trong app:
  1. **Nhanh nhất trên Windows:** mở app bằng **Microsoft Edge** (có sẵn trong Windows) — Edge kèm giọng tiếng Việt tự nhiên **HoaiMy/NamMinh**, nghe được ngay, chất lượng rất tốt.
  2. **Dùng Chrome trên Windows:** Settings → Time & Language → Language → thêm **Tiếng Việt** (tick Text-to-speech) → khởi động lại; Chrome sẽ có giọng **Microsoft An**.
  3. **Điện thoại:** Android cài giọng Việt trong mục Chuyển văn bản thành giọng nói (Google); iPhone thêm giọng Tiếng Việt trong Trợ năng.
  Kèm nút "🔄 Tôi đã cài — thử lại" và lựa chọn "Vẫn đọc bằng giọng hiện có" nếu người dùng chấp nhận giọng lơ lớ.
- **Cài đặt → Giọng giảng bài** hiện trạng thái: "✅ Giọng tiếng Việt: HoaiMy…" hoặc "⚠️ Chưa có giọng tiếng Việt" + nút mở hướng dẫn.

> Kiểm thử tự động 3 kịch bản: máy chỉ có giọng Anh → không đọc, hiện hướng dẫn (nhắc Edge); máy Edge có HoaiMy → tự chọn giọng Natural và đọc ngay; giọng nạp trễ → vẫn đọc đúng sau khi nạp. Hồi quy pause/resume, Cô/Thầy, tốc độ: đạt — 0 lỗi.

---

## 🎙️ Học sinh tự giảng — thu âm, lưu và nghe lại bài giảng của chính mình

Đúng tinh thần Feynman nhất: ở **bước ④ Tự giảng lại** của mỗi bài học có khối **"🎙️ Giảng bằng giọng của em"** — học sinh đọc/giảng lại nội dung bài như một thầy cô thật, thu âm, rồi **nghe lại chính mình**.

- **Thu âm** bằng micro của máy (Chrome/Edge/điện thoại), tối đa 2 phút/bản, đồng hồ đếm thời gian, nút đỏ nhấp nháy khi đang thu.
- **Nghe thử → 💾 Lưu** (hoặc 🔄 Thu lại). Mỗi bài học lưu một bản giảng mới nhất; bản thu nằm trên máy, không gửi đi đâu.
- **Nghe lại mọi lúc**: ngay trong bài học (khối "Bài giảng em đã lưu") và ở trang **Tiến bộ → "🎙️ Nghe lại bài giảng của em"** — danh sách các bản thu theo bài, bấm ▶ nghe, 🗑 xoá.
- **Động lực**: +15 EXP cho bản thu đầu tiên của mỗi bài; huy hiệu mới **🎙️ Bài giảng đầu tiên** (lưu 1 bản) và **🧑‍🏫 Người thầy nhí** (giảng 3 bài khác nhau); hoạt động được ghi vào nhật ký để bố mẹ thấy trong Góc phụ huynh & báo cáo tuần.
- An toàn bộ nhớ: file âm thanh lưu ở **khoá riêng** (không làm chậm dữ liệu học tập), có cảnh báo khi đầy bộ nhớ; trình duyệt không hỗ trợ thu âm thì hiện ghi chú thân thiện, không ảnh hưởng phần khác.

Vì sao đáng làm: nói ra thành lời buộc não sắp xếp lại kiến thức (hiệu ứng tự giải thích), còn nghe lại giọng mình vừa giúp phát hiện chỗ ấp úng — chính là chỗ chưa hiểu — vừa tạo cảm giác tiến bộ rất "thật" khi so bản thu cũ và mới.

> Kiểm thử tự động trọn luồng: thu → dừng → nghe thử (audio dataURL) → lưu (meta + khoá riêng + khối "đã lưu" + huy hiệu 🎙️) → trang Tiến bộ liệt kê, ▶ nghe gắn đúng nguồn, 🗑 xoá sạch; trình duyệt không hỗ trợ chỉ hiện ghi chú; bộ nhớ bị chặn có cảnh báo — 0 lỗi.

---

## 🌐 Bản online cho gia đình 2–3 thành viên (dùng trên điện thoại)

### 1. Đưa app lên mạng MIỄN PHÍ (5 phút, chọn 1 trong 2 cách)

**Cách A — Netlify Drop (dễ nhất, không cần tài khoản GitHub):**
1. Mở trang **app.netlify.com/drop** trên máy tính.
2. Kéo–thả **cả thư mục `toan9-feynman`** (thư mục chứa index.html, assets, icons, sw.js, manifest.webmanifest) vào trang.
3. Netlify trả về một địa chỉ dạng `https://ten-gi-do.netlify.app` — gửi link này cho các thành viên. (Đăng ký tài khoản miễn phí nếu muốn giữ link vĩnh viễn và đổi tên đẹp hơn.)

**Cách B — GitHub Pages:**
1. Tạo tài khoản github.com → New repository (Public), ví dụ `toan9`.
2. Upload toàn bộ nội dung thư mục vào repo (kéo thả trên web được).
3. Vào **Settings → Pages** → Source: `main` / thư mục gốc → Save. Vài phút sau có link `https://<tên>.github.io/toan9/`.

Lưu ý: link là "ai có link đều mở được" — với 2–3 người trong nhà thì chỉ cần **không chia sẻ link ra ngoài**. (Muốn khoá đăng nhập thực sự thì cần dịch vụ có máy chủ — xem ghi chú cuối.)

### 2. Cài lên màn hình chính điện thoại (PWA — như app thật)
- **Android (Chrome):** mở link → menu ⋮ → **"Thêm vào màn hình chính"** / "Cài đặt ứng dụng".
- **iPhone (Safari):** mở link → nút Chia sẻ ⬆️ → **"Thêm vào MH chính"**.
- Sau lần mở đầu, app **chạy được cả khi mất mạng** (service worker đã lưu toàn bộ), có icon √9 riêng, mở toàn màn hình.

### 3. 2–3 thành viên, mỗi người dữ liệu riêng
- Nút **🦊 <tên> · đổi ▾** ở cuối menu trái (hoặc Cài đặt → **Thành viên & Sao lưu**) mở bảng **"Ai đang học?"**: chọn người, hoặc ➕ Thêm thành viên (tối đa 3).
- Mỗi hồ sơ có **tiến độ, EXP, huy hiệu, bản thu bài giảng, PIN phụ huynh… hoàn toàn riêng**. Dữ liệu người dùng cũ được giữ nguyên ở hồ sơ đầu tiên.
- Lưu ý bản chất: dữ liệu lưu **trên từng thiết bị** (không tự đồng bộ qua mạng). Cùng 1 điện thoại thì 3 hồ sơ dùng chung máy rất tiện; khác thiết bị thì dùng Sao lưu bên dưới.

### 4. Chuyển tiến độ giữa các thiết bị
Cài đặt → Thành viên & Sao lưu → **⬇️ Xuất tệp** (tạo tệp .json) → gửi qua Zalo/USB → máy kia bấm **⬆️ Nhập tệp** → tiến độ hiện nguyên vẹn. Bố mẹ ở xa muốn xem chi tiết: con Xuất tệp gửi Zalo, bố mẹ Nhập vào điện thoại mình rồi mở Góc phụ huynh/Tiến bộ (hoặc đơn giản hơn: dùng nút **📋 Báo cáo tuần** có sẵn).

> Ghi chú kỹ thuật: app cố tình không dùng máy chủ (không tài khoản, không phí, không lộ dữ liệu trẻ em ra ngoài). Nếu sau này cần **đồng bộ tự động + đăng nhập riêng từng người**, sẽ cần thêm backend (ví dụ Firebase — có gói miễn phí); mình có thể hướng dẫn khi bạn sẵn sàng.

> Kiểm thử tự động: chip thành viên hiển thị đúng, bảng "Ai đang học?" thêm/chuyển hồ sơ (dữ liệu tách riêng đã test cấp storage: EXP mỗi hồ sơ độc lập, xoá hồ sơ dọn sạch khoá, chặn hồ sơ thứ 4), Xuất tệp tạo file tải về, Nhập tệp khôi phục và tải lại, manifest JSON hợp lệ, sw.js hợp lệ, đăng ký SW chỉ chạy trên http/https — 0 lỗi.

---

## ⏱️ Sửa bộ đếm phút học + Lịch nhắc tuần + Đủ 30' tự mở trò chơi (2 game mới)

**1. Sửa lỗi thời gian bị "quay từ đầu" khi chuyển module.** Trước đây phút học chỉ được ghi khi bấm Kết thúc trong "Buổi học 30'" — chuyển sang trang khác là mất. Nay có **bộ đếm toàn cục**: em học ở BẤT KỲ đâu trong app (bài học, luyện tập, tư duy, flashcard…) đều được cộng dồn tự động từng phút và lưu ngay; chuyển module thoải mái không mất. Tạm dừng thông minh khi ẩn tab/khoá máy (không đếm gian). "Buổi học 30'" vẫn dùng được như bộ bấm giờ 4 chặng, và không còn cộng trùng.

**2. Lịch nhắc học theo TỪNG NGÀY trong tuần.** Cài đặt → Duy trì thói quen: lưới **CN–T7**, bật/tắt từng ngày và chọn **giờ riêng cho mỗi ngày** (vd T2 19:00, T4 20:30, T7 nghỉ) để né lịch học các môn khác. Đến giờ (khi app đang mở) sẽ toast + thông báo hệ thống nếu đã cấp quyền; **đã học đủ mục tiêu thì không làm phiền**; mỗi mốc chỉ nhắc một lần/ngày.

**3. Đủ 30 phút → tự mở phần thưởng trò chơi.** Ngay khi tổng phút hôm nay chạm mục tiêu (mặc định 30'), hiện màn ăn mừng 🎉 với đếm ngược 6 giây rồi **tự chuyển sang Khu trò chơi** (hoặc bấm "Chơi ngay"/"Học tiếp đã"). Mỗi ngày chỉ ăn mừng một lần.

**4. Khu trò chơi mới (🎮) — 3 trò:**
- **🏎️ Đua xe tính nhanh:** tính nhẩm (+, −, ×, :) đúng để tăng tốc — trả lời càng nhanh xe vọt càng xa; sai xe khựng lại; về đích trước xe đối thủ để thắng (+30 EXP).
- **🗺️ Phiêu lưu mê cung:** bản đồ 10 cánh cửa; mỗi cửa là một câu hỏi lấy từ ngân hàng luyện tập Chương I–X — **chọn đáp án đúng** để mở đường; có 3 ❤️, sai mất tim; tới 💎 kho báu thắng (+30 EXP).
- **⚔️ Đấu trường Toán học** (trò cũ) vẫn nguyên.

> Kiểm thử tự động: học rải qua 3 module vẫn cộng đủ 3 phút (không reset); chạm 30' hiện overlay và chuyển đúng khu trò chơi, không lặp trong ngày; nhắc đúng lịch, đúng 1 lần, bật/đổi giờ/tắt từng ngày lưu chuẩn; Đua xe thắng sau chuỗi câu đúng (+30 EXP); Mê cung 10 ô đường, sai mất tim, tới kho báu thắng; Buổi học 30' không cộng trùng; mọi màn chạy được khi trình duyệt chặn bộ nhớ — 0 lỗi.

---

## 🎣 Tạo hứng thú (3 phút) — mở bài bằng câu hỏi đời thực, không vào lý thuyết ngay

M��i khi mở một bài học, thay vì thấy lý thuyết ngay, học sinh gặp **màn "Tạo hứng thú · 3 phút"**: một **câu hỏi tò mò từ đời thực** đúng chủ đề bài đó, để não "muốn biết" trước khi học.

- **Cả 37 bài trong lộ trình đều có hook riêng.** Ví dụ:
  - *Hàm số bậc nhất:* "Vì sao Grab tính tiền = **phí mở cửa + số km × đơn giá**? Và nếu mỗi tháng tiết kiệm 500 nghìn thì bao lâu đủ mua điện thoại 6 triệu?" → Bật mí: cả hai đều là **y = ax + b**.
  - *Xác suất:* vé số và trò tung xúc xắc; *Hình cầu:* vì sao bong bóng luôn tròn; *Vi-ét:* mẹo "đọc" nghiệm không cần giải; *Tứ giác nội tiếp:* bí mật 4 điểm nằm trên một vòng tròn…
- **Luồng 3 bước:** đọc câu hỏi → tự đoán vài giây → bấm **"🔍 Bật mí bí mật Toán học"** (lời giải thích ngắn nối thẳng vào khái niệm của bài) → **"🚀 Vào bài học ngay!"**. Có nút 🔊 nghe cô/thầy đọc câu hỏi và phần bật mí.
- **Không làm phiền:** trong cùng một phiên, mỗi bài chỉ hiện hook một lần (quay lại bài là vào thẳng lý thuyết); mở app phiên mới lại có, đúng vai trò "khởi động não". Ai muốn học luôn có nút **Bỏ qua →** một chạm.

> Kiểm thử tự động: hook Hàm số bậc nhất hiện đúng ví dụ Grab và chặn lý thuyết cho tới khi bấm; Bật mí hiện "y = ax + b" rồi đổi nút thành Vào bài; vào bài render ELI5 và tính bước ①; quay lại cùng phiên vào thẳng lý thuyết; bài khác vẫn có hook; Bỏ qua hoạt động; chạy được khi trình duyệt chặn bộ nhớ — 0 lỗi. Dữ liệu hook: 37/37 bài đủ trường (câu hỏi + bật mí).

---

## 🔄 v3.0 — Sửa lỗi "đưa lên GitHub mà không thấy thay đổi"

**Nguyên nhân:** service worker bản trước dùng chiến lược *cache-first* — sau lần đầu cài, trình duyệt LUÔN dùng bản đã lưu trong máy, kể cả khi máy chủ đã có bản mới. Vì vậy bạn cập nhật GitHub xong vẫn thấy giao diện cũ (và "đồng hồ vẫn sai" chính là vì đang chạy bản cũ trước khi sửa bộ đếm).

**Đã sửa (v3.0):**
- `sw.js` chuyển sang **network-first**: có mạng luôn tải bản mới nhất từ máy chủ, mất mạng mới dùng bản đã lưu → vẫn chạy offline nhưng không bao giờ "kẹt" bản cũ.
- Trang tự **kiểm tra bản mới mỗi giờ** và khi phát hiện SW mới sẽ **tự tải lại đúng 1 lần**.
- Hiện **số phiên bản** ở chân menu trái và trong Cài đặt ("Phiên bản v3.0 · 03/07/2026") — nhìn là biết ngay đang chạy bản nào.

**Cách cập nhật NGAY BÂY GIỜ trên máy đang bị kẹt bản cũ (làm 1 lần duy nhất):**
1. Tải toàn bộ thư mục mới (đủ cả `sw.js`, `index.html`, `assets/…`) lên GitHub/Netlify — ghi đè bản cũ.
2. Chờ 1–2 phút (GitHub Pages có độ trễ triển khai ngắn).
3. Trên thiết bị: mở trang → **tải lại 2 lần** (lần 1 nhận sw.js mới, lần 2 áp dụng). Nếu vẫn chưa thấy "Phiên bản v3.0" ở chân menu: máy tính bấm **Ctrl+Shift+R**; điện thoại vào cài đặt trình duyệt → Xoá dữ liệu trang web của trang này → mở lại. PWA đã cài ra màn hình chính: mở app, kéo xuống tải lại 2 lần (hoặc gỡ ra cài lại từ trình duyệt).
4. Từ v3.0 trở đi **không phải làm thủ tục này nữa** — mọi lần bạn đẩy code mới, app tự nhận và tự tải lại.

**Mẹo kiểm chứng:** chân menu trái luôn ghi "Phiên bản vX · ngày". Sau này mỗi lần mình nâng cấp sẽ tăng số này — bạn chỉ cần liếc là biết bản trên mạng đã mới chưa.

> Kiểm thử: bản build chứa đúng đồng hồ toàn cục (3 phút qua 3 module không reset), tem phiên bản hiện ở sidebar + Cài đặt, sw.js v3 network-first hợp lệ — 0 lỗi.

---

## 🚑 Sửa lỗi "Deployment failed, try again later" (actions/deploy-pages)

Lỗi này nằm ở khâu triển khai GitHub Actions, không phải ở code app. Chọn 1 trong 2 cách:

### Cách A — Đơn giản nhất, KHÔNG cần Actions (khuyên dùng)
App là web tĩnh thuần, không cần build, nên không cần workflow:
1. Vào repo → **Settings → Pages**.
2. Mục **Build and deployment → Source**: chọn **"Deploy from a branch"**.
3. Branch: `main`, thư mục `/ (root)` → **Save**.
4. Nếu repo đang có file workflow cũ trong `.github/workflows/` thì xoá đi để nó khỏi chạy nữa.
5. Chờ 1–2 phút, mở `https://<tên>.github.io/<repo>/` — xong. Mỗi lần đẩy code mới, Pages tự cập nhật.

### Cách B — Vẫn muốn dùng Actions
Nguyên nhân "Deployment failed" thường gặp (kiểm theo thứ tự):
1. **Settings → Pages → Source chưa để "GitHub Actions"** — bắt buộc phải chọn đúng nguồn này trước khi workflow chạy.
2. Workflow **thiếu quyền** `pages: write` và `id-token: write`, hoặc **thiếu `environment: github-pages`** trong job.
3. Artifact upload bằng `actions/upload-artifact` thường — **phải dùng `actions/upload-pages-artifact`** (định dạng tar riêng của Pages).
4. **Environment "github-pages" có protection rule** chỉ cho phép branch khác với branch bạn đang đẩy (Settings → Environments → github-pages → Deployment branches).
5. Đôi khi chỉ là **trục trặc tạm của GitHub** — bấm **Re-run all jobs** thử lại.

Trong thư mục dự án đã kèm sẵn file chuẩn **`.github/workflows/deploy.yml`** (đủ quyền, đúng action, đúng environment) — chép nguyên vào repo là chạy.

> Gợi ý: với dự án này Cách A là đủ và bền nhất; Actions chỉ đáng dùng khi sau này bạn thêm bước build.

---

## 🤖 AI Mentor thật (ChatGPT) — v3.1

AI Mentor giờ có thể nối với **ChatGPT thật** qua API của OpenAI. Không bắt buộc: chưa có key thì app vẫn dùng đầy đủ như cũ (Mentor trả lời theo kịch bản có sẵn).

### Cách bật (5 phút)
1. Vào **platform.openai.com** → đăng nhập → mục **API keys** → **Create new secret key** → sao chép chuỗi bắt đầu bằng `sk-…`. (Cần nạp tối thiểu $5 vào tài khoản OpenAI — dùng được rất lâu.)
2. Mở app → **Cài đặt → 🤖 AI Mentor (ChatGPT)** → dán key → chọn model → **Lưu** → bấm **Kiểm tra kết nối** thấy "✅ Kết nối thành công" là xong.
3. Model khuyên dùng: **gpt-4o-mini** — rẻ nhất (khoảng vài trăm đến vài nghìn đồng cho cả trăm câu hỏi), đủ thông minh cho Toán 9. Muốn "xịn" hơn chọn gpt-4o.

### Có key thì được gì
- **💬 AI Mentor chat thật:** hỏi bất kỳ điều gì về Toán 9. AI đóng vai cô giáo theo SGK Kết nối tri thức, trả lời kiểu Socratic (gợi ý từng bước, không giải hộ ngay), tự biết em đang yếu chủ đề nào (đọc từ hồ sơ điểm yếu) để hướng dẫn sát hơn. Banner đầu trang hiện 🟢 khi đang nối AI thật.
- **🤖 AI chấm bài tự luận:** trong khu Rèn tư duy, sau khi xem lời giải mẫu có thêm nút **"Nhờ AI chấm"** — AI đọc bài làm của em, đối chiếu từng tiêu chí (rubric) và lời giải mẫu, trả về nhận xét + điểm + gợi ý cải thiện.

### Bảo mật & chi phí
- Key **chỉ lưu trên máy của bạn** (LocalStorage), gọi thẳng tới OpenAI, không qua máy chủ trung gian nào.
- Key **không bao giờ lọt vào tệp sao lưu** (Xuất tệp đã tự che key) — gửi backup cho ai cũng an toàn.
- Nên đặt **Billing Limits** trong tài khoản OpenAI (vd $5/tháng) để tuyệt đối yên tâm.
- Lưu ý: gọi API cần mở app qua **https** (GitHub Pages/Netlify đều là https — chuẩn rồi); mở file trực tiếp trên máy vẫn được nhưng một số trình duyệt có thể chặn.

> Kiểm thử tự động: lưu/kiểm tra/xoá key (payload đúng URL + Bearer + model); exportState không chứa key; chat gửi kèm system prompt cô giáo + điểm yếu, render đậm/xuống dòng, lỗi 401 báo "khoá API không đúng"; không key → banner trắng + fallback cũ + essay ẩn nút AI; AI chấm tự luận gửi đủ đề + tiêu chí + bài làm, lỗi mạng báo đỏ; chạy được khi trình duyệt chặn bộ nhớ — 0 lỗi.

---

## 📕 Sổ tay lỗi sai + Ôn lại (v3.2)

Tính năng học tập mạnh nhất vừa thêm: **làm lại đúng chính những câu mình từng sai** — kỹ thuật được chứng minh hiệu quả hơn làm câu mới.

**Tự động ghi lỗi.** Mỗi khi làm sai một câu trắc nghiệm/điền đáp án ở **Bài học, Luyện tập, Rèn tư duy hoặc Kiểm tra định kỳ**, app lưu lại *nguyên câu đó* (kèm nguồn, bài liên quan) vào **Sổ tay lỗi sai** (menu 📕). Câu làm đúng không bị lưu; sửa được rồi thì tự biến mất.

**Ôn lại theo lịch giãn cách (spaced repetition).** Mỗi câu đi qua 3 "hộp": làm đúng thì lên hộp và **giãn dần thời gian hỏi lại** (hôm nay → sau 1 ngày → sau 3 ngày); làm đúng đủ **3 lần** thì câu "🎓 tốt nghiệp" khỏi sổ. Lỡ sai lại thì rớt về hộp đầu, hỏi lại sớm. Nhờ vậy em chỉ ôn đúng câu chưa chắc, đúng lúc sắp quên.

**Nhắc đúng chỗ.** Trang chính hiện thẻ đỏ *"📕 N câu lỗi sai cần ôn hôm nay → Ôn ngay"*; trang Sổ tay cho xem toàn bộ câu đang giữ (đã sai mấy lần, ngày ôn kế tiếp), xoá câu không cần, và nút ôn nhanh cả loạt. Làm đúng khi ôn được cộng EXP.

> Kiểm thử tự động: làm sai 1 câu luyện tập → vào sổ và hiện due hôm nay; dashboard nhắc; trang sổ liệt kê đúng; vào ôn hiện đúng câu đã sai; trả lời đúng → lên hộp, hết due, đúng 3 lần → tốt nghiệp sạch sổ; làm đúng cả bộ thì sổ vẫn trống; chạy được khi trình duyệt chặn bộ nhớ — 0 lỗi.

---

## ➗ Công thức đẹp như sách giáo khoa — KaTeX (v3.3)

Căn thức, luỹ thừa, phân số… giờ được **hiển thị bằng KaTeX** thay vì chữ thường — dấu căn có vạch ngang phủ đúng biểu thức, số mũ nhỏ nâng lên, trông chuẩn như SGK.

- **Tự động, không phải sửa nội dung.** App nhận diện sẵn các mẫu trong bài (√(...), √50, ∛27, x², (x+3)²…) và render đẹp ở khắp nơi: lý thuyết, câu hỏi, lời giải từng bước, hook, sổ lỗi sai. Nội dung động (bấm hiện lời giải, chuyển bước) cũng tự render nhờ theo dõi thay đổi màn hình.
- **Chạy offline 100%.** KaTeX và bộ font được **nhúng thẳng vào app** (bản 1-file nhúng base64; bản thư mục có `assets/katex/` và được service worker lưu cache) — không gọi mạng, không CDN, vẫn hoạt động khi mất mạng.
- **An toàn:** không đụng vào ô nhập đáp án, không phá việc chấm bài; nếu vì lý do nào đó KaTeX không nạp được thì nội dung vẫn hiện dạng chữ như cũ (không lỗi).

Lưu ý dung lượng: bản **1-file** giờ ~1,1 MB (do gói kèm font Toán). Nếu muốn nhẹ, dùng **bản thư mục** (KaTeX tải riêng, cache lại sau lần đầu) — khuyên dùng khi đưa lên GitHub Pages.

> Kiểm thử tự động: KaTeX nạp và render đúng (bài học, luyện tập nhiều công thức), renderToString hoạt động, ô nhập đáp án không bị đụng, chấm bài vẫn đúng, không treo/lặp vô hạn, chạy cả khi trình duyệt chặn bộ nhớ — 0 lỗi.

---

## 🌳 Bản đồ cây kiến thức (v3.4)

M��t trang toàn cảnh (menu **🌳 Bản đồ kiến thức**, hoặc `#/ban-do`) cho học sinh nhìn thấy **cả hành trình Toán 9 trong một màn hình**: 11 chương nối nhau bằng một "trục leo núi" dọc, mỗi bài là một ô, **tô màu theo mức thành thạo**:

- ⚪ **Chưa học** (xám) — chưa mở bài.
- 🟡 **Đang học** — đã làm vài bước nhưng chưa xong bài.
- 🟢 **Đã xong** — hoàn thành đủ 5 bước Feynman.
- 🟠★ **Thành thạo** — đã xong *và* làm bài đúng vững (độ chính xác ≥ 85% qua đủ số câu).

Trên cùng hiện **% bản đồ đã chinh phục** + đếm số bài ở mỗi mức; mỗi chương có % riêng. Bấm vào ô bất kỳ là mở thẳng bài đó để học hoặc ôn lại — nhìn phát là biết đang ở đâu và "vùng tối" (phần chưa học) còn ở đâu, tạo cảm giác tiến bộ rất rõ.

> Kiểm thử tự động: bản đồ hiện đủ 37 bài/11 chương, ban đầu tất cả "chưa học"; sau khi học 1 bài → ô chuyển "đã xong", bài đúng vững → "thành thạo ★", bài mới vài bước → "đang học"; % tổng cập nhật; bấm ô mở đúng bài; chạy cả khi trình duyệt chặn bộ nhớ — 0 lỗi.

---

## 🎮 Game v2 — đồ hoạ đẹp & nội dung hấp dẫn hơn (v3.5)

Làm lại toàn bộ khu trò chơi về cả **hình ảnh** lẫn **cảm giác chơi**:

**🏎️ Đua xe tính nhanh (canvas 60fps).** Cảnh đua vẽ thời gian thực: mặt đường cuộn với vạch kẻ trôi, cỏ và bụi cây hai bên chạy theo tốc độ, **đếm ngược 3-2-1-GO!** trước khi xuất phát. Trả lời đúng → **đốt nitro 🔥💨** kèm vệt tốc độ trắng xoẹt qua màn hình, combo hiện góc phải; sai → xe rung và trượt bánh. Gần thắng thì **vạch đích ca-rô** hiện dần. Thêm **3 độ khó**: 🙂 Dễ (cộng trừ), 😎 Vừa (bốn phép tính), 🔥 Khó (√49, 2³, phần trăm nhẩm — thắng được **+40 EXP**). Cơ chế mới "nitro tắt dần" khiến phải trả lời liên tục mới giữ được tốc độ — đúng chất đua.

**🏛️ Đền cổ kho báu (mê cung phiên bản phiêu lưu).** Nền đá tối với đổ bóng lòng đền, hai ngọn **đuốc 🔥 lập loè**; đường chưa đi bị **sương mù** che, hé lộ dần khi tiến lên; mỗi bước có **lời dẫn truyện** ("Cánh cửa đá khắc một câu đố cổ…"); trả lời đúng → **cánh cửa 🚪 xoay mở 3D** rồi nhà thám hiểm nhảy sang ô mới; sai → **màn hình rung** + mất ❤️; viên **💎 kho báu nhấp nháy** chờ ở cuối; cửa cuối cùng là **⚡ Cửa Thần** phát sáng. Câu hỏi vẫn lấy từ ngân hàng SGK Chương I–X (vừa chơi vừa ôn thật).

**Hub trò chơi**: 3 thẻ nền gradient riêng từng game + hiệu ứng vệt sáng lướt qua khi rê chuột.

Kỹ thuật: vòng lặp canvas tự dừng khi rời trang (không rò rỉ), toàn bộ phần vẽ bọc an toàn — máy không hỗ trợ canvas thì game vẫn chơi được bình thường (chỉ mất phần hình nền).

> Kiểm thử tự động: đếm ngược → GO → câu độ Khó ("25% của 120") → thắng +40 EXP; đền cổ: sương mù 8 ô hé dần, sai rung + mất tim, cửa mở 3D ngay sau câu đúng, gặp Cửa Thần, tới KHO BÁU; rời trang giữa trận không lỗi tích tụ — 0 lỗi.

---

## 🎓 Thi thử vào 10 — 90 phút, chấm như thi thật (v3.6)

Nâng cấp lớn nhất về mặt luyện thi: menu **🎓 Thi thử vào 10** với **3 đề mô phỏng đúng cấu trúc đề tuyển sinh**: Câu 1 căn thức (2đ) → Câu 2 hệ PT + bài toán thực tế vòi nước/chuyển động/năng suất (2,5đ) → Câu 3 PT bậc hai & Vi-ét & parabol (2,5đ) → Câu 4 hình học đường tròn (2,5đ) → Câu 5 GTNN/GTLN chốt điểm 10 (0,5đ). Mỗi đề 14 ý, chấm **theo trọng số từng ý, thang điểm 10** — đúng cách giám khảo chấm.

**Phòng thi như thật:** đồng hồ **90 phút** đếm ngược dính trên đầu màn hình; cảnh báo "còn 15 phút" và "còn 5 phút" (thanh giờ chuyển đỏ); **hết giờ tự nộp bài**; nộp sớm được nhưng app nhắc nếu còn ý bỏ trống; được đổi đáp án thoải mái tới khi nộp.

**Sau khi nộp:** điểm to + **xếp loại** (🏆 Giỏi ≥8 · 👍 Khá · 📈 Trung bình · 💪 Cần cố gắng) + thời gian làm; **lời giải từng bước cho cả 14 ý** (ý sai tô đỏ, hiện đáp án em chọn vs đáp án đúng); mọi ý sai/bỏ trống **tự vào Sổ tay lỗi sai** để ôn theo lịch; nút "Ôn lỗi sai ngay". Hoàn thành +40 EXP, đạt ≥8 điểm +60 EXP kèm pháo hoa.

**Theo dõi:** trang chọn đề hiện 🥇 kỷ lục cá nhân, điểm tốt nhất từng đề và 5 lần thi gần nhất — con tự thấy mình tiến bộ qua từng lần thi.

> Kiểm thử tự động: hub 3 đề; phòng thi đủ 14 ý + đồng hồ 90:00; đổi đáp án hoạt động; chấm trọng số chính xác tuyệt đối (sai 2 ý + trống 2 ý → đúng 7/10 như tính tay); xếp loại Khá; 4 ý sai vào sổ lỗi; lịch sử lưu đúng điểm; hết giờ tự nộp và ghi "(tự nộp khi hết giờ)"; công thức căn lồng √((3−√5)²) render KaTeX đẹp không cảnh báo; chạy được khi trình duyệt chặn bộ nhớ — 0 lỗi.

---

## 🚀 v3.7 — Ba nâng cấp cùng lúc

### 1) 📄 Thêm đề thi thử & trộn số liệu ngẫu nhiên
- Nay có **5 đề** thi thử vào 10 (thêm Đề 4, Đề 5).
- **Đề 4 và Đề 5 sinh số liệu MỚI mỗi lần thi**: rút gọn căn (√32 − √8 + √18…), hệ phương trình, Vi-ét (tổng/tích/nghiệm lớn), hệ thức lượng MH² = HA·HB, GTNN — tất cả đổi số nhưng luôn ra nghiệm đẹp và lời giải tự khớp theo số mới.
- **Mọi đề đều trộn thứ tự phương án** sau mỗi lần thi → không thể học vẹt "đáp án câu 1 là A".
- Học sinh có thể thi lại đề cũ nhiều lần mà vẫn phải *tính thật*.

### 2) 🔒 Chế độ nghiêm của phụ huynh
- Bật trong **Góc phụ huynh → Chế độ nghiêm** (có PIN bảo vệ như cũ).
- Khi bật: **khu trò chơi bị khoá** cho tới khi con **học đủ số phút mục tiêu hôm nay** *và* **làm xong bài bố mẹ giao**. Vào thẳng link game cũng bị chặn.
- Màn khoá hiện rõ tiến độ ("đã học 18/30 phút · còn 1 việc được giao") kèm nút **Vào học ngay** — mang tính hướng dẫn, không phải trừng phạt.
- Đủ điều kiện là mở khoá ngay lập tức, không cần thao tác gì thêm.

### 3) 🤖 AI ra đề vô hạn theo điểm yếu
- Menu **🤖 AI ra đề** (cần khoá API ChatGPT như phần AI Mentor).
- ChatGPT soạn **câu hỏi mới hoàn toàn** đúng chủ đề con hay sai (app tự gửi danh sách chủ đề yếu kèm % chính xác), hoặc chọn tay bài bất kỳ + 3 mức độ.
- Mỗi lượt 3 câu trắc nghiệm, có **lời giải từng bước**; làm đúng được EXP, **làm sai tự vào Sổ tay lỗi sai** để ôn lại theo lịch. Bấm là có đề mới — luyện không bao giờ hết bài.
- Xử lý lỗi đầy đủ: AI trả sai định dạng → báo "bấm tạo lại"; khoá API sai → báo rõ; chưa có khoá → hướng dẫn vào Cài đặt.

> Kiểm thử tự động: mở Đề 4 bốn lần ra **4 bản đề khác nhau**; trả lời đúng hết đề ngẫu nhiên → **10/10 cả 3 lượt**; chế độ nghiêm khoá đúng cả khi vào thẳng link, mở khi đủ phút, khoá lại khi có bài giao chưa xong, mở khi hoàn thành; AI ra đề render 3 câu, sai → hiện lời giải + vào sổ lỗi, đúng → cộng EXP, hai ca lỗi (JSON hỏng, khoá 401) báo thân thiện — 0 lỗi.

---

## 🔮 Góc Ramanujan — giải bài theo kiểu nhà toán học (v3.8)

Menu mới **🔮 Góc Ramanujan**: dạy trẻ *cách nghĩ* của Srinivasa Ramanujan — nhà toán học Ấn Độ tự học, nổi tiếng vì nhìn ra quy luật từ hàng đống con số cụ thể.

**Quan trọng về mặt sư phạm:** Ramanujan mạnh ở trực giác nhưng bị phê bình vì hay bỏ qua chứng minh. App vì thế dùng **5 bước, không cho phép bỏ bước 4**:

1. **👀 Quan sát** — bảng các trường hợp nhỏ (không có lời giải sẵn).
2. **🔮 Đoán** — học sinh phải tự dự đoán trường hợp tiếp theo *trước khi* thấy quy luật. Đoán sai được khích lệ ("đoán sai là một phần của khám phá"), không bị phạt điểm.
3. **✅ Kiểm chứng** — công bố quy luật.
4. **📐 Chứng minh** — chứng minh ngắn gọn, kèm lời nhắc rằng đây chính là khâu Ramanujan từng bị chê thiếu.
5. **⚡ Giải nhanh** — 2 bài tập Toán 9 dùng chính quy luật vừa khám phá (sai thì vào Sổ tay lỗi sai như mọi nơi khác).

**8 khám phá:** tổng số lẻ liên tiếp = n²; bình phương số tận cùng 5 trong 2 giây; hiệu hai bình phương để phá số to (2026² − 2024²); đọc nghiệm phương trình bậc hai không cần Δ (a+b+c=0); **căn lồng vô tận của chính Ramanujan** √(1+2√(1+3√(1+4√…))) = 3 (câu đố ông đăng năm 1911, sáu tháng không ai giải được); mở gói căn trong căn √(7+4√3) = 2+√3; tích 4 số liên tiếp cộng 1 luôn là số chính phương; và **1729 — con số taxi** Hardy chê nhạt nhẽo mà Ramanujan nhận ra ngay là số nhỏ nhất viết được thành tổng hai lập phương theo hai cách.

Tiến độ hiển thị ở hub (x/8), hoàn thành mỗi khám phá được EXP như một bài Feynman.

> Kiểm định toán học: 21 khẳng định trong 8 khám phá đều được máy xác minh độc lập (bao gồm chứng minh 1729 thật sự là số taxicab nhỏ nhất, và căn lồng hội tụ về đúng 3).
> Kiểm thử tự động: hub 8 thẻ + 5 bước; quan sát không lộ quy luật trước khi đoán; đoán sai → khích lệ và hiện đáp án; chứng minh đủ số bước; áp dụng đúng → EXP, sai → vào sổ lỗi; lưu tiến độ và hub cập nhật 1/8; mở lần lượt cả 8 khám phá 0 lỗi, 51 công thức render KaTeX — 0 lỗi.

---

## ⚡ v3.9 — "Hôm nay 5 phút" + "Tò mò hôm nay": để con tự mở app mỗi ngày

Hai thay đổi nhỏ về giao diện nhưng lớn về hành vi, dựa trên khoa học thói quen (ma sát thấp + phần thưởng đến sớm):

**⚡ Hôm nay · 5 phút — một nút, một việc.** Thẻ đầu tiên trên trang chính. App tự chọn *một* việc nhỏ theo thứ tự ưu tiên: ôn 3 câu em từng sai → lật 5 thẻ ghi nhớ đến hạn → khám phá 1 điều tò mò → học 1 bước bài mới. Làm xong (app tự nhận biết qua hành động thật, không cần bấm "đã xong") là **điểm danh hôm nay thành công**, +15 EXP, thẻ chuyển ✅ và ghi rõ "học tiếp hay nghỉ đều ổn". Cùng ngày mở lại bao nhiêu lần vẫn là việc đó — không đổi ngẫu nhiên gây rối.

**🎣 Tò mò hôm nay.** Thẻ thứ hai: mỗi ngày một câu hỏi đời thực khác nhau (xoay vòng qua các bài chưa học, theo ngày). Bấm "Xem 1 phút" là hé lộ bí mật Toán ngay tại chỗ, rồi có nút vào thẳng bài (đã xem hook nên vào bài là tới lý thuyết luôn). Đây là *lý do để mở app* — tò mò trước, học sau.

**🔥 Không bao giờ hiện "chuỗi 0".** Đứt chuỗi thì hiện "kỷ lục N ngày"; người mới thì hiện "bắt đầu". Số 0 trần trụi là thứ khiến nhiều em bỏ cuộc sau lần lỡ đầu tiên.

> Kiểm thử tự động: thẻ 5 phút luôn ở vị trí đầu; người mới → việc = tò mò, bấm Bắt đầu hé lộ và tự nhận xong +15 EXP; có lỗi sai → việc = ôn 3 câu, điều hướng đúng, ôn 2/3 chưa xong, đủ 3 mới xong và thẻ tự chuyển ✅; cùng ngày không đổi việc; tò mò 5 ngày liên tiếp ra 5 bài khác nhau; chuỗi 0 không hiện; chạy cả khi chặn bộ nhớ — 0 lỗi.

---

## 🛠️ v4.0 — Khắc phục 3 điểm yếu lớn

### 1) Nội dung mỏng → ♾️ Luyện vô hạn
Thay vì thêm vài chục câu rồi lại cạn, app có **bộ sinh bài tập cho 8 kỹ năng cốt lõi**: rút gọn căn, cộng trừ căn đồng dạng, giải hệ phương trình, giải phương trình bậc hai, định lí Vi-ét, tỉ số lượng giác, góc ở tâm & góc nội tiếp, bài toán thực tế (phần trăm, chuyển động). Mỗi lần bấm là **bộ 10 câu mới với số liệu khác**, luôn ra nghiệm đẹp, kèm lời giải khớp theo số. Không bao giờ hết bài, không dính bản quyền SGK (số liệu tự sinh). Đúng ≥90% có pháo hoa và gợi ý chuyển kỹ năng; sai vào Sổ lỗi sai như mọi nơi.

### 2) Chưa dạy viết chứng minh → ✍️ Tập viết chứng minh hình học
Hình học chứng minh chiếm 2,5 điểm đề thi và là chỗ mất điểm oan nhất — không phải vì không hiểu mà vì **viết thiếu căn cứ**. Module mới luyện đúng kỹ năng đó qua 6 bài kinh điển (tứ giác nội tiếp 2 cách, hai tiếp tuyến cắt nhau, góc chắn nửa đường tròn + hệ thức lượng, đồng dạng từ góc nội tiếp, tính góc bằng góc ở tâm):
- **Bước 1 — Sắp xếp:** các bước chứng minh bị xáo, em bấm theo đúng thứ tự. Sai ở đâu app chỉ đúng bước đó và giữ lại phần đã đúng.
- **Bước 2 — Căn cứ:** với mỗi bước then chốt, chọn đúng định lí/tính chất làm căn cứ (3 lựa chọn). Đây chính là thứ giám khảo tìm khi chấm.
- Chỉ khi đúng cả thứ tự lẫn mọi căn cứ mới được "bài chứng minh hoàn chỉnh" — mô phỏng đúng tiêu chí điểm tối đa.

### 3) Menu 17 mục → 4 nhóm gọn
Sidebar gom thành **📚 HỌC · ✏️ LUYỆN · 🎓 THI · 🎮 KHÁM PHÁ** (bấm tiêu đề để thu gọn/mở), cấp 1 chỉ còn Trang chủ và Cài đặt. Vào mục nào, nhóm chứa nó tự mở. Học sinh mở app không còn phải "chọn giữa 17 thứ".

> Kiểm định: 8.000 lượt sinh bài không lỗi cấu trúc; 2.500 lượt kiểm tra độc lập (rút gọn căn, nghiệm PT bậc hai thoả phương trình, góc nội tiếp = ½ cung, sin/cos/tan đúng cạnh, giảm giá đúng %) → 0 sai. Kiểm thử giao diện: menu 4 nhóm thu/mở đúng; luyện vô hạn 10 câu/bộ, chấm + lời giải + đổi bộ; chứng minh: xáo bước, khoá nút khi chưa đủ, thứ tự sai được chỉ và cắt về trước chỗ sai, đúng → sang căn cứ, chấm hoàn chỉnh + EXP + lưu; chạy cả khi chặn bộ nhớ — 0 lỗi.
