<?php
/**
 * Local development router for PHP built-in server.
 *
 * Usage:  php -S localhost:8000 router.php
 *
 * Handles:
 *  - Clean URLs  (/contact -> frontend/contact.html)
 *  - PHP endpoints (/process-contact.php, /process-order.php)
 *  - Static assets (/assets/...)
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// --- PHP endpoints ---
$phpRoutes = [
    '/process-contact.php' => __DIR__ . '/backend/php/process-contact.php',
    '/process-order.php'   => __DIR__ . '/backend/php/process-order.php',
    '/init-db.php'         => __DIR__ . '/backend/php/init-db.php',
    '/test-db.php'         => __DIR__ . '/tests/test-db.php',
    '/test-ovh.php'        => __DIR__ . '/tests/test-ovh.php',
];

if (isset($phpRoutes[$uri])) {
    require $phpRoutes[$uri];
    return true;
}

// --- Clean URL -> HTML pages ---
$pages = [
    '/'          => '/index.html',
    '/essential' => '/frontend/essential.html',
    '/business'  => '/frontend/business.html',
    '/enterprise'=> '/frontend/enterprise.html',
    '/contact'   => '/frontend/contact.html',
    '/blog'      => '/frontend/blog.html',
    '/a-propos'  => '/frontend/a-propos.html',
    '/simulateur'=> '/frontend/simulateur.html',
    '/logos'     => '/frontend/logos.html',
];

// Normalize trailing slash
$normalized = rtrim($uri, '/') ?: '/';

if (isset($pages[$normalized])) {
    $file = __DIR__ . $pages[$normalized];
    if (file_exists($file)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($file);
        return true;
    }
}

// --- Static files (assets, images, etc.) ---
$filePath = __DIR__ . $uri;
if (is_file($filePath)) {
    return false; // Let PHP built-in server handle it
}

// --- 404 ---
$notFound = __DIR__ . '/frontend/404.html';
if (file_exists($notFound)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    readfile($notFound);
    return true;
}

http_response_code(404);
echo '404 Not Found';
return true;
