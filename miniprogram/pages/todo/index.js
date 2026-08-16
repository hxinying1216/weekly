const pad = (value) => String(value).padStart(2, '0')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const dateValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const chineseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

const filterTasks = (tasks, startDate, endDate) => tasks.filter(
  (task) => task.date >= startDate && task.date <= endDate
)

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
    isAddDialogVisible: false,
    draftTitle: '',
    draftNote: '',
    draftDate: current,
    draftDateLabel: chineseDate(current)
  }
}

const updateRange = (startDate, endDate, tasks) => ({
  startDate,
  endDate,
  startDateLabel: chineseDate(startDate),
  endDateLabel: chineseDate(endDate),
  selectedDateLabel: `${chineseDate(startDate)} 至 ${chineseDate(endDate)}`,
  visibleTasks: filterTasks(tasks, startDate, endDate)
})

Page({
  data: { ...rangeState(), pageTransition: '' },

  onShow() {
    enterPage(this)
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  onStartDateChange(event) {
    const startDate = event.detail.value
    const endDate = startDate > this.data.endDate ? startDate : this.data.endDate
    this.setData(updateRange(startDate, endDate, this.data.tasks))
  },

  onEndDateChange(event) {
    const endDate = event.detail.value
    const startDate = endDate < this.data.startDate ? endDate : this.data.startDate
    this.setData(updateRange(startDate, endDate, this.data.tasks))
  },

  openAddDialog() {
    this.setData({
      isAddDialogVisible: true,
      draftTitle: '',
      draftNote: '',
      draftDate: this.data.startDate,
      draftDateLabel: chineseDate(this.data.startDate)
    })
  },

  closeAddDialog() {
    this.setData({ isAddDialogVisible: false })
  },

  stopDialogTap() {},

  onTaskInput(event) {
    const { field } = event.currentTarget.dataset
    this.setData({ [field]: event.detail.value })
  },

  onTaskDateChange(event) {
    const draftDate = event.detail.value
    this.setData({ draftDate, draftDateLabel: chineseDate(draftDate) })
  },

  addTask() {
    const title = this.data.draftTitle.trim()
    const note = this.data.draftNote.trim()

    if (!title) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' })
      return
    }

    if (!note) {
      wx.showToast({ title: '请输入任务备注', icon: 'none' })
      return
    }

    const task = {
      id: `${Date.now()}-${this.data.tasks.length}`,
      title,
      note,
      date: this.data.draftDate,
      dateLabel: chineseDate(this.data.draftDate)
    }
    const tasks = [...this.data.tasks, task]

    this.setData({
      tasks,
      isAddDialogVisible: false,
      draftTitle: '',
      draftNote: '',
      visibleTasks: filterTasks(tasks, this.data.startDate, this.data.endDate)
    })
  }
})
