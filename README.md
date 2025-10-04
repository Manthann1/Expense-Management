# Expense-Management 
# 💰 Expense Management System

A full-stack expense management application with multi-level approval workflows, role-based access control, OCR receipt scanning, and real-time currency conversion.

## ✨ Features

- 🔐 JWT Authentication with auto-company creation on signup
- 👥 Role-based access control (Admin, Manager, Employee)
- 💰 Multi-currency expense submission with auto-conversion
- 📋 Sequential multi-level approval workflows
- 🎯 Flexible approval rules (Percentage, Specific Approver, Hybrid)
- 📸 OCR receipt scanning with Tesseract.js
- 📊 Real-time expense tracking and history
- 💱 Live currency conversion using external APIs

## 🛠 Tech Stack

**Backend:** Node.js, Express.js, MySQL, JWT, Multer, Tesseract.js  
**Frontend:** React, Tailwind CSS, Lucide Icons  
**APIs:** RestCountries (currencies), ExchangeRate-API (conversion)

## 📁 Project Structure

```
expense-management/
├── backend/
│   ├── config/database.js
│   ├── controllers/
│   ├── middleware/auth.js
│   ├── routes/index.js
│   ├── scripts/initDatabase.js
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   └── ExpenseManagementApp.jsx
└── README.md
```

## ⚙️ Prerequisites

- Node.js (v14+)
- MySQL (v8.0+)
- npm or yarn

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create `.env` file in backend directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=expense_management
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
```

### 3. Initialize Database

```bash
npm run init-db
```

### 4. Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on: `http://localhost:3000`

### 5. Frontend Setup

The frontend is a React component that works in Claude.ai artifacts or can be integrated into any React app.

For local React development:
```bash
npx create-react-app expense-app
cd expense-app
npm install lucide-react
# Copy ExpenseManagementApp.jsx to src/App.js
npm start
```

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Create users, assign roles, configure approval rules, view all expenses |
| **Manager** | Approve/reject expenses, view team expenses, submit own expenses |
| **Employee** | Submit expenses, upload receipts, view own expense history |

## 📖 Quick Start Guide

### First Time Setup

1. **Sign Up as Admin**
   - Open the application
   - Fill signup form with company details
   - Admin and company are auto-created

2. **Create Users (Admin)**
   - Login as admin
   - Go to Users tab → Create New User
   - Assign roles and managers

3. **Submit Expense (Employee)**
   - Login as employee
   - Click "Submit New Expense"
   - Fill form and submit

4. **Approve Expense (Manager)**
   - Login as manager
   - Go to "Pending Approvals"
   - Click ✅ to approve or ❌ to reject

## 🔌 API Endpoints

### Authentication
```http
POST /api/auth/signup        # Create company & admin
POST /api/auth/login         # User login
```

### User Management (Admin)
```http
POST /api/users              # Create user
GET  /api/users              # Get all users
PUT  /api/users/:id/role     # Update role
PUT  /api/users/:id/manager  # Assign manager
```

### Expenses
```http
POST /api/expenses                      # Submit expense
GET  /api/expenses/my                   # Get my expenses
GET  /api/expenses/pending-approvals    # Get pending (Manager)
GET  /api/expenses/team                 # Get team expenses (Manager)
GET  /api/expenses/all                  # Get all (Admin)
POST /api/expenses/:id/approve-reject   # Approve/Reject
```

### Approval Rules (Admin)
```http
POST   /api/approval-rules        # Create rule
GET    /api/approval-rules        # Get all rules
PUT    /api/approval-rules/:id    # Update rule
DELETE /api/approval-rules/:id    # Delete rule
```

### OCR
```http
POST /api/ocr/process-receipt    # Upload & process receipt
```

## 📋 Approval Workflow Examples

### Simple Manager Approval
```json
{
  "name": "Manager Only",
  "ruleType": "percentage",
  "percentageThreshold": 100,
  "isManagerApprover": true,
  "approvalSteps": []
}
```
Flow: Employee → Manager ✓

### Three-Level Sequential
```json
{
  "name": "Three Level",
  "ruleType": "percentage",
  "percentageThreshold": 100,
  "isManagerApprover": true,
  "approvalSteps": [
    { "approverId": 3 },  // Finance
    { "approverId": 4 }   // Director
  ]
}
```
Flow: Employee → Manager → Finance → Director ✓

### Hybrid Rule (60% OR CFO)
```json
{
  "name": "CFO Override",
  "ruleType": "hybrid",
  "percentageThreshold": 60,
  "specificApproverId": 5,  // CFO
  "isManagerApprover": true,
  "approvalSteps": [
    { "approverId": 2 },
    { "approverId": 3 },
    { "approverId": 4 }
  ]
}
```
Logic: Approved if CFO approves OR 60% of others approve

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
sudo service mysql start

# Verify credentials in .env
# Re-run initialization
npm run init-db
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Authentication Issues
- Ensure JWT_SECRET is set in .env
- Include token in header: `Authorization: Bearer {token}`
- Token might be expired, login again

### CORS Issues
Backend has CORS enabled. If issues persist, check frontend URL matches backend CORS config.

## 🔒 Security Notes

- Passwords hashed with bcryptjs
- JWT token authentication
- SQL injection prevention with parameterized queries
- File upload validation (type & size)
- Role-based authorization middleware

**Production Recommendations:**
- Use strong JWT_SECRET (32+ characters)
- Enable HTTPS
- Implement rate limiting
- Use environment-specific configs

## 📦 Database Schema

**Tables:**
- `companies` - Company info and currency
- `users` - User accounts and roles
- `approval_rules` - Approval configurations
- `approval_steps` - Sequential approval steps
- `expenses` - Expense submissions
- `expense_lines` - Line items from OCR
- `approvals` - Approval tracking history

## 🧪 Testing

Use Postman or Thunder Client:

1. POST `/api/auth/signup` → Save token
2. POST `/api/users` → Create test users
3. POST `/api/expenses` → Submit expense
4. POST `/api/expenses/:id/approve-reject` → Approve

## 🚀 Deployment

### Backend (Heroku)
```bash
heroku create expense-api
heroku addons:create cleardb:ignite
heroku config:set JWT_SECRET=your_secret
git push heroku main
heroku run npm run init-db
```

### Frontend (Vercel)
```bash
npm i -g vercel
cd frontend
vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📞 Support

Create an issue in the repository for bugs or feature requests.

---

**Built with ❤️ using Node.js, React, and MySQL**
