import unittest
import json
from app import app, orders # Import orders here for setUp and tests

class BasicTests(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        app.config['MAIL_SUPPRESS_SEND'] = True  # Suppress emails during tests
        self.app = app.test_client()
        orders.clear() # Clear the global orders list before each test

    def test_order_page_loads(self):
        response = self.app.get('/order', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        # Check for a more specific element from order.html if possible
        # For now, checking for form related content
        self.assertIn(b'<form action="/submit_order" method="POST">', response.data)

    def test_submit_order(self):
        response = self.app.post('/submit_order', data=dict(
            name='Test User',
            email='test@example.com',
            shipping_address='123 Test St',
            product='Test Product',
            quantity='1'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Order received!')
        self.assertEqual(data['order']['name'], 'Test User')
        self.assertEqual(data['order']['payment_status'], 'mock_success')

        # Check if the order was added to the 'orders' list
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]['name'], 'Test User')
        self.assertEqual(orders[0]['email'], 'test@example.com')


    def test_admin_page_loads(self):
        response = self.app.get('/admin', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Admin Panel', response.data)
        self.assertIn(b'Generate Sample Quote PDF', response.data) # Check for link text

    def test_generate_quote_pdf(self):
        response = self.app.get('/admin/generate_quote_pdf', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/pdf')
        self.assertTrue(response.headers['Content-Disposition'].startswith("attachment; filename=quote.pdf"))

    def test_generate_invoice_pdf(self):
        response = self.app.get('/admin/generate_invoice_pdf', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/pdf')
        self.assertTrue(response.headers['Content-Disposition'].startswith("attachment; filename=invoice.pdf"))

if __name__ == "__main__":
    unittest.main()
