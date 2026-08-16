const normalize = (value) => value.trim()

const isPhone = (value) => /^1[3-9]\d{9}$/.test(value)

Page({
  data: {
    profile: {
      nickname: '团队成员',
      phone: '13800000000',
      avatarUrl: '',
      avatarInitial: '团'
    },
    nicknameInput: '团队成员',
    phoneInput: '13800000000'
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset
    this.setData({ [field]: event.detail.value })
  },

  onChooseAvatar(event) {
    this.setData({
      profile: { ...this.data.profile, avatarUrl: event.detail.avatarUrl }
    })
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
