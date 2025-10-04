const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  let connection;
  
  try {
    // Connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database '${process.env.DB_NAME}' created or already exists`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Create Companies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        currency_code VARCHAR(10) NOT NULL,
        country VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Companies table created');

    // Create Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'manager', 'employee') DEFAULT 'employee',
        manager_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Users table created');

    // Create Approval Rules table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS approval_rules (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        rule_type ENUM('percentage', 'specific_approver', 'hybrid') NOT NULL,
        percentage_threshold INT NULL,
        specific_approver_id INT NULL,
        is_manager_approver BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (specific_approver_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Approval Rules table created');

    // Create Approval Steps table (for multi-level approvals)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS approval_steps (
        id INT PRIMARY KEY AUTO_INCREMENT,
        approval_rule_id INT NOT NULL,
        step_order INT NOT NULL,
        approver_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (approval_rule_id) REFERENCES approval_rules(id) ON DELETE CASCADE,
        FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_step (approval_rule_id, step_order)
      )
    `);
    console.log('✅ Approval Steps table created');

    // Create Expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency_code VARCHAR(10) NOT NULL,
        amount_in_company_currency DECIMAL(10, 2),
        category VARCHAR(100) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_path VARCHAR(500),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        current_step INT DEFAULT 1,
        approval_rule_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approval_rule_id) REFERENCES approval_rules(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Expenses table created');

    // Create Expense Lines table (for OCR multiple items)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expense_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        expense_id INT NOT NULL,
        item_name VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Expense Lines table created');

    // Create Approvals table (to track approval history)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS approvals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        expense_id INT NOT NULL,
        approver_id INT NOT NULL,
        step_number INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        comments TEXT,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Approvals table created');

    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the initialization
initDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));