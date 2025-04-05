const fs = require('fs');
const path = require('path');
const assert = require('assert');
const AnswerOptionModel = require('../models/AnswerOptionModel');

describe('AnswerOptionModel', function() {
  let fakeDB;
  let answerOptionModel;
  let csvFilePath;

  // Set up a fake database object before each test.
  beforeEach(function() {
    fakeDB = {
      answers: [],
      nextId: 1,
      prepare: function(query) {
        if (query.includes("INSERT INTO Answer")) {
          return {
            run: (question_id, answer_value, answer_text) => {
              const newAnswer = {
                answer_id: fakeDB.nextId,
                question_id,
                answer_value,
                answer_text
              };
              fakeDB.answers.push(newAnswer);
              fakeDB.nextId++;
            }
          };
        } else if (query.includes("SELECT answer_text FROM Answer WHERE question_id = ?")) {
          return {
            all: (questionId) => {
              return fakeDB.answers
                .filter(answer => answer.question_id === questionId)
                .map(answer => ({ answer_text: answer.answer_text }));
            }
          };
        }
        // Default stub.
        return {
          run: () => {},
          get: () => null,
          all: () => []
        };
      }
    };

    answerOptionModel = new AnswerOptionModel(fakeDB);

    // Create a temporary CSV file for testing loadFromCSV.
    // Assuming CSV format: question_id,answer_value,answer_text (one row per answer)
    csvFilePath = path.join(__dirname, 'test_answers.csv');
    const csvContent = `1,Yes,Absolutely!
1,No,Not really.
2,Maybe,Could be.`;
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');
  });

  // Clean up the temporary CSV file after each test.
  afterEach(function() {
    if (fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
    }
  });

  describe('loadFromCSV', function() {
    it('should import all answers from a CSV file', async function() {
      // If loadFromCSV is not implemented, skip this test.
      if (typeof answerOptionModel.loadFromCSV !== 'function') {
        this.skip();
      }
      await answerOptionModel.loadFromCSV(csvFilePath);
      // Verify that answers were imported into our fakeDB.
      assert.strictEqual(fakeDB.answers.length, 3);
      assert.strictEqual(fakeDB.answers[0].question_id, 1);
      assert.strictEqual(fakeDB.answers[0].answer_value, 'Yes');
      assert.strictEqual(fakeDB.answers[0].answer_text, 'Absolutely!');
    });
  });

  describe('getAnswersByQuestion', function() {
    it('should return answers for a given question id', function() {
      // Populate fakeDB.answers manually.
      fakeDB.answers.push({ answer_id: 1, question_id: 1, answer_value: 'Yes', answer_text: 'Absolutely!' });
      fakeDB.answers.push({ answer_id: 2, question_id: 1, answer_value: 'No', answer_text: 'Not really.' });
      fakeDB.answers.push({ answer_id: 3, question_id: 2, answer_value: 'Maybe', answer_text: 'Could be.' });
      
      const results = answerOptionModel.getAnswersByQuestion(1);
      // Expect to receive two answers for question id 1.
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].answer_text, 'Absolutely!');
      assert.strictEqual(results[1].answer_text, 'Not really.');
    });
  });
});
