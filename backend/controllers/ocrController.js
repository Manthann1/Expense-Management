const Tesseract = require('tesseract.js');
const path = require('path');

const processReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt image uploaded' });
    }

    const imagePath = req.file.path;

    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: info => console.log(info)
    });

    // Parse the OCR text to extract expense information
    const expenseData = parseReceiptText(text);

    res.json({
      message: 'Receipt processed successfully',
      rawText: text,
      extractedData: expenseData,
      imagePath: req.file.filename
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({ error: 'Server error while processing receipt' });
  }
};

// Helper function to parse receipt text
const parseReceiptText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  const expenseData = {
    amount: null,
    date: null,
    merchantName: null,
    category: null,
    items: []
  };

  // Patterns to match
  const amountPattern = /(?:total|amount|sum|₹|rs\.?|inr|\$|usd|eur|€)\s*:?\s*(\d+(?:[.,]\d{2})?)/i;
  const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
  const itemPattern = /^(.+?)\s+(\d+(?:[.,]\d{2})?)\s*$/;

  // Extract merchant name (usually first non-empty line)
  if (lines.length > 0) {
    expenseData.merchantName = lines[0].trim();
  }

  // Parse each line
  for (const line of lines) {
    // Try to extract amount
    const amountMatch = line.match(amountPattern);
    if (amountMatch && !expenseData.amount) {
      expenseData.amount = parseFloat(amountMatch[1].replace(',', '.'));
    }

    // Try to extract date
    const dateMatch = line.match(datePattern);
    if (dateMatch && !expenseData.date) {
      expenseData.date = dateMatch[0];
    }

    // Try to extract line items
    const itemMatch = line.match(itemPattern);
    if (itemMatch && itemMatch[1] && itemMatch[2]) {
      const itemName = itemMatch[1].trim();
      const itemAmount = parseFloat(itemMatch[2].replace(',', '.'));
      
      // Avoid adding total/subtotal lines as items
      if (!itemName.toLowerCase().includes('total') && 
          !itemName.toLowerCase().includes('subtotal') &&
          itemAmount > 0) {
        expenseData.items.push({
          name: itemName,
          amount: itemAmount
        });
      }
    }
  }

  // Try to categorize based on merchant name
  if (expenseData.merchantName) {
    const merchant = expenseData.merchantName.toLowerCase();
    if (merchant.includes('restaurant') || merchant.includes('cafe') || 
        merchant.includes('food') || merchant.includes('pizza') || 
        merchant.includes('burger')) {
      expenseData.category = 'Food & Dining';
    } else if (merchant.includes('hotel') || merchant.includes('inn')) {
      expenseData.category = 'Accommodation';
    } else if (merchant.includes('uber') || merchant.includes('taxi') || 
               merchant.includes('transport')) {
      expenseData.category = 'Transportation';
    } else if (merchant.includes('store') || merchant.includes('shop') || 
               merchant.includes('mart')) {
      expenseData.category = 'Office Supplies';
    } else {
      expenseData.category = 'Other';
    }
  }

  return expenseData;
};

module.exports = { processReceipt };