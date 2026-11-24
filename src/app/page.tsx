import Link from "next/link";
import PlanSummary from "@/components/profile/PlanSummary";
import ActiveSessionBanner from "@/components/workout/ActiveSessionBanner";
import { buttonVariants } from "@/components/ui/button";
import { defaultProgram, exercises } from "@/content";

export default function Home() {
  const program = defaultProgram;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Tập bodyweight tại nhà</h1>
        <p className="text-muted-foreground">
          Lộ trình theo giai đoạn, không quảng cáo, miễn phí. Tập được không cần dụng cụ, hoặc với
          xà đơn và dây kháng lực.
        </p>
      </header>

      <ActiveSessionBanner />
      <PlanSummary firstPhaseHref={`/program/phase/${program.phases[0].id}`} />

      <section className="bg-card space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">{program.nameVi}</h2>
        <p className="text-muted-foreground text-sm">
          {program.phases.length} giai đoạn · {program.phases.reduce((n, p) => n + p.weeks, 0)} tuần
        </p>
        <Link href="/program" className={buttonVariants({ variant: "outline" })}>
          Toàn bộ chương trình
        </Link>
      </section>

      <section className="bg-card space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Thư viện bài tập</h2>
        <p className="text-muted-foreground text-sm">
          {exercises.length} bài tập kèm hướng dẫn, lỗi thường gặp và hình minh họa.
        </p>
        <Link href="/exercises" className={buttonVariants({ variant: "outline" })}>
          Mở thư viện
        </Link>
      </section>

      <p className="text-muted-foreground text-xs">
        Nội dung tham khảo từ nguồn công khai, chưa được chuyên gia kiểm duyệt. Hỏi ý kiến bác sĩ
        nếu bạn có vấn đề sức khỏe.
      </p>
    </main>
  );
}
