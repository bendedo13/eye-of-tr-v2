"use client";

interface OsintCategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  counts: Record<string, number>;
}

/**
 * Kategori filtreleme tabları
 */
export default function OsintCategoryTabs({
  activeCategory,
  onCategoryChange,
  counts,
}: OsintCategoryTabsProps) {
  const categories = [
    { id: "all", label: "All", icon: "🔍" },
    { id: "social-media", label: "Social Media", icon: "👥" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "public-profiles", label: "Profiles", icon: "👤" },
    { id: "other", label: "Other", icon: "🔎" },
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {categories.map((category) => {
        const count = counts[category.id] || 0;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              isActive
                ? "bg-indigo-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
            {count > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
