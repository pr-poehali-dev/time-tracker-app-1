-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы проектов
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы типов занятости
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы записей времени
CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    project_id INTEGER NOT NULL REFERENCES projects(id),
    activity_id INTEGER NOT NULL REFERENCES activities(id),
    entry_date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);

-- Вставка тестовых пользователей (пароли: password123 и admin123)
INSERT INTO users (email, password, full_name, role) VALUES
    ('ivan@company.com', 'password123', 'Иван Петров', 'employee'),
    ('maria@company.com', 'password123', 'Мария Сидорова', 'employee'),
    ('alex@company.com', 'password123', 'Алексей Смирнов', 'employee'),
    ('admin@company.com', 'admin123', 'Администратор', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Вставка проектов
INSERT INTO projects (name, description) VALUES
    ('Проект А', 'Разработка веб-приложения'),
    ('Проект Б', 'Мобильное приложение'),
    ('Проект В', 'Интеграция API'),
    ('Проект Г', 'Тестирование и QA')
ON CONFLICT DO NOTHING;

-- Вставка типов занятости
INSERT INTO activities (name) VALUES
    ('Разработка'),
    ('Тестирование'),
    ('Встречи'),
    ('Документация'),
    ('Код-ревью')
ON CONFLICT DO NOTHING;

-- Вставка тестовых записей времени
INSERT INTO time_entries (user_id, project_id, activity_id, entry_date, hours, comment) VALUES
    (1, 1, 1, '2025-10-28', 6.0, 'Работа над API'),
    (1, 2, 2, '2025-10-28', 2.0, 'Тестирование новых функций'),
    (1, 1, 5, '2025-10-27', 4.0, 'Код-ревью PR#123'),
    (1, 3, 3, '2025-10-27', 3.5, 'Встреча с клиентом'),
    (2, 2, 1, '2025-10-28', 7.0, 'Backend разработка'),
    (2, 1, 2, '2025-10-27', 8.0, 'Интеграционное тестирование'),
    (3, 3, 4, '2025-10-28', 5.0, 'Обновление документации'),
    (1, 1, 1, '2025-10-26', 7.0, 'Разработка функционала'),
    (2, 2, 1, '2025-10-25', 8.0, 'Работа над мобильной версией'),
    (3, 3, 2, '2025-10-25', 6.0, 'Тестирование API')
ON CONFLICT DO NOTHING;
