"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  LogOut,
  Plus,
  Search,
  Settings,
  Bell,
  Menu,
  X,
  ChevronRight,
  Calendar,
  Tag,
  User,
  CreditCard,
  AlertCircle,
} from "lucide-react"

// API Configuration
const API_BASE_URL = "http://localhost:3000/api"

// Demo credentials for testing
const DEMO_CREDENTIALS = {
  admin: { email: "admin@company.com", password: "admin123" },
  manager: { email: "manager@company.com", password: "manager123" },
  employee: { email: "employee@company.com", password: "employee123" },
}

// Utility Functions
const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null)
const getUser = () => (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {})
const setAuth = (token: string, user: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
  }
}
const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }
}

// API Service
const api = {
  async request(endpoint: string, options: any = {}) {
    const token = getAuthToken()
    const headers: any = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || "Request failed")
    return data
  },

  auth: {
    register: (data: any) => api.request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: any) => api.request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  },

  users: {
    create: (data: any) => api.request("/users", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => api.request("/users"),
    update: (id: number, data: any) => api.request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    getManagers: () => api.request("/users/managers"),
  },

  expenses: {
    create: (data: any) => api.request("/expenses", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => api.request("/expenses"),
    getById: (id: number) => api.request(`/expenses/${id}`),
    getStats: () => api.request("/expenses/stats"),
  },

  approvals: {
    getPending: () => api.request("/approvals/pending"),
    approve: (id: number, comments: string) =>
      api.request(`/approvals/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ comments }),
      }),
    reject: (id: number, comments: string) =>
      api.request(`/approvals/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ comments }),
      }),
  },

  categories: {
    getAll: () => api.request("/categories"),
    create: (data: any) => api.request("/categories", { method: "POST", body: JSON.stringify(data) }),
  },

  currencies: {
    getRates: () => api.request("/currencies/rates"),
  },
}

// Main App Component
export default function ExpenseManagementApp() {
  const [currentView, setCurrentView] = useState("login")
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    const savedUser = getUser()
    if (token && savedUser.id) {
      setUser(savedUser)
      setCurrentView("dashboard")
    }
  }, [])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    setCurrentView("login")
    showSuccess("Logged out successfully")
  }

  const showError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(""), 5000)
  }

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 5000)
  }

  if (!user) {
    return (
      <AuthScreen
        onLogin={(userData) => {
          setUser(userData)
          setCurrentView("dashboard")
        }}
        showError={showError}
        showSuccess={showSuccess}
      />
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-8 h-8" />
              <span className="font-bold text-lg">ExpenseHub</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-700 rounded-lg">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton
            icon={<TrendingUp />}
            text="Dashboard"
            active={currentView === "dashboard"}
            onClick={() => setCurrentView("dashboard")}
            collapsed={!sidebarOpen}
          />
          <SidebarButton
            icon={<FileText />}
            text="My Expenses"
            active={currentView === "expenses"}
            onClick={() => setCurrentView("expenses")}
            collapsed={!sidebarOpen}
          />
          {(user.role === "Manager" || user.role === "Admin") && (
            <SidebarButton
              icon={<CheckCircle />}
              text="Approvals"
              active={currentView === "approvals"}
              onClick={() => setCurrentView("approvals")}
              collapsed={!sidebarOpen}
            />
          )}
          {user.role === "Admin" && (
            <>
              <SidebarButton
                icon={<Users />}
                text="Team"
                active={currentView === "users"}
                onClick={() => setCurrentView("users")}
                collapsed={!sidebarOpen}
              />
              <SidebarButton
                icon={<Settings />}
                text="Settings"
                active={currentView === "settings"}
                onClick={() => setCurrentView("settings")}
                collapsed={!sidebarOpen}
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-blue-700">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-blue-300 truncate">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full p-2 hover:bg-blue-700 rounded-lg">
              <LogOut className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {currentView === "dashboard" && "Dashboard"}
              {currentView === "expenses" && "My Expenses"}
              {currentView === "approvals" && "Pending Approvals"}
              {currentView === "users" && "Team Management"}
              {currentView === "settings" && "Settings"}
            </h1>
            <p className="text-sm text-gray-500">Welcome back, {user.firstName}!</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{user.currency || "USD"}</span>
            </div>
          </div>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4">
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4">
            <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {currentView === "dashboard" && (
            <Dashboard user={user} showError={showError} setCurrentView={setCurrentView} />
          )}
          {currentView === "expenses" && <ExpensesView user={user} showError={showError} showSuccess={showSuccess} />}
          {currentView === "approvals" && <ApprovalsView user={user} showError={showError} showSuccess={showSuccess} />}
          {currentView === "users" && <UsersView showError={showError} showSuccess={showSuccess} />}
          {currentView === "settings" && <SettingsView user={user} showError={showError} showSuccess={showSuccess} />}
        </main>
      </div>
    </div>
  )
}

// Sidebar Button Component
function SidebarButton({ icon, text, active, onClick, collapsed, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
        active ? "bg-blue-700 shadow-lg" : "hover:bg-blue-700/50"
      }`}
    >
      <div className="w-5 h-5 flex-shrink-0">{icon}</div>
      {!collapsed && (
        <>
          <span className="flex-1 text-left font-medium">{text}</span>
          {badge && <span className="px-2 py-0.5 bg-red-500 text-xs font-bold rounded-full">{badge}</span>}
        </>
      )}
    </button>
  )
}

// Auth Screen Component
function AuthScreen({ onLogin, showError, showSuccess }: any) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    companyName: "",
    country: "United States",
  })

  const handleDemoLogin = async (role: "admin" | "manager" | "employee") => {
    const credentials = DEMO_CREDENTIALS[role]
    setFormData({ ...formData, email: credentials.email, password: credentials.password })

    setLoading(true)
    try {
      const result = await api.auth.login(credentials)
      setAuth(result.token, result.user)
      onLogin(result.user)
      showSuccess(`Welcome back, ${role}!`)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = isLogin
        ? await api.auth.login({ email: formData.email, password: formData.password })
        : await api.auth.register(formData)

      setAuth(result.token, result.user)
      onLogin(result.user)
      showSuccess(isLogin ? "Welcome back!" : "Account created successfully!")
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-10 h-10" />
            <h2 className="text-3xl font-bold">ExpenseHub</h2>
          </div>
          <p className="text-blue-100">{isLogin ? "Sign in to your account" : "Create your company account"}</p>
        </div>

        {/* Demo Credentials Section */}
        {isLogin && (
          <div className="px-8 pt-6 pb-4 bg-blue-50 border-b">
            <p className="text-sm font-semibold text-gray-700 mb-3">Quick Demo Login:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoLogin("admin")}
                className="px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition"
              >
                Admin
              </button>
              <button
                onClick={() => handleDemoLogin("manager")}
                className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition"
              >
                Manager
              </button>
              <button
                onClick={() => handleDemoLogin("employee")}
                className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Employee
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>India</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Germany</option>
                  <option>France</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 shadow-lg"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component
function Dashboard({ user, showError, setCurrentView }: any) {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 })
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const result = await api.expenses.getAll()
      const expenseList = result.expenses || []
      setExpenses(expenseList.slice(0, 5))

      const totalAmount = expenseList.reduce(
        (sum: number, e: any) => sum + Number.parseFloat(e.converted_amount || e.amount || 0),
        0,
      )

      setStats({
        total: expenseList.length,
        pending: expenseList.filter((e: any) => e.status === "Pending").length,
        approved: expenseList.filter((e: any) => e.status === "Approved").length,
        rejected: expenseList.filter((e: any) => e.status === "Rejected").length,
        totalAmount,
      })
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={stats.total}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          trend="+12%"
        />
        <StatCard title="Pending Approval" value={stats.pending} icon={<Clock className="w-6 h-6" />} color="yellow" />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Total Amount"
          value={`${user.currency} ${stats.totalAmount.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
          isAmount
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Recent Expenses</h3>
              <button
                onClick={() => setCurrentView("expenses")}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No expenses yet</p>
                <button
                  onClick={() => setCurrentView("expenses")}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create First Expense
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense: any) => (
                  <ExpenseCard key={expense.id} expense={expense} compact />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setCurrentView("expenses")}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg font-medium transition flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                Submit New Expense
              </button>
              {(user.role === "Manager" || user.role === "Admin") && (
                <button
                  onClick={() => setCurrentView("approvals")}
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg font-medium transition flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5" />
                  Review Approvals
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Breakdown</h3>
            <div className="space-y-3">
              <BreakdownItem label="Travel" value={35} color="blue" />
              <BreakdownItem label="Food & Dining" value={25} color="green" />
              <BreakdownItem label="Office Supplies" value={20} color="yellow" />
              <BreakdownItem label="Other" value={20} color="gray" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, icon, color, trend, isAmount }: any) {
  const colors: any = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colors[color]} text-white`}>{icon}</div>
        {trend && <span className="text-green-600 text-sm font-medium">{trend}</span>}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">
        {isAmount ? value : typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  )
}

// Breakdown Item Component
function BreakdownItem({ label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-400",
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colors[color]} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}

// Expense Card Component
function ExpenseCard({ expense, compact }: any) {
  const statusColors: any = {
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Approved: "bg-green-100 text-green-800 border-green-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
    Processing: "bg-blue-100 text-blue-800 border-blue-200",
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-800">{expense.category_name || "Uncategorized"}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[expense.status]}`}>
              {expense.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(expense.expense_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {expense.first_name} {expense.last_name}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-800">
            {expense.currency} {Number.parseFloat(expense.amount).toFixed(2)}
          </p>
          {expense.converted_amount && expense.currency !== expense.company_currency && (
            <p className="text-xs text-gray-500">
              ≈ {expense.company_currency} {Number.parseFloat(expense.converted_amount).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Expenses View Component
function ExpensesView({ user, showError, showSuccess }: any) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [expensesData, categoriesData] = await Promise.all([api.expenses.getAll(), api.categories.getAll()])
      setExpenses(expensesData.expenses || [])
      setCategories(categoriesData.categories || [])
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter((expense: any) => {
    const matchesFilter = filter === "all" || expense.status === filter
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.category_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          New Expense
        </button>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No expenses found</p>
            <p className="text-gray-400 text-sm mb-6">Create your first expense to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Expense
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {filteredExpenses.map((expense: any) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseFormModal
          categories={categories}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadData()
            showSuccess("Expense created successfully!")
          }}
          showError={showError}
        />
      )}
    </div>
  )
}

// Expense Form Modal Component
function ExpenseFormModal({ categories, onClose, onSuccess, showError }: any) {
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    currency: "USD",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
    receipt_url: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.expenses.create(formData)
      onSuccess()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Create New Expense</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt URL (optional)</label>
            <input
              type="url"
              value={formData.receipt_url}
              onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Approvals View Component
function ApprovalsView({ user, showError, showSuccess }: any) {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<any>(null)

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = async () => {
    try {
      const result = await api.approvals.getPending()
      setApprovals(result.expenses || [])
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await api.approvals.approve(id, "Approved")
      showSuccess("Expense approved successfully!")
      loadApprovals()
      setSelectedExpense(null)
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await api.approvals.reject(id, "Rejected")
      showSuccess("Expense rejected")
      loadApprovals()
      setSelectedExpense(null)
    } catch (err: any) {
      showError(err.message)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border">
        {approvals.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No pending approvals</p>
            <p className="text-gray-400 text-sm">All expenses have been reviewed</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {approvals.map((expense: any) => (
              <div key={expense.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-800">{expense.category_name}</span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {expense.first_name} {expense.last_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800 mb-3">
                      {expense.currency} {Number.parseFloat(expense.amount).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(expense.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(expense.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Users View Component
function UsersView({ showError, showSuccess }: any) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const result = await api.users.getAll()
      setUsers(result.users || [])
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Team Members</h2>
          <p className="text-gray-500">Manage your organization's users</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            loadUsers()
            showSuccess("User created successfully!")
          }}
          showError={showError}
        />
      )}
    </div>
  )
}

// User Form Modal Component
function UserFormModal({ onClose, onSuccess, showError }: any) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "Employee",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.users.create(formData)
      onSuccess()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Add New User</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Employee</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Settings View Component
function SettingsView({ user, showError, showSuccess }: any) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const result = await api.categories.getAll()
      setCategories(result.categories || [])
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Categories</h3>
        <div className="space-y-2 mb-4">
          {categories.map((cat: any) => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">{cat.name}</span>
              <span className="text-sm text-gray-500">{cat.description}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowCategoryForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {showCategoryForm && (
        <CategoryFormModal
          onClose={() => setShowCategoryForm(false)}
          onSuccess={() => {
            setShowCategoryForm(false)
            loadCategories()
            showSuccess("Category created successfully!")
          }}
          showError={showError}
        />
      )}
    </div>
  )
}

// Category Form Modal Component
function CategoryFormModal({ onClose, onSuccess, showError }: any) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.categories.create(formData)
      onSuccess()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">Add New Category</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
