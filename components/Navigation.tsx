'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/quick-links', label: 'Quick Links' },
    { href: '/price-list', label: 'Price List' },
    { href: '/tools', label: 'Tools', comingSoon: true },
  ];

  return (
    <header className="bg-gradient-to-r from-bogner-blue via-blue-600 to-bogner-teal text-white shadow-xl rounded-t-xl backdrop-blur-sm" role="banner">
      <div className="px-3 sm:px-6 md:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4 md:py-5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 sm:h-12 w-auto">
              <Image
                src="/bogner-logo.png"
                alt="Bogner Pools"
                width={289}
                height={89}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
            <span className="text-base sm:text-lg font-semibold tracking-tight hidden md:inline">
              Resources
            </span>
          </div>
          <nav aria-label="Main navigation">
            <ul className="flex gap-1 sm:gap-2 items-center">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`px-3 sm:px-3 md:px-4 py-2 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 min-h-[44px] touch-manipulation ${
                      pathname === item.href
                        ? 'bg-white/20 backdrop-blur-md shadow-lg'
                        : 'hover:bg-white/10 hover:backdrop-blur-md'
                    }`}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                    {item.comingSoon && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-white/20 rounded text-xs font-semibold" aria-label="Coming soon">Soon</span>
                    )}
                  </Link>
                </li>
              ))}
              {session?.user && (
                <li>
                  <button
                    onClick={() => signOut()}
                    className="px-3 sm:px-3 md:px-4 py-2 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-white/10 hover:backdrop-blur-md flex items-center gap-2 min-h-[44px] touch-manipulation"
                    aria-label={`Sign out ${session.user.name || session.user.email}`}
                  >
                    <span className="hidden md:inline">{session.user.name?.split(' ')[0]}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
