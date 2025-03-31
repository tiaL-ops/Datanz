const fs = require('fs');
const path = require('path');
const readline = require('readline');
/**
 * this is to just have the answer
 * 
 *    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    answer_value TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES Question(question_id)


    loadFromCSV(filePath) – Import all Answer from a CSV file

getAnswersByQuestion(questionId) – Get answers to one question
 */
class AnswerModel{


    constructor(db){
        this.db=db;
    }

    
    async loadFromCSV(filepath) {
        const fileStream = fs.createReadStream(filepath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const insertQuestion = this.db.prepare(`
            INSERT INTO Question (question_text)
            VALUES (?)
        `);

        const insertAnswer = this.db.prepare(`
            INSERT INTO Answer (question_id, answer_value, answer_text)
            VALUES (?, ?, ?)
        `);

        for await (const line of rl) {
            const [questionRaw, answersRaw] = line.split('\t');
            const questionText = questionRaw?.trim();

            if (!questionText) continue;

            // Insert into Question and get question_id
            const result = insertQuestion.run(questionText);
            const questionId = result.lastInsertRowid;

            
            if (answersRaw?.trim()) {
                const answers = answersRaw.trim().split('\n');

                for (const answer of answers) {
                    const [value, ...textParts] = answer.split('.');
                    const valueTrimmed = value?.trim();
                    const text = textParts.join('.').trim();

                    if (valueTrimmed && text) {
                        insertAnswer.run(questionId, valueTrimmed, text);
                    }
                }
            }
        }

        console.log('Question and answer added.');
    }


    getAnswersByQuestion(questionId) {
        const query = `SELECT answer_text FROM Answer WHERE question_id = ?`;
        const stmt = this.db.prepare(query);
        const results = stmt.all(questionId);
        return results;
    }
    




}
module.exports = AnswerModel;