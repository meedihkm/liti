import { redirect } from 'next/navigation';

export default function RootPage() {
  // Temporary: redirect to hash router home
  redirect('/#/');
}
