const assert = require('assert');
const fs = require('fs');
const path = require('path');
const QuestionModel = require('../models/QuestionModel');

describe('QuestionModel', function() {
  let fakeDB;
  let questionModel;
  let csvFilePath;
  let originalLog;
  let logCalls;

  beforeEach(function() {
    // Setup fake DB for questions and answer options
    fakeDB = {
      questions: [],
      answerOptions: [],
      nextQId: 1,
      nextAId: 1,
      prepare(query) {
        if (query.includes('INSERT INTO Question')) {
          return { run: (text) => {
            const id = fakeDB.nextQId++;
            fakeDB.questions.push({ question_id: id, question_text: text });
            return { lastInsertRowid: id };
          }};
        }
        if (query.includes('INSERT INTO AnswerOption')) {
          return { run: (qId, value, text, weight) => {
            const id = fakeDB.nextAId++;
            fakeDB.answerOptions.push({ id, question_id: qId, answer_value: value, answer_text: text, answer_weight: weight });
            return { lastInsertRowid: id };
          }};
        }
        if (query.includes('SELECT * FROM Questions WHERE')) {
          return { get: (id) => fakeDB.questions.find(q => q.question_id === id) || null };
        }
        if (query.includes('SELECT * FROM Questions')) {
          return { all: () => fakeDB.questions };
        }
        if (query.includes('DELETE FROM Questions')) {
          return { run: () => { fakeDB.questions = []; fakeDB.answerOptions = []; }};
        }
        return { run: () => {}, all: () => [], get: () => null };
      }
    };

    questionModel = new QuestionModel(fakeDB);

    
    originalLog = console.log;
    logCalls = [];
    console.log = function(...args) {
      logCalls.push(args.join(' '));
    };

    // Create a temporary CSV file with questions and options
    csvFilePath = path.join(__dirname, 'test_questions.csv');
    const csvContent = [
      'Favorite Fruit,1. Apple\n2. Banana\n3. Cherry',
      'Sleep Hours,1. <5\n2. 5-8\n3. >8',
      'NoOptions,'
    ].join('\n');
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');
  });

  afterEach(function() {
    
    console.log = originalLog;
    if (fs.existsSync(csvFilePath)) fs.unlinkSync(csvFilePath);
  });

  describe('readAndLogQA', function() {
    it('logs each question and its options or none', function(done) {
      questionModel.readAndLogQA(csvFilePath);
      setTimeout(() => {
        // First question with options
        assert(logCalls.some(line => line.includes('Question: Favorite Fruit')));
        assert(logCalls.some(line => line.includes('Answer Options: 1. Apple')));
        // Third entry with no options
        assert(logCalls.some(line => line.includes('Question: NoOptions')));
        assert(logCalls.some(line => line.includes('Answer Options: None provided')));
        done();
      }, 50);
    });
  });

  describe('importFromCSV', function() {
    it('imports questions and options with default weights', async function() {
      await questionModel.importFromCSV(csvFilePath);
      const allQs = questionModel.getAllQuestions();
      assert.strictEqual(allQs.length, 3);
      const q1 = allQs.find(q => q.question_text === 'Favorite Fruit');
      const opts1 = fakeDB.answerOptions.filter(o => o.question_id === q1.question_id);
      assert.strictEqual(opts1.length, 3);
      assert.strictEqual(opts1[0].answer_text, 'Apple');
      // Default weight when not in weightMap is 0
      assert.strictEqual(opts1[0].answer_weight, 0);
    });
  });

  describe('CRUD methods', function() {
    it('getAllQuestions, getQuestionById, deleteAll work as expected', function() {
      fakeDB.questions.push({ question_id: 1, question_text: 'Q1' });
      fakeDB.questions.push({ question_id: 2, question_text: 'Q2' });
      const all = questionModel.getAllQuestions();
      assert.strictEqual(all.length, 2);
      const single = questionModel.getQuestionById(2);
      assert.strictEqual(single.question_text, 'Q2');
      const none = questionModel.getQuestionById(999);
      assert.strictEqual(none, null);
      questionModel.deleteAll();
      assert.strictEqual(questionModel.getAllQuestions().length, 0);
      assert.strictEqual(fakeDB.answerOptions.length, 0);
    });
  });
});
