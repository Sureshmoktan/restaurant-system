// src/service/billService.js

import api from "./api"

export const generateBill = async (billData) => {
  const res = await api.post("/bills", billData)
  return res.data
}

// For cashier/admin - gets latest bill (including paid)
export const fetchBillByTable = async (tableNumber) => {
  const res = await api.get(`/bills/table/${tableNumber}`)
  return res.data
}

// For customer - gets ONLY current unpaid bill
export const fetchCurrentBillByTable = async (tableNumber) => {
  const res = await api.get(`/bills/table/${tableNumber}/current`)
  return res.data
}

// Customer requests a new bill
export const requestCustomerBill = async (tableNumber) => {
  const res = await api.post("/bills/request", { tableNumber })
  return res.data
}

// Customer gets bill by ID
export const fetchCustomerBillById = async (id) => {
  const res = await api.get(`/bills/${id}/customer`)
  return res.data
}

export const processPayment = async (id, { paymentMethod, tipAmount = 0 }) => {
  const res = await api.patch(`/bills/${id}/pay`, { paymentMethod, tipAmount })
  return res.data
}

export const initiateEsewaPayment = async (billId) => {
  const res = await api.post(`/bills/${billId}/esewa/initiate`)
  return res.data
}

export const verifyEsewaPayment = async (data) => {
  const res = await api.post("/bills/esewa/verify", { data })
  return res.data
}

export const applyCashierDiscount = async (billId, { discountPercent, reason = "", note = "" }) => {
  const res = await api.put(`/bills/${billId}/cashier-discount`, { discountPercent, reason, note })
  return res.data
}

// Enable or disable the discount game for a table's current unpaid bill
export const enableTableGame = async (tableNumber, enabled) => {
  const res = await api.put(`/bills/table/${tableNumber}/game-enable`, { enabled })
  return res.data
}