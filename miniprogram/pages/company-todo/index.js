const { listTeamAssignees, listTeamTodos } = require('../../utils/api')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const pad = (value) => String(value).padStart(2, '0')
const dateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const chineseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}
const messageOf = (error) => error?.message || '请求失败，请稍后重试'
const standardizeProject = (project) => ({
  ...project,
  subtaskCountText: String(project.subtasks.length),
  subtasks: project.subtasks.map((subtask) => ({
    ...subtask,
    dateLabel: chineseDate(subtask.dueDate)
  }))
})

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
    selectedDateLabel: `${chineseDate(current)} 至 ${chineseDate(current)}`
  }
}

const updateRange = (startDate, endDate) => ({
  startDate,
  endDate,
  startDateLabel: chineseDate(startDate),
  endDateLabel: chineseDate(endDate),
  selectedDateLabel: `${chineseDate(startDate)} 至 ${chineseDate(endDate)}`
})

Page({
  data: {
    ...rangeState(),
    members: [],
    memberNames: [],
    selectedMemberIndex: 0,
    selectedMemberName: '全部成员',
    projects: [],
    totalSubtaskCountText: '0',
    selectedProject: null,
    isProjectDialogVisible: false,
    isLoading: false,
    pageTransition: ''
  },

  onShow() {
    if (enterPage(this)) this.loadBoard()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  async loadBoard() {
    this.setData({ isLoading: true })
    try {
      const members = await listTeamAssignees()
      const normalizedMembers = [{ id: null, username: '全部成员' }, ...members]
      this.setData({
        members: normalizedMembers,
        memberNames: normalizedMembers.map((member) => member.username),
        selectedMemberIndex: 0,
        selectedMemberName: '全部成员'
      })
      await this.loadTasks(normalizedMembers[0].id)
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  async loadTasks(assigneeId = this.data.members[this.data.selectedMemberIndex]?.id) {
    this.setData({ isLoading: true })
    try {
      const projects = await listTeamTodos({
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        assigneeId
      })
      const normalizedProjects = projects.map(standardizeProject)
      const totalSubtaskCountText = String(projects.reduce(
        (count, project) => count + project.subtasks.length,
        0
      ))
      this.setData({
        projects: normalizedProjects,
        totalSubtaskCountText
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
    this.setData(updateRange(startDate, endDate))
    await this.loadTasks()
  },

  async onEndDateChange(event) {
    const endDate = event.detail.value
    const startDate = endDate < this.data.startDate ? endDate : this.data.startDate
    this.setData(updateRange(startDate, endDate))
    await this.loadTasks()
  },

  openProjectDialog(event) {
    const project = this.data.projects.find((item) => item.id === Number(event.currentTarget.dataset.id))
    if (project) this.setData({ selectedProject: project, isProjectDialogVisible: true })
  },

  closeProjectDialog() {
    this.setData({ isProjectDialogVisible: false, selectedProject: null })
  },

  stopDialogTap() {},

  async onUserChange(event) {
    const selectedMemberIndex = Number(event.detail.value)
    const selectedMember = this.data.members[selectedMemberIndex]
    this.setData({
      selectedMemberIndex,
      selectedMemberName: selectedMember.username
    })
    await this.loadTasks(selectedMember.id)
  }
})
