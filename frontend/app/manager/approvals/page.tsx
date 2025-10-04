"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PendingApprovals } from "@/components/manager/pending-approvals"
import { TeamExpenses } from "@/components/manager/team-expenses"
import type { User, Company } from "@/lib/types"

export default function ManagerApprovalsPage() {
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
    if (parsedUser.role !== "manager") {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Approval Dashboard</h1>
          <p className="text-slate-600">Review and approve expense claims from your team</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Approvals</CardDescription>
              <CardTitle className="text-3xl">8</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-600">Requires your action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved Today</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-600">{company.currency} 2,340</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Team Members</CardDescription>
              <CardTitle className="text-3xl">12</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Under your management</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-3xl">{company.currency} 18,450</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Total team expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="team">Team Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingApprovals user={user} company={company} />
          </TabsContent>

          <TabsContent value="team">
            <TeamExpenses user={user} company={company} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
