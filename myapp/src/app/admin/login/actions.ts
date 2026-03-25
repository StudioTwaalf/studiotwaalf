'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminPassword, setAdminCookie, clearAdminCookie } from '@/lib/admin-auth'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string

  if (!verifyAdminPassword(password)) {
    redirect('/admin/login?error=invalid')
  }

  const { name, value, options } = setAdminCookie()
  cookies().set(name, value, options)
  redirect('/admin/templates')
}

export async function logoutAction() {
  const { name, value, options } = clearAdminCookie()
  cookies().set(name, value, options)
  redirect('/admin/login')
}
