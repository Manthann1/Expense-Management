"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, Company } from "@/lib/types"
import { convertCurrency, supportedCurrencies, formatCurrency } from "@/lib/currency"
import { extractReceiptData, validateReceiptImage } from "@/lib/ocr"

interface SubmitExpenseProps {
  user: User
  company: Company
}

export function SubmitExpense({ user, company }: SubmitExpenseProps) {
  const [formData, setFormData] = useState({
    amount: "",
    currency: company.currency,
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })
  const [receipt, setReceipt] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState<any>(null)

  const categories = ["Travel", "Meals", "Equipment", "Software", "Office Supplies", "Training", "Other"]

  const convertedAmount =
    formData.amount && formData.currency !== company.currency
      ? convertCurrency(Number.parseFloat(formData.amount), formData.currency, company.currency)
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mock submission
    setTimeout(() => {
      alert("Expense submitted successfully!")
      setFormData({
        amount: "",
        currency: company.currency,
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      })
      setReceipt(null)
      setOcrResult(null)
      setLoading(false)
    }, 1000)
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file
      const validation = validateReceiptImage(file)
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      setReceipt(file)

      // Automatically scan receipt
      setScanning(true)
      try {
        const result = await extractReceiptData(file)
        setOcrResult(result)

        // Auto-fill form if confidence is high
        if (result.confidence > 0.85) {
          setFormData({
            amount: result.amount?.toString() || "",
            currency: result.currency || company.currency,
            category: result.category || "",
            description: result.merchant ? `Purchase from ${result.merchant}` : "",
            date: result.date || new Date().toISOString().split("T")[0],
          })
        }
      } catch (error) {
        console.error("OCR failed:", error)
      } finally {
        setScanning(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit New Expense</CardTitle>
        <CardDescription>Fill in the details of your expense claim</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {ocrResult && ocrResult.confidence > 0.85 && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                Receipt scanned successfully! Form has been auto-filled with extracted data (
                {Math.round(ocrResult.confidence * 100)}% confidence). Please review and adjust if needed.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
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
              {convertedAmount && (
                <p className="text-sm text-slate-600">
                  ≈ {formatCurrency(convertedAmount, company.currency)} (company currency)
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide details about this expense..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt (Auto-scans with OCR)</Label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors">
              <input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptUpload}
                className="hidden"
                disabled={scanning}
              />
              <label htmlFor="receipt" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  {scanning ? (
                    <>
                      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium text-blue-700">Scanning receipt...</p>
                      <p className="text-xs text-slate-500">Extracting data using OCR</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {receipt ? receipt.name : "Click to upload receipt"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 10MB • Auto-fills form data</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || scanning} className="flex-1">
              {loading ? "Submitting..." : "Submit Expense"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  amount: "",
                  currency: company.currency,
                  category: "",
                  description: "",
                  date: new Date().toISOString().split("T")[0],
                })
                setReceipt(null)
                setOcrResult(null)
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
