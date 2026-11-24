# Kịch bản thử nghiệm với người dùng (S5-8, NFR-USE-03)

**Mục tiêu:** kiểm chứng người mới hoàn thành onboarding và buổi tập đầu tiên **không cần hướng dẫn bên ngoài** (đạt khi ≥ 4/5 người thành công).

## Chuẩn bị

- 5 người chưa từng dùng app, ưu tiên người mới tập hoặc tập không đều.
- Điện thoại của chính họ, app đã deploy (xem `RELEASE_CHECKLIST.md`), **dữ liệu trống**.
- Người điều phối chỉ quan sát và ghi chép, **không gợi ý** cách dùng. Nếu người tham gia bí quá 2 phút, ghi nhận "thất bại ở bước X" rồi mới giúp.
- Thời lượng: ~20 phút/người. Xin phép trước nếu ghi âm/quay màn hình.

## Lời mở đầu (đọc cho người tham gia)

> "Chúng tôi đang thử một ứng dụng tập luyện, không phải thử bạn — không có câu trả lời sai. Hãy vừa làm vừa nói to điều bạn đang nghĩ. Nếu thấy khó hiểu, đó là lỗi của ứng dụng."

## Nhiệm vụ

| #   | Nhiệm vụ (đọc nguyên văn)                                                   | Thành công khi                           | Thời gian mục tiêu |
| --- | --------------------------------------------------------------------------- | ---------------------------------------- | ------------------ |
| 1   | "Bạn muốn bắt đầu tập ở nhà, có một dây kháng lực. Hãy thiết lập ứng dụng." | Xong onboarding, chọn đúng dây kháng lực | ≤ 2 phút           |
| 2   | "Hãy bắt đầu buổi tập hôm nay."                                             | Vào màn hình đang tập từ trang chủ       | ≤ 2 chạm           |
| 3   | "Tập hiệp đầu tiên; giả sử bạn làm được 10 lần."                            | Ghi đúng 10 lần                          | ≤ 30 giây          |
| 4   | "Bạn muốn nghỉ thêm một chút."                                              | Dùng +15 giây                            | —                  |
| 5   | "Bài tiếp theo bạn thấy hơi đau vai."                                       | Dùng nút "Đau / khó chịu"                | —                  |
| 6   | "Hãy kết thúc buổi tập và xem lại kết quả."                                 | Thấy màn hình tóm tắt                    | —                  |
| 7   | "Tuần sau bạn có xà đơn. Hãy cập nhật."                                     | Bật Xà đơn trong Cài đặt                 | ≤ 1 phút           |
| 8   | "Bạn sắp đổi điện thoại. Làm sao giữ lại lịch sử tập?"                      | Tìm thấy "Xuất file sao lưu"             | —                  |

## Câu hỏi sau buổi

1. Thang 1–5: ứng dụng dễ dùng đến đâu?
2. Điều gì làm bạn bối rối nhất?
3. Bạn có tin các gợi ý lên/hạ bậc không? Vì sao?
4. Bạn có muốn dùng tiếp tuần sau không? Điều gì sẽ khiến bạn bỏ?
5. So với app bạn từng dùng (nếu có), điểm nào tốt hơn/kém hơn?

## Bảng ghi kết quả

| Người | Tuổi / kinh nghiệm tập | Thiết bị | NV1 | NV2 | NV3 | NV4 | NV5 | NV6 | NV7 | NV8 | Điểm dễ dùng | Ghi chú chính |
| ----- | ---------------------- | -------- | --- | --- | --- | --- | --- | --- | --- | --- | ------------ | ------------- |
| P1    |                        |          |     |     |     |     |     |     |     |     |              |               |
| P2    |                        |          |     |     |     |     |     |     |     |     |              |               |
| P3    |                        |          |     |     |     |     |     |     |     |     |              |               |
| P4    |                        |          |     |     |     |     |     |     |     |     |              |               |
| P5    |                        |          |     |     |     |     |     |     |     |     |              |               |

Ghi ✅ (tự làm được), ⚠️ (làm được nhưng lúng túng > 30 giây), ❌ (cần giúp).

## Sau thử nghiệm

- Gom vấn đề, xếp theo số người gặp × mức độ ảnh hưởng.
- Vấn đề chặn NV1–3 → sửa trước khi chia sẻ rộng. Còn lại → backlog v1 trong `IMPLEMENTATION_PLAN.md`.
