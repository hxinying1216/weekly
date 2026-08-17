const { isAdmin } = require('../utils/session')

const allTabs = [
  { path: '/pages/task-management/index', text: '任务管理', adminOnly: true },
  { path: '/pages/todo/index', text: '个人待办' },
  { path: '/pages/company-todo/index', text: '团队大板' },
  { path: '/pages/archive/index', text: '任务归档' },
  { path: '/pages/profile/index', text: '个人信息' }
]

const availableTabs = () => allTabs.filter((tab) => !tab.adminOnly || isAdmin())

Component({
  data: { selected: 0, tabs: [] },

  lifetimes: {
    attached() {
      this.setData({ tabs: availableTabs() })
    }
  },

  methods: {
    onTabTap(event) {
      const { path } = event.currentTarget.dataset
      const current = getCurrentPages().pop()
      if (`/${current.route}` === path) return
      current.transitionToTab(path)
    }
  }
})
