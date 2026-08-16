const normalizeTitle = (value) => value.trim()
const { enterPage, transitionToTab } = require('../../utils/page-transition')

Page({
  data: {
    draftTitle: '',
    draftNote: '',
    isAddDialogVisible: false,
    tasks: [],
    pageTransition: ''
  },

  onShow() {
    enterPage(this)
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  openAddDialog() {
    this.setData({ isAddDialogVisible: true })
  },

  closeAddDialog() {
    this.setData({
      draftTitle: '',
      draftNote: '',
      isAddDialogVisible: false
    })
  },

  onTitleInput(event) {
    this.setData({ draftTitle: event.detail.value })
  },

  onNoteInput(event) {
    this.setData({ draftNote: event.detail.value })
  },

  stopDialogTap() {},

  addTask() {
    const title = normalizeTitle(this.data.draftTitle)

    if (!title) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' })
      return
    }

    this.setData({
      draftTitle: '',
      draftNote: '',
      isAddDialogVisible: false,
      tasks: [
        ...this.data.tasks,
        {
          id: `${Date.now()}-${this.data.tasks.length}`,
          title,
          note: this.data.draftNote.trim()
        }
      ]
    })
  },

  deleteTask(event) {
    const { id } = event.currentTarget.dataset
    const task = this.data.tasks.find((item) => item.id === id)

    if (!task) return

    wx.showModal({
      title: '删除任务',
      content: `确认删除“${task.title}”吗？`,
      success: ({ confirm }) => {
        if (!confirm) return

        this.setData({
          tasks: this.data.tasks.filter((item) => item.id !== id)
        })
      }
    })
  }
})
