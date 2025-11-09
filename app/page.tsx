import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 min-h-[var(--content-height)]">
      <div className="text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-bogner-blue to-bogner-teal bg-clip-text text-transparent">
          Bogner Pools Resources
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-8">
          Professional tools and resources for pool construction
        </p>
        <Link
          href="/quick-links"
          className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-bogner-blue to-bogner-teal text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity touch-manipulation min-h-[44px]"
        >
          View Quick Links
        </Link>
      </div>
    </main>
  );
}
