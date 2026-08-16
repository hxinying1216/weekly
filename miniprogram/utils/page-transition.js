const ENTER_DURATION = 240
const tabIndexByRoute = {
  'pages/task-management/index': 0,
  'pages/todo/index': 1,
  'pages/company-todo/index': 2,
  'pages/archive/index': 3,
  'pages/profile/index': 4
}

const syncTabBar = (page) => {
  if (typeof page.getTabBar !== 'function') return

  const tabBar = page.getTabBar()
  const selected = tabIndexByRoute[page.route]

  if (tabBar && selected !== undefined) tabBar.setData({ selected })
}

const enterPage = (page) => {
  syncTabBar(page)
  page.setData({ pageTransition: 'page-fade-in' })

  setTimeout(() => {
    if (page.data.pageTransition === 'page-fade-in') {
      page.setData({ pageTransition: '' })
    }
  }, ENTER_DURATION)
}

const transitionToTab = (url) => {
  wx.switchTab({ url })
  return true
}

module.exports = { enterPage, transitionToTab }
