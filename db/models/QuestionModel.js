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
        const weightMap = {
          Q8: {
            "Within 1 hour": 0,
            "Between 2-3 hours": 1,
            "More than 3 hours": 2,
          },
          Q9: {
            "Yes": 1,
            "No": 0,
          },
          Q10: {
            "Yes": 1,
            "No": 0,
          },
          Q12: {
            "Yes": 0,
            "Some": 1,
            "None": 2,
          },
          Q14: {
            "Yes": 1,
            "Some": 0,
          },
          Q17: {
            "Bad service": 0,
            "Not satisfied": 1,
            "Normal": 2,
            "Good Service": 3,
            "Very good": 4,
          }
        };
      
        return new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv({ headers: false }))
            .on('data', (row) => {
              const question = row[0]?.trim();
              const rawAnswers = row[1]?.trim();
      
              if (!question) return;
      
              const insertQuestion = this.db.prepare(
                `INSERT INTO Question (question_text) VALUES (?)`
              );
              const result = insertQuestion.run(question);
              const questionId = result.lastInsertRowid;
      
              if (rawAnswers) {
                const answers = rawAnswers.split('\n').map(a => a.trim());
                const insertAnswer = this.db.prepare(
                  `INSERT INTO AnswerOption (question_id, answer_value, answer_text, answer_weight) VALUES (?, ?, ?, ?)`
                );
      
                const questionCodeMatch = question.match(/(Q\d+)/);
                const questionCode = questionCodeMatch ? questionCodeMatch[1] : null;
      
                answers.forEach(answer => {
                  const match = answer.match(/^(\d+)\.\s*(.+)$/);
                  if (match) {
                    const value = match[1];
                    const text = match[2];
                    let weight = null;
      
                    if (questionCode && weightMap[questionCode] && weightMap[questionCode][text] !== undefined) {
                      weight = weightMap[questionCode][text];
                    }
      
                    insertAnswer.run(questionId, value, text, weight);
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
