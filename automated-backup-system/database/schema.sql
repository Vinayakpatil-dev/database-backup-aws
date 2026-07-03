CREATE DATABASE IF NOT EXISTS local_backup_db;
USE local_backup_db;

CREATE TABLE IF NOT EXISTS backup_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    s3_uri VARCHAR(512) NOT NULL,
    execution_type ENUM('manual', 'scheduled') NOT NULL,
    status ENUM('success', 'failed') NOT NULL,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);