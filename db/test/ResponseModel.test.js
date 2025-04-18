// test/responseModel.test.js
const assert = require('assert');
const Database = require('better-sqlite3');
const ResponseModel = require('../models/ResponseModel');

describe('ResponseModel (in‑memory DB)', function() {
  let db;
  let model;

  before(function() {
    // Initialize in‑memory DB and schema
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE Facility (
        facility_id   INTEGER PRIMARY KEY AUTOINCREMENT,
        facility_code TEXT,
        name          TEXT NOT NULL,
        location      TEXT,
        facility_type TEXT,
        headO_name    TEXT,
        headO_contact TEXT,
        date_opened   TEXT
      );
      CREATE TABLE Question (
        question_id   INTEGER PRIMARY KEY,
        question_text TEXT NOT NULL
      );
      CREATE TABLE AnswerOption (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id   INTEGER NOT NULL,
        answer_text   TEXT NOT NULL,
        answer_value  INTEGER
      );
      CREATE TABLE Response (
        response_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id      TEXT,
        facility_id     INTEGER,
        question_id     INTEGER,
        answer_option_id INTEGER,
        submitted_at    TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facility_id) REFERENCES Facility(facility_id),
        FOREIGN KEY (question_id) REFERENCES Question(question_id),
        FOREIGN KEY (answer_option_id) REFERENCES AnswerOption(id)
      );
    `);

    // Seed one facility
    db.prepare(`
      INSERT INTO Facility (facility_code, name, location)
      VALUES ('FAC1','Test Facility','Arusha Region, Arusha District, Olmoti')
    `).run();

    // Seed questions 8,9,10,12,14,16,17,18,19
    const questions = [
      [8,  'Waiting time'],
      [9,  'Permission before exam'],
      [10, 'Confidentiality'],
      [12, 'Received all tests'],
      [14, 'Received all meds'],
      [16, 'Service payment mode'],
      [17, 'Overall satisfaction'],
      [18, 'Positive area'],
      [19, 'Problem area']
    ];
    const qStmt = db.prepare(`INSERT INTO Question (question_id, question_text) VALUES (?,?)`);
    questions.forEach(q => qStmt.run(...q));

    // Seed answer options for each
    const aoStmt = db.prepare(`
      INSERT INTO AnswerOption (question_id, answer_text, answer_value)
      VALUES (?,?,?)
    `);
    // Q8
    aoStmt.run(8, 'Within 1 hour', null);
    aoStmt.run(8, 'Between 2-3 hours', null);
    // Q9
    aoStmt.run(9, 'Yes', null);
    aoStmt.run(9, 'No', null);
    // Q10
    aoStmt.run(10, 'Yes', null);
    aoStmt.run(10, 'No', null);
    // Q12
    aoStmt.run(12, 'Yes', null);
    aoStmt.run(12, 'No', null);
    // Q14
    aoStmt.run(14, 'Yes', null);
    aoStmt.run(14, 'No', null);
    // Q16
    aoStmt.run(16, 'Free', null);
    aoStmt.run(16, 'Cash', null);
    // Q17
    aoStmt.run(17, 'Very good', 5);
    aoStmt.run(17, 'Bad service', 1);
    // Q18
    aoStmt.run(18, 'Friendly Staff', null);
    // Q19
    aoStmt.run(19, 'Delay', null);

    // Seed responses to test each method
    const rStmt = db.prepare(`
      INSERT INTO Response
        (patient_id, facility_id, question_id, answer_option_id, submitted_at)
      VALUES (?,?,?,?,?)
    `);
    const now = new Date().toISOString();

    // WaitingTime: 2×Within 1h, 1×Between2-3h
    rStmt.run('p1',1,8,1,now);
    rStmt.run('p2',1,8,1,now);
    rStmt.run('p3',1,8,2,now);

    // Permission Q9: 3×Yes, 1×No
    rStmt.run('p1',1,9,3,now);
    rStmt.run('p2',1,9,3,now);
    rStmt.run('p3',1,9,3,now);
    rStmt.run('p4',1,9,4,now);

    // Confidentiality Q10: 4×Yes, 1×No
    rStmt.run('p1',1,10,5,now);
    rStmt.run('p2',1,10,5,now);
    rStmt.run('p3',1,10,5,now);
    rStmt.run('p4',1,10,5,now);
    rStmt.run('p5',1,10,6,now);

    // Tests Q12: 2×Yes, 1×No
    rStmt.run('p1',1,12,7,now);
    rStmt.run('p2',1,12,7,now);
    rStmt.run('p3',1,12,8,now);

    // Meds Q14: 1×Yes
    rStmt.run('p1',1,14,9,now);

    // Payment Q16: 5×Free
    for(let i=0;i<5;i++) rStmt.run(`p${i}`,1,16,11,now);

    // Satisfaction Q17: 3×Very good, 2×Bad service
    rStmt.run('p1',1,17,13,now);
    rStmt.run('p2',1,17,13,now);
    rStmt.run('p3',1,17,13,now);
    rStmt.run('p4',1,17,14,now);
    rStmt.run('p5',1,17,14,now);

    // Positive Q18: 4×Friendly Staff
    for(let i=0;i<4;i++) rStmt.run(`p${i}`,1,18,15,now);

    // Problem Q19: 3×Delay
    for(let i=0;i<3;i++) rStmt.run(`p${i}`,1,19,16,now);

    model = new ResponseModel(db);
  });

  after(function() {
    db.close();
  });

  it('getWaitingTimeStats → avg 70 mins', function() {
    const stats = model.getWaitingTimeStats(1);
    assert.strictEqual(Math.round(stats.average_wait_time_minutes), 70);
    assert.strictEqual(stats.breakdown.length, 2);
  });

  it('getPermissionBeforeExamStats → 75% Yes', function() {
    const res = model.getPermissionBeforeExamStats(1);
    assert.strictEqual(res.average_percent_yes, '75.00');
    assert.strictEqual(res.total, 4);
  });

  it('getConfidentialityStats → 80% Yes', function() {
    const res = model.getConfidentialityStats(1);
    assert.strictEqual(res.average_percent_yes, '80.00');
    assert.strictEqual(res.total, 5);
  });

  it('getTestCompletionStats → 66.67% Yes', function() {
    const res = model.getTestCompletionStats(1);
    // 2 Yes, 1 No → 2/3 ≈ 66.67%
    assert.strictEqual(res.average_percent_yes, '66.67');
    assert.strictEqual(res.total, 3);
  });

  it('getMedicationCompletionStats → 100% Yes', function() {
    const res = model.getMedicationCompletionStats(1);
    assert.strictEqual(res.average_percent_yes, '100.00');
    assert.strictEqual(res.total, 1);
  });

  it('getServicePaymentModes → most common Free', function() {
    const res = model.getServicePaymentModes(1);
    assert.strictEqual(res.most_common, 'Free');
    assert.strictEqual(res.breakdown[0].count, 5);
  });

  it('getSatisfactionDistribution → average ≈ 3.40', function() {
    const dist = model.getSatisfactionDistribution(1);
    // (3×5 + 2×1) / 5 = (15+2)/5 = 3.4
    assert.strictEqual(dist.average, '3.40');
    assert.strictEqual(dist.total, 5);
  });

  it('getProblemAreaFrequency & getPositiveAreaFrequency', function() {
    const probs = model.getProblemAreaFrequency(1);
    assert.strictEqual(probs[0].problem_area, 'Delay');
    assert.strictEqual(probs[0].count, 3);

    const pos = model.getPositiveAreaFrequency(1);
    assert.strictEqual(pos[0].positive_area, 'Friendly Staff');
    assert.strictEqual(pos[0].count, 4);
  });

  it('getResponseCount → total responses', function() {
    const c = model.getResponseCount(1);
    // sum of all inserted above
    assert.strictEqual(c.total_responses, db.prepare(`SELECT COUNT(*) FROM Response`).get()['COUNT(*)']);
  });

  it('getResponseBreakdownByQuestion', function() {
    const breakdown = model.getResponseBreakdownByQuestion(1, 10);
    // Q10 had 4 Yes, 1 No
    console.log("here is breakdpwn",breakdown );
    assert.strictEqual(breakdown.find(x=>x.answer==='Yes')?.count, 4);
    assert.strictEqual(breakdown.find(x=>x.answer==='No')?.count, 1);
  });

  it('getLatestResponses honors limit & fromDate', function() {
    const now = new Date().toISOString();
    // insert one older record
    db.prepare(`
      INSERT INTO Response
        (patient_id, facility_id, question_id, answer_option_id, submitted_at)
      VALUES (?,?,?,?,?)
    `).run('old',1,8,1,'2000-01-01T00:00:00.000Z');

    const latest = model.getLatestResponses(1, '2020-01-01', 3);
    assert(latest.every(r => new Date(r.submitted_at) >= new Date('2020-01-01')));
    assert(latest.length <= 3);
  });

  it('getSummaryStats returns unique counts', function() {
    const stats = model.getSummaryStats(1);
    assert(stats.questions_answered >= 1);
    assert(stats.unique_answers_given >= 1);
    assert(stats.unique_patients >= 1);
  });

  it('getFacilityResponsesById returns joined rows', function() {
    const rows = model.getFacilityResponsesById(1);
    assert(rows.length > 0);
    assert.strictEqual(rows[0].facility_name, 'Test Facility');
    assert('question_text' in rows[0]);
    assert('answer_text' in rows[0]);
  });
});
