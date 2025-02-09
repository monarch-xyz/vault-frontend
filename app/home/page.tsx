import { Metadata } from 'next';
import HomeClient from './client-page';

export const metadata: Metadata = {
  title: 'Wowo',
  description: 'Wowo in control',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return <HomeClient />;
}
