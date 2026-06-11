'use client';
import PixelBackground from '@/packages/studio/src/components/PixelBackground';
import AuthShell from '@/components/auth/AuthShell';

export default function ClientLayout({ children }) {
  return (
    <>
      <PixelBackground />
      <AuthShell>{children}</AuthShell>
    </>
  );
}
