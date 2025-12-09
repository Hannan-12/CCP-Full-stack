from flask import Flask
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash

app = Flask(__name__)

# --- CONFIGURATION ---
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Aamir@19may2004' # Your Password
app.config['MYSQL_DB'] = 'nexus_care_db'
app.config['MYSQL_HOST'] = 'localhost'

mysql = MySQL(app)

def force_create_admin():
    with app.app_context():
        cursor = mysql.connection.cursor()
        
        # 1. Delete existing admin if any (to prevent duplicates)
        cursor.execute("DELETE FROM users WHERE email = 'admin@nexus.com'")
        
        # 2. Create the hash
        raw_password = "adminpass"
        hashed_pw = generate_password_hash(raw_password)
        
        # 3. Insert the Admin
        print(f"Creating Admin with hash: {hashed_pw[:10]}...")
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ('AdminUser', 'admin@nexus.com', %s, 'Admin')
        """, (hashed_pw,))
        
        mysql.connection.commit()
        cursor.close()
        print("\n✅ SUCCESS: Admin user created manually.")
        print("📧 Email: admin@nexus.com")
        print("🔑 Password: adminpass")

if __name__ == '__main__':
    force_create_admin()