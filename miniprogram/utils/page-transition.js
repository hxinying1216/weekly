const ENTER_DURATION = 240
const { ensureAuthenticated, isAdmin } = require('./session')

const adminOnlyRoutes = new Set(['pages/task-management/index'])
const tabIndexByRoute = {
  'pages/task-management/index': 0,
  'pages/todo/index': 1,
  'pages/company-todo/index': 2,
  'pages/archive/index': 3,
  'pages/profile/index': 4
}

const accessibleTabs = () => (
  isAdmin()
    ? Object.keys(tabIndexByRoute)
    : Object.keys(tabIndexByRoute).filter((route) => !adminOnlyRoutes.has(route))
)

const syncTabBar = (page) => {
  if (typeof page.getTabBar !== 'function') return

  const tabBar = page.getTabBar()
  const selected = accessibleTabs().indexOf(page.route)

  if (tabBar && selected !== -1) tabBar.setData({ selected })
}

const enterPage = (page) => {
  if (!ensureAuthenticated()) return false

  if (adminOnlyRoutes.has(page.route) && !isAdmin()) {
    wx.showToast({ title: '任务管理仅限管理员使用', icon: 'none' })
    wx.switchTab({ url: '/pages/todo/index' })
    return false
  }

  syncTabBar(page)
  page.setData({ pageTransition: 'page-fade-in' })

  setTimeout(() => {
    if (page.data.pageTransition === 'page-fade-in') {
      page.setData({ pageTransition: '' })
    }
  }, ENTER_DURATION)
  return true
}

const transitionToTab = (url) => {
  wx.switchTab({ url })
  return true
}

module.exports = { enterPage, transitionToTab }
