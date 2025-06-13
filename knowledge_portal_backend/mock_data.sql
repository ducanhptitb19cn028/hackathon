-- Mock data for knowledge portal database

-- Create tables with proper indexes
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    hashed_password VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);

CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    description VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_skills_name ON skills(name);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_tags_name ON tags(name);

CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR,
    url VARCHAR UNIQUE NOT NULL,
    duration FLOAT,
    thumbnail_url VARCHAR,
    category VARCHAR,
    difficulty_level VARCHAR,
    transcript VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_videos_title ON videos(title);
CREATE INDEX IF NOT EXISTS ix_videos_category ON videos(category);

CREATE TABLE IF NOT EXISTS learning_paths (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description VARCHAR,
    difficulty_level VARCHAR,
    estimated_hours INTEGER,
    creator_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_learning_paths_title ON learning_paths(title);

CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    difficulty_level VARCHAR(20) NOT NULL,
    questions JSONB NOT NULL,
    passing_score INTEGER NOT NULL DEFAULT 70,
    time_limit INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_quizzes_video_difficulty ON quizzes(video_id, difficulty_level);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS ix_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);

CREATE TABLE IF NOT EXISTS video_tags (
    video_id INTEGER REFERENCES videos(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (video_id, tag_id)
);

CREATE TABLE IF NOT EXISTS video_skills (
    video_id INTEGER REFERENCES videos(id),
    skill_id INTEGER REFERENCES skills(id),
    PRIMARY KEY (video_id, skill_id)
);

CREATE TABLE IF NOT EXISTS learning_path_video (
    learning_path_id INTEGER REFERENCES learning_paths(id),
    video_id INTEGER REFERENCES videos(id),
    PRIMARY KEY (learning_path_id, video_id)
);

CREATE TABLE IF NOT EXISTS learning_path_skill (
    learning_path_id INTEGER REFERENCES learning_paths(id),
    skill_id INTEGER REFERENCES skills(id),
    PRIMARY KEY (learning_path_id, skill_id)
);

-- Clear existing data (now safe since tables exist)
TRUNCATE users, skills, tags, videos, learning_paths, quizzes, quiz_attempts, video_tags, video_skills, learning_path_video, learning_path_skill CASCADE;

-- Insert mock data in correct order (respecting foreign key constraints)

-- 1. First, insert users (they are referenced by learning_paths and quiz_attempts)
INSERT INTO users (id, email, username, full_name, hashed_password, is_active, is_superuser, created_at, updated_at) VALUES
(1, 'admin@example.com', 'admin', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGpJ4P.Kmo2', true, true, NOW(), NOW()),
(2, 'john@example.com', 'john_doe', 'John Doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGpJ4P.Kmo2', true, false, NOW(), NOW()),
(3, 'jane@example.com', 'jane_smith', 'Jane Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGpJ4P.Kmo2', true, false, NOW(), NOW()),
(4, 'bob@example.com', 'bob_wilson', 'Bob Wilson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGpJ4P.Kmo2', true, false, NOW(), NOW()),
(5, 'alice@example.com', 'alice_brown', 'Alice Brown', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGpJ4P.Kmo2', true, false, NOW(), NOW());
-- Reset the users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert independent tables (skills and tags)
INSERT INTO skills (id, name, description, created_at, updated_at) VALUES
(1, 'Python', 'Programming language Python', NOW(), NOW()),
(2, 'JavaScript', 'Programming language JavaScript', NOW(), NOW()),
(3, 'Machine Learning', 'Machine Learning and AI concepts', NOW(), NOW()),
(4, 'Web Development', 'Web development fundamentals', NOW(), NOW()),
(5, 'Data Science', 'Data science and analytics', NOW(), NOW()),
(6, 'DevOps', 'Development operations and deployment', NOW(), NOW()),
(7, 'SQL', 'Database management with SQL', NOW(), NOW()),
(8, 'Cloud Computing', 'Cloud platforms and services', NOW(), NOW());
-- Reset the skills sequence
SELECT setval('skills_id_seq', (SELECT MAX(id) FROM skills));

INSERT INTO tags (id, name) VALUES
(1, 'Programming'),
(2, 'Web Development'),
(3, 'Data Science'),
(4, 'AI'),
(5, 'Backend'),
(6, 'Frontend'),
(7, 'Database'),
(8, 'Cloud'),
(9, 'Security'),
(10, 'Best Practices');
-- Reset the tags sequence
SELECT setval('tags_id_seq', (SELECT MAX(id) FROM tags));

-- 3. Insert videos (referenced by quizzes and learning paths)
INSERT INTO videos (id, title, description, url, duration, thumbnail_url, category, difficulty_level, transcript, created_at, updated_at) VALUES
(1, 'Python for Beginners', 'Introduction to Python programming', 'https://example.com/videos/python-intro', 45.5, 'https://example.com/thumbnails/python-intro.jpg', 'Programming', 'beginner', 'Welcome to Python programming. In this video, we will cover the basics of Python including variables, data types, and control structures...', NOW(), NOW()),
(2, 'Advanced JavaScript Concepts', 'Deep dive into JavaScript', 'https://example.com/videos/js-advanced', 60.0, 'https://example.com/thumbnails/js-advanced.jpg', 'Web Development', 'advanced', 'Today we will explore advanced JavaScript concepts including closures, hoisting, and the event loop...', NOW(), NOW()),
(3, 'Machine Learning Basics', 'Introduction to ML concepts', 'https://example.com/videos/ml-basics', 55.5, 'https://example.com/thumbnails/ml-basics.jpg', 'Data Science', 'intermediate', 'Understanding machine learning fundamentals including supervised learning, regression, and classification...', NOW(), NOW()),
(4, 'Web Development Fundamentals', 'Getting started with web dev', 'https://example.com/videos/web-dev', 40.0, 'https://example.com/thumbnails/web-dev.jpg', 'Web Development', 'beginner', 'Learn the basics of web development including HTML, CSS, and JavaScript...', NOW(), NOW()),
(5, 'SQL Masterclass', 'Advanced SQL techniques', 'https://example.com/videos/sql-master', 50.0, 'https://example.com/thumbnails/sql-master.jpg', 'Database', 'advanced', 'Advanced SQL concepts and optimization techniques including indexing, query optimization, and database design...', NOW(), NOW());
-- Reset the videos sequence
SELECT setval('videos_id_seq', (SELECT MAX(id) FROM videos));

-- 4. Insert learning paths (requires users to exist)
INSERT INTO learning_paths (id, title, description, difficulty_level, estimated_hours, creator_id, created_at, updated_at) VALUES
(1, 'Full Stack Development', 'Complete path to become a full stack developer', 'intermediate', 40, 1, NOW(), NOW()),
(2, 'Data Science Career Path', 'Comprehensive data science curriculum', 'advanced', 60, 1, NOW(), NOW()),
(3, 'Web Development Basics', 'Foundation of web development', 'beginner', 20, 2, NOW(), NOW()),
(4, 'Machine Learning Engineer', 'Path to become an ML engineer', 'advanced', 50, 1, NOW(), NOW()),
(5, 'Database Expert', 'Master database management', 'intermediate', 30, 3, NOW(), NOW());
-- Reset the learning_paths sequence
SELECT setval('learning_paths_id_seq', (SELECT MAX(id) FROM learning_paths));

-- 5. Insert quizzes (requires videos to exist)
INSERT INTO quizzes (id, video_id, title, description, difficulty_level, questions, passing_score, time_limit, created_at) VALUES
(1, 1, 'Python Basics Quiz', 'Test your Python knowledge', 'beginner', 
   '[
     {
       "id": "q_1",
       "question": "What is Python?",
       "options": ["Programming Language", "Snake", "Game", "Database"],
       "correct_answer": 0,
       "explanation": "Python is a high-level, interpreted programming language."
     },
     {
       "id": "q_2",
       "question": "How do you create a variable in Python?",
       "options": ["var x = 5", "let x = 5", "x = 5", "const x = 5"],
       "correct_answer": 2,
       "explanation": "In Python, variables are created by simply assigning a value using the = operator."
     },
     {
       "id": "q_3",
       "question": "Which of these is a valid Python comment?",
       "options": ["// Comment", "/* Comment */", "# Comment", "<!-- Comment -->"],
       "correct_answer": 2,
       "explanation": "Python uses the # symbol for single-line comments."
     },
     {
       "id": "q_4",
       "question": "What is the correct way to create a list in Python?",
       "options": ["array(1, 2, 3)", "{1, 2, 3}", "[1, 2, 3]", "(1, 2, 3)"],
       "correct_answer": 2,
       "explanation": "Lists in Python are created using square brackets []"
     }
   ]'::jsonb,
   70, 15, NOW()),
(2, 2, 'JavaScript Fundamentals', 'Test your JavaScript basics', 'beginner',
   '[
     {
       "id": "q_1",
       "question": "What is JavaScript?",
       "options": ["Programming Language", "Markup Language", "Database", "Operating System"],
       "correct_answer": 0,
       "explanation": "JavaScript is a programming language used primarily for web development."
     },
     {
       "id": "q_2",
       "question": "How do you declare a variable in modern JavaScript?",
       "options": ["var x = 5", "let x = 5", "x = 5", "const x = 5"],
       "correct_answer": 1,
       "explanation": "let is the modern way to declare variables in JavaScript."
     },
     {
       "id": "q_3",
       "question": "What is the correct way to write a function in JavaScript?",
       "options": ["function myFunc() {}", "def myFunc():", "void myFunc()", "func myFunc()"],
       "correct_answer": 0,
       "explanation": "In JavaScript, functions are declared using the function keyword."
     }
   ]'::jsonb,
   70, 20, NOW()),
(3, 3, 'ML Concepts Quiz', 'Test your ML understanding', 'intermediate',
   '[
     {
       "id": "q_1",
       "question": "What is supervised learning?",
       "options": ["Self-learning", "Learning with labeled data", "Reinforcement", "Clustering"],
       "correct_answer": 1,
       "explanation": "Supervised learning is a type of machine learning where the model learns from labeled training data."
     },
     {
       "id": "q_2",
       "question": "What is regression?",
       "options": ["Classification", "Prediction of continuous values", "Clustering", "Pattern matching"],
       "correct_answer": 1,
       "explanation": "Regression is a type of supervised learning that predicts continuous numerical values."
     },
     {
       "id": "q_3",
       "question": "What is overfitting?",
       "options": ["Perfect training", "Model too complex", "Fast learning", "Good prediction"],
       "correct_answer": 1,
       "explanation": "Overfitting occurs when a model learns the training data too well, including noise and outliers."
     },
     {
       "id": "q_4",
       "question": "What is cross-validation?",
       "options": ["Testing data", "Model evaluation technique", "Data cleaning", "Feature selection"],
       "correct_answer": 1,
       "explanation": "Cross-validation is a technique to assess how well a model will generalize to new, unseen data."
     }
   ]'::jsonb,
   75, 25, NOW());
-- Reset the quizzes sequence
SELECT setval('quizzes_id_seq', (SELECT MAX(id) FROM quizzes));

-- 6. Insert quiz attempts (requires both quizzes and users to exist)
INSERT INTO quiz_attempts (quiz_id, user_id, answers, score, completed, started_at, completed_at) VALUES
(1, 2, '[0, 2, 2, 2]'::jsonb, 100, true, NOW() - INTERVAL '1 hour', NOW()),
(2, 3, '[2, 1, 2]'::jsonb, 90, true, NOW() - INTERVAL '2 hours', NOW()),
(3, 4, '[1, 1, 1, 1]'::jsonb, 85, true, NOW() - INTERVAL '3 hours', NOW());
-- Reset the quiz_attempts sequence
SELECT setval('quiz_attempts_id_seq', (SELECT MAX(id) FROM quiz_attempts));

-- 7. Insert relationship data
-- Video Tags
INSERT INTO video_tags (video_id, tag_id) VALUES
(1, 1), -- Python video - Programming tag
(1, 3), -- Python video - Data Science tag
(2, 1), -- JavaScript video - Programming tag
(2, 2), -- JavaScript video - Web Development tag
(3, 3), -- ML video - Data Science tag
(3, 4), -- ML video - AI tag
(4, 2), -- Web Dev video - Web Development tag
(4, 6), -- Web Dev video - Frontend tag
(5, 7); -- SQL video - Database tag

-- Video Skills
INSERT INTO video_skills (video_id, skill_id) VALUES
(1, 1), -- Python video - Python skill
(2, 2), -- JavaScript video - JavaScript skill
(3, 3), -- ML video - Machine Learning skill
(4, 4), -- Web Dev video - Web Development skill
(5, 7); -- SQL video - SQL skill

-- Learning Path Videos
INSERT INTO learning_path_video (learning_path_id, video_id) VALUES
(1, 1), -- Full Stack - Python
(1, 2), -- Full Stack - JavaScript
(1, 4), -- Full Stack - Web Dev
(2, 1), -- Data Science - Python
(2, 3), -- Data Science - ML
(2, 5), -- Data Science - SQL
(3, 4), -- Web Dev Basics - Web Dev
(4, 1), -- ML Engineer - Python
(4, 3), -- ML Engineer - ML
(5, 5); -- Database Expert - SQL 