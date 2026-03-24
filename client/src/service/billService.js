import api from "./api"

export const generateBill = async (billData) => {
  const res = await api.post("/bills", billData)
  return res.data
}

export const fetchBillByTable = async (tableNumber) => {
  const res = await api.get(`/bills/table/${tableNumber}`)
  return res.data
}

export const processPayment = async (id, { paymentMethod, tipAmount = 0 }) => {
  const res = await api.patch(`/bills/${id}/pay`, { paymentMethod, tipAmount })
  return res.data
}