const { listArchiveTodos } = require('../../utils/api')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const pad = (value) => String(value).padStart(2, '0')
const messageOf = (error) => error?.message || '请求失败，请稍后重试'
const dateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const chineseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

const rangeState = () => {
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
    endDateLabel: chineseDate(current),
    projects: [],
    subtaskCount: 0,
    isLoading: false
  }
}

const rangeUpdate = (startDate, endDate) => ({
  startDate,
  endDate,
  startDateLabel: chineseDate(startDate),
  endDateLabel: chineseDate(endDate)
})

const projectOf = (project) => ({
  ...project,
  subtasks: project.subtasks.map((subtask) => ({
    ...subtask,
    completedDateLabel: chineseDate(subtask.completedAt)
  }))
})

Page({
  data: { ...rangeState(), pageTransition: '' },

  onShow() {
    if (enterPage(this)) this.loadArchive()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  async loadArchive() {
    this.setData({ isLoading: true })
    try {
      const projects = (await listArchiveTodos({
        startDate: this.data.startDate,
        endDate: this.data.endDate
      })).map(projectOf)
      this.setData({
        projects,
        subtaskCount: projects.reduce((count, project) => count + project.subtasks.length, 0)
      })
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  async onStartDateChange(event) {
    const startDate = event.detail.value
    const endDate = startDate > this.data.endDate ? startDate : this.data.endDate
    this.setData(rangeUpdate(startDate, endDate))
    await this.loadArchive()
  },

  async onEndDateChange(event) {
    const endDate = event.detail.value
    const startDate = endDate < this.data.startDate ? endDate : this.data.startDate
    this.setData(rangeUpdate(startDate, endDate))
    await this.loadArchive()
  }
})
