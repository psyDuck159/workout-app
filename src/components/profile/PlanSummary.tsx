"use client";

import Link from "next/link";
import { gearLabels, goalLabels } from "@/content/labels";
import { useProfile } from "@/data/hooks";
import { buttonVariants } from "@/components/ui/button";

/** Trang chủ: mời thiết lập nếu chưa có hồ sơ, ngược lại tóm tắt kế hoạch. */
export default function PlanSummary() {
  const { data: profile, loading } = useProfile();

  if (loading) return <div className="bg-muted h-36 animate-pulse rounded-lg" aria-hidden />;

  if (!profile) {
    return (
      <section className="bg-card space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Bắt đầu trong 1 phút</h2>
        <p className="text-muted-foreground text-sm">
          Chọn mục tiêu, số buổi mỗi tuần và dụng cụ bạn có. Không cần tài khoản.
        </p>
        <Link href="/welcome" className={buttonVariants()}>
          Thiết lập lộ trình
        </Link>
      </section>
    );
  }

  return (
    <section className="bg-card space-y-3 rounded-lg border p-4">
      <h2 className="font-semibold">Kế hoạch của bạn</h2>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Mục tiêu</dt>
          <dd>{goalLabels[profile.goal].title}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Lịch tập</dt>
          <dd>
            {profile.daysPerWeek} buổi/tuần · {profile.sessionMinutes} phút
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Dụng cụ</dt>
          <dd>
            {profile.gear.length > 0
              ? profile.gear.map((g) => gearLabels[g]).join(", ")
              : "Không dụng cụ"}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Link href="/settings" className={buttonVariants({ variant: "outline" })}>
          Chỉnh sửa
        </Link>
      </div>
    </section>
  );
}
