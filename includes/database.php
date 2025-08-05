<?php
class Database {
    private $host;
    private $db_name;
    private $db_user;
    private $db_pass;
    private $conn;

    public function __construct() {
        $config = include(__DIR__ . '/../config.php');
        $this->host = $config['db_host'];
        $this->db_name = $config['db_name'];
        $this->db_user = $config['db_user'];
        $this->db_pass = $config['db_pass'];
    }

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->db_user,
                $this->db_pass
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Erreur de connexion: " . $exception->getMessage();
        }
        
        return $this->conn;
    }

    public function createOrdersTable() {
        $query = "CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            offer_type VARCHAR(50) NOT NULL,
            company_name VARCHAR(255) NOT NULL,
            contact_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            website_url VARCHAR(500),
            current_issues TEXT,
            accessibility_goals TEXT,
            timeline VARCHAR(100),
            budget_range VARCHAR(100),
            additional_info TEXT,
            total_price DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        
        try {
            $this->conn->exec($query);
            return true;
        } catch(PDOException $exception) {
            echo "Erreur création table: " . $exception->getMessage();
            return false;
        }
    }
}
?>