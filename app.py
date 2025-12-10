from flask import Flask, request, jsonify, session
from flask_mysqldb import MySQL
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import MySQLdb.cursors
import logging # Added for file logging

app = Flask(__name__)

# --- CONFIGURATION ---
app.secret_key = 'nexus_care_secret_key'

# Session Config
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_PERMANENT'] = True

# CORS
CORS(app, supports_credentials=True)

# Database Config
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Aamir@19may2004' 
app.config['MYSQL_DB'] = 'nexus_care_db'

mysql = MySQL(app)

# --- LOGGING (File-Based) ---
logging.basicConfig(filename='server_errors.log', level=logging.ERROR, 
                    format='%(asctime)s %(levelname)s: %(message)s')

# --- HELPER: Audit Logs ---
def log_action(user_id, action):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO audit_logs (user_id, action) VALUES (%s, %s)", (user_id, action))
        mysql.connection.commit()
        cursor.close()
    except Exception as e:
        logging.error(f"Audit Log Error: {str(e)}")

# --- ROUTES ---

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'Resident') # Default to Resident

    if not email or not password or not username:
        return jsonify({"message": "Missing fields"}), 400

    hashed_pw = generate_password_hash(password)
    
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)", 
                       (username, email, hashed_pw, role))
        mysql.connection.commit()
        
        # Get ID of new user for logging
        new_user_id = cursor.lastrowid
        log_action(new_user_id, "User Registered")
        cursor.close()
        return jsonify({"message": "Registration successful"}), 201
    except MySQLdb.IntegrityError:
        return jsonify({"message": "Email already exists"}), 409
    except Exception as e:
        logging.error(f"Register Error: {str(e)}")
        return jsonify({"message": "Internal Error"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cursor.fetchone()
        cursor.close()
        
        if user and check_password_hash(user['password_hash'], data['password']):
            session.clear()
            session['loggedin'] = True
            session['id'] = user['id']
            session['role'] = user['role']
            session['username'] = user['username']
            log_action(user['id'], "User Login")
            return jsonify({"message": "Login success", "role": user['role'], "username": user['username']})
        
        return jsonify({"message": "Invalid credentials"}), 401
    except Exception as e:
        logging.error(f"Login Error: {str(e)}")
        return jsonify({"message": "Server Error"}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

# ✅ NEW: Session Check Endpoint (Requirement)
@app.route('/check-session', methods=['GET'])
def check_session():
    if session.get('loggedin'):
        return jsonify({
            "loggedin": True, 
            "user": {
                "id": session['id'], 
                "username": session['username'], 
                "role": session['role']
            }
        })
    return jsonify({"loggedin": False}), 401

# ✅ NEW: Password Recovery Endpoint (Fixes 404 Error)
@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        email = data.get('email')
        new_password = data.get('new_password')
        
        if not email or not new_password:
            return jsonify({"message": "Missing fields"}), 400
            
        hashed_pw = generate_password_hash(new_password)
        
        cursor = mysql.connection.cursor()
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            return jsonify({"message": "User not found"}), 404
            
        # Update password
        cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (hashed_pw, email))
        mysql.connection.commit()
        
        # Log the action (handle tuple vs dict cursor)
        user_id = user[0] if isinstance(user, tuple) else user['id']
        log_action(user_id, "Password Reset")
        
        cursor.close()
        return jsonify({"message": "Password updated successfully"}), 200
        
    except Exception as e:
        logging.error(f"Reset Password Error: {str(e)}")
        return jsonify({"message": "Server Error"}), 500

@app.route('/complaints', methods=['GET', 'POST'])
def handle_complaints():
    try:
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        
        if request.method == 'POST':
            if not session.get('loggedin'): 
                return jsonify({"error": "Unauthorized"}), 401
                
            data = request.json
            cursor.execute("INSERT INTO complaints (user_id, title, description) VALUES (%s, %s, %s)",
                           (session['id'], data['title'], data['description']))
            mysql.connection.commit()
            log_action(session['id'], "Created Complaint")
            return jsonify({"message": "Complaint added"}), 201

        elif request.method == 'GET':
            if session.get('role') == 'Admin':
                cursor.execute("SELECT c.*, u.username FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.is_deleted = FALSE ORDER BY c.created_at DESC")
            else:
                cursor.execute("SELECT * FROM complaints WHERE user_id = %s AND is_deleted = FALSE ORDER BY created_at DESC", (session.get('id'),))
            complaints = cursor.fetchall()
            return jsonify(complaints)
    except Exception as e:
        logging.error(f"Complaint Error: {str(e)}")
        return jsonify({"error": "Server Error"}), 500

@app.route('/complaints/<int:id>', methods=['DELETE'])
def delete_complaint(id):
    if session.get('role') != 'Admin': return jsonify({"error": "Admins Only"}), 403
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("UPDATE complaints SET is_deleted = TRUE WHERE id = %s", (id,))
        mysql.connection.commit()
        log_action(session['id'], f"Deleted Complaint {id}")
        return jsonify({"message": "Deleted"})
    except Exception as e:
        logging.error(f"Delete Error: {str(e)}")
        return jsonify({"error": "Failed to delete"}), 500

# ✅ Update Status Endpoint (Admin Only)
@app.route('/complaints/<int:id>/status', methods=['PUT'])
def update_complaint_status(id):
    if session.get('role') != 'Admin': return jsonify({"error": "Admins Only"}), 403
    data = request.json
    new_status = data.get('status')
    
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("UPDATE complaints SET status = %s WHERE id = %s", (new_status, id))
        mysql.connection.commit()
        log_action(session['id'], f"Updated Complaint {id} to {new_status}")
        return jsonify({"message": "Status Updated"})
    except Exception as e:
        logging.error(f"Update Status Error: {str(e)}")
        return jsonify({"error": "Failed to update"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)