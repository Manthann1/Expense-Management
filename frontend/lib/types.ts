export type UserRole = "admin" | "manager" | "employee"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string
  managerId?: string
}

export interface Company {
  id: string
  name: string
  country: string
  currency: string
}

export interface Expense {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  currency: string
  convertedAmount?: number
  category: string
  description: string
  date: string
  status: "pending" | "approved" | "rejected"
  receiptUrl?: string
  currentApproverId?: string
  approvalHistory: ApprovalStep[]
  createdAt: string
}

export interface ApprovalStep {
  approverId: string
  approverName: string
  action: "approved" | "rejected" | "pending"
  comment?: string
  timestamp?: string
  sequence: number
}

export interface ApprovalRule {
  id: string
  companyId: string
  name: string
  type: "sequential" | "conditional"
  approvers: {
    userId: string
    userName: string
    sequence?: number
  }[]
  conditions?: {
    type: "percentage" | "specific_approver" | "hybrid"
    percentage?: number
    specificApproverId?: string
  }
  isManagerApprover: boolean
}
