"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersManagement } from "@/components/admin/users-management"
import { ApprovalRulesManagement } from "@/components/admin/approval-rules-management"
import { ExpensesOverview } from "@/components/admin/expenses-overview"
import type { User, Company } from "@/lib/types"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const companyData = localStorage.getItem("company")

    if (!userData) {
      router.push("/auth/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/auth/login")
      return
    }

    setUser(parsedUser)
    setCompany(companyData ? JSON.parse(companyData) : null)
  }, [router])

  if (!user || !company) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">
            Manage users, configure approval workflows, and oversee all expenses for {company.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Employees</CardDescription>
              <CardTitle className="text-3xl">24</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">+2 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Approvals</CardDescription>
              <CardTitle className="text-3xl">12</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Across all managers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{company.currency} 45,230</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-600">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approval Rules</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Active workflows</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="approval-rules">Approval Rules</TabsTrigger>
            <TabsTrigger value="expenses">All Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersManagement company={company} />
          </TabsContent>

          <TabsContent value="approval-rules">
            <ApprovalRulesManagement company={company} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesOverview company={company} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
