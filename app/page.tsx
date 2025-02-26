import { AGENT_NAME } from '@/utils/constants';
import { generateMetadata } from '@/utils/generateMetadata';
import VaultPage from './home/content';

export const metadata = generateMetadata({
  title: `${AGENT_NAME} AI`,
  description: 'Smart Agent for Morpho Vaults',
  images: 'themes.png',
  pathname: '',
});

/**
 * Server component, which imports the Home component (client component that has 'use client' in it)
 * https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 * https://nextjs.org/docs/pages/building-your-application/upgrading/app-router-migration#step-4-migrating-pages
 * https://nextjs.org/docs/app/building-your-application/rendering/client-components
 */
export default function Page() {
  return <VaultPage />;
}
