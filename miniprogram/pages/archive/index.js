const { listArchiveTodos, listTeamAssignees } = require('../../utils/api')
const { getSession } = require('../../utils/session')
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
    isUserFilterVisible: false,
    members: [],
    memberNames: [],
    selectedMemberIndex: 0,
    selectedMemberName: '全部用户',
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
    if (enterPage(this)) this.initializeArchive()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  async initializeArchive() {
    const isAdmin = getSession()?.role === 'ADMIN'
    if (isAdmin) {
      try {
        const users = await listTeamAssignees()
        const members = [{ id: null, username: '全部用户' }, ...users]
        this.setData({
          isUserFilterVisible: true,
          members,
          memberNames: members.map((member) => member.username),
          selectedMemberIndex: 0,
          selectedMemberName: '全部用户'
        })
      } catch (error) {
        wx.showToast({ title: messageOf(error), icon: 'none' })
        return
      }
    } else {
      this.setData({ isUserFilterVisible: false, members: [] })
    }
    await this.loadArchive()
  },

  async loadArchive() {
    this.setData({ isLoading: true })
    try {
      const projects = (await listArchiveTodos({
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        assigneeId: this.data.members[this.data.selectedMemberIndex]?.id
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

  async onUserChange(event) {
    const selectedMemberIndex = Number(event.detail.value)
    const selectedMember = this.data.members[selectedMemberIndex]
    this.setData({
      selectedMemberIndex,
      selectedMemberName: selectedMember.username
    })
    await this.loadArchive()
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
