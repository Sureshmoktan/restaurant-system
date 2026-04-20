import { Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute      from "./ProtectedRoute"
import Login               from "../pages/LoginPage"
import DoorDisplay         from "../pages/DoorDisplayPage"
import CustomerTablet      from "../pages/CustomerTabletPage"
import KitchenDisplay      from "../pages/KitchenDisplayPage"
import CashierPanel        from "../pages/CashierPanelPage"
import Dashboard           from "../pages/admin/Dashboard"
import MenuManagement      from "../pages/admin/MenuManagement"
import TableManagement     from "../pages/admin/TableManagement"
import UserManagement      from "../pages/admin/UserManagement"
import BillPage            from "../pages/admin/BillPage"
import OffersPage          from "../pages/admin/OfferPage"
import BarDisplay          from "../pages/BarDisplayPage"
import ForecastPage           from "../pages/admin/ForecastPage"
import Orders                 from "../pages/admin/Orders"
import EsewaCallbackPage      from "../pages/EsewaCallbackPage"
import IngredientManagement   from "../pages/admin/IngredientManagement"
import PurchaseManagement     from "../pages/admin/PurchaseManagement"
import WasteManagement           from "../pages/admin/WasteManagement"
import InventoryAnalyticsPage   from "../pages/admin/InventoryAnalyticsPage"
import FeedbackManagement        from "../pages/admin/FeedbackManagement"
import DiscountGameSettings      from "../pages/admin/DiscountGameSettings"
import AuditLogPage             from "../pages/admin/AuditLogPage"





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
      <Route
        path="/admin/offers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <OffersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/forecast"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ForecastPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Orders/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ingredients"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <IngredientManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/purchases"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PurchaseManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/waste"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <WasteManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory-analytics"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <InventoryAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/feedback"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <FeedbackManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/discount-game"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DiscountGameSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-log"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />

      {/* eSewa payment callbacks — public, includes tableNumber for redirect back */}
      <Route path="/esewa/success/:tableNumber" element={<EsewaCallbackPage type="success" />} />
      <Route path="/esewa/failure/:tableNumber" element={<EsewaCallbackPage type="failure" />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}