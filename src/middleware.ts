import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (isApiRoute) return NextResponse.next()

  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))

  if (!hasAuthCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasAuthCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
