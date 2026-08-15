const csrf = () => document.cookie.split('; ').find(value => value.startsWith('langgor_csrf='))?.split('=')[1] || ''

async function uploadImage(url:string,file:File){
  const response=await fetch(url,{method:'POST',credentials:'include',cache:'no-store',headers:{'Content-Type':file.type,'X-CSRF-Token':csrf()},body:file})
  const body=await response.json().catch(()=>({message:'Respons upload tidak dapat dibaca.'}))
  if(!response.ok)throw new Error(body.message||'Upload belum berhasil.')
  return body as {url:string;path:string;width:number;height:number}
}

export const uploadProfileImage=(file:File,kind:'avatar'|'banner')=>uploadImage(`/api/uploads/profile?kind=${kind}`,file)
export const uploadProductImage=(productId:string,file:File)=>uploadImage(`/api/admin/products/${encodeURIComponent(productId)}/image`,file)

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${url}`, {
    credentials: 'include',
    cache: 'no-store',
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

export const deleteProductImage=(productId:string)=>api<{ok:boolean}>(`/admin/products/${encodeURIComponent(productId)}/image`,{method:'DELETE'})
