import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FiSun, FiMoon } from "react-icons/fi";
import AccountConnect from './AccountConnect';
import { AGENT_NAME } from '@/utils/constants';

export type HeaderProps = {
  ghost?: boolean;
};

type ScrollState = 'at-top' | 'scrolling-up' | 'scrolling-down';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center rounded-full p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <FiSun className="h-4 w-4" />
      ) : (
        <FiMoon className="h-4 w-4" />
      )}
    </button>
  );
}

function Header({ ghost }: HeaderProps) {
  const [scrollState, setScrollState] = useState<ScrollState>('at-top');

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
        <div className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-lg">
          <div className="container mx-auto">
            <nav className="bg-surface flex h-[72px] w-full items-center justify-between px-4 rounded-md">
                <div className="flex h-8 items-center justify-start gap-4 text-xl dark:text-gray-200 font-zen">
                  {AGENT_NAME} AI
                </div>
              <div className="flex items-center gap-4">
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
