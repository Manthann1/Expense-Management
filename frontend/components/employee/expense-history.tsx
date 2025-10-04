"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { User, Company, Expense } from "@/lib/types"

interface ExpenseHistoryProps {
  user: User
  company: Company
}

export function ExpenseHistory({ user, company }: ExpenseHistoryProps) {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [expenses] = useState<Expense[]>([
    {
      id: "1",
      employeeId: user.id,
      employeeName: user.name,
      amount: 250,
      currency: "USD",
      convertedAmount: 250,
      category: "Travel",
      description: "Client meeting transportation - Uber ride to downtown office",
      date: "2025-01-15",
      status: "pending",
      currentApproverId: "2",
      approvalHistory: [
        {
          approverId: "2",
          approverName: "Sarah Manager",
          action: "pending",
          sequence: 1,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "2",
      employeeId: user.id,
      employeeName: user.name,
      amount: 1200,
      currency: "USD",
      convertedAmount: 1200,
      category: "Equipment",
      description: "New laptop for development work",
      date: "2025-01-10",
      status: "approved",
      approvalHistory: [
        {
          approverId: "2",
          approverName: "Sarah Manager",
          action: "approved",
          sequence: 1,
          timestamp: "2025-01-11T09:00:00Z",
          comment: "Approved - necessary for project work",
        },
        {
          approverId: "1",
          approverName: "John Doe (CFO)",
          action: "approved",
          sequence: 2,
          timestamp: "2025-01-11T14:00:00Z",
          comment: "Approved for Q1 budget",
        },
      ],
      createdAt: "2025-01-10T08:00:00Z",
    },
    {
      id: "3",
      employeeId: user.id,
      employeeName: user.name,
      amount: 85,
      currency: "USD",
      convertedAmount: 85,
      category: "Meals",
      description: "Team lunch at Italian restaurant",
      date: "2025-01-08",
      status: "rejected",
      approvalHistory: [
        {
          approverId: "2",
          approverName: "Sarah Manager",
          action: "rejected",
          sequence: 1,
          timestamp: "2025-01-09T10:00:00Z",
          comment: "Not a business expense - personal meal",
        },
      ],
      createdAt: "2025-01-08T15:00:00Z",
    },
    {
      id: "4",
      employeeId: user.id,
      employeeName: user.name,
      amount: 450,
      currency: "EUR",
      convertedAmount: 495,
      category: "Travel",
      description: "Flight to Berlin for conference",
      date: "2025-01-05",
      status: "approved",
      approvalHistory: [
        {
          approverId: "2",
          approverName: "Sarah Manager",
          action: "approved",
          sequence: 1,
          timestamp: "2025-01-06T11:00:00Z",
        },
      ],
      createdAt: "2025-01-05T09:00:00Z",
    },
  ])

  const getStatusBadge = (status: Expense["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Expense History</CardTitle>
          <CardDescription>View all your submitted expenses and their approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{expense.description}</h3>
                        {getStatusBadge(expense.status)}
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Amount</p>
                          <p className="font-medium">
                            {expense.currency} {expense.amount.toFixed(2)}
                            {expense.currency !== company.currency && (
                              <span className="text-slate-500 text-xs block">
                                ({company.currency} {expense.convertedAmount?.toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Category</p>
                          <p className="font-medium">{expense.category}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Date</p>
                          <p className="font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Submitted</p>
                          <p className="font-medium">{new Date(expense.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedExpense(expense)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Details Dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>Complete information about this expense claim</DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Amount</p>
                  <p className="text-lg font-semibold">
                    {selectedExpense.currency} {selectedExpense.amount.toFixed(2)}
                  </p>
                  {selectedExpense.currency !== company.currency && (
                    <p className="text-sm text-slate-600">
                      Converted: {company.currency} {selectedExpense.convertedAmount?.toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  {getStatusBadge(selectedExpense.status)}
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Category</p>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-1">Description</p>
                <p className="text-slate-900">{selectedExpense.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-900 mb-3">Approval History</p>
                <div className="space-y-3">
                  {selectedExpense.approvalHistory.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-700">{step.sequence}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{step.approverName}</p>
                          {step.action === "approved" && (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>
                          )}
                          {step.action === "rejected" && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>
                          )}
                          {step.action === "pending" && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
                          )}
                        </div>
                        {step.timestamp && (
                          <p className="text-xs text-slate-500 mb-1">{new Date(step.timestamp).toLocaleString()}</p>
                        )}
                        {step.comment && <p className="text-sm text-slate-600 italic">"{step.comment}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
