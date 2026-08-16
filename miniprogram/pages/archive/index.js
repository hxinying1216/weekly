const pad = (value) => String(value).padStart(2, '0')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const dateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const chineseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

const dateRange = () => {
  const today = new Date()
  const minimum = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
  const maximum = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
  const current = dateValue(today)

  return {
    minimumDate: dateValue(minimum),
    maximumDate: dateValue(maximum),
    startDate: current,
    endDate: current,
    startDateLabel: chineseDate(current),
    endDateLabel: chineseDate(current)
  }
}

const users = [
  { id: 'all', name: '全部用户' },
  { id: 'team-member', name: '团队成员' }
]

const tasksInDateRange = (tasks, startDate, endDate) => tasks.filter(
  (task) => task.date >= startDate && task.date <= endDate
)

const tasksForUser = (tasks, userId) => userId === 'all'
  ? tasks
  : tasks.filter((task) => task.userId === userId)

const filteredTasks = (tasks, startDate, endDate, userId) => tasksForUser(
  tasksInDateRange(tasks, startDate, endDate),
  userId
)

const filterState = (data, startDate, endDate, selectedUserIndex) => {
  const selectedUser = data.users[selectedUserIndex]
  const visibleTasks = filteredTasks(data.tasks, startDate, endDate, selectedUser.id)

  return {
    startDate,
    endDate,
    startDateLabel: chineseDate(startDate),
    endDateLabel: chineseDate(endDate),
    selectedUserIndex,
    selectedUserName: selectedUser.name,
    visibleTasks
  }
}

Page({
  data: {
    ...dateRange(),
    users,
    userNames: users.map((user) => user.name),
    selectedUserIndex: 0,
    selectedUserName: users[0].name,
    tasks: [],
    visibleTasks: [],
    pageTransition: ''
  },

  onShow() {
    enterPage(this)
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  onStartDateChange(event) {
    const startDate = event.detail.value
    const endDate = startDate > this.data.endDate ? startDate : this.data.endDate
    this.setData(filterState(this.data, startDate, endDate, this.data.selectedUserIndex))
  },

  onEndDateChange(event) {
    const endDate = event.detail.value
    const startDate = endDate < this.data.startDate ? endDate : this.data.startDate
    this.setData(filterState(this.data, startDate, endDate, this.data.selectedUserIndex))
  },

  onUserChange(event) {
    const selectedUserIndex = Number(event.detail.value)
    this.setData(filterState(
      this.data,
      this.data.startDate,
      this.data.endDate,
      selectedUserIndex
    ))
  }
})
