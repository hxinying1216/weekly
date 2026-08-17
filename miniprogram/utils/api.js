const { getSession } = require('./session')

const API_BASE_URL = 'http://192.168.110.136:8080'

const request = ({ url, method = 'GET', data, withSession = false }) => new Promise((resolve, reject) => {
  const session = getSession()
  const header = { 'content-type': 'application/json' }
  if (withSession && session?.accessToken) header.Authorization = `Bearer ${session.accessToken}`

  wx.request({
    url: `${API_BASE_URL}${url}`,
    method,
    data,
    header,
    success: ({ statusCode, data: body }) => {
      if (statusCode >= 200 && statusCode < 300) {
        resolve(body)
        return
      }
      reject(new Error(body && body.message ? body.message : '请求失败'))
    },
    fail: () => reject(new Error('无法连接认证服务'))
  })
})

const authenticate = (action, credentials) => request({
  url: `/api/auth/${action}`,
  method: 'POST',
  data: credentials
})

const listUsers = () => request({ url: '/api/users', withSession: true })
const createUser = (user) => request({ url: '/api/users', method: 'POST', data: user, withSession: true })
const updateUserRole = (id, role) => request({
  url: `/api/users/${id}/role`,
  method: 'PATCH',
  data: { role },
  withSession: true
})
const deleteUser = (id) => request({ url: `/api/users/${id}`, method: 'DELETE', withSession: true })
const listProjects = () => request({ url: '/api/projects', withSession: true })
const createProject = (project) => request({ url: '/api/projects', method: 'POST', data: project, withSession: true })
const deleteProject = (id) => request({ url: `/api/projects/${id}`, method: 'DELETE', withSession: true })

const listAvailableProjects = () => request({ url: '/api/personal-todos/available-projects', withSession: true })
const listPersonalTodos = ({ startDate, endDate }) => request({
  url: `/api/personal-todos?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
  withSession: true
})
const createPersonalTodo = (todo) => request({
  url: '/api/personal-todos',
  method: 'POST',
  data: todo,
  withSession: true
})

const listTeamAssignees = () => request({ url: '/api/personal-todos/assignees', withSession: true })
const listTeamTodos = ({ startDate, endDate, assigneeId }) => {
  const assigneeQuery = assigneeId ? `&assigneeId=${encodeURIComponent(assigneeId)}` : ''
  return request({
    url: `/api/personal-todos/team?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}${assigneeQuery}`,
    withSession: true
  })
}

module.exports = {
  authenticate,
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
  listProjects,
  createProject,
  deleteProject,
  listAvailableProjects,
  listPersonalTodos,
  createPersonalTodo,
  listTeamAssignees,
  listTeamTodos
}
