<?php
class Emailer {
    private $smtp_host;
    private $smtp_port;
    private $smtp_user;
    private $smtp_pass;
    private $from_email;
    private $admin_email;

    public function __construct() {
        $config = include(__DIR__ . '/../config.php');
        $this->smtp_host = $config['smtp_host'];
        $this->smtp_port = $config['smtp_port'];
        $this->smtp_user = $config['smtp_user'];
        $this->smtp_pass = $config['smtp_pass'];
        $this->from_email = $config['from_email'];
        $this->admin_email = $config['admin_email'];
    }

    public function sendOrderConfirmation($orderData) {
        $to = $orderData['email'];
        $subject = "Confirmation de commande - " . ucfirst($orderData['offer_type']);
        
        $message = $this->getOrderConfirmationTemplate($orderData);
        
        return $this->sendEmail($to, $subject, $message);
    }

    public function sendAdminNotification($orderData) {
        $to = $this->admin_email;
        $subject = "Nouvelle commande - " . ucfirst($orderData['offer_type']);
        
        $message = $this->getAdminNotificationTemplate($orderData);
        
        return $this->sendEmail($to, $subject, $message);
    }

    private function sendEmail($to, $subject, $message) {
        $headers = array(
            'From' => $this->from_email,
            'Reply-To' => $this->from_email,
            'X-Mailer' => 'PHP/' . phpversion(),
            'Content-Type' => 'text/html; charset=UTF-8'
        );

        // Configuration SMTP simple avec mail()
        $headers_string = '';
        foreach ($headers as $key => $value) {
            $headers_string .= $key . ': ' . $value . "\r\n";
        }

        return mail($to, $subject, $message, $headers_string);
    }

    private function getOrderConfirmationTemplate($orderData) {
        $prices = [
            'essential' => 199,
            'business' => 399,
            'enterprise' => 1000
        ];
        
        $price = $prices[$orderData['offer_type']] ?? 0;
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(45deg, #00f5ff, #ff00aa); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .footer { padding: 20px; text-align: center; color: #666; }
                .price { font-size: 24px; font-weight: bold; color: #00f5ff; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Accessi-web</h1>
                    <p>Confirmation de votre commande</p>
                </div>
                <div class='content'>
                    <p>Bonjour " . htmlspecialchars($orderData['contact_name']) . ",</p>
                    <p>Nous avons bien reçu votre commande pour l'offre <strong>" . ucfirst($orderData['offer_type']) . "</strong>.</p>
                    
                    <h3>Détails de votre commande :</h3>
                    <ul>
                        <li><strong>Entreprise :</strong> " . htmlspecialchars($orderData['company_name']) . "</li>
                        <li><strong>Contact :</strong> " . htmlspecialchars($orderData['contact_name']) . "</li>
                        <li><strong>Email :</strong> " . htmlspecialchars($orderData['email']) . "</li>
                        <li><strong>Site web :</strong> " . htmlspecialchars($orderData['website_url']) . "</li>
                        <li><strong>Prix :</strong> <span class='price'>{$price}€</span></li>
                    </ul>
                    
                    <p>Nous vous contacterons sous 24h pour planifier votre audit d'accessibilité RGAA.</p>
                    <p>Merci de nous faire confiance !</p>
                </div>
                <div class='footer'>
                    <p>Accessi-web - Expert en Accessibilité Numérique<br>
                    Email: contact@accessi-web.com</p>
                </div>
            </div>
        </body>
        </html>";
    }

    private function getAdminNotificationTemplate($orderData) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #333; color: white; padding: 20px; }
                .content { padding: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Nouvelle commande reçue</h1>
                </div>
                <div class='content'>
                    <div class='field'>
                        <div class='label'>Offre :</div>
                        " . ucfirst($orderData['offer_type']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Entreprise :</div>
                        " . htmlspecialchars($orderData['company_name']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Contact :</div>
                        " . htmlspecialchars($orderData['contact_name']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Email :</div>
                        " . htmlspecialchars($orderData['email']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Téléphone :</div>
                        " . htmlspecialchars($orderData['phone']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Site web :</div>
                        " . htmlspecialchars($orderData['website_url']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Problèmes actuels :</div>
                        " . nl2br(htmlspecialchars($orderData['current_issues'])) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Objectifs :</div>
                        " . nl2br(htmlspecialchars($orderData['accessibility_goals'])) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Délais :</div>
                        " . htmlspecialchars($orderData['timeline']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Budget :</div>
                        " . htmlspecialchars($orderData['budget_range']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Informations supplémentaires :</div>
                        " . nl2br(htmlspecialchars($orderData['additional_info'])) . "
                    </div>
                </div>
            </div>
        </body>
        </html>";
    }
}
?>