/**
 * Tham số engine tăng tiến và lịch tập (FR-PRO-06). Chọn thận trọng vì nội dung chưa được
 * chuyên gia kiểm duyệt: lên bậc chậm, hạ bậc sớm khi có dấu hiệu quá sức.
 */
export const progressionConfig = {
  /** Số buổi gần nhất của một bài được xem xét. */
  historySessions: 2,
  /** RPE từ mức này trở lên coi là "khó". */
  hardRpe: 9,
  /** Hạ bậc khi có từ ngần này hiệp dưới mức thấp của mục tiêu trong một buổi. */
  setsBelowMinToStruggle: 2,
  /** Nghỉ từ ngần này ngày trở lên thì buổi quay lại giảm khối lượng (FR-PRO-05). */
  comebackAfterDays: 10,
  comebackSetFactor: 0.7,
  /** Tuần giảm tải cuối mỗi giai đoạn. */
  deloadSetFactor: 0.5,
} as const;

export type ProgressionConfig = typeof progressionConfig;
