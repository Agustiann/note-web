import type { ApiResponse, AuthUser } from '~/types/api'

interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface UpdateProfilePayload {
  name: string
  password?: string
  password_confirmation?: string
  photo?: File | null
}

interface LoginResponse extends ApiResponse<AuthUser> {
  token: string
}

export const useAuth = () => {
  const api = useApi()

  const token = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  const user = useState<AuthUser | null>('auth_user', () => null)

  const login = async (email: string, password: string) => {
    clearNuxtData()

    const response = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    token.value = response.token
    user.value = response.data

    return response
  }

  const register = async (payload: RegisterPayload) => {
    const response = await api<ApiResponse<AuthUser>>('/auth/register', {
      method: 'POST',
      body: payload,
    })
    return response
  }

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      token.value = null
      user.value = null
      clearNuxtData()
    }
  }

  const fetchUser = async () => {
    const response = await api<ApiResponse<AuthUser>>('/auth/me')
    user.value = response.data
    return response.data
  }

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('name', payload.name)

    if (payload.password) {
      formData.append('password', payload.password)
      formData.append('password_confirmation', payload.password_confirmation ?? '')
    }

    if (payload.photo) {
      formData.append('photo', payload.photo)
    }

    const response = await api<ApiResponse<AuthUser>>('/auth/profile', {
      method: 'POST',
      body: formData,
    })

    user.value = response.data
    return response.data
  }

  const fetchPhotoBlobUrl = async (photoUrl: string) => {
    return await api<Blob>(photoUrl, { responseType: 'blob', cache: 'no-store' })
  }

  const isAuthenticated = computed(() => !!token.value)

  return {
    user,
    token,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    fetchPhotoBlobUrl,
    isAuthenticated,
  }
}