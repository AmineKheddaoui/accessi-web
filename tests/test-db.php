<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

try {
    $config = include(__DIR__ . '/../backend/php/config.php');
    
    $response = [
        'config' => [
            'db_host' => $config['db_host'],
            'db_name' => $config['db_name'],
            'db_user' => $config['db_user'],
            'password_set' => !empty($config['db_pass'])
        ]
    ];
    
    // Test de connexion
    $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']}";
    
    $response['dsn'] = $dsn;
    
    $pdo = new PDO(
        $dsn,
        $config['db_user'],
        $config['db_pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
        ]
    );
    
    $response['connection'] = 'SUCCESS';
    
    // Test d'une requête simple
    $stmt = $pdo->query('SELECT VERSION() as version');
    $version = $stmt->fetch();
    
    $response['mysql_version'] = $version['version'];
    
    // Test des tables existantes
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $response['existing_tables'] = $tables;
    $response['success'] = true;
    $response['message'] = 'Connexion base de données réussie';
    
} catch (PDOException $e) {
    $response = [
        'success' => false,
        'error' => 'PDO Error',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'config_loaded' => isset($config),
        'dsn_attempted' => isset($dsn) ? $dsn : 'N/A'
    ];
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => 'General Error',
        'message' => $e->getMessage(),
        'config_loaded' => isset($config)
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>