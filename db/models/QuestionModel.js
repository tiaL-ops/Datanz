const fs = require('fs');
const path = require('path');
const readline = require('readline');

class QuestionModel {
    constructor(db) {
        this.db = db;
    }

    async loadFromCSV(filepath) {
        const fileStream = fs.createReadStream(filepath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity //idk we seem to need this need testing
        });

        const insertQuery = this.db.prepare(`INSERT INTO Questions (question_text) VALUES (?)`);

        for await (const line of rl) {
            const questionText = line.trim();
            if (questionText) {
                insertQuery.run(questionText);
            }
        }
    }

    getAllQuestions() {
        const query = `SELECT * FROM Questions`;
        const stmt = this.db.prepare(query);
        return stmt.all();
    }

    getQuestionById(id) {
        const query = `SELECT * FROM Questions WHERE question_id = ?`;
        const stmt = this.db.prepare(query);
        return stmt.get(id);  
    }

    deleteAll() {
        const query = `DELETE FROM Questions`;
        const stmt = this.db.prepare(query);
        stmt.run(); 
    }
}

module.exports = QuestionModel;
