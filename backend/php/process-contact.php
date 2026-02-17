<?php
// Désactiver l'affichage des erreurs pour ne pas casser le JSON
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/emailer.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Validation des données requises
    $requiredFields = ['contact_name', 'contact_email', 'contact_subject', 'contact_message'];
    foreach ($requiredFields as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("Le champ {$field} est requis");
        }
    }

    // Validation email
    if (!filter_var($_POST['contact_email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Format d'email invalide");
    }

    // Validation sujet
    $validSubjects = ['devis', 'info', 'urgence', 'formation', 'autre'];
    if (!in_array($_POST['contact_subject'], $validSubjects)) {
        throw new Exception("Sujet invalide");
    }

    // Préparation des données
    $contactData = [
        'contact_name' => trim($_POST['contact_name']),
        'contact_email' => trim($_POST['contact_email']),
        'contact_phone' => trim($_POST['contact_phone'] ?? ''),
        'contact_subject' => $_POST['contact_subject'],
        'contact_message' => trim($_POST['contact_message'])
    ];

    // Connexion base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Erreur de connexion à la base de données");
    }

    // Création de la table contacts si nécessaire
    $createTableQuery = "CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_phone VARCHAR(50),
        contact_subject VARCHAR(50) NOT NULL,
        contact_message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $db->exec($createTableQuery);

    // Insertion du message de contact
    $query = "INSERT INTO contacts (
        contact_name, contact_email, contact_phone, 
        contact_subject, contact_message
    ) VALUES (
        :contact_name, :contact_email, :contact_phone,
        :contact_subject, :contact_message
    )";

    $stmt = $db->prepare($query);
    
    $result = $stmt->execute([
        ':contact_name' => $contactData['contact_name'],
        ':contact_email' => $contactData['contact_email'],
        ':contact_phone' => $contactData['contact_phone'],
        ':contact_subject' => $contactData['contact_subject'],
        ':contact_message' => $contactData['contact_message']
    ]);

    if (!$result) {
        throw new Exception("Erreur lors de l'enregistrement du message");
    }

    $contactId = $db->lastInsertId();
    $contactData['id'] = $contactId;

    // Envoi des emails
    $emailer = new ContactEmailer();
    
    // Email de confirmation client
    $clientEmailSent = $emailer->sendContactConfirmation($contactData);
    
    // Email de notification admin
    $adminEmailSent = $emailer->sendContactNotification($contactData);

    // Réponse de succès
    echo json_encode([
        'success' => true,
        'message' => 'Message envoyé avec succès',
        'contact_id' => $contactId,
        'emails_sent' => [
            'client' => $clientEmailSent,
            'admin' => $adminEmailSent
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données: ' . $e->getMessage()
    ]);
}

// Classe pour gérer les emails de contact
class ContactEmailer {
    private $smtp_host;
    private $smtp_port;
    private $smtp_user;
    private $smtp_pass;
    private $from_email;
    private $admin_email;

    public function __construct() {
        $config = include(__DIR__ . '/config.php');
        $this->smtp_host = $config['smtp_host'];
        $this->smtp_port = $config['smtp_port'];
        $this->smtp_user = $config['smtp_user'];
        $this->smtp_pass = $config['smtp_pass'];
        $this->from_email = $config['from_email'];
        $this->admin_email = $config['admin_email'];
    }

    public function sendContactConfirmation($contactData) {
        $to = $contactData['contact_email'];
        $subject = "Message reçu - Accessi-web";
        
        $message = $this->getContactConfirmationTemplate($contactData);
        
        return $this->sendEmail($to, $subject, $message);
    }

    public function sendContactNotification($contactData) {
        $to = $this->admin_email;
        $subject = "Nouveau message de contact - " . ucfirst($contactData['contact_subject']);
        
        $message = $this->getContactNotificationTemplate($contactData);
        
        return $this->sendEmail($to, $subject, $message);
    }

    private function sendEmail($to, $subject, $message) {
        require_once __DIR__ . '/includes/smtp.php';

        $smtp = new SmtpClient(
            $this->smtp_host,
            $this->smtp_port,
            $this->smtp_user,
            $this->smtp_pass
        );

        $result = $smtp->send($this->from_email, $to, $subject, $message);

        if (!$result) {
            error_log("ContactEmailer SMTP error: " . $smtp->getLastError());
        }

        return $result;
    }

    private function getContactConfirmationTemplate($contactData) {
        $subjectLabels = [
            'devis' => 'Demande de devis',
            'info' => 'Informations générales',
            'urgence' => 'Projet urgent',
            'formation' => 'Formation équipe',
            'autre' => 'Autre demande'
        ];
        
        $subjectLabel = $subjectLabels[$contactData['contact_subject']] ?? 'Demande';
        
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
                .highlight { color: #00f5ff; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Accessi-web</h1>
                    <p>Votre message a été reçu</p>
                </div>
                <div class='content'>
                    <p>Bonjour " . htmlspecialchars($contactData['contact_name']) . ",</p>
                    <p>Nous avons bien reçu votre message concernant : <span class='highlight'>{$subjectLabel}</span></p>
                    
                    <p><strong>Votre message :</strong></p>
                    <div style='background: white; padding: 15px; border-left: 4px solid #00f5ff; margin: 15px 0;'>
                        " . nl2br(htmlspecialchars($contactData['contact_message'])) . "
                    </div>
                    
                    <p>Nous vous répondrons sous <strong>24 heures</strong> à l'adresse : " . htmlspecialchars($contactData['contact_email']) . "</p>
                    
                    <p>En attendant, n'hésitez pas à consulter :</p>
                    <ul>
                        <li>Nos offres sur <a href='https://accessi-web.com'>accessi-web.com</a></li>
                        <li>Notre profil LinkedIn</li>
                        <li>Nos articles sur l'accessibilité</li>
                    </ul>
                    
                    <p>Merci de votre confiance !</p>
                </div>
                <div class='footer'>
                    <p>Accessi-web - Expert en Accessibilité Numérique<br>
                    Email: contact@accessi-web.com | Tél: +33 1 23 45 67 89</p>
                </div>
            </div>
        </body>
        </html>";
    }

    private function getContactNotificationTemplate($contactData) {
        $subjectLabels = [
            'devis' => 'Demande de devis',
            'info' => 'Informations générales',
            'urgence' => 'Projet urgent',
            'formation' => 'Formation équipe',
            'autre' => 'Autre demande'
        ];
        
        $subjectLabel = $subjectLabels[$contactData['contact_subject']] ?? 'Demande';
        $urgency = $contactData['contact_subject'] === 'urgence' ? '🚨 URGENT - ' : '';
        
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
                .urgent { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>{$urgency}Nouveau message de contact</h1>
                    <p>Sujet : {$subjectLabel}</p>
                </div>
                <div class='content'>
                    " . ($contactData['contact_subject'] === 'urgence' ? "<div class='urgent'><strong>⚠️ PROJET URGENT</strong> - Traiter en priorité</div>" : "") . "
                    
                    <div class='field'>
                        <div class='label'>Nom :</div>
                        " . htmlspecialchars($contactData['contact_name']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Email :</div>
                        " . htmlspecialchars($contactData['contact_email']) . "
                    </div>
                    <div class='field'>
                        <div class='label'>Téléphone :</div>
                        " . htmlspecialchars($contactData['contact_phone'] ?: 'Non renseigné') . "
                    </div>
                    <div class='field'>
                        <div class='label'>Sujet :</div>
                        {$subjectLabel}
                    </div>
                    <div class='field'>
                        <div class='label'>Message :</div>
                        <div style='background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #00f5ff;'>
                            " . nl2br(htmlspecialchars($contactData['contact_message'])) . "
                        </div>
                    </div>
                    
                    <p><strong>Action requise :</strong> Répondre sous 24h</p>
                </div>
            </div>
        </body>
        </html>";
    }
}
?>