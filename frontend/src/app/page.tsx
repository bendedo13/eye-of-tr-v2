import AlanSearch from '@/components/AlanSearch';
import LocationSearch from '@/components/LocationSearch';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-16">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">EyeOfTR</h1>
          <p className="text-gray-400">Gelişmiş arama platformu</p>
        </div>
        <AlanSearch />
        <LocationSearch />
      </div>
    </main>
  );
}
