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
class AnswerOptionModel{


    constructor(db){
        this.db=db;
    }

    
   //AnswerOption has been populated from Question Model


    getAnswersByQuestion(questionId) {
        const query = `SELECT answer_text FROM Answer WHERE question_id = ?`;
        const stmt = this.db.prepare(query);
        const results = stmt.all(questionId);
        return results;
    }
    



}
module.exports = AnswerOptionModel;