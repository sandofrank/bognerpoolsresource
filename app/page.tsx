import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50" style={{ height: 'calc(100vh - 76px)' }}>
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-bogner-blue to-bogner-teal bg-clip-text text-transparent">
          Bogner Pools Resources
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional tools and resources for pool construction
        </p>
        <Link
          href="/quick-links"
          className="inline-block px-8 py-3 bg-gradient-to-r from-bogner-blue to-bogner-teal text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-opacity"
        >
          View Quick Links
        </Link>
      </div>
    </main>
  );
}
