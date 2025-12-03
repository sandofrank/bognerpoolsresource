import Link from 'next/link';

const resources = [
  {
    href: '/quick-links',
    title: 'Quick Links',
    description: 'Access daily business tools, GIS maps, property data, and county resources',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/price-list',
    title: 'Price List',
    description: 'Browse comprehensive pricing for pool construction materials and services',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    href: '/tools',
    title: 'Tools',
    description: 'Project management tools and calculators (Coming Soon)',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-500',
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <main className="page-content">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-xl sm:text-2xl font-bold mb-1.5 text-gradient-primary">
            Bogner Pools Resources
          </h1>
          <p className="text-sm text-gray-700 max-w-2xl mx-auto">
            Professional tools and resources for pool construction
          </p>
        </div>

        {/* Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {resources.map((resource) => (
            <Link
              key={resource.href}
              href={resource.href}
              className="group relative card-solid card-hover p-3 overflow-hidden"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${resource.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${resource.gradient} text-white mb-2 group-hover:scale-105 transition-transform duration-300`}>
                  <div className="icon-xl">
                    {resource.icon}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                  {resource.title}
                  {resource.comingSoon && (
                    <span className="pill badge-gray">Soon</span>
                  )}
                </h2>

                {/* Description */}
                <p className="text-xs text-gray-600 mb-2">
                  {resource.description}
                </p>

                {/* Arrow Icon */}
                <div className="flex items-center text-bogner-blue font-semibold group-hover:gap-1 transition-all">
                  <span className="text-xs">Access</span>
                  <svg className="icon-sm transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Since 1959 • Affordable Excellence
          </p>
        </div>
      </div>
    </main>
  );
}
