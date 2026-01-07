import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shift2 Auditor
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            WCAG Toegankelijkheidsonderzoek Tool
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/admin"
              className="px-6 py-3 text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#1f0036' }}
            >
              Admin Dashboard
            </Link>
            <Link
              href="/onderzoeken"
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Bekijk Onderzoeken
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
