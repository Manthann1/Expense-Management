"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User, Company } from "@/lib/types"
import { supportedCurrencies, getExchangeRate } from "@/lib/currency"

export default function AdminSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [settings, setSettings] = useState({
    currency: "USD",
    approvalThreshold: "1000",
    autoApprove: false,
  })

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
    const parsedCompany = companyData ? JSON.parse(companyData) : null
    setCompany(parsedCompany)

    if (parsedCompany) {
      setSettings({
        currency: parsedCompany.currency,
        approvalThreshold: parsedCompany.approvalThreshold?.toString() || "1000",
        autoApprove: parsedCompany.autoApprove || false,
      })
    }
  }, [router])

  const handleSave = () => {
    const updatedCompany = {
      ...company,
      currency: settings.currency,
      approvalThreshold: Number.parseFloat(settings.approvalThreshold),
      autoApprove: settings.autoApprove,
    }
    localStorage.setItem("company", JSON.stringify(updatedCompany))
    setCompany(updatedCompany)
    alert("Settings saved successfully!")
  }

  if (!user || !company) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Company Settings</h1>
          <p className="text-slate-600">Configure your expense management system</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="approval">Approval Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic company information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={company.name} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCurrencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    All expenses will be converted to this currency for reporting
                  </p>
                </div>

                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency">
            <Card>
              <CardHeader>
                <CardTitle>Currency Exchange Rates</CardTitle>
                <CardDescription>Current exchange rates relative to {company.currency}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportedCurrencies
                    .filter((curr) => curr.code !== company.currency)
                    .map((curr) => {
                      const rate = getExchangeRate(curr.code, company.currency)
                      return (
                        <div key={curr.code} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {curr.symbol} {curr.code}
                            </p>
                            <p className="text-sm text-slate-600">{curr.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              1 {curr.code} = {rate.toFixed(4)} {company.currency}
                            </p>
                            <p className="text-xs text-slate-500">Last updated: Today</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
                <p className="text-sm text-slate-500 mt-6">
                  Exchange rates are updated daily. In production, integrate with a live currency API for real-time
                  rates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval"></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
