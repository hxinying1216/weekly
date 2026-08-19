const { listAvailableProjects, listPersonalTodos, createPersonalTodo, updatePersonalTodo, completePersonalTodo } = require('../../utils/api')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const pad = (value) => String(value).padStart(2, '0')
const messageOf = (error) => error?.message || '请求失败，请稍后重试'
const dateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const chineseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

const taskOf = (todo) => {
  const [mainNote = '', childNote = ''] = todo.note.split('\n')
  return {
    ...todo,
    mainNote,
    childNote,
    date: todo.dueDate,
    dateLabel: chineseDate(todo.dueDate)
  }
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
    selectedDateLabel: `${chineseDate(current)} 至 ${chineseDate(current)}`,
    tasks: [],
    visibleTasks: [],
    projects: [],
    projectLabels: [],
    isLoading: false,
    isSaving: false,
    completingId: null,
    editingId: null,
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
    let firstError = null

    try {
      const projects = await listAvailableProjects()
      this.setData({
        projects,
        projectLabels: projects.map((project) => `${project.title}（创建人：${project.creator}）`)
      })
    } catch (error) {
      firstError = error
    }

    try {
      const tasks = (await listPersonalTodos({
        startDate: this.data.startDate,
        endDate: this.data.endDate
      })).map(taskOf)
      this.setData({ tasks, visibleTasks: tasks })
    } catch (error) {
      firstError = firstError || error
    } finally {
      this.setData({ isLoading: false })
    }

    if (firstError) wx.showToast({ title: messageOf(firstError), icon: 'none' })
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

  async completeTask(event) {
    const id = Number(event.currentTarget.dataset.id)
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '完成任务',
        content: '确认将此任务设为完成？完成后将移入任务归档。',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false)
      })
    })
    if (!confirmed) return

    this.setData({ completingId: id })
    try {
      await completePersonalTodo(id)
      await this.loadTodos()
      wx.showToast({ title: '任务已归档', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ completingId: null })
    }
  },

  openAddDialog() {
    if (!this.data.projects.length) {
      wx.showToast({ title: '暂无可选择的父任务', icon: 'none' })
      return
    }
    this.setData({
      isAddDialogVisible: true,
      editingId: null,
      draftProjectIndex: 0,
      draftNote: '',
      draftDate: this.data.startDate,
      draftDateLabel: chineseDate(this.data.startDate)
    })
  },

  openEditDialog(event) {
    const id = Number(event.currentTarget.dataset.id)
    const task = this.data.tasks.find((item) => item.id === id)
    const projectIndex = this.data.projects.findIndex((project) => project.id === task?.projectId)
    if (!task || projectIndex < 0) {
      wx.showToast({ title: '任务信息已变化，请刷新后重试', icon: 'none' })
      return
    }
    this.setData({
      isAddDialogVisible: true,
      editingId: id,
      draftProjectIndex: projectIndex,
      draftNote: task.childNote.replace(/^个人备注：/, '').trim(),
      draftDate: task.dueDate,
      draftDateLabel: chineseDate(task.dueDate)
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
      wx.showToast({ title: '请选择主任务', icon: 'none' })
      return
    }
    if (!note) {
      wx.showToast({ title: '请输入个人备注', icon: 'none' })
      return
    }

    const editingId = this.data.editingId
    this.setData({ isSaving: true })
    try {
      const payload = { projectId: project.id, dueDate: this.data.draftDate, note }
      const updatedTodo = editingId
        ? taskOf(await updatePersonalTodo(editingId, payload))
        : taskOf(await createPersonalTodo(payload))
      const tasks = editingId
        ? this.data.tasks.map((task) => task.id === updatedTodo.id ? updatedTodo : task)
        : [...this.data.tasks, updatedTodo]
      this.setData({
        tasks,
        isAddDialogVisible: false,
        editingId: null,
        draftNote: '',
        visibleTasks: tasks.filter((task) => task.date >= this.data.startDate && task.date <= this.data.endDate)
      })
      wx.showToast({ title: editingId ? '任务已修改' : '个人任务已创建', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ isSaving: false })
    }
  }
})
