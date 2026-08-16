const tabs = [
  { path: '/pages/task-management/index', text: '任务管理' },
  { path: '/pages/todo/index', text: '个人待办' },
  { path: '/pages/company-todo/index', text: '公司待办' },
  { path: '/pages/archive/index', text: '任务归档' },
  { path: '/pages/profile/index', text: '个人信息' }
]

Component({
  data: { selected: 0, tabs },

  methods: {
    onTabTap(event) {
      const { path } = event.currentTarget.dataset
      const current = getCurrentPages().pop()
      if (`/${current.route}` === path) return
      current.transitionToTab(path)
    }
  }
})
