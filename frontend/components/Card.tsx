import Link from "next/link";

/**
 * Arama sonuçları için Card komponenti
 */
interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  confidence?: number;
  profileUrl?: string;
  platform?: string;
  date?: string;
}

export default function Card({
  title,
  subtitle,
  imageUrl,
  confidence,
  profileUrl,
  platform,
  date,
}: CardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
      {/* Image */}
      {imageUrl && (
        <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden mb-4">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 truncate">{title}</h3>
          {confidence && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {Math.round(confidence * 100)}%
            </div>
          )}
        </div>

        {subtitle && <p className="text-gray-600 text-sm truncate">{subtitle}</p>}

        {platform && (
          <div className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
            {platform}
          </div>
        )}

        {date && <p className="text-gray-400 text-xs">{date}</p>}

        {profileUrl && (
          <Link
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:underline"
          >
            View Profile →
          </Link>
        )}
      </div>
    </div>
  );
}
