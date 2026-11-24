"use client";

import { useState } from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { useActiveSession, useRepositories } from "@/data/hooks";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/** Nhắc tiếp tục buổi tập dở khi mở lại app (FR-WKP-08). */
export default function ActiveSessionBanner() {
  const repos = useRepositories();
  const { data: session } = useActiveSession();
  const [confirm, setConfirm] = useState(false);

  if (!session) return null;
  const done = session.player.items.reduce((n, p) => n + p.done, 0);
  const total = session.player.items.reduce((n, p) => n + p.sets, 0);

  return (
    <section
      aria-label="Buổi tập dở"
      className="border-primary/30 bg-primary/5 space-y-3 rounded-lg border p-4"
    >
      <div className="flex gap-3">
        <Dumbbell className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Bạn đang tập dở</p>
          <p className="text-muted-foreground text-sm">
            {session.titleVi} · đã xong {done}/{total} hiệp
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/workout" className={buttonVariants()}>
          Tiếp tục
        </Link>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Bỏ buổi này
        </Button>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Bỏ buổi tập dở?">
        <p className="text-muted-foreground mb-4 text-sm">
          Các hiệp đã ghi vẫn được giữ trong lịch sử, nhưng buổi này sẽ không được tính là hoàn
          thành.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(false)}>
            Giữ lại
          </Button>
          <Button
            onClick={async () => {
              setConfirm(false);
              await repos.abandonSession(session.id);
            }}
          >
            Bỏ buổi
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
