const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const ResponseModel = require('../models/ResponseModel');
describe('ResponseModel (in‑memory DB)', function() {
  let db;
  let model;
  const today = new Date().toISOString().split('T')[0];

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
        answer_value  INTEGER,
        answer_weight INTEGER
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
    db.prepare(`INSERT INTO Facility (facility_code, name, location) VALUES ('FAC1','Test Facility','Arusha Region%')`).run();

    // Seed questions for all methods
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

    // Seed answer options with weights where applicable
    const aoStmt = db.prepare(`
      INSERT INTO AnswerOption (question_id, answer_text, answer_value, answer_weight)
      VALUES (?,?,?,?)
    `);
    // Q8
    aoStmt.run(8, 'Within 1 hour', null, null);
    aoStmt.run(8, 'Between 2-3 hours', null, null);
    // Q9
    aoStmt.run(9, 'Yes', null, null);
    aoStmt.run(9, 'No', null, null);
    // Q10
    aoStmt.run(10, 'Yes', null, null);
    aoStmt.run(10, 'No', null, null);
    // Q12
    aoStmt.run(12, 'Yes', null, null);
    aoStmt.run(12, 'No', null, null);
    // Q14
    aoStmt.run(14, 'Yes', null, null);
    aoStmt.run(14, 'No', null, null);
    // Q16
    aoStmt.run(16, 'Free', null, null);
    aoStmt.run(16, 'Cash', null, null);
    // Q17
    aoStmt.run(17, 'Very good', 5, 5);
    aoStmt.run(17, 'Bad service', 1, 1);
    // Q18
    aoStmt.run(18, 'Friendly Staff', null, null);
    // Q19
    aoStmt.run(19, 'Delay', null, null);

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

  // Core stats
  it('getWaitingTimeStats → avg 70 mins', function() {
    const stats = model.getWaitingTimeStats(1);
    assert.strictEqual(Math.round(stats.average_wait_time_minutes), 70);
    assert.strictEqual(stats.breakdown.length, 2);
  });

  it('getPermissionBeforeExamStats → 75% Yes', function() {
    const res = model.getPermissionBeforeExamStats(1);
    assert.strictEqual(res.average_percent_yes, '75.00');
  });

  it('getConfidentialityStats → 80% Yes', function() {
    const res = model.getConfidentialityStats(1);
    assert.strictEqual(res.average_percent_yes, '80.00');
  });

  it('getTestCompletionStats → 66.67% Yes', function() {
    const res = model.getTestCompletionStats(1);
    assert.strictEqual(res.average_percent_yes, '66.67');
  });

  it('getMedicationCompletionStats → 100% Yes', function() {
    const res = model.getMedicationCompletionStats(1);
    assert.strictEqual(res.average_percent_yes, '100.00');
  });

  it('getServicePaymentModes → most common Free', function() {
    const res = model.getServicePaymentModes(1);
    assert.strictEqual(res.most_common, 'Free');
    assert.strictEqual(res.breakdown[0].count, 5);
  });

  it('getSatisfactionDistribution → average ≈ 3.40', function() {
    const dist = model.getSatisfactionDistribution(1);
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

  // Response counts
  it('getResponseCount → matches SQL count', function() {
    const c = model.getResponseCount(1);
    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM Response`).get().cnt;
    assert.strictEqual(c.total_responses, total);
  });

  it('getResponseBreakdownByQuestion', function() {
    const breakdown = model.getResponseBreakdownByQuestion(1, 10);
    assert.strictEqual(breakdown.find(x=>x.answer==='Yes').count, 4);
    assert.strictEqual(breakdown.find(x=>x.answer==='No').count, 1);
  });

  // Latest / summary
  it('getLatestResponses honors limit & fromDate', function() {
    db.prepare(`INSERT INTO Response (patient_id, facility_id, question_id, answer_option_id, submitted_at) VALUES (?,?,?,?,?)`)
      .run('old',1,8,1,'2000-01-01T00:00:00.000Z');
    const latest = model.getLatestResponses(1, '2020-01-01', 2);
    assert(latest.length <= 2);
    assert(latest.every(r => new Date(r.submitted_at) >= new Date('2020-01-01')));
  });

  it('getSummaryStats returns correct structure', function() {
    const stats = model.getSummaryStats(1);
    ['questions_answered','unique_answers_given','unique_patients'].forEach(k => {
      assert(typeof stats[k] === 'number');
    });
  });

  // Joined responses
  it('getFacilityResponsesById includes facility and question', function() {
    const rows = model.getFacilityResponsesById(1);
    assert(rows.length > 0);
    assert.strictEqual(rows[0].facility_name, 'Test Facility');
    assert('question_text' in rows[0]);
  });

  // Area satisfaction
  it('getAreaSatisfactionSummary aggregates good/bad', function() {
    const summary = model.getAreaSatisfactionSummary(1);
    const friendly = summary.find(a => a.area === 'Friendly Staff');
    const delay = summary.find(a => a.area === 'Delay');
    assert.strictEqual(friendly.good_count, 4);
    assert.strictEqual(delay.bad_count, 3);
  });

  it('getAreaSatisfactionWithScore computes net_score', function() {
    const scored = model.getAreaSatisfactionWithScore(1);
    const first = scored.find(s => s.area === 'Friendly Staff');
    assert.strictEqual(first.net_score, 4);
  });

  // Best/worst
  it('getBestWorstByArea returns same facility when only one exists', function() {
    const result = model.getBestWorstByArea('Delay');
    assert.strictEqual(result.best.facility_name, 'Test Facility');
    assert.strictEqual(result.worst.facility_name, 'Test Facility');
  });

  // Weight computations
  it('getFacilityWeightByQuestion computes average_weight', function() {
    const weights = model.getFacilityWeightByQuestion(17);
    assert.strictEqual(weights[0].response_count, 5);
    assert(Math.abs(weights[0].average_weight - 3.4) < 0.01);
  });

  it('getWeightOfFacility aggregates weights across questions', function() {
    const w = model.getWeightOfFacility(1);
    assert(Math.abs(w.average_weight - 3.4) < 0.01);
  });

  it('getFacilityWeightbyTime filters by date range', function() {
    const arr = model.getFacilityWeightbyTime(17, '1970-01-01', '3000-01-01');
    assert.strictEqual(arr[0].response_count, 5);
  });

  // Over time series
  it('getAverageSatisfactionOverTime returns daily averages', function() {
    const arr = model.getAverageSatisfactionOverTime('1970-01-01', '3000-01-01');
    assert(arr.find(e => e.date === today));
    assert('average_satisfaction' in arr[0]);
  });

  it('getAverageSatisfactionOverTimeFacilities scopes to facility', function() {
    const arr = model.getAverageSatisfactionOverTimeFacilities(1, '1970-01-01', '3000-01-01');
    assert(arr.length > 0);
  });

  it('getAverageSatisfactionOverTimeRegion scopes to location pattern', function() {
    const arr = model.getAverageSatisfactionOverTimeRegion('Arusha Region', '1970-01-01', '3000-01-01');
    assert(arr.length > 0);
  });

  // Utility methods
  it('parseDate handles various formats', function() {
    const iso = model.parseDate('2020-12-31');
    assert(iso.startsWith('2020-12-31'));
    const md = model.parseDate('1/2/21');
    assert(md.startsWith('2021-01-02'));
    assert.strictEqual(model.parseDate('invalid'), null);
  });

  it('generatePatientId returns hex string length 12', function() {
    const id = model.generatePatientId();
    assert(/^[0-9a-f]{12}$/.test(id));
  });

  it('getResponseBreakdownByQuestion for nonexistent returns empty array', function() {
    const arr = model.getResponseBreakdownByQuestion(1, 999);
    assert(Array.isArray(arr) && arr.length === 0);
  });

});
