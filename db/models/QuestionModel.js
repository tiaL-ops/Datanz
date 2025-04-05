const fs = require('fs');
const path = require('path');
const readline = require('readline');
const csv = require('csv-parser');

class QuestionModel {
    constructor(db) {
        this.db = db;
    }

    readAndLogQA(filePath) {
        fs.createReadStream(filePath)
          .pipe(csv({ headers: false }))
          .on('data', (row) => {
            const question = row[0];
            const answerOption = row[1];
      
            console.log("Question:", question);
            if (answerOption) {
              console.log("Answer Options:", answerOption);
            } else {
              console.log("Answer Options: None provided");
            }
            console.log('---');
          })
          .on('end', () => {
            console.log('CSV file successfully processed');
          });
      }
      
      importFromCSV(filePath) {
        return new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv({ headers: false }))
            .on('data', (row) => {
              const question = row[0]?.trim();
              const rawAnswers = row[1]?.trim();
      
              if (!question) return;
      
              // Insert question
              const insertQuestion = this.db.prepare(
                `INSERT INTO Question (question_text) VALUES (?)`
              );
              const result = insertQuestion.run(question);
              const questionId = result.lastInsertRowid;
      
              if (rawAnswers) {
                const answers = rawAnswers.split('\n').map(a => a.trim());
                const insertAnswer = this.db.prepare(
                  `INSERT INTO AnswerOption (question_id, answer_value, answer_text) VALUES (?, ?, ?)`
                );
      
                answers.forEach(answer => {
                  const match = answer.match(/^(\d+)\.\s*(.+)$/);
                  if (match) {
                    const value = match[1];
                    const text = match[2];
                    insertAnswer.run(questionId, value, text);
                  }
                });
              }
            })
            .on('end', () => {
              console.log('CSV import completed.');
              resolve();
            })
            .on('error', (err) => {
              reject(err);
            });
        });
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
