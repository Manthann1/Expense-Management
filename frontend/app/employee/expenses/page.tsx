"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmitExpense } from "@/components/employee/submit-expense"
import { ExpenseHistory } from "@/components/employee/expense-history"
import type { User, Company } from "@/lib/types"

export default function EmployeeExpensesPage() {
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
    if (parsedUser.role !== "employee") {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Expenses</h1>
          <p className="text-slate-600">Submit new expenses and track your reimbursement status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Approval</CardDescription>
              <CardTitle className="text-3xl">3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Awaiting manager review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved This Month</CardDescription>
              <CardTitle className="text-3xl">{company.currency} 1,450</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-600">5 expenses approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Submitted</CardDescription>
              <CardTitle className="text-3xl">12</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submit">Submit Expense</TabsTrigger>
            <TabsTrigger value="history">Expense History</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <SubmitExpense user={user} company={company} />
          </TabsContent>

          <TabsContent value="history">
            <ExpenseHistory user={user} company={company} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
