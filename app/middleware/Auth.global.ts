const publicRoutes = [
  '/auth/login',
  '/auth/register',
]

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie<string | null>('auth_token')

  if (to.path === '/') {
    return navigateTo(token.value ? '/dashboard' : '/auth/login')
  }

  const isPublic = publicRoutes.includes(to.path)

  if (!token.value && !isPublic) {
    return navigateTo('/auth/login')
  }

  if (token.value && isPublic) {
    return navigateTo('/dashboard')
  }
})