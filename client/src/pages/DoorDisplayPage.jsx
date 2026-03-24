import { useEffect, useState } from "react"
import { fetchTables } from "../service/tableService"
import { fetchMenu }   from "../service/menuService"
import useSocket       from "../hooks/useSocket"

const TABLE_STYLES = {
  available: { card: "border-green-300 bg-green-50",  num: "text-green-700", sub: "text-green-500", badge: "bg-green-100 text-green-700" },
  occupied:  { card: "border-red-300 bg-red-50",      num: "text-red-600",   sub: "text-red-400",   badge: "bg-red-100 text-red-600"     },
  billed:    { card: "border-yellow-300 bg-yellow-50",num: "text-yellow-700",sub: "text-yellow-500",badge: "bg-yellow-100 text-yellow-700"},
}

export default function DoorDisplay() {
  const [tables,   setTables]   = useState([])
  const [specials, setSpecials] = useState([])
  const [time,     setTime]     = useState(new Date())

  const loadData = async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetchTables(),
        fetchMenu({ isAvailable: true }),
      ])
      setTables(tRes.tables   || [])
      setSpecials((mRes.menu  || []).slice(0, 3))
    } catch {}
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useSocket({
    "table-status-update": () => loadData(),
    "new-order":           () => loadData(),
  })

  const available = tables.filter((t) => t.status === "available").length
  const occupied  = tables.filter((t) => t.status === "occupied").length
  const billed    = tables.filter((t) => t.status === "billed").length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* top bar */}
      <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🏔</div>
          <div>
            <div className="text-white font-semibold text-lg leading-tight">Himalaya Kitchen</div>
            <div className="text-green-100 text-xs">हिमालय किचन — Thamel, Kathmandu</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-semibold text-xl">
            {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-green-100 text-xs">
            {time.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })}
          </div>
        </div>
      </div>

      {/* ticker */}
      <div className="bg-green-700 px-6 py-2 overflow-hidden">
        <div className="flex gap-12 animate-pulse">
          <span className="text-green-100 text-sm whitespace-nowrap">
            🎉 Welcome! &nbsp;|&nbsp; 💳 We accept eSewa & Khalti &nbsp;|&nbsp; 📱 Scan QR on table to order &nbsp;|&nbsp; ✨ Free dessert on orders above Rs. 1500
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* left — tables */}
        <div className="lg:col-span-2 space-y-4">

          {/* summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-700">{available}</div>
              <div className="text-xs text-green-600 mt-1">Available</div>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-200">
              <div className="text-3xl font-bold text-red-600">{occupied}</div>
              <div className="text-xs text-red-500 mt-1">Occupied</div>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-4 text-center border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">{billed}</div>
              <div className="text-xs text-yellow-600 mt-1">Billing soon</div>
            </div>
          </div>

          {/* legend */}
          <div className="flex gap-4 flex-wrap">
            {[
              { label: "Available", color: "bg-green-400"  },
              { label: "Occupied",  color: "bg-red-400"    },
              { label: "Billing",   color: "bg-yellow-400" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className={`w-3 h-3 rounded-sm ${l.color}`}></div>
                {l.label}
              </div>
            ))}
          </div>

          {/* table grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {tables.sort((a, b) => a.tableNumber - b.tableNumber).map((table) => {
  // add fallback here ✅
  const s = TABLE_STYLES[table.status] || TABLE_STYLES["available"]
  return (
    <div key={table._id} className={`rounded-2xl border-2 p-3 text-center ${s.card}`}>
      <div className={`text-xl font-bold ${s.num}`}>T{table.tableNumber}</div>
      <div className={`text-xs mt-0.5 ${s.sub}`}>{table.capacity} seats</div>
      <div className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block capitalize ${s.badge}`}>
        {table.status}
      </div>
    </div>
  )
})}
          </div>
        </div>

        {/* right — info */}
        <div className="space-y-4">

          {/* queue */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="text-xs text-gray-400 mb-1">Est. wait time</div>
            <div className="text-4xl font-bold text-green-600">
              {available > 0 ? "Now" : "~10 min"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {available > 0 ? `${available} table(s) ready` : "All tables occupied"}
            </div>
          </div>

          {/* today's specials */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Today's highlights</div>
            <div className="space-y-3">
              {specials.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">Loading...</div>
              ) : specials.map((item) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🍽</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                    <div className="text-xs text-green-600 font-medium">Rs. {item.price}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${item.isVeg ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {item.isVeg ? "Veg" : "Non-veg"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* payments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">We accept</div>
            <div className="space-y-2">
              {[
                { icon: "📱", label: "eSewa",  color: "bg-green-50 text-green-700"  },
                { icon: "📱", label: "Khalti", color: "bg-purple-50 text-purple-700"},
                { icon: "💵", label: "Cash",   color: "bg-gray-50 text-gray-600"    },
              ].map((p) => (
                <div key={p.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${p.color}`}>
                  <span>{p.icon}</span>{p.label}
                </div>
              ))}
            </div>
          </div>

          {/* hours */}
          <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
            <div className="text-xs text-green-500 mb-1">Opening hours</div>
            <div className="text-sm font-semibold text-green-700">10:00 AM — 10:00 PM</div>
            <div className="text-xs text-green-500 mt-1">Open now 🟢</div>
          </div>

        </div>
      </div>

      {/* bottom bar */}
      <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-400">
        <span>WiFi: HimalayaKitchen &nbsp;|&nbsp; Password: himalaya2026</span>
        <span>Please wait to be seated or ask our staff</span>
      </div>
    </div>
  )
}