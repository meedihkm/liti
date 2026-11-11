import { redirect } from 'next/navigation';

// Force dynamic rendering for redirects
export const dynamic = 'force-dynamic';

export default function RootPage() {
  // Temporary: redirect to hash router home
  redirect('/#/');
}
