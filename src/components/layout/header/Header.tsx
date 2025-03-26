'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FiSun, FiMoon } from 'react-icons/fi';
import { BiBook, BiLinkExternal } from 'react-icons/bi';
import { RiDiscordFill } from 'react-icons/ri';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { clsx } from 'clsx';
import Link from 'next/link';
import AccountConnect from './AccountConnect';
import { EXTERNAL_LINKS } from '@/utils/external';

export type HeaderProps = {
  ghost?: boolean;
};

type ScrollState = 'at-top' | 'scrolling-up' | 'scrolling-down';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
    </button>
  );
}

function Header({ ghost }: HeaderProps) {
  const [scrollState, setScrollState] = useState<ScrollState>('at-top');
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    let previousScrollY = window.scrollY;

    const handleScroll = () => {
      const direction = previousScrollY < window.scrollY ? 'scrolling-down' : 'scrolling-up';
      const state = window.scrollY < 30 ? 'at-top' : direction;
      previousScrollY = window.scrollY;
      setScrollState(state);
    };

    if (ghost) {
      addEventListener('scroll', handleScroll, { passive: true });
    } else {
      removeEventListener('scroll', handleScroll);
    }

    handleScroll();
    return () => removeEventListener('scroll', handleScroll);
  }, [ghost]);

  return (
    <>
      <div className="h-[120px] w-full" /> {/* Spacer div */}
      <header
        data-scroll-state={scrollState}
        className="bg-main fixed left-0 right-0 top-0 flex h-[120px] justify-center pt-8"
        style={{ zIndex: 40 }}
      >
        <div className="bg-surface/80 sticky top-0 z-50 w-full backdrop-blur-lg">
          <div className="container mx-auto">
            <nav className="bg-surface flex h-[72px] w-full items-center justify-between rounded-md px-4">
              <div className="flex h-8 items-center justify-start px-4">
                <Link href="/" className="font-zen text-lg dark:text-gray-200 hover:opacity-80 transition-opacity no-underline">
                  M1 Agent
                </Link>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/runs" className="font-zen text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors no-underline">
                  History
                </Link>
                <Dropdown onOpenChange={setIsMoreOpen} className="rounded-sm">
                  <DropdownTrigger>
                    <button
                      type="button"
                      className={clsx(
                        'px-2 py-1 text-center font-zen text-base font-normal text-primary',
                        ' text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                        'border-none transition-all duration-200',
                        'inline-flex items-center gap-1',
                        'focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0',
                        'active:outline-none active:ring-0',
                        'bg-transparent hover:bg-transparent active:bg-transparent',
                        '[&:not(:focus-visible)]:outline-none',
                      )}
                    >
                      More
                      <ChevronDownIcon
                        className={clsx(
                          'h-4 w-4 transition-transform duration-200 ease-in-out',
                          isMoreOpen && 'rotate-180',
                        )}
                      />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="More links"
                    className="bg-surface min-w-[180px] rounded-sm border-none shadow-none"
                    itemClasses={{
                      base: [
                        'gap-4 px-4 py-2 rounded-none font-zen',
                        'data-[hover=true]:bg-hovered rounded-sm',
                      ].join(' '),
                      title: 'text-sm text-primary flex-grow font-zen',
                      wrapper: 'justify-between no-underline rounded-sm',
                    }}
                  >
                    <DropdownItem
                      key="discord"
                      endContent={<RiDiscordFill className="h-4 w-4" />}
                      onClick={() => window.open(EXTERNAL_LINKS.discord, '_blank')}
                    >
                      Discord
                    </DropdownItem>
                    <DropdownItem
                      key="monarch"
                      endContent={<BiLinkExternal className="h-4 w-4" />}
                      onClick={() => window.open(EXTERNAL_LINKS.monarch, '_blank')}
                    >
                      Monarch
                    </DropdownItem>
                    <DropdownItem
                      key="docs"
                      endContent={<BiBook className="h-4 w-4" />}
                      onClick={() => window.open(EXTERNAL_LINKS.docs, '_blank')}
                    >
                      Docs
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <ThemeToggle />
                <AccountConnect />
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
