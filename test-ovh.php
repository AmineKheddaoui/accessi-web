<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

// Gestion des requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Informations de diagnostic
$diagnostics = [
    'success' => true,
    'message' => 'Test OVH réussi !',
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Non défini',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Non défini',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Non défini',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Non défini',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Non défini',
        'http_host' => $_SERVER['HTTP_HOST'] ?? 'Non défini',
        'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    ],
    'post_data' => $_POST,
    'get_data' => $_GET,
    'headers' => getallheaders(),
    'timestamp' => date('Y-m-d H:i:s'),
    'test_id' => rand(1000, 9999)
];

// Test de configuration PHP
$diagnostics['php_config'] = [
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'post_max_size' => ini_get('post_max_size'),
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'allow_url_fopen' => ini_get('allow_url_fopen') ? 'Oui' : 'Non',
    'display_errors' => ini_get('display_errors') ? 'Oui' : 'Non'
];

// Test de connexion base de données (optionnel)
if (file_exists('config.php')) {
    try {
        $config = include('config.php');
        $pdo = new PDO(
            "mysql:host=" . $config['db_host'] . ";dbname=" . $config['db_name'],
            $config['db_user'],
            $config['db_pass']
        );
        $diagnostics['database'] = 'Connexion réussie';
    } catch (Exception $e) {
        $diagnostics['database'] = 'Erreur: ' . $e->getMessage();
    }
} else {
    $diagnostics['database'] = 'Fichier config.php non trouvé';
}

// Test d'écriture de fichier
$testFile = 'test_write_' . time() . '.tmp';
if (file_put_contents($testFile, 'test')) {
    $diagnostics['file_write'] = 'Écriture autorisée';
    unlink($testFile);
} else {
    $diagnostics['file_write'] = 'Écriture interdite';
}

// Test de permissions
$diagnostics['permissions'] = [
    'current_dir_writable' => is_writable('.'),
    'config_readable' => is_readable('config.php'),
    'includes_readable' => is_readable('includes/'),
];

echo json_encode($diagnostics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>