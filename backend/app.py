from flask import Flask, request, jsonify, render_template, send_file
from flask_mail import Mail, Message
from weasyprint import HTML
from io import BytesIO

app = Flask(__name__, template_folder='templates')

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'smtp.example.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'user@example.com'  # Placeholder
app.config['MAIL_PASSWORD'] = 'password'          # Placeholder
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@example.com'

mail = Mail(app)

orders = []

@app.route('/')
def hello_world():
    return 'Hello, World! This is the backend.'

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

    try:
        msg_subject = "New Order Received"
        msg_recipients = ['amine@accessi-web.com']

        # Format order details for email body
        email_body_parts = [f"New order received:"]
        for key, value in order_data.items():
            email_body_parts.append(f"{key.replace('_', ' ').title()}: {value}")
        msg_body = "\n".join(email_body_parts)

        msg = Message(subject=msg_subject, recipients=msg_recipients, body=msg_body)
        mail.send(msg)
    except Exception as e:
        print(f"Error sending email: {e}")
        # Optionally, log this error to a file or a logging service

    return jsonify({'message': 'Order received!', 'order': order_data})

@app.route('/admin')
def admin_panel():
    return render_template('admin.html')

@app.route('/admin/generate_quote_pdf')
def generate_quote_pdf():
    mock_quote = {'id': 'Q2024001', 'customer_name': 'Test Customer', 'amount': 150.75}
    html_string = render_template('quote_template.html', quote=mock_quote)
    pdf = HTML(string=html_string).write_pdf()
    return send_file(
        BytesIO(pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='quote.pdf'
    )

@app.route('/admin/generate_invoice_pdf')
def generate_invoice_pdf():
    mock_invoice = {'id': 'I2024001', 'customer_name': 'Test Customer', 'amount': 150.75, 'status': 'Paid'}
    html_string = render_template('invoice_template.html', invoice=mock_invoice)
    pdf = HTML(string=html_string).write_pdf()
    return send_file(
        BytesIO(pdf),
        mimetype='application/pdf',
        as_attachment=True,
        download_name='invoice.pdf'
    )

if __name__ == '__main__':
    app.run(debug=True)
