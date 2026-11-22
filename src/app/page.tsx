import PhaseSelector from "@/components/PhaseSelector";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold">Lịch Trình Workout Bodyweight</h1>
        <p className="mb-8">Chọn giai đoạn để bắt đầu theo dõi.</p>
        <PhaseSelector />
      </div>
    </main>
  );
}
