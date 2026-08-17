const { isAuthenticated } = require('./utils/session')

App({
  onLaunch() {
    if (!isAuthenticated()) {
      wx.reLaunch({ url: '/pages/auth/index' })
    }
  }
})
