-- =====================================================================
-- IT Support Ticket Analysis and Service Performance Dashboard
-- Relational Schema DDL (MySQL 8.0+ compatible)
-- =====================================================================

DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS sla_rules;

-- 1. Departments Table
CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Teams Table
CREATE TABLE teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teams_department FOREIGN KEY (department_id) 
        REFERENCES departments (department_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Agents Table
CREATE TABLE agents (
    agent_id INT AUTO_INCREMENT PRIMARY KEY,
    agent_code VARCHAR(20) NOT NULL UNIQUE,
    agent_name VARCHAR(100) NOT NULL,
    team_id INT NOT NULL,
    experience_band ENUM('Junior', 'Mid-level', 'Senior') NOT NULL DEFAULT 'Mid-level',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agents_team FOREIGN KEY (team_id) 
        REFERENCES teams (team_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Categories Table
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    subcategory_name VARCHAR(150) NOT NULL,
    CONSTRAINT uq_category_sub UNIQUE (category_name, subcategory_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. SLA Rules Table
CREATE TABLE sla_rules (
    sla_rule_id INT AUTO_INCREMENT PRIMARY KEY,
    priority ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL UNIQUE,
    target_resolution_hours DECIMAL(6,2) NOT NULL,
    description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tickets Table (Core Fact Table)
CREATE TABLE tickets (
    ticket_id VARCHAR(20) PRIMARY KEY,
    created_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,
    status ENUM('Open', 'In Progress', 'Pending', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
    priority ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
    category_id INT NOT NULL,
    issue_type VARCHAR(150) NOT NULL,
    department_id INT NOT NULL,
    team_id INT NOT NULL,
    agent_id INT NULL,
    sla_rule_id INT NOT NULL,
    satisfaction_rating TINYINT UNSIGNED NULL CHECK (satisfaction_rating BETWEEN 1 AND 5),
    resolution_time_hours DECIMAL(8,2) NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_category (category_id),
    INDEX idx_department (department_id),
    INDEX idx_team (team_id),
    INDEX idx_agent (agent_id),
    CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES categories (category_id),
    CONSTRAINT fk_tickets_department FOREIGN KEY (department_id) REFERENCES departments (department_id),
    CONSTRAINT fk_tickets_team FOREIGN KEY (team_id) REFERENCES teams (team_id),
    CONSTRAINT fk_tickets_agent FOREIGN KEY (agent_id) REFERENCES agents (agent_id),
    CONSTRAINT fk_tickets_sla_rule FOREIGN KEY (sla_rule_id) REFERENCES sla_rules (sla_rule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
