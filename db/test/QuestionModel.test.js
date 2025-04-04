const fs = require('fs');
const path = require('path');
const assert = require('assert');
const QuestionModel = require('../models/QuestionModel');

describe('QuestionModel', function() {
  let fakeDB;
  let questionModel;
  let csvFilePath;

  // Setup a fake database object before each test
  beforeEach(function() {
    fakeDB = {
      questions: [],
      nextId: 1,
      prepare: function(query) {
        if (query.includes("INSERT INTO Questions")) {
          return {
            run: (questionText) => {
              // Create a new question object with an auto-incremented question_id
              const newQuestion = {
                question_id: fakeDB.nextId,
                question_text: questionText
              };
              fakeDB.questions.push(newQuestion);
              fakeDB.nextId++;
            }
          };
        } else if (query.includes("SELECT * FROM Questions WHERE question_id = ?")) {
          return {
            get: (id) => fakeDB.questions.find(q => q.question_id === id) || null
          };
        } else if (query.includes("SELECT * FROM Questions")) {
          return {
            all: () => fakeDB.questions
          };
        } else if (query.includes("DELETE FROM Questions")) {
          return {
            run: () => {
              fakeDB.questions = [];
            }
          };
        }
        // Default stub
        return {
          run: () => {},
          get: () => null,
          all: () => []
        };
      }
    };

    questionModel = new QuestionModel(fakeDB);

    // Create a temporary CSV file for testing loadFromCSV.
    // In this implementation, each line is treated as a question.
    csvFilePath = path.join(__dirname, 'test_questions.csv');
    const csvContent = `What is your favorite color?
How many hours do you sleep?`;
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');
  });

  // Clean up the temporary CSV file after each test.
  afterEach(function() {
    if (fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
    }
  });

  describe('loadFromCSV', function() {
    it('should import all questions from a CSV file', async function() {
      await questionModel.loadFromCSV(csvFilePath);
      const allQuestions = questionModel.getAllQuestions();
      assert.strictEqual(allQuestions.length, 2);
      assert.strictEqual(allQuestions[0].question_text, 'What is your favorite color?');
      assert.strictEqual(allQuestions[1].question_text, 'How many hours do you sleep?');
    });
  });

  describe('getAllQuestions', function() {
    it('should return all questions for form rendering', function() {
      // Manually add sample questions into fakeDB
      fakeDB.questions.push({ question_id: 1, question_text: 'Question 1' });
      fakeDB.questions.push({ question_id: 2, question_text: 'Question 2' });
      const all = questionModel.getAllQuestions();
      assert.strictEqual(all.length, 2);
    });
  });

  describe('getQuestionById', function() {
    it('should return the question if the id exists', function() {
      fakeDB.questions.push({ question_id: 1, question_text: 'Question 1' });
      const question = questionModel.getQuestionById(1);
      assert.strictEqual(question.question_text, 'Question 1');
    });

    it('should return null if the id does not exist', function() {
      const question = questionModel.getQuestionById(999);
      assert.strictEqual(question, null);
    });
  });

  describe('deleteAll', function() {
    it('should clear all questions', function() {
      fakeDB.questions.push({ question_id: 1, question_text: 'Question 1' });
      fakeDB.questions.push({ question_id: 2, question_text: 'Question 2' });
      questionModel.deleteAll();
      const all = questionModel.getAllQuestions();
      assert.strictEqual(all.length, 0);
    });
  });
});
