import { redirect } from 'next/navigation';

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const search = new URLSearchParams(params).toString();
  const suffix = search ? `?${search}` : '';
  redirect(`/studio${suffix}`);
}
