const { listAvailableProjects, listPersonalTodos, createPersonalTodo } = require('../../utils/api')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const pad = (value) => String(value).padStart(2, '0')
const messageOf = (error) => error?.message || '请求失败，请稍后重试'
const dateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const chineseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

const taskOf = (todo) => ({
  ...todo,
  date: todo.dueDate,
  dateLabel: chineseDate(todo.dueDate)
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
    selectedDateLabel: `${chineseDate(current)} 至 ${chineseDate(current)}`,
    tasks: [],
    visibleTasks: [],
    projects: [],
    projectLabels: [],
    isLoading: false,
    isSaving: false,
    isAddDialogVisible: false,
    draftProjectIndex: 0,
    draftNote: '',
    draftDate: current,
    draftDateLabel: chineseDate(current)
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
  data: { ...rangeState(), pageTransition: '' },

  onShow() {
    if (enterPage(this)) this.loadTodos()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  async loadTodos() {
    this.setData({ isLoading: true })
    try {
      const [projects, todos] = await Promise.all([
        listAvailableProjects(),
        listPersonalTodos({ startDate: this.data.startDate, endDate: this.data.endDate })
      ])
      this.setData({
        projects,
        projectLabels: projects.map((project) => `${project.title}（创建人：${project.creator}）`),
        tasks: todos.map(taskOf),
        visibleTasks: todos.map(taskOf)
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
    await this.loadTodos()
  },

  async onEndDateChange(event) {
    const endDate = event.detail.value
    const startDate = endDate < this.data.startDate ? endDate : this.data.startDate
    this.setData(updateRange(startDate, endDate))
    await this.loadTodos()
  },

  openAddDialog() {
    if (!this.data.projects.length) {
      wx.showToast({ title: '暂无可选择的父任务', icon: 'none' })
      return
    }
    this.setData({
      isAddDialogVisible: true,
      draftProjectIndex: 0,
      draftNote: '',
      draftDate: this.data.startDate,
      draftDateLabel: chineseDate(this.data.startDate)
    })
  },

  closeAddDialog() {
    if (!this.data.isSaving) this.setData({ isAddDialogVisible: false })
  },

  stopDialogTap() {},

  onProjectChange(event) {
    this.setData({ draftProjectIndex: Number(event.detail.value) })
  },

  onTaskInput(event) {
    this.setData({ draftNote: event.detail.value })
  },

  onTaskDateChange(event) {
    const draftDate = event.detail.value
    this.setData({ draftDate, draftDateLabel: chineseDate(draftDate) })
  },

  async addTask() {
    const project = this.data.projects[this.data.draftProjectIndex]
    const note = this.data.draftNote.trim()
    if (!project) {
      wx.showToast({ title: '请选择父任务', icon: 'none' })
      return
    }
    if (!note) {
      wx.showToast({ title: '请输入个人备注', icon: 'none' })
      return
    }

    this.setData({ isSaving: true })
    try {
      const todo = taskOf(await createPersonalTodo({
        projectId: project.id,
        dueDate: this.data.draftDate,
        note
      }))
      const tasks = [...this.data.tasks, todo]
      this.setData({
        tasks,
        isAddDialogVisible: false,
        draftNote: '',
        visibleTasks: tasks.filter((task) => task.date >= this.data.startDate && task.date <= this.data.endDate)
      })
      wx.showToast({ title: '个人待办已创建', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ isSaving: false })
    }
  }
})
