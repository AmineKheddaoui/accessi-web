<?php
// Désactiver l'affichage des erreurs pour ne pas casser le JSON
error_reporting(0);
ini_set('display_errors', 0);

require_once 'includes/database.php';
require_once 'includes/emailer.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    // Validation des données requises
    $requiredFields = ['offer_type', 'company_name', 'contact_name', 'email', 'website_url'];
    foreach ($requiredFields as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("Le champ {$field} est requis");
        }
    }

    // Validation email
    if (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Format d'email invalide");
    }

    // Validation URL
    if (!filter_var($_POST['website_url'], FILTER_VALIDATE_URL)) {
        throw new Exception("Format d'URL invalide");
    }

    // Validation offer_type
    $validOffers = ['essential', 'business', 'enterprise'];
    if (!in_array($_POST['offer_type'], $validOffers)) {
        throw new Exception("Type d'offre invalide");
    }

    // Prix selon l'offre
    $prices = [
        'essential' => 199.00,
        'business' => 399.00,
        'enterprise' => 1000.00
    ];

    // Préparation des données
    $orderData = [
        'offer_type' => $_POST['offer_type'],
        'company_name' => trim($_POST['company_name']),
        'contact_name' => trim($_POST['contact_name']),
        'email' => trim($_POST['email']),
        'phone' => trim($_POST['phone'] ?? ''),
        'website_url' => trim($_POST['website_url']),
        'current_issues' => trim($_POST['current_issues'] ?? ''),
        'accessibility_goals' => trim($_POST['accessibility_goals'] ?? ''),
        'timeline' => trim($_POST['timeline'] ?? ''),
        'budget_range' => trim($_POST['budget_range'] ?? ''),
        'additional_info' => trim($_POST['additional_info'] ?? ''),
        'total_price' => $prices[$_POST['offer_type']]
    ];

    // Connexion base de données
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Erreur de connexion à la base de données");
    }

    // Création de la table si nécessaire
    $database->createOrdersTable();

    // Insertion de la commande
    $query = "INSERT INTO orders (
        offer_type, company_name, contact_name, email, phone, 
        website_url, current_issues, accessibility_goals, 
        timeline, budget_range, additional_info, total_price
    ) VALUES (
        :offer_type, :company_name, :contact_name, :email, :phone,
        :website_url, :current_issues, :accessibility_goals,
        :timeline, :budget_range, :additional_info, :total_price
    )";

    $stmt = $db->prepare($query);
    
    $result = $stmt->execute([
        ':offer_type' => $orderData['offer_type'],
        ':company_name' => $orderData['company_name'],
        ':contact_name' => $orderData['contact_name'],
        ':email' => $orderData['email'],
        ':phone' => $orderData['phone'],
        ':website_url' => $orderData['website_url'],
        ':current_issues' => $orderData['current_issues'],
        ':accessibility_goals' => $orderData['accessibility_goals'],
        ':timeline' => $orderData['timeline'],
        ':budget_range' => $orderData['budget_range'],
        ':additional_info' => $orderData['additional_info'],
        ':total_price' => $orderData['total_price']
    ]);

    if (!$result) {
        throw new Exception("Erreur lors de l'enregistrement de la commande");
    }

    $orderId = $db->lastInsertId();
    $orderData['id'] = $orderId;

    // Envoi des emails
    $emailer = new Emailer();
    
    // Email de confirmation client
    $clientEmailSent = $emailer->sendOrderConfirmation($orderData);
    
    // Email de notification admin
    $adminEmailSent = $emailer->sendAdminNotification($orderData);

    // Réponse de succès
    echo json_encode([
        'success' => true,
        'message' => 'Commande enregistrée avec succès',
        'order_id' => $orderId,
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
?>