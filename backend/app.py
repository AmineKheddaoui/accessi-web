import os
from flask import Flask, request, jsonify, render_template, send_file, redirect, url_for
from flask_mail import Mail, Message
from io import BytesIO
import sqlite3
from dotenv import load_dotenv

load_dotenv()

# WeasyPrint is not available, PDF generation will be disabled
WEASYPRINT_ENABLED = False

app = Flask(__name__, template_folder='templates')

# Configuration from environment variables
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() in ['true', '1', 't']
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'False').lower() in ['true', '1', 't']
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'your-app-password')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'your-email@gmail.com')
app.config['ADMIN_EMAIL'] = os.getenv('ADMIN_EMAIL', 'contact@accessi-web.com')
app.config['DATABASE'] = os.getenv('DATABASE', 'orders.db')

mail = Mail(app)

def get_db_connection():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with app.app_context():
        conn = get_db_connection()
        with conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT,
                    company TEXT,
                    shipping_address TEXT NOT NULL,
                    product TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    project_description TEXT,
                    deadline TEXT,
                    payment_status TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
        conn.close()

@app.cli.command('initdb')
def initdb_command():
    """Creates the database tables."""
    init_db()
    print('Initialized the database.')

@app.route('/')
def hello_world():
    return send_file('../index.html')

@app.route('/styles.css')
def styles():
    return send_file('../styles.css')

@app.route('/script.js')
def script():
    return send_file('../script.js')

@app.route('/favicon.svg')
def favicon_svg():
    return send_file('../favicon.svg')

@app.route('/favicon.png')
def favicon_png():
    try:
        return send_file('../favicon.png')
    except FileNotFoundError:
        return '', 404

@app.route('/apple-touch-icon.png')
def apple_touch_icon():
    try:
        return send_file('../apple-touch-icon.png')
    except FileNotFoundError:
        return '', 404

@app.route('/logo.svg')
def logo():
    return send_file('../logo.svg')

@app.route('/images/<path:filename>')
def images(filename):
    return send_file(f'../images/{filename}')

@app.route('/order')
def order_page():
    return render_template('order.html')

@app.route('/order/essential')
def order_essential():
    return send_file('order/essential.html')

@app.route('/order/business')
def order_business():
    return send_file('order/business.html')

@app.route('/order/enterprise')
def order_enterprise():
    return send_file('order/enterprise.html')

@app.route('/submit_order', methods=['POST'])
def submit_order():
    name = request.form.get('name')
    email = request.form.get('email')
    phone = request.form.get('phone', '')
    company = request.form.get('company', '')
    shipping_address = request.form.get('shipping_address')
    product = request.form.get('product')
    quantity = request.form.get('quantity')
    project_description = request.form.get('project_description', '')
    deadline = request.form.get('deadline', '')
    payment_status = "mock_success"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO orders 
           (name, email, phone, company, shipping_address, product, quantity, project_description, deadline, payment_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (name, email, phone, company, shipping_address, product, quantity, project_description, deadline, payment_status)
    )
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()

    order_data = {
        "id": order_id,
        "name": name,
        "email": email,
        "phone": phone,
        "company": company,
        "shipping_address": shipping_address,
        "product": product,
        "quantity": quantity,
        "project_description": project_description,
        "deadline": deadline,
        "payment_status": payment_status
    }

    try:
        # Test SMTP connection first
        app.logger.info(f"Attempting to send emails for order #{order_id}")
        app.logger.info(f"SMTP Server: {app.config['MAIL_SERVER']}:{app.config['MAIL_PORT']}")
        app.logger.info(f"Using TLS: {app.config['MAIL_USE_TLS']}, Using SSL: {app.config['MAIL_USE_SSL']}")
        
        # Send email to admin
        admin_subject = f"Nouvelle commande #{order_id} - {product}"
        admin_body = f"""
Nouvelle commande reçue !

Détails de la commande :
- ID: {order_id}
- Produit: {product}
- Client: {name}
- Email: {email}
- Téléphone: {phone if phone else 'Non renseigné'}
- Entreprise: {company if company else 'Non renseignée'}
- Adresse: {shipping_address}
- Description: {project_description if project_description else 'Aucune'}
- Date souhaitée: {deadline if deadline else 'Non spécifiée'}
- Statut: {payment_status}

Date: {order_data.get('created_at', 'Maintenant')}
        """
        
        admin_msg = Message(
            subject=admin_subject,
            recipients=[app.config['ADMIN_EMAIL']],
            body=admin_body
        )
        
        app.logger.info(f"Sending admin email to: {app.config['ADMIN_EMAIL']}")
        mail.send(admin_msg)
        app.logger.info("Admin email sent successfully")
        
        # Send confirmation email to customer
        customer_subject = f"Confirmation de votre commande #{order_id} - Accessi-web"
        customer_body = f"""
Bonjour {name},

Nous avons bien reçu votre commande et nous vous en remercions !

Récapitulatif de votre commande :
- Numéro de commande: #{order_id}
- Produit: {product}
- Montant: {'150€' if 'Essential' in product else '350€' if 'Business' in product else 'Sur devis'}
- Date: {order_data.get('created_at', 'Maintenant')}

Prochaines étapes :
1. Notre équipe va analyser votre demande sous 24h
2. Vous recevrez un email de suivi avec les détails
3. Nous commencerons l'audit selon le délai annoncé

Besoin d'aide ?
- Email: {app.config['ADMIN_EMAIL']}
- Support disponible du lundi au vendredi

Merci de votre confiance !

L'équipe Accessi-web
{app.config['ADMIN_EMAIL']}
        """
        
        customer_msg = Message(
            subject=customer_subject,
            recipients=[email],
            body=customer_body
        )
        
        app.logger.info(f"Sending customer email to: {email}")
        mail.send(customer_msg)
        app.logger.info("Customer email sent successfully")
        
        app.logger.info(f"All emails sent successfully for order #{order_id}: {product} - {name} ({email})")
        
    except Exception as e:
        app.logger.error(f"Error sending email: {e}")
        app.logger.error(f"Error type: {type(e).__name__}")
        app.logger.error(f"Error details: {str(e)}")
        # Continue even if email fails

    return redirect(url_for('success', order_id=order_id))

@app.route('/success')
def success():
    # Récupérer l'ID de la commande depuis les paramètres de l'URL
    order_id = request.args.get('order_id')
    
    if order_id:
        # Récupérer les détails de la commande depuis la base de données
        conn = get_db_connection()
        order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
        conn.close()
        
        if order:
            # Convertir en dictionnaire pour le template
            order_dict = dict(order)
            return render_template('success.html', order=order_dict)
    
    # Si pas d'ID ou commande non trouvée, afficher une page de succès générique
    return render_template('success.html', order={
        'id': 'N/A',
        'product': 'Commande',
        'name': 'Client',
        'email': 'email@example.com',
        'created_at': 'Maintenant'
    })

@app.route('/admin')
def admin_panel():
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('admin.html', orders=orders, weasyprint_enabled=WEASYPRINT_ENABLED)

@app.route('/admin/generate_quote_pdf')
def generate_quote_pdf():
    if not WEASYPRINT_ENABLED:
        return jsonify({'error': 'PDF generation is disabled. WeasyPrint is not installed.'}), 500
        
    return jsonify({'error': 'PDF generation is disabled. WeasyPrint is not installed.'}), 500

@app.route('/admin/generate_invoice_pdf')
def generate_invoice_pdf():
    if not WEASYPRINT_ENABLED:
        return jsonify({'error': 'PDF generation is disabled. WeasyPrint is not installed.'}), 500

    return jsonify({'error': 'PDF generation is disabled. WeasyPrint is not installed.'}), 500

@app.route('/business.html')
def business_page():
    return send_file('../business.html')

@app.route('/enterprise.html')
def enterprise_page():
    return send_file('../enterprise.html')

@app.route('/essential.html')
def essential_page():
    return send_file('../essential.html')

@app.route('/404.html')
def error_404_page():
    return send_file('../404.html')

@app.route('/blog.html')
def blog_page():
    return send_file('../blog.html')

@app.route('/logos.html')
def logos_page():
    return send_file('../logos.html')

@app.route('/robots.txt')
def robots():
    return send_file('../robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_file('../sitemap.xml')

if __name__ == '__main__':
    # For development server only. In production, use a WSGI server like Gunicorn.
    # To initialize the database in production, run "flask initdb".
    if not os.path.exists(app.config['DATABASE']):
        init_db()
    app.run(debug=True)
