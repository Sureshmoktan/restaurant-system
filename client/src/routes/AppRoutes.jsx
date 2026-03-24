import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute   from "./ProtectedRoute"
import Login            from "../pages/LoginPage"
import DoorDisplay      from "../pages/DoorDisplayPage"
import CustomerTablet   from "../pages/CustomerTabletPage"
import KitchenDisplay   from "../pages/KitchenDisplayPage"
import CashierPanel     from "../pages/CashierPanelPage"
import Dashboard        from "../pages/admin/Dashboard"
import MenuManagement   from "../pages/admin/MenuManagement"
import TableManagement  from "../pages/admin/TableManagement"
import UserManagement   from "../pages/admin/UserManagement"
import BillPage         from "../pages/admin/BillPage"
import BarDisplay from "../pages/BarDisplayPage"



export default function AppRoutes() {
  return (
    <Routes>
      {/* public routes */}
      <Route path="/login"              element={<Login />} />
      <Route path="/"                   element={<DoorDisplay />} />
      <Route path="/customer/:tableNumber" element={<CustomerTablet />} />

      {/* kitchen */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={["kitchen", "admin"]}>
            <KitchenDisplay />
          </ProtectedRoute>
        }
      />
      
      <Route path="/bar" element={
        <ProtectedRoute allowedRoles={["bar", "admin"]}>
          <BarDisplay />
        </ProtectedRoute>
      } />

      {/* cashier */}
      <Route
        path="/cashier"
        element={
          <ProtectedRoute allowedRoles={["cashier", "admin"]}>
            <CashierPanel />
          </ProtectedRoute>
        }
      />

      {/* admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <MenuManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tables"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <TableManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bills"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <BillPage />
          </ProtectedRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}