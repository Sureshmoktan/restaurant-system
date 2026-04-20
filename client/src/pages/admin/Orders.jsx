import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../service/api"

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  cooking: "bg-orange-100 text-orange-700",
  ready: "bg-blue-100 text-blue-700",
  served: "bg-emerald-100 text-emerald-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  billed: "bg-slate-100 text-slate-700",
}

const STATUS_ICONS = {
  pending: "⏳",
  cooking: "🍳",
  ready: "🔔",
  served: "✅",
  completed: "✅",
  cancelled: "❌",
  billed: "💰",
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading orders...</span>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, orderId, isBulk = false, count = 0 }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {isBulk ? `Delete ${count} Orders?` : "Delete Order?"}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {isBulk 
              ? `Are you sure you want to delete ${count} orders? This action cannot be undone.`
              : "Are you sure you want to delete this order? This action cannot be undone."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(isBulk ? null : orderId)}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition"
            >
              Delete {isBulk ? "All" : "Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrders, setSelectedOrders] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [isBulkDelete, setIsBulkDelete] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000)
  }

  // ✅ FETCH ALL ORDERS FROM DATABASE
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get("/orders/admin/all")
      console.log("Fetched orders:", res.data)
      setOrders(res.data.orders || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      showToast("Failed to load orders", "error")
    } finally {
      setLoading(false)
    }
  }

  // ✅ DELETE SINGLE ORDER
  const handleDeleteOrder = async (orderId) => {
    try {
      await api.delete(`/orders/admin/${orderId}`)
      showToast("Order deleted successfully", "success")
      fetchOrders() // Refresh the list
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
    } catch (error) {
      console.error("Error deleting order:", error)
      showToast("Failed to delete order", "error")
    } finally {
      setShowDeleteModal(false)
      setDeletingId(null)
    }
  }

  // ✅ BULK DELETE ORDERS
  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return
    
    try {
      await api.delete("/orders/admin/bulk", { data: { orderIds: selectedOrders } })
      showToast(`${selectedOrders.length} orders deleted successfully`, "success")
      fetchOrders() // Refresh the list
      setSelectedOrders([])
    } catch (error) {
      console.error("Error bulk deleting orders:", error)
      showToast("Failed to delete orders", "error")
    } finally {
      setShowDeleteModal(false)
      setIsBulkDelete(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(order => order._id))
    }
  }

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId))
    } else {
      setSelectedOrders([...selectedOrders, orderId])
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders by search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || (
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchTerm)
    )
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    cooking: orders.filter(o => o.status === "cooking").length,
    ready: orders.filter(o => o.status === "ready").length,
    served: orders.filter(o => o.status === "served").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg ${
          toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📋</span>
              <h1 className="text-2xl font-bold text-white">Orders Management</h1>
            </div>
            <p className="text-slate-400 text-sm">View, manage, and delete customer orders</p>
          </div>
          {selectedOrders.length > 0 && (
            <button
              onClick={() => {
                setIsBulkDelete(true)
                setShowDeleteModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition"
            >
              🗑️ Delete Selected ({selectedOrders.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Total Orders</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-xs text-slate-400 mt-1">Pending</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.cooking}</div>
          <div className="text-xs text-slate-400 mt-1">Cooking</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.ready}</div>
          <div className="text-xs text-slate-400 mt-1">Ready</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.served}</div>
          <div className="text-xs text-slate-400 mt-1">Served</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-xs text-slate-400 mt-1">Cancelled</div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-600 font-semibold uppercase">Total Revenue</div>
            <div className="text-2xl font-bold text-emerald-700">Rs. {stats.totalRevenue.toLocaleString()}</div>
          </div>
          <div className="text-3xl">💰</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by Order ID or Table Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="cooking">Cooking</option>
            <option value="ready">Ready</option>
            <option value="served">Served</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <div className="text-5xl mb-4 opacity-30">📋</div>
            <div className="text-sm font-medium text-slate-400">No orders found</div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-xs text-emerald-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Order ID</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Table</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Items</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Total</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Time</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => handleSelectOrder(order._id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-semibold text-slate-600">
                          #{order._id?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-700">
                          Table {order.tableNumber || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700">
                          {order.items?.length || 0} items
                        </div>
                        <div className="text-xs text-slate-400">
                          {order.items?.slice(0, 2).map(i => i.name).join(", ")}
                          {order.items?.length > 2 && ` +${order.items.length - 2}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-800">
                          Rs. {order.totalAmount?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>
                          {STATUS_ICONS[order.status]} {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setDeletingId(order._id)
                            setIsBulkDelete(false)
                            setShowDeleteModal(true)
                          }}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Order"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredOrders.length} of {orders.length} orders</span>
              <button onClick={fetchOrders} className="text-emerald-600 hover:underline">Refresh</button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingId(null)
          setIsBulkDelete(false)
        }}
        onConfirm={isBulkDelete ? handleBulkDelete : handleDeleteOrder}
        orderId={deletingId}
        isBulk={isBulkDelete}
        count={selectedOrders.length}
      />
    </div>
  )
}