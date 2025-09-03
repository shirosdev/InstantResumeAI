"""
Database initialization script for InstantResumeAI
This script creates all necessary tables in the MySQL database including password reset functionality
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables


# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'ballast.proxy.rlwy.net'),
    'port': os.getenv('DB_PORT', '10788'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'CbaTmjcFKluybgCevaSxVyzYurNHFyoy'),
    'database': os.getenv('DB_NAME', 'railway'),
     'ssl_disabled': False,
    'ssl_verify_cert': False,
    'ssl_verify_identity': False
}


# SQL schema - Enhanced with password reset functionality
SCHEMA_SQL = """
-- Users table for storing user account information (Enhanced for password reset)
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    profile_picture_url VARCHAR(500),
    bio TEXT,
    location VARCHAR(255),
    profession VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_password_reset_token (password_reset_token),
    INDEX idx_password_reset_expires (password_reset_expires)
);

-- Password reset attempts tracking for security monitoring
CREATE TABLE IF NOT EXISTS password_reset_attempts (
    attempt_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT FALSE,
    token_used VARCHAR(10),
    INDEX idx_email_attempts (email),
    INDEX idx_attempt_time (attempt_time),
    INDEX idx_success_status (success)
);

-- Social authentication providers
CREATE TABLE IF NOT EXISTS social_auth (
    social_auth_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    provider ENUM('google', 'facebook', 'linkedin', 'github') NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_user (provider, provider_user_id),
    INDEX idx_user_id (user_id)
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    plan_name VARCHAR(100) NOT NULL,
    plan_type ENUM('free', 'monthly', 'quarterly', 'semi_annual', 'annual') NOT NULL,
    price DECIMAL(10, 2) DEFAULT 0.00,
    duration_days INT NOT NULL,
    resume_limit INT DEFAULT NULL,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    subscription_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'active',
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_end_date (end_date)
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay') NOT NULL,
    payment_gateway_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    description TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(subscription_id),
    INDEX idx_user_transactions (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- User sessions for tracking login sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_sessions (user_id),
    INDEX idx_expires_at (expires_at)
);

-- User activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_activity (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Resume enhancement tracking table
CREATE TABLE IF NOT EXISTS resume_enhancements (
    enhancement_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    original_filename VARCHAR(255),
    enhanced_filename VARCHAR(255),
    file_path VARCHAR(500),
    enhancement_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    job_description_snippet TEXT,
    enhancement_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_enhancements (user_id),
    INDEX idx_status (enhancement_status),
    INDEX idx_created_at (created_at)
);

-- Create user subscription status view
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    us.subscription_id,
    sp.plan_name,
    sp.plan_type,
    us.start_date,
    us.end_date,
    us.status,
    CASE 
        WHEN us.end_date IS NULL THEN 'Unlimited'
        WHEN us.end_date > CURDATE() THEN 'Active'
        ELSE 'Expired'
    END as subscription_status
FROM users u
LEFT JOIN user_subscriptions us ON u.user_id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.plan_id;
"""

# Enhanced cleanup event for password reset tokens
CLEANUP_EVENT_SQL = """
-- Create cleanup event for expired password reset tokens
DROP EVENT IF EXISTS cleanup_expired_reset_tokens;

DELIMITER //
CREATE EVENT cleanup_expired_reset_tokens
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- Archive expired attempts to password_reset_attempts table
    INSERT INTO password_reset_attempts (email, attempt_time, success, token_used)
    SELECT u.email, u.password_reset_expires, FALSE, u.password_reset_token
    FROM users u
    WHERE u.password_reset_expires IS NOT NULL 
    AND u.password_reset_expires < NOW()
    AND u.password_reset_token IS NOT NULL;
    
    -- Clear expired tokens from users table
    UPDATE users 
    SET password_reset_token = NULL, 
        password_reset_expires = NULL 
    WHERE password_reset_expires IS NOT NULL 
    AND password_reset_expires < NOW();
END //
DELIMITER ;
"""

# --- THIS IS THE ONLY SECTION THAT HAS BEEN CHANGED ---
# The SQL for inserting plans is updated to match our new requirements.
# The original 'Free Unlimited' plan is replaced with the two new free plans.
INSERT_PLANS_SQL = """
INSERT INTO subscription_plans (plan_name, plan_type, price, duration_days, resume_limit, features) VALUES
('Free - 3 Enhancements', 'free', 0.00, 0, 3, '{"description": "Basic access with a 3 resume enhancement limit."}'),
('Internal User Plan', 'free', 0.00, 0, NULL, '{"description": "Unlimited access for internal team members."}'),
('Monthly Plan', 'monthly', 9.99, 30, NULL, '{"unlimited_resumes": true, "priority_support": true, "advanced_templates": true, "password_reset": true}'),
('Quarterly Plan', 'quarterly', 24.99, 90, NULL, '{"unlimited_resumes": true, "priority_support": true, "advanced_templates": true, "discount": "17%", "password_reset": true}'),
('Semi-Annual Plan', 'semi_annual', 44.99, 180, NULL, '{"unlimited_resumes": true, "priority_support": true, "advanced_templates": true, "discount": "25%", "password_reset": true}'),
('Annual Plan', 'annual', 79.99, 365, NULL, '{"unlimited_resumes": true, "priority_support": true, "advanced_templates": true, "discount": "33%", "password_reset": true}');
"""
# --- END OF MODIFIED SECTION ---

def create_database_connection():
    """Create a database connection to MySQL database"""
    connection = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print(f"Successfully connected to MySQL database '{DB_CONFIG['database']}'")
        return connection
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        return None

def execute_sql_statements(connection, sql_statements):
    """Execute multiple SQL statements"""
    cursor = connection.cursor()
    try:
        # Split and execute each statement
        for statement in sql_statements.strip().split(';'):
            if statement.strip():
                cursor.execute(statement + ';')
        connection.commit()
        return True
    except Error as e:
        print(f"Error executing SQL: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()

# --- THIS FUNCTION IS NOW CORRECTED TO FIX THE TypeError ---
def execute_event_sql(connection, event_sql):
    """Execute event creation SQL with special handling"""
    cursor = connection.cursor()
    try:
        # The mysql-connector requires iterating through the results for multi-statement queries
        for _ in cursor.execute(event_sql, multi=True):
            pass
        connection.commit()
        return True
    except Error as e:
        print(f"Error creating cleanup event: {e}")
        connection.rollback()
        return False
    finally:
        cursor.close()
# --- END OF CORRECTION ---

def check_tables_exist(connection):
    """Check which tables already exist"""
    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")
    existing_tables = [table[0] for table in cursor.fetchall()]
    cursor.close()
    return existing_tables

def verify_password_reset_setup(connection):
    """Verify password reset functionality is properly configured"""
    cursor = connection.cursor()
    try:
        # Check if password reset indexes exist
        cursor.execute("SHOW INDEX FROM users WHERE Key_name LIKE 'idx_password_reset%'")
        indexes = cursor.fetchall()
        
        # Check if password_reset_attempts table exists
        cursor.execute("SHOW TABLES LIKE 'password_reset_attempts'")
        attempts_table = cursor.fetchall()
        
        # Check if cleanup event exists
        cursor.execute("SHOW EVENTS LIKE 'cleanup_expired_reset_tokens'")
        cleanup_event = cursor.fetchall()
        
        print(f"Password reset indexes: {len(indexes)} found")
        print(f"Password reset attempts table: {'✓' if attempts_table else '✗'}")
        print(f"Cleanup event: {'✓' if cleanup_event else '✗'}")
        
        return len(indexes) >= 2 and attempts_table and cleanup_event
        
    except Error as e:
        print(f"Error verifying password reset setup: {e}")
        return False
    finally:
        cursor.close()

def main():
    """Main function to create database tables with password reset functionality"""
    print("=== InstantResumeAI Database Setup with Password Reset ===\n")
    
    # Create connection
    connection = create_database_connection()
    if not connection:
        return
    
    try:
        # Check existing tables
        existing_tables = check_tables_exist(connection)
        if existing_tables:
            print(f"Found existing tables: {', '.join(existing_tables)}")
        else:
            print("No existing tables found.")
        
        # Create tables and indexes
        print("\nCreating database schema with password reset functionality...")
        if execute_sql_statements(connection, SCHEMA_SQL):
            print("✓ Database schema created successfully!")
        else:
            print("✗ Failed to create database schema")
            return
        
        # Create cleanup event
        print("\nCreating password reset cleanup event...")
        if execute_event_sql(connection, CLEANUP_EVENT_SQL):
            print("✓ Password reset cleanup event created successfully!")
        else:
            print("✗ Failed to create cleanup event (may require SUPER privileges)")
        
        # Check if subscription plans already exist
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM subscription_plans")
        plan_count = cursor.fetchone()[0]
        cursor.close()
        
        if plan_count == 0:
            print("\nInserting default subscription plans...")
            if execute_sql_statements(connection, INSERT_PLANS_SQL):
                print("✓ Default subscription plans inserted successfully!")
            else:
                print("✗ Failed to insert subscription plans")
        else:
            print(f"\nFound {plan_count} existing subscription plans, skipping insertion.")
        
        # Verify password reset functionality setup
        print("\nVerifying password reset functionality setup...")
        if verify_password_reset_setup(connection):
            print("✓ Password reset functionality is properly configured!")
        else:
            print("⚠ Some password reset components may not be fully configured")
        
        # Display final table list
        final_tables = check_tables_exist(connection)
        print(f"\nDatabase setup complete! Tables in database: {', '.join(final_tables)}")
        print(f"Total tables created: {len(final_tables)}")
        
    except Error as e:
        print(f"Error during database setup: {e}")
    finally:
        if connection.is_connected():
            connection.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
