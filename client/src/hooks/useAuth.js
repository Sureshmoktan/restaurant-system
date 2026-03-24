import { useSelector, useDispatch } from "react-redux"
import { useNavigate }              from "react-router-dom"
import { logout }                   from "../features/authSlice"
import { logoutUser }               from "../service/authService"

export default function useAuth() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { user, accessToken, isLoading } = useSelector((state) => state.auth)

  const isAuthenticated = !!accessToken && !!user
  const isAdmin         = user?.role === "admin"
  const isCashier       = user?.role === "cashier"
  const isKitchen       = user?.role === "kitchen"

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // silent fail
    } finally {
      dispatch(logout())
      navigate("/login")
    }
  }

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    isAdmin,
    isCashier,
    isKitchen,
    handleLogout,
  }
}