'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/quick-links', label: 'Quick Links' },
    { href: '/price-list', label: 'Price List' },
    { href: '/tools', label: 'Tools', comingSoon: true },
  ];

  return (
    <header className="bg-gradient-to-r from-bogner-blue via-blue-600 to-bogner-teal text-white shadow-xl rounded-t-xl backdrop-blur-sm">
      <div className="px-3 sm:px-6 md:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4 md:py-5">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center font-bold text-base sm:text-lg group-hover:bg-white/30 transition-all duration-200 group-hover:scale-105">
              BP
            </div>
            <span className="text-base sm:text-xl font-bold tracking-tight group-hover:tracking-normal transition-all duration-200">
              Bogner Pools <span className="font-normal opacity-90 hidden sm:inline">Resources</span>
            </span>
          </Link>
          <nav>
            <ul className="flex gap-1 sm:gap-2 items-center">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 ${
                      pathname === item.href
                        ? 'bg-white/20 backdrop-blur-md shadow-lg'
                        : 'hover:bg-white/10 hover:backdrop-blur-md'
                    }`}
                  >
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                    {item.comingSoon && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-white/20 rounded text-xs font-semibold">Soon</span>
                    )}
                  </Link>
                </li>
              ))}
              {session?.user && (
                <li>
                  <button
                    onClick={() => signOut()}
                    className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-md flex items-center gap-2"
                    title={`Sign out (${session.user.email})`}
                  >
                    <span className="hidden md:inline">{session.user.name?.split(' ')[0]}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
