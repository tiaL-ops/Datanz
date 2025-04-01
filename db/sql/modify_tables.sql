DROP TABLE IF EXISTS Response;

CREATE TABLE IF NOT EXISTS Response (
    response_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    facility_id INTEGER,
    question_id INTEGER,
    answer_option_id INTEGER,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id),
    FOREIGN KEY (question_id) REFERENCES Question(question_id),
    FOREIGN KEY (answer_option_id) REFERENCES AnswerOption(id)
);

