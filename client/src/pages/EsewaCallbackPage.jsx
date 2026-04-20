import { useEffect } from "react"
import { useSearchParams, useNavigate, useParams } from "react-router-dom"
import { verifyEsewaPayment } from "../service/billService"

export default function EsewaCallbackPage({ type }) {
  const [searchParams]  = useSearchParams()
  const { tableNumber } = useParams()
  const navigate        = useNavigate()

  const goBack = (esewaResult, billId) => {
    const target = tableNumber ? `/customer/${tableNumber}` : "/"
    navigate(target, { replace: true, state: { esewaResult, billId: billId || null } })
  }

  useEffect(() => {
    if (type === "failure") {
      // eSewa redirected to the failure URL — payment was not completed
      const pendingBillId = sessionStorage.getItem(`pendingEsewaBillId_${tableNumber}`)
      goBack("failed", pendingBillId)
      return
    }

    const data = searchParams.get("data")
    if (!data) {
      const pendingBillId = sessionStorage.getItem(`pendingEsewaBillId_${tableNumber}`)
      goBack("failed", pendingBillId)
      return
    }

    verifyEsewaPayment(data)
      .then((res) => {
        const billId = res?.bill?._id || sessionStorage.getItem(`pendingEsewaBillId_${tableNumber}`)
        goBack("success", billId)
      })
      .catch(() => {
        const pendingBillId = sessionStorage.getItem(`pendingEsewaBillId_${tableNumber}`)
        goBack("failed", pendingBillId)
      })
  }, [])

  // Show spinner while verification is in progress (only reached for success type)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 border-4 border-gray-100 border-t-[#60BB46] rounded-full animate-spin mx-auto mb-5" />
        <div className="text-base font-bold text-gray-800">Verifying payment…</div>
        <div className="text-xs text-gray-400 mt-1">Please wait, do not close this page</div>
      </div>
    </div>
  )
}
