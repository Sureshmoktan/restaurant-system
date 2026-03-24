import { useSelector } from "react-redux"
import { Navigate }    from "react-router-dom"

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, accessToken } = useSelector((state) => state.auth)

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = {
      admin:   "/admin",
      cashier: "/cashier",
      kitchen: "/kitchen",
      bar:     "/bar",
    }
    return <Navigate to={redirectMap[user.role] || "/login"} replace />
  }

  return children
}