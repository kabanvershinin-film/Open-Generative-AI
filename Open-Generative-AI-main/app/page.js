import { redirect } from 'next/navigation';

export default function Home({ searchParams }) {
  const search = new URLSearchParams(searchParams).toString();
  const suffix = search ? `?${search}` : '';
  redirect(`/studio${suffix}`);
}
