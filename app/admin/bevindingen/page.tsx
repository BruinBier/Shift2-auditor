'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BevindingenRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/snelle-bevindingen');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting...</p>
    </div>
  );
}