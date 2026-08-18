const normalize = (value) => value.trim()
const { enterPage, transitionToTab } = require('../../utils/page-transition')
const { clearSession, getSession, saveSession } = require('../../utils/session')
const { createUser, deleteUser, getProfile, listUsers, lookupPhone, updateProfile, updateUserRole } = require('../../utils/api')

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
      phone: '13800000000'
    },
    nicknameInput: '团队成员',
    phoneInput: '13800000000',
    phoneQueryUsername: '',
    phoneQueryResult: '',
    isPhoneQuerying: false,
    userRole: '普通用户',
    accessScope: '可使用个人待办、团队大板与任务归档',
    isAdmin: false,
    users: [],
    isUsersLoading: false,
    isCreateDialogVisible: false,
    isEditDialogVisible: false,
    createUsername: '',
    createPassword: '',
    createRole: 'USER',
    editUserId: null,
    editUserIndex: 0,
    editUsername: '',
    editRole: 'USER',
    operatingUserId: null,
    pageTransition: ''
  },

  async onShow() {
    if (!enterPage(this)) return

    const session = getSession()
    if (!session) return

    const isAdmin = session.role === 'ADMIN'
    this.setData({
      'profile.nickname': session.username,
      nicknameInput: session.username,
      userRole: isAdmin ? '管理员' : '普通用户',
      accessScope: accessScopeFor(session.role),
      isAdmin
    })
    try {
      const profile = await getProfile()
      this.setData({
        'profile.nickname': profile.username,
        'profile.phone': profile.phone || '',
        nicknameInput: profile.username,
        phoneInput: profile.phone || ''
      })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
    if (isAdmin) this.loadUsers()
  },

  transitionToTab(url) {
    return transitionToTab(url)
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset
    this.setData({ [field]: event.detail.value })
  },

  async lookupPhone() {
    const username = normalize(this.data.phoneQueryUsername)
    if (!username) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ isPhoneQuerying: true, phoneQueryResult: '' })
    try {
      const result = await lookupPhone(username)
      this.setData({ phoneQueryResult: result.phone || '对方未登记手机号' })
    } catch (error) {
      this.setData({ phoneQueryResult: '' })
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ isPhoneQuerying: false })
    }
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

  openEditDialog() {
    const user = this.data.users[0]
    if (!user) {
      wx.showToast({ title: '暂无可编辑用户', icon: 'none' })
      return
    }
    this.setData({
      isEditDialogVisible: true,
      editUserIndex: 0,
      editUserId: user.id,
      editUsername: user.username,
      editRole: user.role
    })
  },

  onEditUserChange(event) {
    const editUserIndex = Number(event.detail.value)
    const user = this.data.users[editUserIndex]
    if (!user) return
    this.setData({
      editUserIndex,
      editUserId: user.id,
      editUsername: user.username,
      editRole: user.role
    })
  },

  closeEditDialog() {
    if (this.data.operatingUserId !== this.data.editUserId) {
      this.setData({ isEditDialogVisible: false })
    }
  },

  selectEditRole(event) {
    this.setData({ editRole: event.currentTarget.dataset.role })
  },

  async submitEditUser() {
    const id = this.data.editUserId
    if (!id) return

    this.setData({ operatingUserId: id })
    try {
      const user = await updateUserRole(id, this.data.editRole)
      const session = getSession()
      if (session && user.id === session.id) {
        if (user.role === 'USER') {
          clearSession()
          wx.showToast({ title: '已设为普通用户，请重新登录', icon: 'none' })
          setTimeout(() => wx.reLaunch({ url: '/pages/auth/index' }), 800)
          return
        }
        saveSession({ ...session, role: user.role })
        this.setData({
          isAdmin: true,
          userRole: '管理员',
          accessScope: accessScopeFor(user.role)
        })
      }
      this.setData({ isEditDialogVisible: false })
      wx.showToast({ title: '角色已更新', icon: 'success' })
      await this.loadUsers()
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ operatingUserId: null })
    }
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
          this.setData({ isEditDialogVisible: false })
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

  async saveProfile() {
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

    try {
      const profile = await updateProfile({ username: nickname, phone })
      const session = getSession()
      if (session) saveSession({ ...session, username: profile.username })
      this.setData({
        profile: {
          ...this.data.profile,
          nickname: profile.username,
          phone: profile.phone
        },
        nicknameInput: profile.username,
        phoneInput: profile.phone
      })
      wx.showToast({ title: '资料已更新，登录用户名已同步', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    }
  }
})
