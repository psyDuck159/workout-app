import type { Metadata } from "next";
import Onboarding from "@/components/profile/Onboarding";
import { defaultProgram, gearIndex } from "@/content";

export const metadata: Metadata = { title: "Thiết lập" };

export default function WelcomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Thiết lập lộ trình của bạn</h1>
        <p className="text-muted-foreground">
          Khoảng 1 phút. Không cần tài khoản — mọi bước đều bỏ qua được.
        </p>
      </header>
      <Onboarding programId={defaultProgram.id} gearIndex={gearIndex} />
    </main>
  );
}
