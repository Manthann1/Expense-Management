"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { User, Company, Expense } from "@/lib/types"

interface PendingApprovalsProps {
  user: User
  company: Company
}

export function PendingApprovals({ user, company }: PendingApprovalsProps) {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      employeeId: "3",
      employeeName: "Mike Employee",
      amount: 250,
      currency: "USD",
      convertedAmount: 250,
      category: "Travel",
      description: "Client meeting transportation - Uber ride to downtown office for Q1 presentation",
      date: "2025-01-15",
      status: "pending",
      currentApproverId: user.id,
      approvalHistory: [
        {
          approverId: user.id,
          approverName: user.name,
          action: "pending",
          sequence: 1,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "5",
      employeeId: "4",
      employeeName: "Jane Developer",
      amount: 89,
      currency: "USD",
      convertedAmount: 89,
      category: "Software",
      description: "Annual subscription to design tools (Figma Pro)",
      date: "2025-01-14",
      status: "pending",
      currentApproverId: user.id,
      approvalHistory: [
        {
          approverId: user.id,
          approverName: user.name,
          action: "pending",
          sequence: 1,
        },
      ],
      createdAt: "2025-01-14T14:30:00Z",
    },
    {
      id: "6",
      employeeId: "3",
      employeeName: "Mike Employee",
      amount: 450,
      currency: "EUR",
      convertedAmount: 495,
      category: "Travel",
      description: "Flight tickets to Berlin for tech conference - includes baggage fees",
      date: "2025-01-13",
      status: "pending",
      currentApproverId: user.id,
      approvalHistory: [
        {
          approverId: user.id,
          approverName: user.name,
          action: "pending",
          sequence: 1,
        },
      ],
      createdAt: "2025-01-13T09:15:00Z",
    },
  ])

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")

  const handleAction = (expense: Expense, action: "approve" | "reject") => {
    setSelectedExpense(expense)
    setActionType(action)
    setComment("")
  }

  const confirmAction = () => {
    if (!selectedExpense || !actionType) return

    // Update expense status
    setExpenses(expenses.filter((e) => e.id !== selectedExpense.id))

    // Show success message
    alert(`Expense ${actionType === "approve" ? "approved" : "rejected"} successfully!`)

    // Reset state
    setSelectedExpense(null)
    setActionType(null)
    setComment("")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Review and approve expense claims awaiting your decision</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-600">No pending approvals at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Card key={expense.id} className="border-l-4 border-l-amber-400">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{expense.employeeName}</h3>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        <p className="text-slate-700 mb-3">{expense.description}</p>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Amount</p>
                            <p className="font-semibold text-lg">
                              {expense.currency} {expense.amount.toFixed(2)}
                            </p>
                            {expense.currency !== company.currency && (
                              <p className="text-slate-500 text-xs">
                                ({company.currency} {expense.convertedAmount?.toFixed(2)})
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-slate-500">Expense Date</p>
                            <p className="font-medium">{new Date(expense.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Submitted</p>
                            <p className="font-medium">{new Date(expense.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => handleAction(expense, "approve")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleAction(expense, "reject")}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!selectedExpense && !!actionType} onOpenChange={() => setSelectedExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve Expense" : "Reject Expense"}</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Add an optional comment and approve this expense claim."
                : "Please provide a reason for rejecting this expense claim."}
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Employee:</span>
                  <span className="font-medium">{selectedExpense.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Amount:</span>
                  <span className="font-medium">
                    {company.currency} {selectedExpense.convertedAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Category:</span>
                  <span className="font-medium">{selectedExpense.category}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">
                  Comment {actionType === "reject" && <span className="text-red-600">*</span>}
                </Label>
                <Textarea
                  id="comment"
                  placeholder={
                    actionType === "approve"
                      ? "Add an optional comment..."
                      : "Explain why this expense is being rejected..."
                  }
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required={actionType === "reject"}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExpense(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionType === "reject" && !comment.trim()}
              className={
                actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              Confirm {actionType === "approve" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
