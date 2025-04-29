-- Auth table: users like government officials or doctors
CREATE TABLE IF NOT EXISTS Auth (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    usertype TEXT NOT NULL, -- e.g. 'government', 'doctor'
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    password_changed INTEGER DEFAULT 0
);


-- Question table: stores question text
CREATE TABLE IF NOT EXISTS Question (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL
);

-- AnswerOption table: stores possible answers for each question
CREATE TABLE IF NOT EXISTS AnswerOption (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    answer_value TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    answer_weight INTEGER,
    FOREIGN KEY (question_id) REFERENCES Question(question_id)
);

-- Facility table
CREATE TABLE IF NOT EXISTS Facility (
    facility_id INTEGER PRIMARY KEY AUTOINCREMENT,
    facility_code TEXT,
    name TEXT NOT NULL,
    location TEXT,
    facility_type TEXT,
    headO_name TEXT,
    headO_contact TEXT,
    date_opened TEXT,
    ltd INTEGER,
    lng INTEGER
);
--i don't think we need report , rather just response i think
CREATE TABLE IF NOT EXISTS Response (
    response_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    facility_id INTEGER,
    question_id INTEGER,
    answer_option_id INTEGER,
    submitted_at DATETIME NOT NULL,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id),
    FOREIGN KEY (question_id) REFERENCES Question(question_id),
    FOREIGN KEY (answer_option_id) REFERENCES AnswerOption(id)
);

