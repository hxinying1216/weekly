const { listProjects, createProject, deleteProject } = require('../../utils/api')
const { enterPage, transitionToTab } = require('../../utils/page-transition')

const normalizeTitle = (value) => value.trim()
const messageOf = (error) => error?.message || '请求失败，请稍后重试'

Page({
  data: {
    draftTitle: '',
    draftNote: '',
    isAddDialogVisible: false,
    isLoading: false,
    isSaving: false,
    projects: [],
    pageTransition: ''
  },

  onShow() {
    if (enterPage(this)) this.loadProjects()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  async loadProjects() {
    this.setData({ isLoading: true })
    try {
      this.setData({ projects: await listProjects() })
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  openAddDialog() {
    this.setData({ isAddDialogVisible: true })
  },

  closeAddDialog() {
    if (this.data.isSaving) return
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

  async addTask() {
    const title = normalizeTitle(this.data.draftTitle)
    if (!title) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' })
      return
    }

    this.setData({ isSaving: true })
    try {
      const project = await createProject({ title, note: this.data.draftNote.trim() })
      this.setData({
        draftTitle: '',
        draftNote: '',
        isAddDialogVisible: false,
        projects: [project, ...this.data.projects]
      })
      wx.showToast({ title: '任务已创建', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: messageOf(error), icon: 'none' })
    } finally {
      this.setData({ isSaving: false })
    }
  },

  deleteTask(event) {
    const { id } = event.currentTarget.dataset
    const project = this.data.projects.find((item) => String(item.id) === String(id))
    if (!project) return

    wx.showModal({
      title: '删除任务',
      content: `确认删除“${project.title}”吗？`,
      success: async ({ confirm }) => {
        if (!confirm) return
        try {
          await deleteProject(project.id)
          this.setData({ projects: this.data.projects.filter((item) => item.id !== project.id) })
          wx.showToast({ title: '任务已删除', icon: 'success' })
        } catch (error) {
          wx.showToast({ title: messageOf(error), icon: 'none' })
        }
      }
    })
  }
})
