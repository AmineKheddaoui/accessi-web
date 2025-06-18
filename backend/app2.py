from flask import Flask, request, jsonify, render_template

app = Flask(__name__, template_folder='templates')

# Flask-Mail configuration (optionnel pour les tests)
app.config['MAIL_SERVER'] = 'smtp.example.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'user@example.com'
app.config['MAIL_PASSWORD'] = 'password'
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@example.com'

# Liste des commandes en mémoire
orders = []

@app.route('/')
def hello_world():
    return '''
    <h1>🎉 Backend Accessi-web</h1>
    <p>Backend fonctionnel sans WeasyPrint !</p>
    <ul>
        <li><a href="/order">📝 Test commande</a></li>
        <li><a href="/admin">⚙️ Admin (sans PDF)</a></li>
        <li><a href="/api/orders">📊 Voir commandes</a></li>
    </ul>
    '''

@app.route('/order')
def order_page():
    return render_template('order.html')

@app.route('/submit_order', methods=['POST'])
def submit_order():
    order_data = {
        "name": request.form.get('name'),
        "email": request.form.get('email'),
        "shipping_address": request.form.get('shipping_address'),
        "product": request.form.get('product'),
        "quantity": request.form.get('quantity'),
        "payment_status": "mock_success"
    }
    orders.append(order_data)
    
    print(f"📦 Nouvelle commande reçue : {order_data['name']} - {order_data['product']}")
    
    return jsonify({
        'message': 'Commande reçue avec succès !', 
        'order': order_data,
        'order_id': len(orders)
    })

@app.route('/admin')
def admin_panel():
    return f'''
    <h1>⚙️ Panel Admin Simplifié</h1>
    <p>Total commandes : {len(orders)}</p>
    <h2>📋 Commandes reçues :</h2>
    <ul>
    ''' + ''.join([f'<li>{order["name"]} - {order["product"]} ({order["email"]})</li>' for order in orders]) + '''
    </ul>
    <p><em>Note : Génération PDF désactivée (WeasyPrint non installé)</em></p>
    <a href="/">← Retour accueil</a>
    '''

@app.route('/api/orders')
def get_orders():
    return jsonify({'orders': orders, 'total': len(orders)})

# Routes pour compatibilité (sans PDF)
@app.route('/admin/generate_quote_pdf')
def generate_quote_pdf():
    return jsonify({
        'error': 'PDF désactivé', 
        'message': 'WeasyPrint non installé. Utilisez app.py avec les dépendances système.'
    })

@app.route('/admin/generate_invoice_pdf')
def generate_invoice_pdf():
    return jsonify({
        'error': 'PDF désactivé',
        'message': 'WeasyPrint non installé. Utilisez app.py avec les dépendances système.'
    })

if __name__ == '__main__':
    print("🚀 Lancement du backend simplifié...")
    print("📍 Accessible sur : http://localhost:5000")
    print("💡 Les formulaires frontend fonctionneront parfaitement !")
    app.run(debug=True)