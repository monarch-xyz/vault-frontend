import { Metadata } from 'next';
import HomeClient from './client-page';

export const metadata: Metadata = {
  title: 'M1 Smart Vault',
  description: 'Monarch Vault',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return <HomeClient />;
}
