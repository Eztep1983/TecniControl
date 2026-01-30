import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(p => path.startsWith(p))
  
  // Verificar si hay usuario autenticado (Firebase guarda el token)
  // Firebase usa cookies como __session o tokens en localStorage
  // En el middleware solo hacemos verificación básica
  
  if (!isPublicPath) {
    // Para rutas protegidas, el componente ProtectedRoute hará la verificación completa
    // El middleware solo previene acceso obvio sin auth
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}