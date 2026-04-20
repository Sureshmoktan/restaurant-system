// client/src/service/discountGameService.js

import api from "./api"

export const fetchGameSettings = () =>
  api.get("/discount-game/settings").then((r) => r.data)

export const updateGameSettings = (data) =>
  api.put("/discount-game/settings", data).then((r) => r.data)

export const toggleGame = () =>
  api.put("/discount-game/toggle").then((r) => r.data)

export const spinWheel = (billId) =>
  api.post("/discount-game/spin", { billId }).then((r) => r.data)

export const fetchGameStats = () =>
  api.get("/discount-game/stats").then((r) => r.data)

export const fetchGameHistory = (params = {}) =>
  api.get("/discount-game/history", { params }).then((r) => r.data)

export const fetchPublicGameSettings = () =>
  api.get("/discount-game/public-settings").then((r) => r.data)
