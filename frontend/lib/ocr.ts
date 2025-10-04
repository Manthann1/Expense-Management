// OCR utilities for receipt scanning

export interface OCRResult {
  amount?: number
  currency?: string
  date?: string
  merchant?: string
  category?: string
  confidence: number
}

// Mock OCR function - in production, integrate with services like:
// - Google Cloud Vision API
// - AWS Textract
// - Azure Computer Vision
// - Tesseract.js for client-side OCR
export async function extractReceiptData(imageFile: File): Promise<OCRResult> {
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      // Mock extracted data
      const mockResults: OCRResult[] = [
        {
          amount: 45.99,
          currency: "USD",
          date: new Date().toISOString().split("T")[0],
          merchant: "Starbucks Coffee",
          category: "Meals",
          confidence: 0.95,
        },
        {
          amount: 125.5,
          currency: "USD",
          date: new Date().toISOString().split("T")[0],
          merchant: "Uber",
          category: "Travel",
          confidence: 0.92,
        },
        {
          amount: 299.99,
          currency: "USD",
          date: new Date().toISOString().split("T")[0],
          merchant: "Best Buy",
          category: "Equipment",
          confidence: 0.88,
        },
      ]

      // Return random mock result
      const result = mockResults[Math.floor(Math.random() * mockResults.length)]
      resolve(result)
    }, 2000)
  })
}

export function validateReceiptImage(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPG, PNG, WEBP, or PDF file.",
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum size is 10MB.",
    }
  }

  return { valid: true }
}
