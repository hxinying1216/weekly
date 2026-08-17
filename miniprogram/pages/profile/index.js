const normalize = (value) => value.trim()
const { enterPage, transitionToTab } = require('../../utils/page-transition')
const { clearSession, getSession, saveSession } = require('../../utils/session')
const { createUser, deleteUser, listUsers, updateUserRole } = require('../../utils/api')

const isPhone = (value) => /^1[3-9]\d{9}$/.test(value)
const accessScopeFor = (role) => (
  role === 'ADMIN'
    ? '可使用全部功能，包括任务管理和用户管理'
    : '可使用个人待办、团队大板与任务归档'
)

Page({
  data: {
    profile: {
      nickname: '团队成员',
      phone: '13800000000',
      avatarUrl: '',
      avatarInitial: '团'
    },
    nicknameInput: '团队成员',
    phoneInput: '13800000000',
    userRole: '普通用户',
    accessScope: '可使用个人待办、团队大板与任务归档',
    isAdmin: false,
    users: [],
    isUsersLoading: false,
    isCreateDialogVisible: false,
    createUsername: '',
    createPassword: '',
    createRole: 'USER',
    operatingUserId: null,
    pageTransition: ''
  },

  onShow() {
    if (!enterPage(this)) return

    const session = getSession()
    if (!session) return

    const isAdmin = session.role === 'ADMIN'
    this.setData({
      'profile.nickname': session.username,
      'profile.avatarInitial': session.username.slice(0, 1),
      nicknameInput: session.username,
      userRole: isAdmin ? '管理员' : '普通用户',
      accessScope: accessScopeFor(session.role),
      isAdmin
    })
    if (isAdmin) this.loadUsers()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset
    this.setData({ [field]: event.detail.value })
  },

  onChooseAvatar({ detail = {} }) {
    const { avatarUrl } = detail

    if (!avatarUrl) {
      wx.showToast({ title: '未获取到微信头像', icon: 'none' })
      return
    }

    this.setData({ 'profile.avatarUrl': avatarUrl })
  },

  onAvatarLoadError() {
    wx.showToast({ title: '头像加载失败，请重新选择', icon: 'none' })
  },

  async loadUsers() {
    this.setData({ isUsersLoading: true })
    try {
      this.setData({ users: await listUsers() })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ isUsersLoading: false })
    }
  },

  openCreateDialog() {
    this.setData({
      isCreateDialogVisible: true,
      createUsername: '',
      createPassword: '',
      createRole: 'USER'
    })
  },

  closeCreateDialog() {
    this.setData({ isCreateDialogVisible: false })
  },

  stopDialogTap() {},

  selectCreateRole(event) {
    this.setData({ createRole: event.currentTarget.dataset.role })
  },

  async submitCreateUser() {
    const username = normalize(this.data.createUsername)
    const password = this.data.createPassword
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    this.setData({ operatingUserId: 'create' })
    try {
      await createUser({ username, password, role: this.data.createRole })
      this.closeCreateDialog()
      wx.showToast({ title: '用户已创建', icon: 'success' })
      await this.loadUsers()
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ operatingUserId: null })
    }
  },

  async changeUserRole(event) {
    const { id, role } = event.currentTarget.dataset
    this.setData({ operatingUserId: id })
    try {
      const user = await updateUserRole(id, role)
      const session = getSession()
      if (session && user.id === session.id) {
        saveSession({ ...session, role: user.role })
        const isAdmin = user.role === 'ADMIN'
        this.setData({
          isAdmin,
          userRole: isAdmin ? '管理员' : '普通用户',
          accessScope: accessScopeFor(user.role),
          users: isAdmin ? this.data.users : []
        })
      }
      wx.showToast({ title: '角色已更新', icon: 'success' })
      if (this.data.isAdmin) await this.loadUsers()
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ operatingUserId: null })
    }
  },

  deleteManagedUser(event) {
    const { id, username } = event.currentTarget.dataset
    wx.showModal({
      title: '删除用户',
      content: `确认删除“${username}”吗？`,
      success: async ({ confirm }) => {
        if (!confirm) return
        this.setData({ operatingUserId: id })
        try {
          await deleteUser(id)
          const session = getSession()
          if (session && Number(id) === session.id) {
            clearSession()
            wx.reLaunch({ url: '/pages/auth/index' })
            return
          }
          wx.showToast({ title: '用户已删除', icon: 'success' })
          await this.loadUsers()
        } catch (error) {
          wx.showToast({ title: error.message, icon: 'none' })
        } finally {
          this.setData({ operatingUserId: null })
        }
      }
    })
  },

  logout() {
    clearSession()
    wx.reLaunch({ url: '/pages/auth/index' })
  },

  saveProfile() {
    const nickname = normalize(this.data.nicknameInput)
    const phone = normalize(this.data.phoneInput)

    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    if (!isPhone(phone)) {
      wx.showToast({ title: '请输入有效手机号', icon: 'none' })
      return
    }

    this.setData({
      profile: {
        ...this.data.profile,
        nickname,
        phone,
        avatarInitial: nickname.slice(0, 1)
      },
      nicknameInput: nickname,
      phoneInput: phone
    })
    wx.showToast({ title: '资料已更新', icon: 'success' })
  }
})
