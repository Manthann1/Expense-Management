"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Company, Expense } from "@/lib/types"

interface ExpensesOverviewProps {
  company: Company
}

export function ExpensesOverview({ company }: ExpensesOverviewProps) {
  const [expenses] = useState<Expense[]>([
    {
      id: "1",
      employeeId: "3",
      employeeName: "Mike Employee",
      amount: 250,
      currency: "USD",
      convertedAmount: 250,
      category: "Travel",
      description: "Client meeting transportation",
      date: "2025-01-15",
      status: "pending",
      currentApproverId: "2",
      approvalHistory: [{ approverId: "2", approverName: "Sarah Manager", action: "pending", sequence: 1 }],
      createdAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "2",
      employeeId: "3",
      employeeName: "Mike Employee",
      amount: 1200,
      currency: "USD",
      convertedAmount: 1200,
      category: "Equipment",
      description: "New laptop for development",
      date: "2025-01-10",
      status: "approved",
      approvalHistory: [
        {
          approverId: "2",
          approverName: "Sarah Manager",
          action: "approved",
          sequence: 1,
          timestamp: "2025-01-11T09:00:00Z",
        },
        {
          approverId: "1",
          approverName: "John Doe",
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
      employeeId: "3",
      employeeName: "Mike Employee",
      amount: 85,
      currency: "USD",
      convertedAmount: 85,
      category: "Meals",
      description: "Team lunch",
      date: "2025-01-08",
      status: "rejected",
      approvalHistory: [
        {
          approverId: "2",
          approverName: "Sarah Manager",
          action: "rejected",
          sequence: 1,
          timestamp: "2025-01-09T10:00:00Z",
          comment: "Not a business expense",
        },
      ],
      createdAt: "2025-01-08T15:00:00Z",
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
    <Card>
      <CardHeader>
        <CardTitle>All Expenses</CardTitle>
        <CardDescription>View and manage all company expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.employeeName}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell>
                  {company.currency} {expense.convertedAmount?.toFixed(2)}
                  {expense.currency !== company.currency && (
                    <span className="text-xs text-slate-500 block">
                      ({expense.currency} {expense.amount})
                    </span>
                  )}
                </TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(expense.status)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
