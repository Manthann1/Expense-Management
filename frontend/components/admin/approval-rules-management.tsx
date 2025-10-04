"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Company, ApprovalRule } from "@/lib/types"

interface ApprovalRulesManagementProps {
  company: Company
}

export function ApprovalRulesManagement({ company }: ApprovalRulesManagementProps) {
  const [rules, setRules] = useState<ApprovalRule[]>([
    {
      id: "1",
      companyId: company.id,
      name: "Standard Approval",
      type: "sequential",
      isManagerApprover: true,
      approvers: [
        { userId: "2", userName: "Sarah Manager", sequence: 1 },
        { userId: "1", userName: "John Doe (CFO)", sequence: 2 },
      ],
    },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRule, setNewRule] = useState({
    name: "",
    type: "sequential" as "sequential" | "conditional",
    isManagerApprover: true,
    approvers: [] as { userId: string; userName: string; sequence?: number }[],
    conditionType: "percentage" as "percentage" | "specific_approver" | "hybrid",
    percentage: 60,
    specificApproverId: "",
  })

  const mockUsers = [
    { id: "1", name: "John Doe (CFO)" },
    { id: "2", name: "Sarah Manager" },
    { id: "4", name: "Finance Director" },
  ]

  const handleAddRule = () => {
    const rule: ApprovalRule = {
      id: String(rules.length + 1),
      companyId: company.id,
      name: newRule.name,
      type: newRule.type,
      isManagerApprover: newRule.isManagerApprover,
      approvers: newRule.approvers,
      conditions:
        newRule.type === "conditional"
          ? {
              type: newRule.conditionType,
              percentage: newRule.conditionType !== "specific_approver" ? newRule.percentage : undefined,
              specificApproverId: newRule.conditionType !== "percentage" ? newRule.specificApproverId : undefined,
            }
          : undefined,
    }
    setRules([...rules, rule])
    setNewRule({
      name: "",
      type: "sequential",
      isManagerApprover: true,
      approvers: [],
      conditionType: "percentage",
      percentage: 60,
      specificApproverId: "",
    })
    setIsDialogOpen(false)
  }

  const addApprover = (userId: string, userName: string) => {
    const sequence = newRule.approvers.length + 1
    setNewRule({
      ...newRule,
      approvers: [...newRule.approvers, { userId, userName, sequence }],
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Approval Rules</CardTitle>
            <CardDescription>Configure approval workflows and conditions</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Rule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Approval Rule</DialogTitle>
                <DialogDescription>Define a new approval workflow</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input
                    id="ruleName"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., High Value Expenses"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ruleType">Approval Type</Label>
                  <Select
                    value={newRule.type}
                    onValueChange={(value: "sequential" | "conditional") => setNewRule({ ...newRule, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential (Step by Step)</SelectItem>
                      <SelectItem value="conditional">Conditional (Percentage/Specific)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="managerApprover"
                    checked={newRule.isManagerApprover}
                    onCheckedChange={(checked) => setNewRule({ ...newRule, isManagerApprover: checked as boolean })}
                  />
                  <Label htmlFor="managerApprover" className="text-sm font-normal">
                    Require manager approval first
                  </Label>
                </div>

                {newRule.type === "conditional" && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <Label>Conditional Rules</Label>
                    <Select
                      value={newRule.conditionType}
                      onValueChange={(value: any) => setNewRule({ ...newRule, conditionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Based</SelectItem>
                        <SelectItem value="specific_approver">Specific Approver</SelectItem>
                        <SelectItem value="hybrid">Hybrid (Both)</SelectItem>
                      </SelectContent>
                    </Select>

                    {(newRule.conditionType === "percentage" || newRule.conditionType === "hybrid") && (
                      <div className="space-y-2">
                        <Label>Approval Percentage</Label>
                        <Input
                          type="number"
                          value={newRule.percentage}
                          onChange={(e) => setNewRule({ ...newRule, percentage: Number(e.target.value) })}
                          min="1"
                          max="100"
                        />
                        <p className="text-xs text-slate-600">
                          Expense approved if {newRule.percentage}% of approvers approve
                        </p>
                      </div>
                    )}

                    {(newRule.conditionType === "specific_approver" || newRule.conditionType === "hybrid") && (
                      <div className="space-y-2">
                        <Label>Specific Approver (Auto-approve)</Label>
                        <Select
                          value={newRule.specificApproverId}
                          onValueChange={(value) => setNewRule({ ...newRule, specificApproverId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select approver" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Approvers</Label>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => {
                        const user = mockUsers.find((u) => u.id === value)
                        if (user) addApprover(user.id, user.name)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 mt-2">
                    {newRule.approvers.map((approver, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm">
                          {newRule.type === "sequential" && (
                            <span className="font-medium mr-2">Step {approver.sequence}:</span>
                          )}
                          {approver.userName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setNewRule({
                              ...newRule,
                              approvers: newRule.approvers.filter((_, i) => i !== index),
                            })
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddRule} className="w-full">
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {rule.isManagerApprover && "Manager approval required • "}
                      {rule.type === "sequential" ? "Sequential approval" : "Conditional approval"}
                    </CardDescription>
                  </div>
                  <Badge>{rule.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Approvers:</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.approvers.map((approver, index) => (
                      <Badge key={index} variant="outline">
                        {rule.type === "sequential" && `${approver.sequence}. `}
                        {approver.userName}
                      </Badge>
                    ))}
                  </div>
                  {rule.conditions && (
                    <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                      <p className="font-medium text-blue-900 mb-1">Conditions:</p>
                      {rule.conditions.percentage && (
                        <p className="text-blue-700">• {rule.conditions.percentage}% approval required</p>
                      )}
                      {rule.conditions.specificApproverId && (
                        <p className="text-blue-700">• Auto-approve if specific approver approves</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
