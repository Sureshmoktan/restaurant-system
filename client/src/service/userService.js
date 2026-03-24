import api from "./api"

const userService = {
  // GET /api/users  — optional filters: { role, isActive }
  getAll: (params = {}) => api.get("/users", { params }),

  // GET /api/users/:id
  getById: (id) => api.get(`/users/${id}`),

  // POST /api/users
  create: (data) =>
    api.post("/users", {
      name:     data.name,
      email:    data.email,
      password: data.password,
      role:     data.role,
    }),

  // PUT /api/users/:id
  update: (id, data) =>
    api.put(`/users/${id}`, {
      name:     data.name,
      email:    data.email,
      role:     data.role,
      isActive: data.isActive,
    }),

  // PATCH /api/users/:id/toggle  — flip isActive
  toggle: (id) => api.patch(`/users/${id}/toggle`),

  // PATCH /api/users/:id/reset-password
  resetPassword: (id, newPassword) =>
    api.patch(`/users/${id}/reset-password`, { newPassword }),

  // DELETE /api/users/:id  — soft deactivate
  deactivate: (id) => api.delete(`/users/${id}`),

  // DELETE /api/users/:id/permanent
  deletePermanent: (id) => api.delete(`/users/${id}/permanent`),
}

export default userService