const storageKey = 'auth-session'

const getSession = () => wx.getStorageSync(storageKey) || null
const getRole = () => getSession()?.role || 'USER'
const isAuthenticated = () => Boolean(getSession() && getSession().accessToken)
const isAdmin = () => isAuthenticated() && getRole() === 'ADMIN'
const saveSession = (session) => wx.setStorageSync(storageKey, session)
const clearSession = () => wx.removeStorageSync(storageKey)

const ensureAuthenticated = () => {
  if (isAuthenticated()) return true
  wx.reLaunch({ url: '/pages/auth/index' })
  return false
}

module.exports = { getSession, getRole, isAuthenticated, isAdmin, saveSession, clearSession, ensureAuthenticated }
