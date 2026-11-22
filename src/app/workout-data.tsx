export interface Exercise {
  name: string;
  target: string; // Chân, Ngực, etc.
  reps: string;
  description: string;
  illustration: string; // Link hình ảnh
}

export interface Phase {
  id: number;
  title: string;
  weeks: string;
  exercises: Exercise[];
}

export const phases: Phase[] = [
  {
    id: 1,
    title: "Giai Đoạn 1: Tuần 1-4 (Xây Dựng Nền Tảng)",
    weeks: "1-4",
    exercises: [
      {
        name: "Bodyweight Squat",
        target: "Chân",
        reps: "3 hiệp x 10-12 reps",
        description: "Đứng chân rộng bằng vai, hạ mông như ngồi ghế.",
        illustration: "https://www.istockphoto.com/photos/bodyweight-squat",
      },
      {
        name: "Push-Up",
        target: "Ngực",
        reps: "3 hiệp x 8-10 reps",
        description: "Chống đẩy từ đầu gối hoặc chân.",
        illustration: "https://www.istockphoto.com/photos/push-ups",
      },
      // Thêm các bài còn lại tương tự cho giai đoạn 1...
      {
        name: "Inverted Row",
        target: "Lưng",
        reps: "3 hiệp x 10-12 reps",
        description: "Nằm dưới bàn, kéo ngực lên.",
        illustration: "https://www.nerdfitness.com/blog/inverted-row-are-you-missing-out-on-this-great-exercise/",
      },
      {
        name: "Pike Push-Up",
        target: "Vai",
        reps: "3 hiệp x 8-10 reps",
        description: "Tư thế chữ V ngược, hạ đầu xuống sàn.",
        illustration: "https://www.hingehealth.com/resources/articles/pike-push-up/",
      },
      {
        name: "Plank",
        target: "Core",
        reps: "3 hiệp x 20-30 giây",
        description: "Giữ tư thế chống đẩy.",
        illustration: "https://www.istockphoto.com/photos/plank-exercise",
      },
    ],
  },
  // Thêm Phase 2 và 3 tương tự, với exercises từ lịch trình.
  // (Để ngắn gọn, chỉ ví dụ Phase 1; bạn copy từ lịch trình cũ)
  {
    id: 2,
    title: "Giai Đoạn 2: Tuần 5-8 (Tăng Cường Độ - Thêm Biến Thể)",
    weeks: "5-8",
    exercises: [
      {
        name: "Lunges",
        target: "Chân",
        reps: "3 hiệp x 10 reps mỗi chân",
        description: "Bước chân và hạ thấp.",
        illustration: "https://www.muscleandstrength.com/exercises/bodyweight-lunge.html",
      },
      {
        name: "Diamond Push-Up",
        target: "Ngực",
        reps: "3 hiệp x 10-12 reps",
        description: "Chống đẩy tay tạo hình kim cương.",
        illustration: "https://www.wikihow.com/Do-a-Diamond-Pushup",
      },
      {
        name: "Superman",
        target: "Lưng",
        reps: "3 hiệp x 12-15 reps",
        description: "Nằm sấp, nâng tay chân lên.",
        illustration: "https://www.healthline.com/health/fitness/superman-exercise",
      },
      {
        name: "Wall Shoulder Tap",
        target: "Vai",
        reps: "3 hiệp x 10 reps mỗi bên",
        description: "Chống tay vào tường, chạm vai đối diện.",
        illustration: "https://eat-move-save.extension.illinois.edu/move/exercise/wall-shoulder-taps",
      },
      {
        name: "Bicycle Crunch",
        target: "Core",
        reps: "3 hiệp x 15 reps mỗi bên",
        description: "Nằm ngửa, đạp xe xoay bụng.",
        illustration: "https://spotebi.com/exercise-guide/bicycle-crunches/",
      },
    ],
  },
  {
    id: 3,
    title: "Giai Đoạn 3: Tuần 9-12 (Tối Ưu Hóa - Tăng Khối Lượng)",
    weeks: "9-12",
    exercises: [
      {
        name: "Bulgarian Split Squat",
        target: "Chân",
        reps: "3 hiệp x 10 reps mỗi chân",
        description: "Bước lùi một chân, hạ thấp.",
        illustration: "https://www.verywellfit.com/how-to-do-a-bulgarian-split-squat-4589307",
      },
      {
        name: "Decline Push-Up",
        target: "Ngực",
        reps: "3 hiệp x 12-15 reps",
        description: "Chống đẩy chân cao hơn.",
        illustration: "https://www.becomebettersppt.com/decline-pushup-tutorial",
      },
      {
        name: "Australian Pull-Up",
        target: "Lưng",
        reps: "3 hiệp x 10-12 reps",
        description: "Kéo người lên dưới bàn thấp.",
        illustration: "https://www.tomsguide.com/wellness/fitness/pull-ups-for-beginners-how-to-do-australian-pull-ups-and-the-benefits-for-your-upper-body",
      },
      {
        name: "Handstand Hold Against Wall",
        target: "Vai",
        reps: "3 hiệp x 20-30 giây",
        description: "Đứng ngược tay vào tường.",
        illustration: "https://summerfunfitness.com/the-best-way-to-wall-handstand-for-beginners/",
      },
      {
        name: "Leg Raise",
        target: "Core",
        reps: "3 hiệp x 12-15 reps",
        description: "Nằm ngửa, nâng chân lên.",
        illustration: "https://www.muscleandstrength.com/exercises/lying-floor-leg-raise.html",
      },
    ],
  },
];