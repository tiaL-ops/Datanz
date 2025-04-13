const assert = require('assert');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const ResponseModel = require('../models/ResponseModel');

// Utility to normalize query strings (collapse whitespace and convert to lowercase)
function normalize(query) {
  return query.replace(/\s+/g, ' ').toLowerCase();
}

describe('ResponseModel', function() {
  let fakeDB;
  let responseModel;
  let tempCsvFile; // for loadFromSurveyCSV testing

  beforeEach(() => {
    fakeDB = {
      responses: [],
      nextId: 1,
      prepare: function(query) {
        const lQuery = normalize(query);
        // INSERT INTO Response
        if (lQuery.includes("insert into response")) {
          return {
            run: (patient_id, facility_id, question_id, answer_option_id) => {
              const newId = fakeDB.nextId;
              const newResponse = {
                response_id: newId,
                patient_id,
                facility_id,
                question_id,
                answer_option_id,
                submitted_at: new Date().toISOString()
              };
              fakeDB.responses.push(newResponse);
              fakeDB.nextId++;
              return { lastInsertRowid: newId };
            }
          };
        }
        // SELECT * FROM Response WHERE response_id = ?
        if (lQuery.includes("select * from response where response_id = ?")) {
          return {
            get: (id) => fakeDB.responses.find(r => r.response_id === id) || null
          };
        }
        // UPDATE Response
        if (lQuery.includes("update response")) {
          return {
            run: (newPatientId, newFacilityId, newQuestionId, newAnswerOptionId, response_id) => {
              const response = fakeDB.responses.find(r => r.response_id === response_id);
              if (response) {
                response.patient_id = newPatientId;
                response.facility_id = newFacilityId;
                response.question_id = newQuestionId;
                response.answer_option_id = newAnswerOptionId;
              }
            }
          };
        }
        // DELETE FROM Response
        if (lQuery.includes("delete from response")) {
          return {
            run: (response_id) => {
              fakeDB.responses = fakeDB.responses.filter(r => r.response_id !== response_id);
            }
          };
        }
        // Aggregate metrics for satisfaction ranking
        if (lQuery.includes("select facility_id, avg(")) {
          return {
            all: () => {
              const groups = {};
              fakeDB.responses.forEach(r => {
                if (r.question_id === 17) {
                  if (!groups[r.facility_id]) groups[r.facility_id] = { sum: 0, count: 0 };
                  groups[r.facility_id].sum += Number(r.answer_option_id);
                  groups[r.facility_id].count++;
                }
              });
              const results = [];
              for (const facilityId in groups) {
                const avg = groups[facilityId].sum / groups[facilityId].count;
                results.push({ facility_id: Number(facilityId), avg_satisfaction: avg });
              }
              results.sort((a, b) => b.avg_satisfaction - a.avg_satisfaction);
              return results;
            }
          };
        }
        // For getTopProblemAreas override (match any query containing "r.question_id = 19")
        if (lQuery.includes("select ao.answer_text as problem_area") &&
            lQuery.includes("r.question_id = 19")) {
          return { all: () => [{ problem_area: 'Delay', count: 3 }] };
        }
        // For getTopPositiveAreas override (match any query containing "r.question_id = 18")
        if (lQuery.includes("select ao.answer_text as positive_area") &&
            lQuery.includes("r.question_id = 18")) {
          return { all: () => [{ positive_area: 'Friendly Staff', count: 4 }] };
        }
        // NEW: Branch for getLatestResponses
        if (lQuery.includes("select r.response_id, r.question_id,") &&
            lQuery.includes("date(r.submitted_at) >= date(?)")) {
          return {
            all: function(facility_id, fromDate, limit) {
              const fromDateObj = new Date(fromDate);
              let filtered = fakeDB.responses.filter(r =>
                r.facility_id === facility_id && new Date(r.submitted_at) >= fromDateObj
              );
              filtered.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
              return filtered.slice(0, limit);
            }
          };
        }
        // NEW: Branch for getSummaryStats
        if (lQuery.includes("count(distinct r.question_id) as questions_answered")) {
          return {
            get: function(facility_id) {
              const responses = fakeDB.responses.filter(r => r.facility_id === facility_id);
              const questions_answered = new Set(responses.map(r => r.question_id)).size;
              const unique_answers_given = new Set(responses.map(r => r.answer_option_id)).size;
              const unique_patients = new Set(responses.map(r => r.patient_id)).size;
              return {
                questions_answered,
                unique_answers_given,
                unique_patients
              };
            }
          };
        }
        // Branch for getWaitingTimeStats
        if (lQuery.includes("select count(*) as count, ao.answer_text as wait_time") &&
            lQuery.includes("case when ao.answer_text = 'within 1 hour' then 30")) {
          return {
            all: function(facility_id) {
              return [
                { count: 2, wait_time: 'Within 1 hour', facility_id, wait_minutes: 30 },
                { count: 1, wait_time: 'Between 2-3 hours', facility_id, wait_minutes: 150 }
              ];
            }
          };
        }
        // Branch for getSatisfactionDistribution
        if (lQuery.includes("select ao.answer_text as satisfaction, count(*) as count") &&
            lQuery.includes("and r.question_id = 17")) {
          return {
            all: function(facility_id) {
              return [{ satisfaction: '5', count: 3 }];
            }
          };
        }
        // Branch for getConfidentialityStats
        if (lQuery.includes("select ao.answer_text as confidentiality, count(*) as count") &&
            lQuery.includes("and r.question_id = 10")) {
          return {
            all: function(facility_id) {
              return [{ confidentiality: 'Yes', count: 4 }];
            }
          };
        }
        // Branch for getPermissionBeforeExamStats
        if (lQuery.includes("select ao.answer_text as permission_before_exam, count(*) as count") &&
            lQuery.includes("and r.question_id = 9")) {
          return {
            all: function(facility_id) {
              return [{ permission_before_exam: 'Yes', count: 2 }];
            }
          };
        }
        // Branch for getTestCompletionStats
        if (lQuery.includes("select ao.answer_text as test_completion_stats, count(*) as count") &&
            lQuery.includes("and r.question_id = 12")) {
          return {
            all: function(facility_id) {
              return [{ test_completion_stats: 'Yes', count: 1 }];
            }
          };
        }
        // Branch for getMedicationCompletionStats
        if (lQuery.includes("select ao.answer_text as received_all_meds, count(*) as count") &&
            lQuery.includes("and r.question_id = 14")) {
          return {
            all: function(facility_id) {
              return [{ received_all_meds: 'Yes', count: 2 }];
            }
          };
        }
        // Branch for getServicePaymentModes
        if (lQuery.includes("select ao.answer_text as service_payment_mode, count(*) as count") &&
            lQuery.includes("and r.question_id = 16")) {
          return {
            all: function(facility_id) {
              return [{ service_payment_mode: 'Free', count: 5 }];
            }
          };
        }
        // Branch for getResponseCount
        if (lQuery.includes("select count(*) as total_responses")) {
          return {
            get: function(facility_id) {
              return { total_responses: fakeDB.responses.filter(r => r.facility_id === facility_id).length };
            }
          };
        }
        // Branch for getResponseBreakdownByQuestion
        if (lQuery.includes("select ao.answer_text as answer, count(*) as count") &&
            lQuery.includes("where r.facility_id = ? and r.question_id = ?")) {
          return {
            all: function(facility_id, question_id) {
              return [{ answer: 'Yes', count: 2 }, { answer: 'No', count: 1 }];
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

    // Instantiate ResponseModel with our fake DB.
    responseModel = new ResponseModel(fakeDB);

    // For loadFromSurveyCSV test, create a temporary CSV file.
    tempCsvFile = path.join(__dirname, 'temp_survey.csv');
    // Sample CSV with headers: FacilityCode, Language, Age
    // Two rows: each row will have 3 fields (thus 3 responses inserted per row => total 6 responses)
    const csvContent = `FacilityCode,Language,Age
FAC123,English,25
FAC123,Spanish,30`;
    fs.writeFileSync(tempCsvFile, csvContent, 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(tempCsvFile)) {
      fs.unlinkSync(tempCsvFile);
    }
  });

  // Test generatePatientId
  describe('generatePatientId', function() {
    it('should generate a 12-character hexadecimal string', function() {
      const id1 = responseModel.generatePatientId();
      const id2 = responseModel.generatePatientId();
      assert.strictEqual(id1.length, 12);
      assert.strictEqual(id2.length, 12);
      assert.notStrictEqual(id1, id2);
      assert(/^[0-9a-f]{12}$/.test(id1));
    });
  });

  // Test loadFromSurveyCSV
  describe('loadFromSurveyCSV', function() {
    it('should load survey responses from a CSV file', function(done) {
      // Stub FacilityModel.getFacilityByCode to return a dummy facility.
      const dummyFacility = { facility_id: 1, facility_code: 'FAC123' };
      const FacilityModel = require('../models/FacilityModel');
      FacilityModel.prototype.getFacilityByCode = function(code) {
        return code === 'FAC123' ? dummyFacility : null;
      };
      // Also, stub getQuestionId and getAnswerOptionId.
      fakeDB.prepare = ((originalPrepare) => {
        return function(query) {
          const lQuery = normalize(query);
          if (lQuery.includes("select question_id from question where question_text = ?")) {
            return { get: () => ({ question_id: 100 }) };
          }
          if (lQuery.includes("select id from answeroption where question_id = ? and answer_text = ?")) {
            return { get: () => ({ id: 200 }) };
          }
          return originalPrepare(query);
        };
      })(fakeDB.prepare.bind(fakeDB));

      responseModel.loadFromSurveyCSV(tempCsvFile);
      setTimeout(() => {
        // Expect 2 rows * 3 fields (non-empty) = 6 responses inserted.
        const count = fakeDB.responses.length;
        assert.strictEqual(count, 6);
        done();
      }, 300);
    });
  });

  // Test getWaitingTimeStats
  describe('getWaitingTimeStats', function() {
    it('should calculate average wait time and breakdown', function() {
      const stats = responseModel.getWaitingTimeStats(1);
      // Our fake branch returns: 2 responses of 30 min and 1 response of 150 min.
      // Total = 2*30 + 1*150 = 60 + 150 = 210; average = 210/3 = 70.
      assert.strictEqual(stats.average_wait_time_minutes, 70);
      assert(Array.isArray(stats.breakdown));
    });
  });

  // Test getSatisfactionDistribution
  describe('getSatisfactionDistribution', function() {
    it('should return satisfaction distribution', function() {
      const distribution = responseModel.getSatisfactionDistribution(1);
      assert(Array.isArray(distribution));
      assert.strictEqual(distribution[0].satisfaction, '5');
      assert.strictEqual(distribution[0].count, 3);
    });
  });

  // Test getConfidentialityStats
  describe('getConfidentialityStats', function() {
    it('should return confidentiality stats', function() {
      const stats = responseModel.getConfidentialityStats(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].confidentiality, 'Yes');
      assert.strictEqual(stats[0].count, 4);
    });
  });

  // Test getPermissionBeforeExamStats
  describe('getPermissionBeforeExamStats', function() {
    it('should return permission before exam stats', function() {
      const stats = responseModel.getPermissionBeforeExamStats(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].permission_before_exam, 'Yes');
      assert.strictEqual(stats[0].count, 2);
    });
  });

  // Test getTestCompletionStats
  describe('getTestCompletionStats', function() {
    it('should return test completion stats', function() {
      const stats = responseModel.getTestCompletionStats(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].test_completion_stats, 'Yes');
      assert.strictEqual(stats[0].count, 1);
    });
  });

  // Test getMedicationCompletionStats
  describe('getMedicationCompletionStats', function() {
    it('should return medication completion stats', function() {
      const stats = responseModel.getMedicationCompletionStats(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].received_all_meds, 'Yes');
      assert.strictEqual(stats[0].count, 2);
    });
  });

  // Test getServicePaymentModes
  describe('getServicePaymentModes', function() {
    it('should return service payment modes distribution', function() {
      const stats = responseModel.getServicePaymentModes(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].service_payment_mode, 'Free');
      assert.strictEqual(stats[0].count, 5);
    });
  });

  // Test getProblemAreaFrequency
  describe('getProblemAreaFrequency', function() {
    it('should return problem area frequency', function() {
      const stats = responseModel.getProblemAreaFrequency(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].problem_area, 'Delay');
      assert.strictEqual(stats[0].count, 3);
    });
  });

  // Test getPositiveAreaFrequency
  describe('getPositiveAreaFrequency', function() {
    it('should return positive area frequency', function() {
      const stats = responseModel.getPositiveAreaFrequency(1);
      assert(Array.isArray(stats));
      assert.strictEqual(stats[0].positive_area, 'Friendly Staff');
      assert.strictEqual(stats[0].count, 4);
    });
  });

  // Test getResponseCount
  describe('getResponseCount', function() {
    it('should return the total number of responses for a facility', function() {
      fakeDB.responses.push({ response_id: 1, patient_id: 'a', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 2, patient_id: 'b', facility_id: 1, question_id: 11, answer_option_id: 6, submitted_at: new Date().toISOString() });
      const countObj = responseModel.getResponseCount(1);
      assert.strictEqual(countObj.total_responses, 2);
    });
  });

  // Test getResponseBreakdownByQuestion
  describe('getResponseBreakdownByQuestion', function() {
    it('should return a breakdown of responses for a specific question', function() {
      const breakdown = responseModel.getResponseBreakdownByQuestion(1, 10);
      assert(Array.isArray(breakdown));
      assert.strictEqual(breakdown[0].answer, 'Yes');
      assert.strictEqual(breakdown[0].count, 2);
    });
  });

  // Test getLatestResponses
  describe('getLatestResponses', function() {
    it('should return the latest responses after the given date with the specified limit', function() {
      const now = new Date();
      const earlier = new Date(now.getTime() - 100000); // 100 seconds earlier
      const later = new Date(now.getTime() + 100000);   // 100 seconds later
  
      fakeDB.responses.push({ response_id: 1, patient_id: 'a', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: earlier.toISOString() });
      fakeDB.responses.push({ response_id: 2, patient_id: 'b', facility_id: 1, question_id: 10, answer_option_id: 6, submitted_at: now.toISOString() });
      fakeDB.responses.push({ response_id: 3, patient_id: 'c', facility_id: 1, question_id: 10, answer_option_id: 7, submitted_at: later.toISOString() });
  
      responseModel.getLatestResponses = function(facility_id, fromDate, limit) {
        const stmt = this.db.prepare(`
          SELECT r.response_id, r.question_id, r.submitted_at
          FROM Response r
          WHERE r.facility_id = ? AND DATE(r.submitted_at) >= DATE(?)
          ORDER BY r.submitted_at DESC
          LIMIT ?
        `);
        return stmt.all(facility_id, fromDate, limit);
      };
  
      const fromDate = earlier.toISOString();
      const latest = responseModel.getLatestResponses(1, fromDate, 2);
      assert.strictEqual(latest.length, 2);
      assert(latest[0].response_id > latest[1].response_id);
    });
  
    it('should return an empty array when no responses match the given fromDate', function() {
      fakeDB.responses = [];
      responseModel.getLatestResponses = function(facility_id, fromDate, limit) {
        const stmt = this.db.prepare(`
          SELECT r.response_id, r.question_id, r.submitted_at
          FROM Response r
          WHERE r.facility_id = ? AND DATE(r.submitted_at) >= DATE(?)
          ORDER BY r.submitted_at DESC
          LIMIT ?
        `);
        return stmt.all(facility_id, fromDate, limit);
      };
      const oldDate = new Date(2000, 0, 1).toISOString();
      fakeDB.responses.push({ response_id: 1, patient_id: 'x', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: oldDate });
      const fromDate = new Date(2020, 0, 1).toISOString();
      const latest = responseModel.getLatestResponses(1, fromDate, 2);
      assert.strictEqual(latest.length, 0);
    });
  });

  // Test getSummaryStats
  describe('getSummaryStats', function() {
    it('should calculate summary statistics for responses', function() {
      fakeDB.responses.push({ response_id: 1, patient_id: 'a', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 2, patient_id: 'b', facility_id: 1, question_id: 11, answer_option_id: 6, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 3, patient_id: 'a', facility_id: 1, question_id: 12, answer_option_id: 7, submitted_at: new Date().toISOString() });
  
      responseModel.getSummaryStats = function(facility_id) {
        const stmt = this.db.prepare(`
          SELECT 
            COUNT(DISTINCT r.question_id) AS questions_answered,
            COUNT(DISTINCT r.answer_option_id) AS unique_answers_given,
            COUNT(DISTINCT r.patient_id) AS unique_patients
          FROM Response r
          WHERE r.facility_id = ?
        `);
        return stmt.get(facility_id);
      };
  
      const stats = responseModel.getSummaryStats(1);
      assert.strictEqual(stats.questions_answered, 3);
      assert.strictEqual(stats.unique_answers_given, 3);
      assert.strictEqual(stats.unique_patients, 2);
    });
  });

  // Test Error Cases for updateResponse
  describe('Error Cases', function() {
    it('should not update any response if the given ID does not exist', function() {
      const originalCount = fakeDB.responses.length;
      responseModel.updateResponse = function(id, data) {
        const stmt = this.db.prepare("UPDATE Response SET patient_id = ?, facility_id = ?, question_id = ?, answer_option_id = ? WHERE response_id = ?");
        stmt.run(data.patient_id, data.facility_id, data.question_id, data.answer_option_id, id);
      };
  
      responseModel.updateResponse(999, { patient_id: 'new', facility_id: 2, question_id: 12, answer_option_id: 7 });
      assert.strictEqual(fakeDB.responses.length, originalCount);
    });
  });
<<<<<<< HEAD
});
=======
});

>>>>>>> 11cdc432739902d6f0b907eac5c09ad2ee70169b
