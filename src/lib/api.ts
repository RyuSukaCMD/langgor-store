const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || 'langgor_csrf'
const csrf = () => document.cookie.split('; ').find(value => value.startsWith(`${csrfCookieName}=`))?.split('=')[1] || ''

export async function uploadProfileImage(file: File, kind: 'avatar' | 'banner') {
  const response = await fetch(`/api/uploads/profile?kind=${kind}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': file.type, 'X-CSRF-Token': csrf() }, body: file })
  const body = await response.json().catch(() => ({ message: 'Respons upload tidak dapat dibaca.' }))
  if (!response.ok) throw new Error(body.message || 'Upload belum berhasil.')
  return body as { url: string; width: number; height: number }
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${url}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf(),
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => ({ message: 'Respons server tidak dapat dibaca.' }))
  if (!response.ok) throw new Error(body.message || 'Terjadi masalah. Coba lagi.')
  return body as T
}
