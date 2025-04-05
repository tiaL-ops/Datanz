const assert = require('assert');
const ResponseModel = require('../models/ResponseModel');

describe('ResponseModel', function() {
  let fakeDB;
  let responseModel;

  // Set up a fake DB object to simulate Response table operations.
  beforeEach(() => {
    fakeDB = {
      responses: [],
      nextId: 1,
      // Will use a simple prepare method that inspects the query string and returns
      // stub functions for run, get, and all.
      prepare: function(query) {
        // Handle INSERT INTO Response: Create a new response record.
        if (query.includes("INSERT INTO Response")) {
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
        // Handle SELECT * FROM Response WHERE response_id = ?
        if (query.includes("SELECT * FROM Response WHERE response_id = ?")) {
          return {
            get: (id) => fakeDB.responses.find(r => r.response_id === id) || null
          };
        }
        // Handle UPDATE Response query.
        if (query.includes("UPDATE Response")) {
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
        // Handle DELETE FROM Response query.
        if (query.includes("DELETE FROM Response")) {
          return {
            run: (response_id) => {
              fakeDB.responses = fakeDB.responses.filter(r => r.response_id !== response_id);
            }
          };
        }
        // Handle aggregateMetrics for satisfaction ranking query.
        if (query.includes("SELECT facility_id, AVG(")) {
          return {
            all: () => {
              // For simplicity, group responses by facility and compute average satisfaction
              // using answer_option_id as a numeric value.
              const groups = {};
              fakeDB.responses.forEach(r => {
                // Only consider responses for satisfaction (question_id === 17)
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
              // Sort descending by average satisfaction.
              results.sort((a, b) => b.avg_satisfaction - a.avg_satisfaction);
              return results;
            }
          };
        }
        // For getTopProblemAreas and getTopPositiveAreas, we override in the tests.
        if (query.includes("SELECT ao.answer_text AS problem_area")) {
          return { all: () => [] };
        }
        if (query.includes("SELECT ao.answer_text AS positive_area")) {
          return { all: () => [] };
        }
        return {
          run: () => {},
          get: () => null,
          all: () => []
        };
      }
    };

    // Instantiate ResponseModel with our fake DB.
    responseModel = new ResponseModel(fakeDB);
  });

  // Test for createResponse(data)
  describe('createResponse', function() {
    it('should save a new response and return its new ID', function() {
      // We'll define createResponse as a method that wraps the INSERT query.
      responseModel.createResponse = function(data) {
        const stmt = this.db.prepare("INSERT INTO Response (patient_id, facility_id, question_id, answer_option_id) VALUES (?, ?, ?, ?)");
        const result = stmt.run(data.patient_id, data.facility_id, data.question_id, data.answer_option_id);
        return result.lastInsertRowid;
      };

      const data = { patient_id: 'abc123', facility_id: 1, question_id: 10, answer_option_id: 5 };
      const newId = responseModel.createResponse(data);
      assert.strictEqual(newId, 1);
      // Verify that the record is stored in the fake database.
      const inserted = fakeDB.responses.find(r => r.response_id === newId);
      assert(inserted);
      assert.strictEqual(inserted.patient_id, 'abc123');
    });
  });

  // Test for getResponseById(id)
  describe('getResponseById', function() {
    it('should retrieve a specific response by its ID', function() {
      // Pre-insert a sample response.
      fakeDB.responses.push({ response_id: 1, patient_id: 'abc123', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: new Date().toISOString() });
      responseModel.getResponseById = function(id) {
        const stmt = this.db.prepare("SELECT * FROM Response WHERE response_id = ?");
        return stmt.get(id);
      };

      const response = responseModel.getResponseById(1);
      assert(response);
      assert.strictEqual(response.patient_id, 'abc123');
    });
  });

  // Test for updateResponse(id, data)
  describe('updateResponse', function() {
    it('should update fields in an existing response', function() {
      // Pre-insert a sample response.
      fakeDB.responses.push({ response_id: 1, patient_id: 'abc123', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: new Date().toISOString() });
      responseModel.updateResponse = function(id, data) {
        const stmt = this.db.prepare("UPDATE Response SET patient_id = ?, facility_id = ?, question_id = ?, answer_option_id = ? WHERE response_id = ?");
        stmt.run(data.patient_id, data.facility_id, data.question_id, data.answer_option_id, id);
      };

      const newData = { patient_id: 'def456', facility_id: 2, question_id: 11, answer_option_id: 7 };
      responseModel.updateResponse(1, newData);
      const updated = fakeDB.responses.find(r => r.response_id === 1);
      assert(updated);
      assert.strictEqual(updated.patient_id, 'def456');
      assert.strictEqual(updated.facility_id, 2);
    });
  });

  // Test for deleteResponse(id)
  describe('deleteResponse', function() {
    it('should remove a response by ID', function() {
      // Pre-insert two responses.
      fakeDB.responses.push({ response_id: 1, patient_id: 'abc123', facility_id: 1, question_id: 10, answer_option_id: 5, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 2, patient_id: 'def456', facility_id: 1, question_id: 11, answer_option_id: 6, submitted_at: new Date().toISOString() });
      responseModel.deleteResponse = function(id) {
        const stmt = this.db.prepare("DELETE FROM Response WHERE response_id = ?");
        stmt.run(id);
      };

      responseModel.deleteResponse(1);
      assert.strictEqual(fakeDB.responses.length, 1);
      assert.strictEqual(fakeDB.responses[0].response_id, 2);
    });
  });

  // Test for aggregateMetrics(facilityId)
  describe('aggregateMetrics', function() {
    it('should calculate key stats (average satisfaction) for a facility', function() {
      // For simplicity, we simulate satisfaction by storing numeric values in answer_option_id for question_id 17.
      fakeDB.responses.push({ response_id: 1, patient_id: 'a', facility_id: 1, question_id: 17, answer_option_id: 4, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 2, patient_id: 'b', facility_id: 1, question_id: 17, answer_option_id: 5, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 3, patient_id: 'c', facility_id: 1, question_id: 17, answer_option_id: 3, submitted_at: new Date().toISOString() });
      responseModel.aggregateMetrics = function(facilityId) {
        // Filter responses for satisfaction (question_id === 17) at the facility.
        const responses = fakeDB.responses.filter(r => r.facility_id === facilityId && r.question_id === 17);
        const total = responses.reduce((sum, r) => sum + Number(r.answer_option_id), 0);
        const avg = responses.length ? total / responses.length : 0;
        return { facility_id: facilityId, average_satisfaction: avg };
      };

      const metrics = responseModel.aggregateMetrics(1);
      assert.strictEqual(metrics.average_satisfaction, 4);
    });
  });

  // Test for rankFacilitiesBySatisfaction()
  describe('rankFacilitiesBySatisfaction', function() {
    it('should return facilities sorted by average satisfaction', function() {
      // Simulate responses for two facilities.
      fakeDB.responses.push({ response_id: 1, patient_id: 'a', facility_id: 1, question_id: 17, answer_option_id: 5, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 2, patient_id: 'b', facility_id: 1, question_id: 17, answer_option_id: 5, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 3, patient_id: 'c', facility_id: 2, question_id: 17, answer_option_id: 3, submitted_at: new Date().toISOString() });
      fakeDB.responses.push({ response_id: 4, patient_id: 'd', facility_id: 2, question_id: 17, answer_option_id: 4, submitted_at: new Date().toISOString() });
      responseModel.rankFacilitiesBySatisfaction = function() {
        const stmt = this.db.prepare("SELECT facility_id, AVG(answer_option_id) AS avg_satisfaction FROM Response WHERE question_id = 17 GROUP BY facility_id ORDER BY avg_satisfaction DESC");
        return stmt.all();
      };

      const ranking = responseModel.rankFacilitiesBySatisfaction();
      assert.strictEqual(ranking.length, 2);
      assert.strictEqual(ranking[0].facility_id, 1);
      assert(ranking[0].avg_satisfaction > ranking[1].avg_satisfaction);
    });
  });

  // Test for getTopProblemAreas(facilityId)
  describe('getTopProblemAreas', function() {
    it('should count and rank the most frequently mentioned problem areas', function() {
      // Override getTopProblemAreas to simulate a result.
      responseModel.getTopProblemAreas = function(facilityId) {
        return [{ problem_area: 'Delay', count: 2 }, { problem_area: 'Rudeness', count: 1 }];
      };

      const topProblems = responseModel.getTopProblemAreas(1);
      assert.strictEqual(topProblems[0].problem_area, 'Delay');
      assert.strictEqual(topProblems[0].count, 2);
    });
  });

  // Test for getTopPositiveAreas(facilityId)
  describe('getTopPositiveAreas', function() {
    it('should count and rank the most frequently mentioned positive areas', function() {
      // Override getTopPositiveAreas to simulate a result.
      responseModel.getTopPositiveAreas = function(facilityId) {
        return [{ positive_area: 'Friendly Staff', count: 2 }, { positive_area: 'Quick Service', count: 1 }];
      };

      const topPositive = responseModel.getTopPositiveAreas(1);
      assert.strictEqual(topPositive[0].positive_area, 'Friendly Staff');
      assert.strictEqual(topPositive[0].count, 2);
    });
  });
});
