import { createContext, useContext, useState, ReactNode } from 'react'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

const AUTH_STORAGE_KEY = 'cold_chain_current_user'

const defaultUsers: AuthUser[] = [
  { id: 1, name: '系统管理员', email: 'admin@coldchain.com', role: 'ADMIN' },
  { id: 2, name: '冷链主管', email: 'supervisor@coldchain.com', role: 'SUPERVISOR' },
  { id: 3, name: '调度员小王', email: 'dispatcher@coldchain.com', role: 'DISPATCHER' },
  { id: 4, name: '司机张师傅', email: 'driver1@coldchain.com', role: 'DRIVER' },
  { id: 5, name: '司机李师傅', email: 'driver2@coldchain.com', role: 'DRIVER' },
  { id: 6, name: '司机王师傅', email: 'driver3@coldchain.com', role: 'DRIVER' },
  { id: 7, name: '刘经理(客户)', email: 'liu@xianyue.com', role: 'CUSTOMER' },
  { id: 8, name: '陈主管(客户)', email: 'chen@weimei.com', role: 'CUSTOMER' },
  { id: 9, name: '赵经理(客户)', email: 'zhao@kangtai.com', role: 'CUSTOMER' },
]

export { defaultUsers }

interface AuthContextValue {
  currentUser: AuthUser
  setCurrentUser: (user: AuthUser) => void
  users: AuthUser[]
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserState] = useState<AuthUser>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return defaultUsers[0]
  })

  const setCurrentUser = (user: AuthUser) => {
    setCurrentUserState(user)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    window.location.reload()
  }

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, users: defaultUsers }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
