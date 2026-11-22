# Đặc tả Yêu cầu Phần mềm (SRS)

## Ứng dụng tập luyện Bodyweight theo giai đoạn — "workout-app"

| Mục                | Giá trị                                             |
| ------------------ | --------------------------------------------------- |
| Phiên bản tài liệu | 1.0                                                 |
| Ngày               | 22/11/2026                                          |
| Tác giả            | Le Dac Anh (soạn cùng Claude)                       |
| Trạng thái         | Bản nháp để review                                  |
| Chuẩn tham chiếu   | Cấu trúc theo ISO/IEC/IEEE 29148 (kế thừa IEEE 830) |

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Khảo sát thị trường & Pain point](#2-khảo-sát-thị-trường--pain-point)
3. [Mô tả tổng quan sản phẩm](#3-mô-tả-tổng-quan-sản-phẩm)
4. [Yêu cầu chức năng](#4-yêu-cầu-chức-năng)
5. [Yêu cầu phi chức năng](#5-yêu-cầu-phi-chức-năng)
6. [Mô hình dữ liệu](#6-mô-hình-dữ-liệu)
7. [Use case chính](#7-use-case-chính)
8. [Giao diện bên ngoài](#8-giao-diện-bên-ngoài)
9. [Ma trận truy vết Pain point → Yêu cầu](#9-ma-trận-truy-vết-pain-point--yêu-cầu)
10. [Lộ trình phát hành](#10-lộ-trình-phát-hành)
11. [Rủi ro & câu hỏi mở](#11-rủi-ro--câu-hỏi-mở)
12. [Phụ lục: Nguồn tham khảo](#12-phụ-lục-nguồn-tham-khảo)

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này đặc tả đầy đủ yêu cầu chức năng và phi chức năng cho **workout-app** — ứng dụng web (PWA) hướng dẫn và theo dõi tập luyện **bodyweight / calisthenics tại nhà theo giai đoạn**, ưu tiên người dùng Việt Nam. Tài liệu dùng cho: người phát triển, người thiết kế UI/UX, người kiểm thử và chủ sản phẩm.

### 1.2 Phạm vi sản phẩm

Sản phẩm giúp người mới và người tập trung cấp:

- Đi theo một **lộ trình có giai đoạn** (ví dụ 12 tuần, 3 giai đoạn) với bài tập không cần dụng cụ hoặc dụng cụ tối thiểu.
- **Ghi lại từng hiệp** nhanh (reps / giây giữ / độ khó cảm nhận).
- **Tự động gợi ý tăng tiến** (progressive overload) — tăng reps, chuyển biến thể khó hơn hoặc giảm khi quá sức.
- Xem **minh họa trực quan** ngay trong app (ảnh/GIF/video ngắn), có hướng dẫn tiếng Việt.
- Theo dõi tiến độ, chuỗi ngày tập (streak), lịch sử, và **xuất dữ liệu** bất cứ lúc nào.

**Ngoài phạm vi (v1):** theo dõi dinh dưỡng/calo, mạng xã hội công khai, lớp học livestream, huấn luyện viên trả phí 1-1, tích hợp máy tập ở phòng gym.

### 1.3 Định nghĩa & thuật ngữ

| Thuật ngữ                                  | Ý nghĩa                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Giai đoạn (Phase)                          | Khối luyện tập nhiều tuần có mục tiêu chung (VD: Tuần 1–4 xây nền tảng)             |
| Buổi tập (Session)                         | Một lần tập cụ thể vào một ngày                                                     |
| Hiệp (Set)                                 | Một lượt thực hiện bài tập liên tục                                                 |
| Rep                                        | Một lần lặp động tác                                                                |
| RPE                                        | Rate of Perceived Exertion — mức gắng sức cảm nhận, thang 1–10                      |
| RIR                                        | Reps In Reserve — số rep còn có thể làm thêm                                        |
| Biến thể / Thang tiến (Progression ladder) | Chuỗi động tác cùng nhóm từ dễ → khó (VD: Push-up gối → Push-up → Diamond → Archer) |
| Deload                                     | Tuần giảm khối lượng để hồi phục                                                    |
| PWA                                        | Progressive Web App — web app cài được lên màn hình chính, chạy offline             |
| MVP                                        | Minimum Viable Product                                                              |

### 1.4 Hiện trạng codebase (tại thời điểm viết)

- Next.js 15.5 (App Router, Turbopack), React 19, Tailwind 4, shadcn/ui (Checkbox, Label).
- Dữ liệu tĩnh trong `src/app/workout-data.tsx`: 3 giai đoạn, ~16 bài tập.
- Trang `/` chọn giai đoạn bằng `<select>`; `/phase/[id]` hiển thị danh sách bài + checkbox "Hoàn thành".
- **Hạn chế đã phát hiện:**
  - Trạng thái hoàn thành chỉ nằm trong `useState` → mất khi tải lại trang (chưa có lưu trữ).
  - Trường `illustration` trỏ tới **trang web bên ngoài** (iStock, wikiHow…) chứ không phải ảnh → người dùng phải rời app, một số link là trang bán ảnh có watermark.
  - `reps` là chuỗi tự do ("3 hiệp x 10-12 reps") → không thể ghi số liệu hay tính tăng tiến.
  - `src/app/phase/[id]/page.tsx` khai báo `params: { id: string }` đồng bộ; ở Next.js 15 `params` là `Promise` và cần `await`.
  - Không có ngày tập, lịch, lịch sử, timer nghỉ.

SRS này mô tả trạng thái đích; mục 10 chia lộ trình từ hiện trạng đi lên.

---

## 2. Khảo sát thị trường & Pain point

### 2.1 Phương pháp

Khảo sát (11/2026) dựa trên: trang store (App Store, Google Play), các bài đánh giá/so sánh 2026, tổng hợp review 1–3 sao, bài báo công nghệ về xu hướng subscription, và số liệu retention ngành. **Lưu ý:** nhiều bài so sánh là nội dung affiliate hoặc do chính hãng app viết (VD: blog của JEFIT); giá và giới hạn gói free thay đổi thường xuyên theo vùng — cần kiểm chứng lại trên store trước khi dùng cho quyết định kinh doanh.

### 2.2 Các app được khảo sát

| App                                            | Phân khúc              | Mô hình giá (tham khảo 2026)                 | Điểm mạnh                                             | Điểm yếu chính                                                                                                                                                           |
| ---------------------------------------------- | ---------------------- | -------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Home Workout – No Equipment** (Leap Fitness) | Tập tại nhà, người mới | Free + quảng cáo; mua gỡ quảng cáo / gói Pro | 100M+ lượt tải, ~4.9★, voice coach, không cần dụng cụ | **Quảng cáo dày đặc, chen giữa buổi tập**; theo dõi tiến độ sơ sài; giáo án ít cá nhân hóa                                                                               |
| **30 Day Fitness** (cùng nhà phát triển)       | Thử thách 30 ngày      | Free + ads; gỡ ads ~$4.99                    | Dễ bắt đầu                                            | Thử thách cố định, hết 30 ngày không có lộ trình tiếp                                                                                                                    |
| **Nike Training Club**                         | Video có HLV           | Miễn phí                                     | Nội dung chất lượng cao, hoàn toàn free               | Ít ghi log chi tiết; không tự tăng tiến theo hiệu suất                                                                                                                   |
| **Fitbod**                                     | Gym, AI tạo giáo án    | ~$95.99/năm; free ≈ 3 buổi dùng thử          | AI tự sinh buổi tập theo dụng cụ & phục hồi cơ        | Free gần như chỉ là demo; **phàn nàn về hủy/hoàn tiền subscription**, support chậm; tập trung gym                                                                        |
| **Strong**                                     | Ghi log gym            | Free giới hạn + Pro                          | Ghi log nhanh, ổn định lâu năm                        | Ít đổi mới; báo cáo có lúc không ghi nhận buổi tập; **không import lại dữ liệu** vào tài khoản mới                                                                       |
| **Hevy**                                       | Ghi log gym + social   | Free khá rộng; Pro ~$2.99–4.99/tháng         | Free hào phóng, UI nhanh, Apple Watch/WearOS          | Free: giới hạn ~4 routine, 7 bài tùy chỉnh, 3 tháng biểu đồ; **tài khoản công khai mặc định**, feed social không tắt được; không tự lập giáo án                          |
| **JEFIT**                                      | Gym, thư viện lớn      | Free + ads + Elite                           | Thư viện bài tập rất lớn                              | UI rườm rà, nhiều quảng cáo; có review báo **mất toàn bộ log**                                                                                                           |
| **Thenx**                                      | Calisthenics           | Subscription                                 | Nội dung calisthenics bài bản, video tốt              | **Crash thường xuyên** (khi khóa màn hình, chuyển app); báo "offline" không vào được nội dung; thiếu âm báo timer / chạy nền; bài khó với người mới, nguy cơ chấn thương |
| **Peloton App / Alo Moves**                    | Lớp học video          | ~$12–20/tháng                                | Nhiều lớp, HLV truyền cảm hứng                        | Đắt; lệ thuộc subscription; ít theo dõi sức mạnh tăng tiến                                                                                                               |
| **Caliber, BetterMe, SHRED…**                  | Tổng hợp / coaching    | Freemium / subscription                      | Được báo chí xếp hạng cao                             | Nhiều app đẩy paywall ngay sau onboarding dài                                                                                                                            |

### 2.3 Pain point tổng hợp

Mỗi pain point được gán mã `PP-xx` để truy vết sang yêu cầu (mục 9).

#### PP-01 — Quảng cáo phá vỡ buổi tập

Các app free phổ biến nhất (Leap Fitness, JEFIT) chèn quảng cáo giữa các bài, có quảng cáo không tắt được khi đang tập. Người dùng mô tả app "không dùng được giữa buổi tập". Đây là phàn nàn số 1 của nhóm app tập tại nhà.

#### PP-02 — Paywall mập mờ, "freemium giả"

- Gói free thực chất là demo (Fitbod ~3 buổi), giới hạn chỉ lộ ra **sau khi** người dùng đã trả lời onboarding dài.
- Tính năng từng miễn phí bị khóa lại sau khi người dùng đã tích lũy thói quen và dữ liệu (xu hướng thấy ở MyFitnessPal, Strava, Fitbit).
- Người dùng mệt mỏi với subscription, ưa mua một lần hoặc app miễn phí.

#### PP-03 — Khó hủy subscription, hoàn tiền, bị trừ tiền 2 lần

Phàn nàn lặp lại trên Trustpilot/review về Fitbod và các app trả phí: khó quản lý gói, hoàn tiền chậm, support phản hồi chậm.

#### PP-04 — Mất dữ liệu / không đồng bộ / bị "khóa" dữ liệu

- Review JEFIT: "xóa hết log của tôi".
- Strong: buổi tập không được ghi nhận dù Apple Activity có; không import lại được dữ liệu.
- Import CSV giữa các app vẫn hay lỗi → người dùng bị trói vào một app (vendor lock-in).

#### PP-05 — Giáo án chung chung, không thích ứng

- App tại nhà dùng thử thách cố định; hết 30 ngày không biết làm gì tiếp.
- App log (Strong, Hevy) không lập giáo án — người dùng phải tự biết lập trình buổi tập.
- AI-plan bị chê cá nhân hóa yếu.
- Thiếu cơ chế **tăng tiến rõ ràng cho bodyweight** (khi nào chuyển từ push-up gối sang push-up thường?).

#### PP-06 — Không phù hợp người mới, nguy cơ chấn thương

Calisthenics app (Thenx) có review "người mới sẽ bị chấn thương". Thiếu bài đánh giá trình độ đầu vào, thiếu hướng dẫn kỹ thuật/lỗi thường gặp, không có phương án giảm độ khó.

#### PP-07 — App không ổn định, phụ thuộc mạng

Crash khi khóa màn hình/chuyển app, báo offline không vào được nội dung (Thenx), "glitchy" (Fitbod). Tập ở nhà/công viên thường mạng yếu.

#### PP-08 — Ghi log chậm, nhiều thao tác

Người dùng phải chạm nhiều lần giữa các hiệp khi tay đang mỏi/ướt. Hevy/Strong được khen chính vì ghi nhanh — chứng tỏ đây là tiêu chí quyết định.

#### PP-09 — Thiếu timer nghỉ tốt, không chạy nền, không âm báo

Người dùng Thenx phải dùng app timer riêng trên đồng hồ. Timer bị dừng khi tắt màn hình.

#### PP-10 — Minh họa kém hoặc phải rời app

Ảnh tĩnh mơ hồ, video nặng tải chậm, hoặc phải mở link ngoài (chính codebase hiện tại cũng gặp). Thiếu tiếng Việt cho mô tả kỹ thuật.

#### PP-11 — Bỏ cuộc sớm (retention cực thấp)

Retention ngày 30 của app fitness chỉ khoảng **3–12%** (Apptopia: 3.4–15.8% với top app; ~8% theo một số benchmark). Nguyên nhân: mục tiêu mơ hồ, không thấy tiến bộ, lịch tập cứng nhắc, bỏ lỡ một buổi là "vỡ" cả kế hoạch.

#### PP-12 — Quyền riêng tư & social ép buộc

Hevy để tài khoản công khai mặc định, feed social không tắt được; nhiều app thu thập dữ liệu sức khỏe nhiều hơn mức cần thiết.

#### PP-13 — Lịch tập cứng nhắc, không xử lý được việc lỡ buổi

Lịch cố định theo ngày; lỡ một buổi thì không biết tập bù hay bỏ; không gợi ý deload khi mệt.

#### PP-14 — Rào cản ngôn ngữ & ngữ cảnh địa phương

App lớn ít bản địa hóa tiếng Việt chất lượng; đơn vị, tên bài, ví dụ dụng cụ thay thế (ghế, bàn, ba lô đựng sách) không phù hợp hộ gia đình Việt.

### 2.4 Cơ hội & định vị sản phẩm

> **"Lộ trình bodyweight tiếng Việt, tự tăng tiến, không quảng cáo, chạy offline, dữ liệu là của bạn."**

| Khoảng trống thị trường                              | Cách sản phẩm lấp                                   |
| ---------------------------------------------------- | --------------------------------------------------- |
| App tại nhà free nhưng đầy ads                       | Không quảng cáo, lõi tập luyện miễn phí vĩnh viễn   |
| App log tốt nhưng không lập giáo án                  | Có sẵn lộ trình theo giai đoạn **và** ghi log nhanh |
| App giáo án nhưng không tăng tiến bodyweight rõ ràng | Thang biến thể + quy tắc tăng tiến minh bạch        |
| App phụ thuộc mạng, hay crash                        | PWA offline-first, lưu cục bộ trước, đồng bộ sau    |
| Dữ liệu bị khóa                                      | Xuất/nhập JSON & CSV, không cần tài khoản để dùng   |

---

## 3. Mô tả tổng quan sản phẩm

### 3.1 Bối cảnh sản phẩm

Sản phẩm độc lập, dạng **web app responsive + PWA** (cài lên màn hình chính iOS/Android/desktop). Giai đoạn đầu chạy hoàn toàn phía client với lưu trữ cục bộ; giai đoạn sau bổ sung backend tùy chọn để đồng bộ đa thiết bị.

```
┌──────────────────────────── Thiết bị người dùng ────────────────────────────┐
│  Next.js UI (React 19)  ──►  Domain logic (tăng tiến, lịch, streak)         │
│         │                              │                                    │
│         ▼                              ▼                                    │
│  Service Worker (cache asset,   IndexedDB (sessions, sets, settings)        │
│  media minh họa, offline)                                                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (tùy chọn, v2) đồng bộ khi có mạng
                                       ▼
                         Backend API + DB (tài khoản, sync, backup)
```

### 3.2 Chức năng chính (tóm tắt)

1. Onboarding & đánh giá trình độ đầu vào.
2. Thư viện bài tập có thang biến thể và minh họa.
3. Chương trình tập theo giai đoạn (có sẵn + tùy chỉnh).
4. Chế độ "Đang tập" (workout player): ghi hiệp, timer nghỉ, âm báo.
5. Engine tăng tiến tự động.
6. Lịch tập linh hoạt, nhắc nhở, xử lý lỡ buổi.
7. Tiến độ, lịch sử, thống kê, streak, thành tích.
8. Quản lý dữ liệu: xuất/nhập/sao lưu, quyền riêng tư.
9. (v2) Tài khoản & đồng bộ đa thiết bị.

### 3.3 Nhóm người dùng & persona

| Persona                                              | Mô tả                                               | Nhu cầu chính                                                  | Pain point liên quan  |
| ---------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- | --------------------- |
| **Minh — Người mới hoàn toàn** (22 tuổi, sinh viên)  | Chưa tập bao giờ, không có tiền đi gym, ở phòng trọ | Biết bắt đầu từ đâu, không bị chấn thương, không phải trả tiền | PP-01, 02, 05, 06, 14 |
| **Lan — Người quay lại tập** (30 tuổi, văn phòng)    | Từng tập, bận rộn, hay bỏ dở                        | Buổi ngắn 20–30', lịch linh hoạt, thấy tiến bộ để giữ động lực | PP-11, 13, 08         |
| **Huy — Người tập calisthenics trung cấp** (26 tuổi) | Làm được 20 push-up, 5 pull-up                      | Lộ trình lên kỹ năng khó, ghi số liệu chi tiết, xuất dữ liệu   | PP-04, 05, 09         |
| **Quản trị nội dung**                                | Chủ dự án/HLV biên soạn bài tập                     | Thêm/sửa bài, giai đoạn mà không sửa code                      | —                     |

### 3.4 Môi trường vận hành

- Trình duyệt: Chrome/Edge ≥ 2 phiên bản gần nhất, Safari iOS ≥ 16.4 (hỗ trợ PWA & Web Push), Firefox mới nhất.
- Thiết bị: điện thoại màn hình ≥ 360px (ưu tiên chính), tablet, desktop.
- Hosting: Vercel hoặc tương đương hỗ trợ Next.js.

### 3.5 Ràng buộc thiết kế & triển khai

- **C-01:** Next.js App Router + TypeScript + Tailwind + shadcn/ui (theo codebase hiện có).
- **C-02:** Lõi tập luyện phải hoạt động **không cần tài khoản và không cần mạng** sau lần tải đầu.
- **C-03:** Không tích hợp SDK quảng cáo.
- **C-04:** Media minh họa lấy từ **thư viện mở** có giấy phép đã xác minh (CC0/CC-BY/CC-BY-SA/public domain), tải về và tự host kèm ghi nguồn — không hotlink, không dùng ảnh từ iStock/trang thương mại.
- **C-07:** Code phải tương thích static export (`output: "export"`) để đóng gói mobile bằng Capacitor sau MVP.
- **C-08:** Sản phẩm miễn phí, không có chi phí server trong MVP.
- **C-05:** Nội dung mặc định tiếng Việt; kiến trúc hỗ trợ i18n để thêm tiếng Anh.
- **C-06:** App không phải thiết bị y tế; không đưa ra chẩn đoán.

### 3.6 Giả định & phụ thuộc

- A-01: Người dùng có điện thoại thông minh và truy cập web lần đầu có mạng.
- A-02: IndexedDB khả dụng (trình duyệt riêng tư có thể hạn chế → cần cảnh báo).
- A-03: iOS cần "Thêm vào màn hình chính" để nhận Web Push.
- A-04: Không có chuyên gia review; nội dung bài tập được biên soạn từ nguồn công khai uy tín và ghi nguồn từng bài.

---

## 4. Yêu cầu chức năng

**Quy ước độ ưu tiên (MoSCoW):** **M** = Must (MVP), **S** = Should (v1), **C** = Could (v2+), **W** = Won't (lần này).

### 4.1 Onboarding & Hồ sơ (ONB)

| ID        | Yêu cầu                                                                                                                                                                                                                                                     | Ưu tiên |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-ONB-01 | Người dùng có thể bắt đầu tập ngay **không cần đăng ký tài khoản**.                                                                                                                                                                                         | M       |
| FR-ONB-02 | Onboarding tối đa **5 bước**, mỗi bước có nút "Bỏ qua"; thu thập: mục tiêu (khỏe tổng quát / tăng cơ / giảm mỡ / kỹ năng calisthenics), số buổi/tuần (2–6), thời lượng mong muốn (15/30/45 phút), dụng cụ sẵn có (không có / ghế / xà đơn / dây kháng lực). | M       |
| FR-ONB-03 | **Bài kiểm tra trình độ** tùy chọn: số push-up tối đa, squat tối đa trong 60s, plank tối đa (giây), số pull-up/inverted row tối đa. Kết quả dùng để chọn bậc khởi đầu trong mỗi thang biến thể.                                                             | S       |
| FR-ONB-04 | **Màn hình sàng lọc sức khỏe** (PAR-Q rút gọn): nếu người dùng chọn có vấn đề tim mạch/chấn thương, hiển thị khuyến cáo tham khảo bác sĩ và gợi ý lộ trình nhẹ. Không chặn người dùng.                                                                      | M       |
| FR-ONB-05 | Hiển thị **minh bạch** ngay trong onboarding: tính năng nào miễn phí, (nếu có) tính năng nào trả phí — không hiện paywall sau onboarding.                                                                                                                   | M       |
| FR-ONB-06 | Người dùng sửa được mọi thông tin hồ sơ sau này trong Cài đặt.                                                                                                                                                                                              | M       |

### 4.2 Thư viện bài tập (EXL)

| ID        | Yêu cầu                                                                                                                                                                                                    | Ưu tiên |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-EXL-01 | Mỗi bài tập có: tên tiếng Việt + tên tiếng Anh, nhóm cơ chính/phụ, dụng cụ, loại đo (`reps` / `time` / `reps_each_side`), độ khó (1–10), mô tả các bước, **lỗi thường gặp**, mẹo thở, chống chỉ định.      | M       |
| FR-EXL-02 | Mỗi bài có **minh họa hiển thị ngay trong app** (ảnh động WebP/GIF hoặc video ngắn ≤ 10s, có tắt tiếng mặc định). Không yêu cầu rời app.                                                                   | M       |
| FR-EXL-03 | Bài tập thuộc một **thang biến thể** (progression ladder) với thứ tự rõ ràng, VD: Wall push-up → Incline push-up → Knee push-up → Push-up → Diamond push-up → Archer push-up → One-arm push-up (assisted). | M       |
| FR-EXL-04 | Mỗi bậc thang có **tiêu chí lên bậc** (VD: 3 hiệp × 12 reps kỹ thuật chuẩn, RPE ≤ 8) và **phương án hạ bậc**.                                                                                              | M       |
| FR-EXL-05 | Tìm kiếm theo tên (không dấu cũng tìm được, VD "hit dat" → "Hít đất"), lọc theo nhóm cơ, dụng cụ, độ khó.                                                                                                  | S       |
| FR-EXL-06 | Người dùng tạo **bài tập tùy chỉnh** (tên, loại đo, nhóm cơ, ghi chú, ảnh tự chụp) — không giới hạn số lượng.                                                                                              | S       |
| FR-EXL-07 | Gợi ý **dụng cụ thay thế trong nhà** (ghế, mép bàn, ba lô đựng sách/chai nước làm tạ).                                                                                                                     | S       |
| FR-EXL-08 | Minh họa được cache để xem offline sau lần xem đầu, hoặc tải trước toàn bộ giai đoạn hiện tại.                                                                                                             | M       |

### 4.3 Chương trình tập (PRG)

| ID        | Yêu cầu                                                                                                                                                                    | Ưu tiên |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-PRG-01 | Hệ thống cung cấp ít nhất **1 chương trình mặc định 12 tuần / 3 giai đoạn** (kế thừa nội dung hiện có: Nền tảng → Tăng cường độ → Nâng cao).                               | M       |
| FR-PRG-02 | Chương trình gồm: Giai đoạn → Tuần → Buổi (A/B/C…) → Bài tập (bậc thang, số hiệp, mục tiêu reps/thời gian dạng **có cấu trúc**, thời gian nghỉ).                           | M       |
| FR-PRG-03 | Dữ liệu mục tiêu phải **có cấu trúc** (`sets: 3, repsMin: 10, repsMax: 12, restSec: 90`) thay vì chuỗi tự do.                                                              | M       |
| FR-PRG-04 | Mỗi giai đoạn có mô tả mục tiêu, thời lượng, và **tuần deload** (giảm ~40% khối lượng) ở cuối giai đoạn.                                                                   | S       |
| FR-PRG-05 | Có thêm các chương trình ngắn: "15 phút mỗi ngày", "Toàn thân 3 buổi/tuần", "Chuẩn bị pull-up đầu tiên".                                                                   | C       |
| FR-PRG-06 | Người dùng tạo/chỉnh sửa/nhân bản chương trình riêng — **không giới hạn số routine**.                                                                                      | S       |
| FR-PRG-07 | Hệ thống tự điều chỉnh chương trình theo dụng cụ (không dụng cụ / xà đơn / dây kháng lực): thiếu xà đơn → thay pull-up bằng inverted row dưới bàn/towel row hoặc band row. | M       |
| FR-PRG-08 | Người dùng có thể **đổi bài** trong buổi tập sang bài tương đương (cùng nhóm cơ, cùng mẫu chuyển động).                                                                    | S       |
| FR-PRG-09 | Màn hình tổng quan chương trình hiển thị tuần hiện tại, % hoàn thành giai đoạn, và buổi tiếp theo.                                                                         | M       |

### 4.4 Chế độ Đang tập — Workout Player (WKP)

| ID        | Yêu cầu                                                                                                                                                                            | Ưu tiên |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-WKP-01 | Nút **"Bắt đầu buổi tập"** mở chế độ toàn màn hình, hiển thị bài hiện tại, minh họa, hiệp thứ mấy / tổng hiệp, mục tiêu.                                                           | M       |
| FR-WKP-02 | **Ghi một hiệp bằng tối đa 1 chạm** khi đạt đúng mục tiêu (nút "Xong ✓" điền sẵn reps mục tiêu); chỉnh reps bằng nút +/− lớn (≥ 48×48px) nếu khác mục tiêu.                        | M       |
| FR-WKP-03 | Với bài loại `time`: bộ đếm giờ tích hợp, đếm ngược 3-2-1, âm báo khi hết giờ.                                                                                                     | M       |
| FR-WKP-04 | **Timer nghỉ** tự bật sau mỗi hiệp; có ±15s, bỏ qua; rung + âm báo khi hết.                                                                                                        | M       |
| FR-WKP-05 | Timer **tính theo mốc thời gian tuyệt đối** (timestamp), không phụ thuộc `setInterval` — đúng giờ kể cả khi tắt màn hình/chuyển app; khi quay lại hiển thị đúng thời gian còn lại. | M       |
| FR-WKP-06 | Dùng **Screen Wake Lock API** (nếu có) để giữ màn hình sáng trong buổi tập; có thể tắt trong cài đặt.                                                                              | S       |
| FR-WKP-07 | Tùy chọn ghi **RPE** hoặc "Dễ / Vừa / Khó" sau mỗi bài (mặc định chỉ hỏi sau hiệp cuối để giảm thao tác).                                                                          | M       |
| FR-WKP-08 | **Lưu tự động sau mỗi hiệp** vào bộ nhớ cục bộ. Nếu app bị đóng/crash, mở lại sẽ hỏi "Tiếp tục buổi tập dở?".                                                                      | M       |
| FR-WKP-09 | Hướng dẫn giọng nói tiếng Việt (Web Speech API): đọc tên bài, đếm ngược, báo hết nghỉ. Bật/tắt được.                                                                               | C       |
| FR-WKP-10 | Hiển thị **lần tập trước** của cùng bài ("Lần trước: 10-10-8") ngay cạnh mục tiêu.                                                                                                 | M       |
| FR-WKP-11 | Cho phép bỏ qua bài, thêm hiệp, thêm ghi chú tự do cho buổi.                                                                                                                       | S       |
| FR-WKP-12 | Kết thúc buổi: màn hình tóm tắt (thời lượng, tổng reps/hiệp, PR mới, gợi ý cho lần sau).                                                                                           | M       |
| FR-WKP-13 | Phần khởi động (warm-up) 3–5 phút và giãn cơ (cool-down) tùy chọn trước/sau buổi.                                                                                                  | S       |

### 4.5 Engine tăng tiến (PRO)

| ID        | Yêu cầu                                                                                                                                                                                                                                                               | Ưu tiên |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-PRO-01 | Sau mỗi buổi, với mỗi bài, hệ thống tính gợi ý cho lần sau theo quy tắc **double progression**: nếu mọi hiệp đạt `repsMax` với RPE ≤ 8 → tăng mục tiêu (hoặc lên bậc khi đạt tiêu chí FR-EXL-04); nếu không đạt `repsMin` ở ≥ 2 hiệp hoặc RPE = 10 → giữ nguyên/giảm. | M       |
| FR-PRO-02 | Khi đủ điều kiện lên bậc, hiển thị đề xuất **"Sẵn sàng thử Diamond Push-up?"** — người dùng chấp nhận / để sau. Không tự đổi khi chưa có xác nhận.                                                                                                                    | M       |
| FR-PRO-03 | Mọi gợi ý phải kèm **lý do dễ hiểu** ("Bạn đã đạt 3×12 trong 2 buổi liên tiếp").                                                                                                                                                                                      | M       |
| FR-PRO-04 | Nếu người dùng báo "Khó" ở 2 buổi liên tiếp hoặc hiệu suất giảm > 20% → đề xuất hạ bậc hoặc tuần deload.                                                                                                                                                              | S       |
| FR-PRO-05 | Sau khi nghỉ ≥ 10 ngày, buổi đầu tiên quay lại giảm 20–30% khối lượng ("buổi khởi động lại").                                                                                                                                                                         | S       |
| FR-PRO-06 | Tham số engine (ngưỡng RPE, bước tăng reps) cấu hình được trong file cấu hình, không hard-code rải rác.                                                                                                                                                               | S       |

### 4.6 Lịch tập & nhắc nhở (SCH)

| ID        | Yêu cầu                                                                                                                                                | Ưu tiên |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| FR-SCH-01 | Người dùng chọn các ngày tập trong tuần; hệ thống phân buổi A/B/C tương ứng.                                                                           | M       |
| FR-SCH-02 | **Lịch dạng hàng đợi, không phải ngày cứng:** lỡ buổi thì buổi đó vẫn là "buổi tiếp theo" — không bị đánh dấu thất bại, không dồn 2 buổi vào một ngày. | M       |
| FR-SCH-03 | Cảnh báo nhẹ nếu tập cùng nhóm cơ 2 ngày liên tiếp với cường độ cao; vẫn cho phép.                                                                     | C       |
| FR-SCH-04 | Nhắc nhở qua **Web Push** vào giờ người dùng chọn; tối đa 1 thông báo/ngày; tắt được hoàn toàn.                                                        | S       |
| FR-SCH-05 | Xem lịch tháng với ngày đã tập / ngày dự kiến.                                                                                                         | S       |
| FR-SCH-06 | Xuất lịch tập ra file `.ics` để thêm vào Google/Apple Calendar.                                                                                        | C       |

### 4.7 Tiến độ, thống kê & động lực (STA)

| ID        | Yêu cầu                                                                                                                                          | Ưu tiên |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| FR-STA-01 | Lịch sử mọi buổi tập (ngày, thời lượng, bài, từng hiệp), xem/sửa/xóa được.                                                                       | M       |
| FR-STA-02 | Biểu đồ theo bài: reps tốt nhất theo thời gian, tổng khối lượng tuần, bậc thang hiện tại — **không giới hạn khoảng thời gian lịch sử**.          | S       |
| FR-STA-03 | Ghi nhận **kỷ lục cá nhân (PR)**: nhiều reps nhất, giữ lâu nhất, bậc cao nhất.                                                                   | S       |
| FR-STA-04 | **Streak theo tuần** (đạt số buổi mục tiêu trong tuần) thay vì streak theo ngày, để không phạt ngày nghỉ hợp lý. Có 1 "thẻ đóng băng" mỗi tháng. | S       |
| FR-STA-05 | Huy hiệu mốc: buổi đầu tiên, hoàn thành giai đoạn, push-up đầu tiên không cần gối, pull-up đầu tiên…                                             | C       |
| FR-STA-06 | Ghi chỉ số cơ thể tùy chọn: cân nặng, vòng eo, ảnh tiến độ (chỉ lưu cục bộ, không upload trừ khi bật sync).                                      | C       |
| FR-STA-07 | Lặp lại bài kiểm tra trình độ (FR-ONB-03) mỗi cuối giai đoạn và so sánh với lần trước.                                                           | S       |

### 4.8 Quản lý dữ liệu & quyền riêng tư (DAT)

| ID        | Yêu cầu                                                                                                                            | Ưu tiên |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-DAT-01 | **Xuất toàn bộ dữ liệu** ra JSON (đầy đủ, nhập lại được) và CSV (mỗi dòng một hiệp) — miễn phí, không giới hạn.                    | M       |
| FR-DAT-02 | **Nhập dữ liệu** từ file JSON của chính app; nhập CSV từ Strong/Hevy (map cột cơ bản) với màn hình xem trước và báo lỗi theo dòng. | S       |
| FR-DAT-03 | Nhắc sao lưu định kỳ (mỗi 30 ngày) khi người dùng chưa bật đồng bộ.                                                                | S       |
| FR-DAT-04 | Xóa toàn bộ dữ liệu với bước xác nhận 2 lần; xóa tài khoản (nếu có) trong ≤ 30 ngày.                                               | M       |
| FR-DAT-05 | Không có tính năng social công khai trong v1; mọi chia sẻ (ảnh tóm tắt buổi tập) là thao tác chủ động của người dùng.              | M       |
| FR-DAT-06 | Mọi thao tác xóa log có **Hoàn tác** trong 10 giây; dữ liệu bị xóa nằm trong "thùng rác" 30 ngày.                                  | S       |
| FR-DAT-07 | Yêu cầu lưu trữ bền vững (`navigator.storage.persist()`) để trình duyệt không tự xóa IndexedDB.                                    | M       |

### 4.9 Tài khoản & đồng bộ (ACC) — v2

| ID        | Yêu cầu                                                                                                                                                           | Ưu tiên |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-ACC-01 | Đăng nhập tùy chọn bằng email (magic link) hoặc Google.                                                                                                           | C       |
| FR-ACC-02 | Đồng bộ đa thiết bị; dữ liệu cục bộ là nguồn chính, đồng bộ khi có mạng; xung đột giải quyết theo "bản ghi mới nhất theo từng hiệp" (per-record last-write-wins). | C       |
| FR-ACC-03 | Khi đăng nhập lần đầu, hợp nhất dữ liệu cục bộ đã có vào tài khoản — không ghi đè, không mất dữ liệu.                                                             | C       |

### 4.10 Kiếm tiền (MON) — nếu có

| ID        | Yêu cầu                                                                                                                                                     | Ưu tiên |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-MON-01 | Lõi (chương trình mặc định, ghi log, timer, tăng tiến, thống kê, xuất dữ liệu) **miễn phí vĩnh viễn, không quảng cáo**.                                     | M       |
| FR-MON-02 | Nếu có gói trả phí: chỉ cho tính năng bổ sung (chương trình chuyên sâu, đồng bộ đám mây, giọng nói HLV); ưu tiên **mua một lần** hoặc có lựa chọn trọn đời. | W       |
| FR-MON-03 | Hủy gói trong ≤ 2 thao tác từ trang Cài đặt; email xác nhận; nhắc trước khi gia hạn 3 ngày.                                                                 | W       |
| FR-MON-04 | Không bao giờ khóa lại tính năng đã miễn phí hoặc chặn truy cập dữ liệu người dùng đã tạo.                                                                  | M       |

### 4.11 Quản trị nội dung (ADM)

| ID        | Yêu cầu                                                                                                                       | Ưu tiên |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| FR-ADM-01 | Nội dung bài tập/chương trình tách khỏi code UI, lưu dạng file dữ liệu có schema (JSON/TS) được validate khi build (VD: Zod). | M       |
| FR-ADM-02 | Build thất bại nếu bài tập thiếu trường bắt buộc, minh họa không tồn tại, hoặc thang biến thể tham chiếu bài không có.        | S       |
| FR-ADM-03 | (v2) Giao diện CMS để thêm/sửa bài không cần sửa code.                                                                        | C       |

### 4.12 Cài đặt (SET)

| ID        | Yêu cầu                                                    | Ưu tiên |
| --------- | ---------------------------------------------------------- | ------- |
| FR-SET-01 | Giao diện sáng/tối/theo hệ thống.                          | S       |
| FR-SET-02 | Bật/tắt âm báo, rung, giọng nói, giữ màn hình sáng.        | M       |
| FR-SET-03 | Thời gian nghỉ mặc định, đơn vị (kg/lb cho chỉ số cơ thể). | S       |
| FR-SET-04 | Ngôn ngữ: Tiếng Việt (mặc định), English (v2).             | S       |

---

## 5. Yêu cầu phi chức năng

### 5.1 Hiệu năng

| ID          | Yêu cầu                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| NFR-PERF-01 | Lần tải đầu trên 4G: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (Core Web Vitals, thiết bị Android tầm trung). |
| NFR-PERF-02 | Mở lại app (đã cache): hiển thị màn hình buổi tập tiếp theo ≤ 1s, kể cả offline.                       |
| NFR-PERF-03 | Ghi một hiệp: phản hồi UI ≤ 100ms; ghi IndexedDB không chặn UI.                                        |
| NFR-PERF-04 | Media minh họa mỗi bài ≤ 500KB (WebP động/MP4 H.264), lazy-load. Bundle JS ban đầu ≤ 200KB gzip.       |
| NFR-PERF-05 | Sai số timer nghỉ ≤ 1s sau 5 phút chạy nền.                                                            |

### 5.2 Độ tin cậy & toàn vẹn dữ liệu

| ID         | Yêu cầu                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-REL-01 | **Không mất dữ liệu đã ghi**: mỗi hiệp được commit vào IndexedDB trước khi UI báo thành công.                                                                      |
| NFR-REL-02 | Phục hồi buổi tập dở sau crash/đóng tab với 100% hiệp đã ghi.                                                                                                      |
| NFR-REL-03 | Dữ liệu cục bộ có `schemaVersion`; migration tự động khi nâng cấp, có kiểm thử cho mọi migration. Migration thất bại → không ghi đè, giữ bản gốc và cho xuất file. |
| NFR-REL-04 | File xuất JSON nhập lại phải cho ra dữ liệu giống hệt (round-trip test).                                                                                           |
| NFR-REL-05 | Tỷ lệ phiên không lỗi JS (crash-free sessions) ≥ 99.5%.                                                                                                            |

### 5.3 Khả dụng offline

| ID         | Yêu cầu                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| NFR-OFF-01 | Sau lần truy cập đầu, toàn bộ luồng: xem chương trình → tập → ghi log → xem lịch sử hoạt động không cần mạng. |
| NFR-OFF-02 | Không bao giờ hiển thị màn hình chặn "Bạn đang offline" cho tính năng lõi.                                    |

### 5.4 Khả năng sử dụng

| ID         | Yêu cầu                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR-USE-01 | Từ mở app → bắt đầu buổi tập tiếp theo: ≤ 2 chạm.                                                                                                |
| NFR-USE-02 | Vùng chạm chính trong Workout Player ≥ 48×48px, dùng được bằng một tay, đặt ở nửa dưới màn hình.                                                 |
| NFR-USE-03 | Người mới hoàn thành onboarding + buổi tập đầu tiên mà không cần hướng dẫn bên ngoài (kiểm chứng bằng usability test 5 người, ≥ 4/5 thành công). |
| NFR-USE-04 | Ngôn ngữ thân thiện, không dùng thuật ngữ chưa giải thích; thuật ngữ như RPE có tooltip.                                                         |
| NFR-USE-05 | Không dùng dark pattern: không đếm ngược giả, không ẩn nút đóng, không ép đánh giá app.                                                          |

### 5.5 Khả năng tiếp cận (Accessibility)

| ID          | Yêu cầu                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------ |
| NFR-A11Y-01 | Tuân thủ WCAG 2.2 mức AA: tương phản ≥ 4.5:1, điều hướng bàn phím, nhãn ARIA cho nút icon. |
| NFR-A11Y-02 | Thông báo hết giờ có cả âm thanh, rung và hiển thị trực quan.                              |
| NFR-A11Y-03 | Tôn trọng `prefers-reduced-motion`: thay ảnh động bằng ảnh tĩnh + nút phát.                |

### 5.6 Bảo mật & quyền riêng tư

| ID         | Yêu cầu                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-01 | Không thu thập dữ liệu cá nhân khi chưa đăng nhập; analytics (nếu có) ẩn danh, không cookie theo dõi bên thứ ba, có tùy chọn tắt.                                                                                 |
| NFR-SEC-02 | Tuân thủ **Nghị định 13/2023/NĐ-CP** về bảo vệ dữ liệu cá nhân (dữ liệu sức khỏe là dữ liệu nhạy cảm): có chính sách quyền riêng tư tiếng Việt, xin đồng ý rõ ràng trước khi đồng bộ dữ liệu sức khỏe lên server. |
| NFR-SEC-03 | (v2) HTTPS toàn bộ, mã hóa dữ liệu khi lưu trữ phía server, token phiên HttpOnly.                                                                                                                                 |
| NFR-SEC-04 | Header bảo mật: CSP, `X-Content-Type-Options`, `Referrer-Policy`.                                                                                                                                                 |

### 5.7 Khả năng bảo trì & mở rộng

| ID         | Yêu cầu                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| NFR-MNT-01 | TypeScript `strict`; logic domain (tăng tiến, lịch, streak) là hàm thuần, tách khỏi React, độ phủ unit test ≥ 80%. |
| NFR-MNT-02 | E2E test (Playwright) cho luồng: onboarding → tập 1 buổi → reload giữa chừng → tiếp tục → xuất dữ liệu.            |
| NFR-MNT-03 | ESLint không cảnh báo; CI chạy lint + type-check + test trên mỗi PR.                                               |
| NFR-MNT-04 | Lớp truy cập dữ liệu (repository) trừu tượng để chuyển từ IndexedDB-only sang có sync mà không sửa UI.             |

### 5.8 Tương thích

| ID         | Yêu cầu                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| NFR-CMP-01 | Hoạt động đầy đủ trên môi trường ở mục 3.4; tính năng thiếu API (Wake Lock, Push, Speech) phải suy giảm êm (graceful degradation). |
| NFR-CMP-02 | Bố cục đúng từ 320px đến 1440px, không cuộn ngang.                                                                                 |

### 5.9 Nội dung & an toàn

| ID         | Yêu cầu                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-CNT-01 | Mỗi bài tập có `sources[]` (nguồn công khai uy tín) hiển thị trong app; app ghi rõ "nội dung tham khảo, chưa được chuyên gia kiểm duyệt". Ngưỡng tăng tiến thận trọng và có nút "Đau / khó chịu" trong buổi tập. |
| NFR-CNT-02 | Có tuyên bố miễn trừ trách nhiệm y tế ở onboarding và trang Giới thiệu.                                                                                                                                          |
| NFR-CNT-03 | Mọi media có ghi nguồn/giấy phép trong dữ liệu (`license`, `attribution`).                                                                                                                                       |

---

## 6. Mô hình dữ liệu

### 6.1 Thực thể nội dung (tĩnh, đóng gói theo app)

```ts
type MuscleGroup =
  "chest" | "back" | "shoulders" | "arms" | "core" | "legs" | "glutes" | "full_body";
type Equipment = "none" | "chair" | "table" | "pullup_bar" | "resistance_band" | "backpack";
type MeasureType = "reps" | "time" | "reps_each_side";

interface Exercise {
  id: string; // "push-up-knee"
  nameVi: string; // "Chống đẩy gối"
  nameEn: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  measure: MeasureType;
  difficulty: number; // 1–10
  steps: string[];
  commonMistakes: string[];
  contraindications?: string[];
  media: {
    src: string;
    type: "webp" | "mp4";
    poster: string;
    license: string;
    attribution?: string;
  };
  ladderId?: string;
  ladderOrder?: number;
  reviewedBy?: string;
  reviewedAt?: string; // ISO date
}

interface ProgressionLadder {
  id: string; // "push"
  nameVi: string; // "Thang chống đẩy"
  steps: {
    exerciseId: string;
    advanceWhen: { sets: number; reps: number; maxRpe: number; sessions: number };
  }[];
}

interface Program {
  id: string;
  nameVi: string;
  phases: Phase[];
}

interface Phase {
  id: string;
  order: number;
  titleVi: string; // "Xây dựng nền tảng"
  weeks: number; // 4
  deloadLastWeek: boolean;
  sessions: SessionTemplate[];
}

interface SessionTemplate {
  id: string; // "A"
  titleVi: string;
  items: {
    ladderId?: string; // chọn bậc theo trình độ người dùng
    exerciseId?: string; // hoặc cố định một bài
    sets: number;
    repsMin?: number;
    repsMax?: number; // cho reps
    secondsMin?: number;
    secondsMax?: number; // cho time
    restSec: number;
  }[];
}
```

### 6.2 Thực thể người dùng (IndexedDB)

```ts
interface UserProfile {
  schemaVersion: number;
  goal: "general" | "muscle" | "fat_loss" | "skill";
  daysPerWeek: number;
  preferredDays: number[]; // 0=CN … 6=T7
  sessionMinutes: 15 | 30 | 45;
  equipment: Equipment[];
  activeProgramId: string;
  createdAt: string;
}

interface LadderState {
  ladderId: string;
  currentExerciseId: string;
  updatedAt: string;
}

interface WorkoutSession {
  id: string; // uuid
  programId: string;
  phaseId: string;
  sessionTemplateId: string;
  startedAt: string;
  endedAt?: string;
  status: "in_progress" | "completed" | "abandoned";
  notes?: string;
  deletedAt?: string; // thùng rác 30 ngày
}

interface SetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  reps?: number;
  seconds?: number;
  rpe?: number; // 1–10
  assistance?: string; // mức dây kháng lực khi tập assisted, VD "band-red"
  painReported?: boolean; // người dùng bấm "Đau / khó chịu"
  completedAt: string;
}

interface Suggestion {
  exerciseId: string;
  kind: "increase" | "hold" | "decrease" | "advance" | "regress" | "deload";
  reasonVi: string;
  createdAt: string;
  status: "pending" | "accepted" | "dismissed";
}
```

### 6.3 Sơ đồ quan hệ

```
Program 1──* Phase 1──* SessionTemplate 1──* TemplateItem *──1 Exercise
ProgressionLadder 1──* Exercise
UserProfile 1──* LadderState
WorkoutSession 1──* SetLog *──1 Exercise
```

---

## 7. Use case chính

### UC-01: Lần đầu sử dụng

- **Tác nhân:** Người mới (Minh)
- **Tiền điều kiện:** Lần đầu mở app, có mạng.
- **Luồng chính:**
  1. Màn hình chào: "Tập bodyweight tại nhà, miễn phí, không quảng cáo" + nút "Bắt đầu".
  2. Chọn mục tiêu → số buổi/tuần → dụng cụ → sàng lọc sức khỏe (có thể bỏ qua từng bước).
  3. (Tùy chọn) Làm bài kiểm tra trình độ, hoặc chọn "Tôi mới hoàn toàn".
  4. Hệ thống gán bậc khởi đầu cho từng thang, tạo lịch, hiển thị "Buổi 1 — Toàn thân A, ~25 phút".
  5. Hệ thống tải trước media của giai đoạn 1 ở nền.
- **Hậu điều kiện:** Có `UserProfile`, `LadderState`; không cần tài khoản.
- **Luồng thay thế:** 2a. Bỏ qua tất cả → dùng cấu hình mặc định (3 buổi/tuần, không dụng cụ, bậc dễ nhất).

### UC-02: Thực hiện buổi tập

- **Tác nhân:** Người dùng
- **Luồng chính:**
  1. Trang chủ → "Bắt đầu buổi tiếp theo".
  2. (Tùy chọn) Khởi động 3 phút.
  3. Với mỗi bài: xem minh họa + mục tiêu + lần trước → tập → chạm "Xong ✓" (hoặc chỉnh reps) → timer nghỉ tự chạy.
  4. Sau hiệp cuối của bài: chọn Dễ/Vừa/Khó.
  5. Kết thúc: màn hình tóm tắt + gợi ý cho lần sau.
- **Luồng ngoại lệ:**
  - 3a. Người dùng tắt màn hình trong lúc nghỉ → timer vẫn đúng; thông báo/rung khi hết (nếu nền tảng cho phép).
  - 3b. Tab bị đóng → mở lại hiện "Tiếp tục buổi tập dở (bài 3/5, hiệp 2)?".
  - 3c. Bài quá khó → "Đổi sang bậc dễ hơn" ngay trong buổi.

### UC-03: Lên bậc biến thể

1. Sau buổi tập, engine phát hiện người dùng đạt 3×12 knee push-up RPE ≤ 8 trong 2 buổi.
2. Hiển thị thẻ "Sẵn sàng thử Push-up chuẩn? Lý do: …" + minh họa bài mới.
3. Người dùng chọn "Thử ở buổi sau" → `LadderState` cập nhật; buổi sau mục tiêu bắt đầu ở 3×5–8.
4. Nếu buổi sau không đạt `repsMin` → gợi ý "Kết hợp: 2 hiệp push-up chuẩn + 1 hiệp knee push-up".

### UC-04: Lỡ buổi tập

1. Người dùng dự kiến tập thứ Hai nhưng không tập.
2. Thứ Ba mở app: vẫn hiển thị "Buổi tiếp theo: Toàn thân A" — không có thông báo thất bại.
3. Streak tuần vẫn giữ nếu cuối tuần đạt đủ số buổi.

### UC-05: Xuất và chuyển dữ liệu

1. Cài đặt → Dữ liệu → "Xuất JSON" / "Xuất CSV".
2. Trên thiết bị mới: "Nhập dữ liệu" → chọn file → xem trước số buổi/hiệp → xác nhận.
3. Hệ thống hợp nhất, bỏ qua bản ghi trùng `id`.

---

## 8. Giao diện bên ngoài

### 8.1 Giao diện người dùng — danh sách màn hình

| Màn hình               | Route đề xuất                   | Ghi chú                                   |
| ---------------------- | ------------------------------- | ----------------------------------------- |
| Chào mừng / Onboarding | `/welcome`                      | Chỉ hiện lần đầu                          |
| Trang chủ (Hôm nay)    | `/`                             | Buổi tiếp theo, tiến độ giai đoạn, streak |
| Chương trình           | `/program`                      | Danh sách giai đoạn → tuần → buổi         |
| Chi tiết giai đoạn     | `/program/phase/[id]`           | Thay thế `/phase/[id]` hiện tại           |
| Workout Player         | `/workout/[sessionId]`          | Toàn màn hình                             |
| Tóm tắt buổi           | `/workout/[sessionId]/summary`  |                                           |
| Thư viện bài tập       | `/exercises`, `/exercises/[id]` |                                           |
| Lịch sử & thống kê     | `/history`, `/stats`            |                                           |
| Cài đặt & dữ liệu      | `/settings`                     |                                           |

Điều hướng chính: thanh tab dưới cùng (Hôm nay · Chương trình · Bài tập · Tiến độ · Cài đặt).

### 8.2 Giao diện phần cứng / API trình duyệt

| API                            | Mục đích             | Phương án khi không hỗ trợ                 |
| ------------------------------ | -------------------- | ------------------------------------------ |
| IndexedDB                      | Lưu dữ liệu          | Cảnh báo, fallback `localStorage` giới hạn |
| Service Worker + Cache Storage | Offline              | App vẫn chạy online                        |
| Screen Wake Lock               | Giữ màn hình         | Gợi ý người dùng tự chỉnh                  |
| Vibration                      | Rung báo             | Chỉ âm thanh + hình                        |
| Web Audio                      | Âm báo               | Hình ảnh                                   |
| Notifications / Push           | Nhắc tập             | Không nhắc                                 |
| Web Speech (TTS)               | Giọng nói            | Tắt tính năng                              |
| Storage Manager (`persist`)    | Chống bị xóa dữ liệu | Nhắc sao lưu thường xuyên hơn              |

### 8.3 Giao diện phần mềm (v2)

- REST/JSON API: `POST /api/sync` (gửi thay đổi kể từ `lastSyncAt`, nhận thay đổi từ server), `GET /api/export`, `DELETE /api/account`.
- Tích hợp tùy chọn: Google Fit / Health Connect (Android) qua ứng dụng native wrapper nếu sau này đóng gói.

---

## 9. Ma trận truy vết Pain point → Yêu cầu

| Pain point                              | Yêu cầu giải quyết                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| PP-01 Quảng cáo phá buổi tập            | C-03, FR-MON-01                                                                      |
| PP-02 Paywall mập mờ                    | FR-ONB-01, FR-ONB-05, FR-MON-01, FR-MON-04                                           |
| PP-03 Khó hủy, hoàn tiền                | FR-MON-02, FR-MON-03                                                                 |
| PP-04 Mất / khóa dữ liệu                | FR-DAT-01, 02, 03, 06, 07, NFR-REL-01…04                                             |
| PP-05 Giáo án chung chung               | FR-EXL-03, 04, FR-PRG-01…08, FR-PRO-01…06                                            |
| PP-06 Không hợp người mới / chấn thương | FR-ONB-03, 04, FR-EXL-01 (lỗi thường gặp, chống chỉ định), FR-PRO-04, NFR-CNT-01, 02 |
| PP-07 Crash, phụ thuộc mạng             | C-02, FR-WKP-08, NFR-OFF-01, 02, NFR-REL-02, 05                                      |
| PP-08 Ghi log chậm                      | FR-WKP-02, FR-WKP-10, NFR-USE-01, 02, NFR-PERF-03                                    |
| PP-09 Timer kém                         | FR-WKP-03, 04, 05, 06, NFR-PERF-05                                                   |
| PP-10 Minh họa kém / rời app            | FR-EXL-02, 08, C-04, NFR-PERF-04                                                     |
| PP-11 Bỏ cuộc sớm                       | FR-PRO-03, FR-STA-03, 04, 05, 07, FR-WKP-12, FR-SCH-04                               |
| PP-12 Riêng tư / social ép buộc         | FR-DAT-05, NFR-SEC-01, 02                                                            |
| PP-13 Lịch cứng nhắc                    | FR-SCH-02, FR-PRO-05, FR-STA-04                                                      |
| PP-14 Ngôn ngữ & địa phương             | C-05, FR-EXL-05 (tìm không dấu), FR-EXL-07                                           |

---

## 10. Lộ trình phát hành

### MVP (khoảng 4–6 tuần) — "Tập được, lưu được"

Mục tiêu: sửa các hạn chế ở mục 1.4 và có vòng lặp tập cốt lõi.

- Chuyển `workout-data.tsx` sang schema có cấu trúc (FR-PRG-02, 03, FR-ADM-01) + thang biến thể cơ bản (push, squat, pull/row, core, vai).
- Thay link minh họa ngoài bằng media có giấy phép hiển thị trong app (FR-EXL-02, C-04).
- Sửa `params` thành `Promise` theo Next.js 15.
- Lưu IndexedDB (FR-DAT-07, NFR-REL-01), lịch sử (FR-STA-01).
- Workout Player: ghi 1 chạm, timer nghỉ theo timestamp, tự lưu & phục hồi (FR-WKP-01…05, 07, 08, 10, 12).
- Engine tăng tiến cơ bản (FR-PRO-01…03).
- Lịch dạng hàng đợi (FR-SCH-01, 02).
- Onboarding tối giản + sàng lọc sức khỏe (FR-ONB-01, 02, 04, 05).
- Xuất JSON/CSV, xóa dữ liệu (FR-DAT-01, 04).
- PWA offline (NFR-OFF-01).

### v1 (+6–8 tuần) — "Giữ chân người dùng"

Bài kiểm tra trình độ, deload, đổi bài, thống kê & PR, streak tuần, nhắc nhở Web Push, nhập dữ liệu, thùng rác, wake lock, khởi động/giãn cơ, tìm kiếm không dấu, bài tập & chương trình tùy chỉnh, dark mode.

### v2 — "Mở rộng"

Tài khoản & đồng bộ, giọng nói tiếng Việt, chương trình bổ sung, huy hiệu, chỉ số cơ thể, CMS, tiếng Anh, (cân nhắc) gói trả phí mua một lần.

### Chỉ số thành công (KPI)

| Chỉ số                                     | Mục tiêu | So sánh ngành |
| ------------------------------------------ | -------- | ------------- |
| Hoàn thành buổi tập đầu tiên / người cài   | ≥ 60%    | —             |
| Retention D7 (có ≥ 1 buổi trong ngày 7–13) | ≥ 30%    | ~15–20%       |
| Retention D30                              | ≥ 15%    | ~3–12%        |
| Tỷ lệ hoàn thành giai đoạn 1 (4 tuần)      | ≥ 20%    | —             |
| Thời gian trung vị để ghi 1 hiệp           | ≤ 2s     | —             |
| Báo cáo mất dữ liệu                        | 0        | —             |

_(Đo bằng analytics ẩn danh, opt-out được — NFR-SEC-01.)_

---

## 11. Rủi ro & câu hỏi mở

### 11.1 Rủi ro

| Rủi ro                                                                  | Ảnh hưởng                         | Giảm thiểu                                                                                            |
| ----------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| iOS Safari giới hạn chạy nền → âm báo timer không kêu khi khóa màn hình | Trải nghiệm timer kém trên iPhone | Wake Lock, timer theo timestamp, Push notification lên lịch; cân nhắc wrapper native (Capacitor) ở v2 |
| Trình duyệt xóa IndexedDB khi thiếu dung lượng                          | Mất dữ liệu                       | `storage.persist()`, nhắc sao lưu, sync ở v2                                                          |
| Chi phí sản xuất media minh họa có bản quyền                            | Chậm MVP                          | Bắt đầu với ảnh vẽ tay/SVG tự làm hoặc nguồn CC0; quay video dần                                      |
| Nội dung tập sai kỹ thuật gây chấn thương                               | Pháp lý, uy tín                   | Review chuyên môn (NFR-CNT-01), miễn trừ trách nhiệm, sàng lọc sức khỏe                               |
| Không có doanh thu khi lõi miễn phí                                     | Bền vững dự án                    | Chi phí hạ tầng thấp (static + client-side); gói mua một lần cho tính năng bổ sung                    |
| Engine tăng tiến quá đơn giản / quá cứng                                | Người dùng không tin gợi ý        | Luôn hiển thị lý do, người dùng luôn có quyền từ chối/chỉnh                                           |

### 11.2 Câu hỏi mở (cần chủ sản phẩm quyết định)

1. Đối tượng chính là **chỉ tập tại nhà không dụng cụ** hay mở rộng sang có xà đơn/dây kháng lực ngay từ MVP?
   Answer: tập tại nhà không dụng cụ + xà đơn + dây kháng lực từ MVP
2. Có kế hoạch kiếm tiền không? Nếu có — mua một lần, donate, hay subscription cho sync?
   hiện tại free
3. Ai là người review chuyên môn nội dung bài tập?
   không có, chỉ tham khảo từ nguồn chia sẻ public
4. Có cần đóng gói lên App Store / Google Play (Capacitor/TWA) không, hay chỉ PWA?
   phát triển hướng mobile, nhưng hiện làm trên pwa trước ở MVP
5. Nguồn media minh họa: tự quay, thuê vẽ, hay dùng thư viện mở?
   media thư viện mở

---

## 12. Phụ lục: Nguồn tham khảo

Khảo sát thực hiện tháng 11/2026. Nhiều nguồn là bài review/affiliate hoặc do chính hãng app viết; số liệu giá và giới hạn có thể đã thay đổi.

**So sánh & đánh giá app**

- JEFIT — Fitbod vs Strong vs Jefit vs Hevy (blog của hãng): https://www.jefit.com/blog/fitbod-vs-strong-vs-jefit-vs-hevy
- JEFIT — Best Workout Apps 2026: https://www.jefit.com/blog/best-workout-apps-for-2026-top-7-options-tested-and-reviewed
- Unstar — Workout apps ranked 2026: https://unstar.app/blog/strava-strong-fitbod-nike-run-club-peloton-apple-fitness-workout-apps-ranked-2026
- Jotform — Best apps for workout tracking: https://www.jotform.com/blog/best-apps-for-workout-tracking/
- Setgraph — Strong app alternatives: https://setgraph.app/articles/best-strong-app-alternatives-(2025)
- Indie Hackers — Fitbod review 2026: https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b
- Fortune — Best workout apps: https://fortune.com/article/best-workout-apps/
- NBC News Select — Best fitness apps: https://www.nbcnews.com/select/shopping/best-fitness-apps-rcna195812
- Beebom — Best workout apps: https://beebom.com/best-workout-apps/amp
- Bits from Bytes — Best workout apps 2026 (giá & free tier): https://bitsfrombytes.com/best-workout-apps-tested-priced-and-free-tier/
- BarBend — Best workout apps: https://barbend.com/best-workout-apps/

**Hevy**

- AI Tools Bakery — Hevy review, free vs Pro limits: https://aitoolsbakery.com/blog/hevy-review/
- Garage Gym Reviews — Hevy: https://garagegymreviews.com/equipment/hevy
- Gainframe — Hevy app review: https://gainframe.app/blog/hevy-app-review/

**Review người dùng / chất lượng app**

- Strong — JustUseApp reviews: https://justuseapp.com/en/app/464254577/strong-workout-tracker-gym-log/reviews
- JEFIT — JustUseApp reviews: https://justuseapp.com/en/app/449810000/jefit-workout-planner-gym-log/reviews
- Strong — unitQ scorecard: https://unitq.com/unitq-scorecards/strongworkouttracker
- Fitbod — unitQ scorecard: https://unitq.com/unitq-scorecards/fitbodworkoutfitnessplans
- Thenx — JustUseApp reviews: https://justuseapp.com/en/app/1192413645/thenx/reviews
- Thenx — App Store: https://apps.apple.com/us/app/1192413645
- Home Workout (Leap Fitness) — App Store: https://apps.apple.com/app/1313192037
- 30 Day Fitness — App Store: https://apps.apple.com/app/id1167377348
- Dr. Muscle — Home Workout No Equipment review: https://dr-muscle.com/home-workout-no-equipment-bodybuilding-review/
- Bitrise App Navigator — Home Workout: https://bitrise.io/resources/tools/app-navigator/apps/android/homeworkout.homeworkouts.noequipment

**Subscription & paywall**

- Android Authority — Free apps getting worse: https://www.androidauthority.com/free-apps-getting-worse-3612373/
- Android Authority — Strava no longer favorite app: https://www.androidauthority.com/strava-no-longer-favorite-app-3626886/
- T3 — Strava paywall problem: https://www.t3.com/tech/dear-strava-we-have-a-paywall-problem-thats-gone-a-step-too-far
- Daily Dot — Subscription fatigue: https://dailydot.com/people-say-theyre-utterly-exhausted-by-subscription-services-as-even-basic-apps-demand-monthly-payments
- DEV Community — Fitness app paywall UX patterns: https://dev.to/paywallpro/top-fitness-app-paywalls-ux-patterns-pricing-insights-2868

**Retention**

- Apptopia — New Year's resolutions retention: https://apptopia.com/en/blog/we-know-you-didnt-keep-your-new-years-resolutions/
- PMC — Analysis of Training Behavior in Users of a Fitness App: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12828317/
- social.plus — Fitness app motivation: https://www.social.plus/blog/to-fitness-app-teams-your-members-need-more-than-workouts-to-stay-motivated
- RevenueCat — Peloton retention takeaways: https://www.revenuecat.com/blog/growth/peloton-retention-takeaways
