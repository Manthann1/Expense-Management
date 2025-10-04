import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Upload, Plus, LogOut, Users, FileText, Settings, Eye, Clock, TrendingUp, Search, Filter, ChevronDown } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

// Utility Functions
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Modal Component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// Alert Component
const Alert = ({ type, message, onClose }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-xl flex items-center gap-3 max-w-md z-50 animate-slide-in ${
    type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' : 'bg-green-50 text-green-800 border-l-4 border-green-500'
  }`}>
    {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
    <span className="flex-1">{message}</span>
    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">&times;</button>
  </div>
);

// Login/Signup Component
const AuthScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', country: ''
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!isLogin) {
      fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
        .then(r => r.json())
        .then(data => setCountries(data.sort((a, b) => a.name.common.localeCompare(b.name.common))));
    }
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const data = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Expense Manager</h1>
          <p className="text-gray-600 mt-2">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          )}
          {!isLogin && (
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              required
            >
              <option value="">Select Country</option>
              {countries.map(c => <option key={c.name.common} value={c.name.common}>{c.name.common}</option>)}
            </select>
          )}
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard
const Dashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalRules, setApprovalRules] = useState([]);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    try {
      if (activeView === 'expenses') {
        const data = await fetchAPI('/expenses/my');
        setExpenses(data.expenses);
      } else if (activeView === 'approvals' && ['manager', 'admin'].includes(user.role)) {
        const data = await fetchAPI('/expenses/pending-approvals');
        setPendingApprovals(data.expenses);
      } else if (activeView === 'users' && user.role === 'admin') {
        const data = await fetchAPI('/users');
        setUsers(data.users);
      } else if (activeView === 'rules' && user.role === 'admin') {
        const data = await fetchAPI('/approval-rules');
        setApprovalRules(data.rules);
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Expense Management</h1>
                <p className="text-sm text-gray-500">{user.firstName} {user.lastName} • {user.role.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2">
          <NavButton active={activeView === 'expenses'} onClick={() => setActiveView('expenses')}>
            <FileText size={18} /> My Expenses
          </NavButton>
          {['manager', 'admin'].includes(user.role) && (
            <NavButton active={activeView === 'approvals'} onClick={() => setActiveView('approvals')}>
              <Clock size={18} /> Pending Approvals
            </NavButton>
          )}
          {user.role === 'admin' && (
            <>
              <NavButton active={activeView === 'users'} onClick={() => setActiveView('users')}>
                <Users size={18} /> Manage Users
              </NavButton>
              <NavButton active={activeView === 'rules'} onClick={() => setActiveView('rules')}>
                <Settings size={18} /> Approval Rules
              </NavButton>
            </>
          )}
        </div>

        {/* Content */}
        {activeView === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onRefresh={loadData}
            setAlert={setAlert}
            user={user}
            showModal={showModal}
            setShowModal={setShowModal}
            selectedExpense={selectedExpense}
            setSelectedExpense={setSelectedExpense}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}

        {activeView === 'approvals' && (
          <ApprovalsView
            pendingApprovals={pendingApprovals}
            onRefresh={loadData}
            setAlert={setAlert}
            user={user}
          />
        )}

        {activeView === 'users' && (
          <UsersView users={users} onRefresh={loadData} setAlert={setAlert} />
        )}

        {activeView === 'rules' && (
          <RulesView rules={approvalRules} users={users} onRefresh={loadData} setAlert={setAlert} />
        )}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

// Expenses View (Employee's View)
const ExpensesView = ({ 
  expenses, onRefresh, setAlert, user, showModal, setShowModal, 
  selectedExpense, setSelectedExpense, searchTerm, setSearchTerm,
  filterStatus, setFilterStatus 
}) => {
  const [formData, setFormData] = useState({
    amount: '', currencyCode: user.currency || 'USD', category: '', 
    description: '', expenseDate: new Date().toISOString().split('T')[0]
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchAPI('/expenses', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setAlert({ type: 'success', message: 'Expense submitted successfully!' });
      setShowModal(null);
      setFormData({ 
        amount: '', currencyCode: user.currency || 'USD', category: '', 
        description: '', expenseDate: new Date().toISOString().split('T')[0] 
      });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  const handleOCRUpload = async (file) => {
    if (!file) return;
    setOcrProcessing(true);
    const formDataOCR = new FormData();
    formDataOCR.append('receipt', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/ocr/process-receipt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataOCR,
      });
      const data = await response.json();
      
      if (data.extractedData) {
        setFormData({
          ...formData,
          amount: data.extractedData.amount || '',
          category: data.extractedData.category || '',
          description: data.extractedData.merchantName || '',
          expenseDate: data.extractedData.date || formData.expenseDate,
        });
        setAlert({ type: 'success', message: 'Receipt processed! Please review the details.' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'OCR processing failed' });
    } finally {
      setOcrProcessing(false);
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || exp.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search expenses..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={() => setShowModal('create')}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-md transition-all"
        >
          <Plus size={20} /> Submit Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-800">{expense.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{expense.description}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                  {expense.amount} {expense.currency_code}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={expense.status} />
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedExpense(expense)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <Eye size={16} /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No expenses found</p>
          </div>
        )}
      </div>

      {/* Create Expense Modal */}
      {showModal === 'create' && (
        <Modal title="Submit New Expense" onClose={() => setShowModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OCR Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload size={32} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">Upload receipt for auto-fill (OCR)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleOCRUpload(e.target.files[0])}
                className="hidden"
                id="receipt-upload"
              />
              <label
                htmlFor="receipt-upload"
                className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                {ocrProcessing ? 'Processing...' : 'Choose File'}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Currency (USD, EUR, etc.)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.currencyCode}
                onChange={(e) => setFormData({...formData, currencyCode: e.target.value})}
                required
              />
            </div>

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">Select Category</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Transportation">Transportation</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>

            <textarea
              placeholder="Description / Notes"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />

            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.expenseDate}
              onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
              required
            />

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Submit Expense
            </button>
          </form>
        </Modal>
      )}

      {/* View Expense Details Modal */}
      {selectedExpense && (
        <Modal title="Expense Details" onClose={() => setSelectedExpense(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Category</label>
                <p className="text-gray-800">{selectedExpense.category}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Status</label>
                <div className="mt-1"><StatusBadge status={selectedExpense.status} /></div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Amount</label>
                <p className="text-gray-800 font-semibold">
                  {selectedExpense.amount} {selectedExpense.currency_code}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Date</label>
                <p className="text-gray-800">
                  {new Date(selectedExpense.expense_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-600">Description</label>
              <p className="text-gray-800">{selectedExpense.description}</p>
            </div>

            {selectedExpense.approvals && selectedExpense.approvals.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Approval Flow</label>
                <div className="space-y-2">
                  {selectedExpense.approvals.map((approval, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">
                          Step {approval.step_number}: {approval.first_name} {approval.last_name}
                        </p>
                        {approval.comments && (
                          <p className="text-sm text-gray-600 mt-1">"{approval.comments}"</p>
                        )}
                      </div>
                      <StatusBadge status={approval.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// Approvals View (Manager's View)
const ApprovalsView = ({ pendingApprovals, onRefresh, setAlert, user }) => {
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState(null);

  const handleApproval = async () => {
    if (!selectedExpense || !actionType) return;
    
    try {
      await fetchAPI(`/expenses/${selectedExpense.id}/approve-reject`, {
        method: 'POST',
        body: JSON.stringify({ action: actionType, comments }),
      });
      setAlert({ type: 'success', message: `Expense ${actionType}d successfully!` });
      setSelectedExpense(null);
      setComments('');
      setActionType(null);
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
        <p className="text-gray-600">Review and approve expense requests</p>
      </div>

      <div className="grid gap-4">
        {pendingApprovals.map((expense) => (
          <div key={expense.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:border-blue-300 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{expense.category}</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                    Step {expense.step_number}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Submitted by: <span className="font-semibold">{expense.employee_first_name} {expense.employee_last_name}</span>
                </p>
                <p className="text-gray-700 mt-2">{expense.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  {expense.amount_in_company_currency} {expense.company_currency || user.currency}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setActionType('approve');
                }}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedExpense(expense);
                  setActionType('reject');
                }}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 font-semibold transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        ))}

        {pendingApprovals.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No pending approvals at this time</p>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedExpense && (
        <Modal 
          title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Expense`} 
          onClose={() => {
            setSelectedExpense(null);
            setComments('');
            setActionType(null);
          }}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">{selectedExpense.category}</h4>
              <p className="text-sm text-gray-600">{selectedExpense.description}</p>
              <p className="text-lg font-bold text-gray-800 mt-2">
                {selectedExpense.amount_in_company_currency} {selectedExpense.company_currency}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows="4"
                placeholder="Add your comments here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedExpense(null);
                  setComments('');
                  setActionType(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                className={`flex-1 text-white py-3 rounded-lg font-semibold ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Users View (Admin's View)
const UsersView = ({ users, onRefresh, setAlert }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'employee', managerId: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setAlert({ type: 'success', message: 'User created successfully!' });
      setShowModal(false);
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'employee', managerId: '' });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <p className="text-gray-600">Create and manage employees and managers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-md"
        >
          <Plus size={20} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Manager</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.manager_first_name 
                    ? `${user.manager_first_name} ${user.manager_last_name}` 
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <Modal title="Add New User" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>

            <input
              type="email"
              placeholder="Email Address"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.managerId}
              onChange={(e) => setFormData({...formData, managerId: e.target.value})}
            >
              <option value="">Select Manager (Optional)</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} ({m.role})
                </option>
              ))}
            </select>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Create User
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Rules View (Admin's View)
const RulesView = ({ rules, users, onRefresh, setAlert }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ruleType: 'percentage',
    percentageThreshold: 60,
    specificApproverId: '',
    isManagerApprover: true,
    approvalSteps: []
  });
  const [stepApprovers, setStepApprovers] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        approvalSteps: stepApprovers.map((approverId, index) => ({
          approverId: parseInt(approverId),
          stepOrder: index + 1
        }))
      };

      await fetchAPI('/approval-rules', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAlert({ type: 'success', message: 'Approval rule created successfully!' });
      setShowModal(false);
      setFormData({
        name: '', ruleType: 'percentage', percentageThreshold: 60,
        specificApproverId: '', isManagerApprover: true, approvalSteps: []
      });
      setStepApprovers([]);
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Approval Rules</h2>
          <p className="text-gray-600">Configure expense approval workflows</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-md"
        >
          <Plus size={20} /> Create Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{rule.name}</h3>
                <p className="text-sm text-gray-600 mt-1">Rule Type: {rule.rule_type.replace('_', ' ').toUpperCase()}</p>
              </div>
              {rule.is_active && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  ACTIVE
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {rule.percentage_threshold && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Percentage Threshold</label>
                  <p className="text-gray-800">{rule.percentage_threshold}%</p>
                </div>
              )}
              {rule.approver_first_name && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Specific Approver</label>
                  <p className="text-gray-800">{rule.approver_first_name} {rule.approver_last_name}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-gray-600">Manager Approval Required</label>
                <p className="text-gray-800">{rule.is_manager_approver ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {rule.steps && rule.steps.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Approval Steps</label>
                <div className="space-y-2">
                  {rule.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {step.step_order}
                      </span>
                      <span className="text-gray-800">
                        {step.first_name} {step.last_name} ({step.role})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {rules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Settings size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No approval rules configured yet</p>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      {showModal && (
        <Modal title="Create Approval Rule" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Rule Name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />

            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.ruleType}
              onChange={(e) => setFormData({...formData, ruleType: e.target.value})}
            >
              <option value="percentage">Percentage Based</option>
              <option value="specific_approver">Specific Approver</option>
              <option value="hybrid">Hybrid (Percentage OR Specific)</option>
            </select>

            {(formData.ruleType === 'percentage' || formData.ruleType === 'hybrid') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Approval Percentage Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.percentageThreshold}
                  onChange={(e) => setFormData({...formData, percentageThreshold: parseInt(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expense will be approved if {formData.percentageThreshold}% of approvers approve
                </p>
              </div>
            )}

            {(formData.ruleType === 'specific_approver' || formData.ruleType === 'hybrid') && (
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.specificApproverId}
                onChange={(e) => setFormData({...formData, specificApproverId: e.target.value})}
                required={formData.ruleType !== 'percentage'}
              >
                <option value="">Select Specific Approver</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.last_name} ({m.role})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="manager-approver"
                checked={formData.isManagerApprover}
                onChange={(e) => setFormData({...formData, isManagerApprover: e.target.checked})}
                className="w-4 h-4"
              />
              <label htmlFor="manager-approver" className="text-sm text-gray-700">
                Require manager approval first
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Approval Steps (Sequential)
              </label>
              {stepApprovers.map((approverId, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <span className="w-8 h-10 bg-blue-600 text-white rounded flex items-center justify-center font-semibold">
                    {idx + 1}
                  </span>
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    value={approverId}
                    onChange={(e) => {
                      const updated = [...stepApprovers];
                      updated[idx] = e.target.value;
                      setStepApprovers(updated);
                    }}
                  >
                    <option value="">Select Approver</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setStepApprovers(stepApprovers.filter((_, i) => i !== idx))}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setStepApprovers([...stepApprovers, ''])}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
              >
                + Add Step
              </button>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Create Rule
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    approved: 'bg-green-100 text-green-800 border border-green-300',
    rejected: 'bg-red-100 text-red-800 border border-red-300',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
};

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}