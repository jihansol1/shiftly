CREATE DATABASE shift_manager;
USE shift_manager;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    owner_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE office_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    office_id INT NOT NULL,
    role ENUM('employer', 'employee') NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (office_id) REFERENCES offices(id),
    UNIQUE KEY unique_membership (user_id, office_id)
);

CREATE TABLE availability (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    office_id INT NOT NULL,
    day_of_week TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (office_id) REFERENCES offices(id),
    INDEX idx_office_day (office_id, day_of_week)
);

CREATE TABLE shifts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    office_id INT NOT NULL,
    user_id INT NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (office_id) REFERENCES offices(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
