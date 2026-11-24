import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { disclaimerVi } from "@/content/health";
import { exercises } from "@/content";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  // Gộp nguồn tham khảo của mọi bài tập, mỗi URL một lần.
  const sources = new Map<string, string>();
  for (const e of exercises) for (const s of e.sources) sources.set(s.url, s.title);
  const sorted = [...sources.entries()].sort((a, b) => a[1].localeCompare(b[1], "vi"));

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <Link
        href="/settings"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Cài đặt
      </Link>
      <h1 className="text-2xl font-bold">Giới thiệu</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Lưu ý sức khỏe</h2>
        <p>{disclaimerVi}</p>
        <p>
          Nội dung bài tập được tham khảo từ nguồn công khai và{" "}
          <strong>chưa được chuyên gia kiểm duyệt</strong>. Nếu bạn có bệnh lý tim mạch, huyết áp,
          chấn thương xương khớp, đang mang thai hoặc mới sinh, hãy hỏi ý kiến bác sĩ trước khi tập.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Dữ liệu của bạn</h2>
        <p>
          Mọi dữ liệu (hồ sơ, lịch sử tập) chỉ lưu trên thiết bị này, không gửi lên máy chủ, không
          có quảng cáo hay theo dõi. Bạn có thể xuất, nhập hoặc xóa toàn bộ dữ liệu trong{" "}
          <Link href="/settings" className="underline">
            Cài đặt
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Hình minh họa và giấy phép</h2>
        <p>
          Hình minh họa người que do dự án tự sinh. Toàn bộ mã nguồn, nội dung bài tập và hình minh
          họa phát hành theo giấy phép{" "}
          <a
            href="https://opensource.org/license/mit"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            MIT
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Nguồn tham khảo</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {sorted.map(([url, title]) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1 underline"
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
