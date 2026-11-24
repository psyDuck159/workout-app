# Phát hành MVP — Deploy & kiểm thử trên thiết bị thật (S5-7)

## 1. Deploy lên Vercel (miễn phí)

1. Đăng nhập https://vercel.com bằng tài khoản GitHub.
2. **Add New… → Project** → chọn repo `workout-app` → **Import**.
3. Vercel tự nhận Next.js; giữ nguyên cấu hình mặc định:
   - Build Command: `npm run build` (tự chạy `validate:content` và sinh `public/sw.js` trước khi build)
   - Node.js: 22.x (Settings → General → Node.js Version)
4. **Deploy**. Mỗi lần merge vào `main` sẽ tự deploy; mỗi PR có link xem trước riêng.
5. Ghi lại URL production (VD: `https://workout-app-xxx.vercel.app`).

> Service worker chỉ chạy trên HTTPS (Vercel có sẵn) hoặc `localhost`. Mở qua IP mạng LAN bằng http sẽ không có offline.

## 2. Kiểm tra nhanh sau deploy

- [ ] Mở URL trên máy tính: trang chủ hiện, không lỗi console.
- [ ] DevTools → Application → Manifest: không có cảnh báo, có icon.
- [ ] Application → Service Workers: trạng thái _activated_.
- [ ] Lighthouse (Mobile): Performance/Accessibility/Best Practices ≥ 90 ở trang chủ, Bài tập, Chi tiết bài, Giai đoạn.
- [ ] Response header có `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.

## 3. Kiểm thử trên điện thoại thật

Cần ít nhất 1 Android (Chrome) và 1 iPhone (Safari, iOS ≥ 16.4).

### Cài lên màn hình chính

- [ ] **Android/Chrome:** menu ⋮ → _Cài đặt ứng dụng_ / _Thêm vào màn hình chính_. Icon hiển thị đúng, mở ra không có thanh địa chỉ.
- [ ] **iPhone/Safari:** nút Chia sẻ → _Thêm vào MH chính_. Icon và tên "Workout" đúng.

### Luồng chính

- [ ] Onboarding 4 bước, chọn dụng cụ → trang chủ hiện "Buổi tiếp theo".
- [ ] Bắt đầu buổi tập → ghi hiệp → timer nghỉ đếm đúng → hết giờ có **âm báo** (và **rung** trên Android).
- [ ] Trong lúc nghỉ, **khóa màn hình 1 phút** rồi mở lại: thời gian còn lại đúng. Ghi lại tiếng báo có kêu đúng giờ khi màn hình tắt không (giới hạn đã biết của PWA, nhất là iOS).
- [ ] Màn hình **không tự tắt** trong lúc tập (khi bật "Giữ màn hình sáng").
- [ ] Đóng hẳn app giữa buổi → mở lại → thấy "Bạn đang tập dở" → Tiếp tục đúng chỗ.
- [ ] Bài giữ theo thời gian (Plank nghiêng ở buổi B): đếm ngược 3-2-1 có tiếng.
- [ ] Kết thúc buổi → tóm tắt → Lịch sử có buổi vừa tập.

### Offline

- [ ] Mở app một lần khi có mạng, chờ vài giây.
- [ ] Bật **chế độ máy bay** → đóng hẳn app → mở lại từ icon: app mở được, tập được, ghi log được, xem Lịch sử và Thư viện (có hình) được.

### Dữ liệu

- [ ] Cài đặt → Xuất file sao lưu (JSON) và CSV: file tải về, CSV mở bằng Excel/Google Sheets hiện đúng tiếng Việt.
- [ ] Trên máy thứ hai: Cài đặt → Nhập từ file sao lưu → lịch sử hiện đủ.
- [ ] Cài đặt → Lưu trữ bền vững: ghi lại trạng thái (thường _Đã bật_ sau khi cài lên màn hình chính).

### Ghi nhận

| Thiết bị | Trình duyệt / OS | Lỗi / quan sát | Mức độ |
| -------- | ---------------- | -------------- | ------ |
|          |                  |                |        |

Lỗi nghiêm trọng (mất dữ liệu, không tập được) phải sửa trước khi chia sẻ link rộng rãi; phần còn lại đưa vào backlog v1.
