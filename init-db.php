<?php
/**
 * Script d'initialisation de la base de données
 * Exécuter une seule fois pour créer la base et les tables
 */

require_once 'includes/database.php';

echo "=== Initialisation de la base de données Accessi-web ===\n\n";

try {
    // Création de l'instance de base de données
    $database = new Database();
    
    // Test de connexion
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception("Impossible de se connecter à la base de données");
    }
    
    echo "✅ Connexion à la base de données réussie\n";
    
    // Création de la table orders
    $result = $database->createOrdersTable();
    
    if ($result) {
        echo "✅ Table 'orders' créée avec succès\n";
    } else {
        echo "❌ Erreur lors de la création de la table 'orders'\n";
    }
    
    // Vérification de la structure de la table
    $query = "DESCRIBE orders";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\n📋 Structure de la table 'orders':\n";
    foreach ($columns as $column) {
        echo "  - {$column['Field']} ({$column['Type']}) " . 
             ($column['Null'] === 'NO' ? "NOT NULL" : "NULL") . 
             ($column['Key'] === 'PRI' ? " PRIMARY KEY" : "") . 
             ($column['Extra'] ? " {$column['Extra']}" : "") . "\n";
    }
    
    // Test d'insertion d'une commande de test
    echo "\n🧪 Test d'insertion d'une commande exemple...\n";
    
    $testOrder = [
        ':offer_type' => 'business',
        ':company_name' => 'Test Company',
        ':contact_name' => 'Test User',
        ':email' => 'test@example.com',
        ':phone' => '0123456789',
        ':website_url' => 'https://test-site.com',
        ':current_issues' => 'Site pas accessible',
        ':accessibility_goals' => 'Conformité RGAA complète',
        ':timeline' => '1month',
        ':budget_range' => '',
        ':additional_info' => 'Commande de test',
        ':total_price' => 399.00
    ];
    
    $insertQuery = "INSERT INTO orders (
        offer_type, company_name, contact_name, email, phone, 
        website_url, current_issues, accessibility_goals, 
        timeline, budget_range, additional_info, total_price
    ) VALUES (
        :offer_type, :company_name, :contact_name, :email, :phone,
        :website_url, :current_issues, :accessibility_goals,
        :timeline, :budget_range, :additional_info, :total_price
    )";
    
    $stmt = $db->prepare($insertQuery);
    $insertResult = $stmt->execute($testOrder);
    
    if ($insertResult) {
        $testOrderId = $db->lastInsertId();
        echo "✅ Commande de test insérée avec l'ID: {$testOrderId}\n";
        
        // Suppression de la commande de test
        $deleteQuery = "DELETE FROM orders WHERE id = :id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->execute([':id' => $testOrderId]);
        echo "🗑️ Commande de test supprimée\n";
    } else {
        echo "❌ Erreur lors de l'insertion de la commande de test\n";
    }
    
    echo "\n🎉 Initialisation terminée avec succès !\n";
    echo "Votre système de commandes PHP est prêt à fonctionner.\n\n";
    
    echo "📌 Prochaines étapes :\n";
    echo "1. Vérifiez les paramètres SMTP dans config.php\n";
    echo "2. Testez les formulaires de commande\n";
    echo "3. Surveillez les logs d'erreurs PHP\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
?>