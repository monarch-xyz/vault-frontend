'use client';

import { clsx } from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import logo from '../../imgs/logo.png';
import AccountConnect from './AccountConnect';

export function NavbarLink({
  children,
  href,
  matchKey,
  target,
}: {
  children: React.ReactNode;
  href: string;
  matchKey?: string;
  target?: string;
}) {
  const pathname = usePathname();
  const isActive = matchKey ? pathname.includes(matchKey) : pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        'px-2 py-1 text-center font-zen text-base font-normal text-primary no-underline',
        'relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-primary',
        'no-underline transition-all duration-200',
        isActive ? 'after:opacity-100' : 'after:opacity-0',
      )}
      target={target}
    >
      {children}
    </Link>
  );
}

export function NavbarTitle() {
  return (
    <div className="flex h-8 items-center justify-start gap-4">
      <Image src={logo} alt="logo" height={30} />
      <Link
        href="/"
        passHref
        className="text-center font-zen text-lg font-medium text-primary no-underline"
        aria-label="build-onchain-apps Github repository"
      >
        Wowo
      </Link>
    </div>
  );
}

export function Navbar() {
  return (
    <nav className="bg-surface flex h-full w-full items-center justify-between rounded px-4">
      <NavbarTitle />

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          <AccountConnect />
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
