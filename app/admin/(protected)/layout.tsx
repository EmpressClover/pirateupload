import React from 'react';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('admin_session')?.value;
  const valid = await verifyAdminSession(token);
  if (!valid) {
    redirect('/admin/login');
  }
  return <>{children}</>;
}

