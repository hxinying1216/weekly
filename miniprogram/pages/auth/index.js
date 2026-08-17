const { authenticate } = require('../../utils/api')
const { saveSession } = require('../../utils/session')

const normalize = (value) => value.trim()

Page({
  data: {
    mode: 'login',
    username: '',
    password: '',
    isSubmitting: false
  },

  switchMode(event) {
    this.setData({
      mode: event.currentTarget.dataset.mode,
      password: ''
    })
  },

  onInput(event) {
    this.setData({ [event.currentTarget.dataset.field]: event.detail.value })
  },

  async submit() {
    const username = normalize(this.data.username)
    const password = this.data.password

    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }

    this.setData({ isSubmitting: true })

    try {
      const session = await authenticate(this.data.mode, { username, password })
      saveSession(session)
      wx.showToast({ title: this.data.mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
      wx.switchTab({ url: '/pages/task-management/index' })
    } catch (error) {
      wx.showToast({ title: error.message, icon: 'none' })
    } finally {
      this.setData({ isSubmitting: false })
    }
  }
})
