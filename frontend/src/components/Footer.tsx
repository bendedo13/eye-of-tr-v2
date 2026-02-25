
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">© 2026 FaceSeek</p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Gizlilik</a>
            <a href="#" className="hover:text-white transition">Kullanım Şartları</a>
            <a href="#" className="hover:text-white transition">İletişim</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
