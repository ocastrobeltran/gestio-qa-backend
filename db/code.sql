-- Create the database
DROP DATABASE IF EXISTS qa_manager;
CREATE DATABASE qa_manager;
USE qa_manager;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'analyst', 'stakeholder') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    initiative VARCHAR(255),
    client VARCHAR(255),
    pm VARCHAR(255),
    lead_dev VARCHAR(255),
    designer VARCHAR(255),
    design_url TEXT,
    test_url TEXT,
    qa_analyst_id INT,
    status ENUM('En análisis', 'En validación', 'En pruebas', 'Aprobado', 'Cancelado') NOT NULL DEFAULT 'En análisis',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (qa_analyst_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_client (client),
    INDEX idx_qa_analyst (qa_analyst_id),
    INDEX idx_created_at (created_at)
);

-- Project developers (N:M relationship)
CREATE TABLE project_developers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    developer_name VARCHAR(255) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id)
);

-- Project assets (documentation URLs)
CREATE TABLE project_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    asset_url TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id)
);

-- Project comments
CREATE TABLE project_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Project history (change tracking)
CREATE TABLE project_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    changed_by INT NOT NULL,
    change_type VARCHAR(255) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_timestamp (timestamp)
);

-- Create views for reporting

-- Project summary view
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.title,
    p.client,
    p.status,
    u.full_name AS qa_analyst,
    p.created_at,
    p.updated_at,
    (SELECT COUNT(*) FROM project_comments pc WHERE pc.project_id = p.id) AS comment_count
FROM 
    projects p
LEFT JOIN 
    users u ON p.qa_analyst_id = u.id;

-- Project count by status view
CREATE VIEW project_count_by_status AS
SELECT 
    status,
    COUNT(*) AS project_count
FROM 
    projects
GROUP BY 
    status;

-- Project activity log view
CREATE VIEW project_activity_log AS
SELECT 
    ph.project_id,
    p.title AS project_title,
    u.full_name AS changed_by_user,
    ph.change_type,
    ph.old_value,
    ph.new_value,
    ph.timestamp
FROM 
    project_history ph
JOIN 
    projects p ON ph.project_id = p.id
JOIN 
    users u ON ph.changed_by = u.id
ORDER BY 
    ph.timestamp DESC;

-- Insert sample data

-- Sample users
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Admin User', 'admin@example.com', '$2a$12$1234567890123456789012', 'admin'),

-- Sample projects
INSERT INTO projects (title, initiative, client, pm, lead_dev, designer, design_url, test_url, qa_analyst_id, status, created_by) VALUES 
('Bolivar Web', 'Migracion pagina Web', 'Constructora Bolivar', 'Natalia Rincon', 'John Vargas', 'Jonathan Ramos', 'https://figma.com/design1', 'https://test.example.com/site1', 1, 'En pruebas', 1);

-- Sample project developers
INSERT INTO project_developers (project_id, developer_name) VALUES 
(1, 'Mauricio Vallejo'),
(1, 'Benjamin Perez');

-- Sample project assets
INSERT INTO project_assets (project_id, asset_url) VALUES 
(1, 'https://docs.example.com/requirements1'), 
(1, 'https://docs.example.com/wireframes1');

-- Sample project comments
INSERT INTO project_comments (project_id, user_id, comment_text) VALUES 
(1, 1, 'prueba comentario'), 
(1, 1, 'segunda prueba de comentario');

-- Sample project history
INSERT INTO project_history (project_id, changed_by, change_type, old_value, new_value) VALUES 
(1, 1, 'Cambio de estado', 'En validación', 'En pruebas'), 
(1, 1, 'Nuevo comentario', NULL, 'Navigation issues on mobile view need to be addressed.');