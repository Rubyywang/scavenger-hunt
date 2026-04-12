import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')
  const isAdminApi  = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')

  if (isAdminPage || isAdminApi) {
    const cookie = req.cookies.get('sh_admin')

    if (!cookie) {
      return isAdminPage
        ? NextResponse.redirect(new URL('/admin/login', req.url))
        : NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    try {
      await jwtVerify(cookie.value, SECRET)
    } catch {
      return isAdminPage
        ? NextResponse.redirect(new URL('/admin/login', req.url))
        : NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
