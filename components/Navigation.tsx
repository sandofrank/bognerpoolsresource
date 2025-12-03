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
    <header className="nav-header" role="banner">
      <div className="px-2 sm:px-6 md:px-8 overflow-visible">
        <div className="flex items-center justify-between py-3 sm:py-6 md:py-7 overflow-visible">
          <div className="relative w-auto flex items-center -my-2 shrink-0">
            <Image
              src="/bogner-logo.png"
              alt="Bogner Pools"
              width={289}
              height={89}
              className="h-auto w-24 sm:w-40 md:w-48 object-contain max-h-none"
              priority
            />
          </div>
          <nav aria-label="Main navigation" className="shrink">
            <ul className="flex gap-0.5 sm:gap-2 items-center">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={pathname === item.href ? 'nav-link-active' : 'nav-link-inactive'}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    <span className="desktop-only">{item.label}</span>
                    <span className="mobile-only">{item.label.split(' ')[0]}</span>
                    {item.comingSoon && (
                      <span className="nav-badge" aria-label="Coming soon">Soon</span>
                    )}
                  </Link>
                </li>
              ))}
              {session?.user && (
                <li>
                  <button
                    onClick={() => signOut()}
                    className="nav-link-inactive"
                    aria-label={`Sign out ${session.user.name || session.user.email}`}
                  >
                    <span className="hidden md:inline">{session.user.name?.split(' ')[0]}</span>
                    <svg className="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
