import type { Metadata } from "next";
import SettingsForm from "@/components/profile/SettingsForm";
import { gearIndex } from "@/content";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>
      <SettingsForm gearIndex={gearIndex} />
    </main>
  );
}
