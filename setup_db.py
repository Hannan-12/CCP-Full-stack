from flask import Flask
from flask_mysqldb import MySQL

app = Flask(__name__)

# --- CONFIGURATION ---
# REPLACE 'your_password' with the password you set in the terminal just now!
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Aamir@19may2004' 
app.config['MYSQL_DB'] = 'nexus_care_db'
app.config['MYSQL_HOST'] = 'localhost'

mysql = MySQL(app)

def create_tables():
    with app.app_context():
        try:
            # 1. Test Connection
            cursor = mysql.connection.cursor()
            print("✅ CONNECTION SUCCESSFUL! MySQL is reachable.")

            # 2. Create Users Table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('Admin', 'Resident', 'Security', 'Medical') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("✅ 'users' table created.")

            # 3. Create Complaints Table (Your Chosen Module)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS complaints (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    title VARCHAR(100),
                    description TEXT,
                    status ENUM('Pending', 'Resolved', 'Dismissed') DEFAULT 'Pending',
                    is_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
            print("✅ 'complaints' table created.")

            # 4. Create Audit Logs (Security Requirement)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    action VARCHAR(255),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("✅ 'audit_logs' table created.")

            mysql.connection.commit()
            cursor.close()
            print("\n🎉 SYSTEM READY: Database is fully set up for NexusCare.")

        except Exception as e:
            print(f"\n❌ CONNECTION FAILED: {e}")
            print("Tip: Check if your password is correct or if MySQL is running.")

if __name__ == '__main__':
    create_tables()