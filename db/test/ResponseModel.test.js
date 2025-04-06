const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const ResponseModel = require('../models/ResponseModel');
const FacilityModel = require('../models/FacilityModel');


FacilityModel.prototype.getFacilityByCode = function(facilityCode) {
  if (facilityCode === 'FAC123') {
    return { facility_id: 1 };
  }
  return null;
};

describe('ResponseModel', function() {
  let fakeDB;
  let responseModel;

  // Setup a fake database before each test.
  beforeEach(function() {
    fakeDB = {
      responses: [],
      prepare: function(query) {
        // Simulate query for getting facility id by facility code.
        if (query.includes("SELECT facility_id FROM Facility WHERE facility_code = ?")) {
          return {
            get: function(facilityCode) {
              if (facilityCode === 'FAC123') {
                return { facility_id: 1 };
              }
              return null;
            }
          };
        }
        
        if (query.includes("SELECT question_id FROM Question WHERE question_text = ?")) {
          return {
            get: function(questionText) {
              const mapping = {
                'After arriving at the facility, how long did it take you to get attended?': { question_id: 8 },
                'Were you satisfied with the confidentiality while receiving treatment?': { question_id: 10 },
                'Did the HCW use easy language to help you understand what services you were receiving?': { question_id: 999 },
                'Did you get all the tests that had been written/prescribed?': { question_id: 12 },
                'Were you asked for permission before being examined?': { question_id: 9 },
                'Did you get all your prescribed medication?': { question_id: 14 },
                'How did you pay for services at the health center?': { question_id: 16 },
                'Are you satisfied with all our services in general?': { question_id: 999 },
                'Which area has satisfied you? (If you answer 4 or 5 to question 17)': { question_id: 18 },
                'Which area did not satisfy you? (If you answered 1, 2 or 3 to question 17)': { question_id: 19 }
              };
              return mapping[questionText] || { question_id: 999 };
            }
          };
        }
        // Simulate query for getting answer option id by question_id and answer_text.
        if (query.includes("SELECT id FROM AnswerOption WHERE question_id = ? AND answer_text = ?")) {
          return {
            get: function(question_id, answer_text) {
              const answerMap = {
                // Waiting time options (question_id 8)
                '8:Within 1 hour': { id: 1 },
                '8:Between 2-3 hours': { id: 2 },
                '8:More than 3 hours': { id: 3 },
                // Confidentiality options (question_id 10)
                '10:Yes': { id: 4 },
                '10:No': { id: 5 },
                // Permission options (question_id 9)
                '9:Yes': { id: 6 },
                '9:No': { id: 7 },
                // Test completion options (question_id 12)
                '12:Yes': { id: 8 },
                '12:Some': { id: 9 },
                '12:None': { id: 10 },
                // Medication completion options (question_id 14)
                '14:Yes': { id: 11 },
                '14:Some': { id: 12 },
                '14:None': { id: 13 },
                // Payment method options (question_id 16)
                '16:Free': { id: 14 },
                '16:Cash': { id: 15 },
                '16:Insurance': { id: 16 },
                // Satisfaction options (question_id 17)
                '17:1': { id: 17 },
                '17:2': { id: 18 },
                '17:3': { id: 19 },
                '17:4': { id: 20 },
                '17:5': { id: 21 },
                // Problem area (question_id 19)
                '19:Area1': { id: 22 },
                '19:Area2': { id: 23 },
                // Positive area (question_id 18)
                '18:AreaA': { id: 24 },
                '18:AreaB': { id: 25 }
              };
              return answerMap[`${question_id}:${answer_text}`] || null;
            }
          };
        }
        // Simulate insert statement.
        if (query.includes("INSERT INTO Response")) {
          return {
            run: function(patient_id, facility_id, question_id, answer_option_id) {
              fakeDB.responses.push({ patient_id, facility_id, question_id, answer_option_id });
            }
          };
        }
        // Simulate general SELECT queries from the Response table.
        if (query.includes("FROM Response")) {
          return {
            all: function(...args) {
              const facility_id = args[0];
              let question_id;
              if (query.includes("question_id = 8")) question_id = 8;
              if (query.includes("question_id = 17")) question_id = 17;
              if (query.includes("question_id = 10")) question_id = 10;
              if (query.includes("question_id = 9")) question_id = 9;
              if (query.includes("question_id = 12")) question_id = 12;
              if (query.includes("question_id = 14")) question_id = 14;
              if (query.includes("question_id = 16")) question_id = 16;
              if (query.includes("question_id = 19")) question_id = 19;
              if (query.includes("question_id = 18")) question_id = 18;
              const responses = fakeDB.responses.filter(r => {
                return r.facility_id === facility_id && (!question_id || r.question_id === question_id);
              });
              // Count responses per answer_option_id.
              const counts = {};
              responses.forEach(r => {
                counts[r.answer_option_id] = (counts[r.answer_option_id] || 0) + 1;
              });
              // Lookup table for answer texts.
              const answerTextLookup = {
                1: "Within 1 hour",
                2: "Between 2-3 hours",
                3: "More than 3 hours",
                4: "Yes",
                5: "No",
                6: "Yes",
                7: "No",
                8: "Yes",
                9: "Some",
                10: "None",
                11: "Yes",
                12: "Some",
                13: "None",
                14: "Free",
                15: "Cash",
                16: "Insurance",
                17: "1",
                18: "2",
                19: "3",
                20: "4",
                21: "5",
                22: "Area1",
                23: "Area2",
                24: "AreaA",
                25: "AreaB"
              };
              const result = [];
              for (const option in counts) {
                
                if (query.includes("AS satisfaction")) {
                  result.push({
                    count: counts[option],
                    satisfaction: answerTextLookup[option],
                    facility_id: facility_id
                  });
                } else {
                  result.push({
                    count: counts[option],
                    answer_text: answerTextLookup[option],
                    facility_id: facility_id,
                    wait_minutes: (question_id === 8) ?
                      (answerTextLookup[option] === "Within 1 hour" ? 30 :
                       answerTextLookup[option] === "Between 2-3 hours" ? 150 :
                       answerTextLookup[option] === "More than 3 hours" ? 240 : null)
                      : undefined
                  });
                }
              }
              return result;
            },
            get: function(...args) {
              const facility_id = args[0];
              const responses = fakeDB.responses.filter(r => r.facility_id === facility_id);
              if (query.includes("COUNT(*) AS total_responses")) {
                return { total_responses: responses.length };
              }
              if (query.includes("COUNT(DISTINCT r.question_id)")) {
                const questions = new Set();
                const uniqueAnswers = new Set();
                const patients = new Set();
                responses.forEach(r => {
                  questions.add(r.question_id);
                  uniqueAnswers.add(r.answer_option_id);
                  patients.add(r.patient_id);
                });
                return {
                  questions_answered: questions.size,
                  unique_answers_given: uniqueAnswers.size,
                  unique_patients: patients.size
                };
              }
              return null;
            }
          };
        }

        return {
          run: () => {},
          get: () => null,
          all: () => []
        };
      }
    };
    responseModel = new ResponseModel(fakeDB);
  });

  describe('generatePatientId', function() {
    it('should generate a unique patient id of length 12 in hex', function() {
      const id = responseModel.generatePatientId();
      assert.strictEqual(id.length, 12);
    });
  });

  /*describe('loadFromSurveyCSV', function() {
    const tempFilePath = path.join(os.tmpdir(), 'test_survey.csv');
    before(function(done) {
      // Write a simple CSV with a single row.
      const csvContent = `FacilityCode,WaitingTime,Confidentiality,Permission,GotAllTests,GotAllMedecines,Payment method,Overall satisfaction,Bad,Good
FAC123,Within 1 hour,Yes,Yes,Yes,Yes,Free,5,Area1,AreaA
`;
      fs.writeFile(tempFilePath, csvContent, done);
    });
    after(function(done) {
      fs.unlink(tempFilePath, done);
    });
    it('should load responses from CSV and insert them into fakeDB.responses', function(done) {
      responseModel.loadFromSurveyCSV(tempFilePath);
      // Allow some time for the asynchronous CSV reading.
      setTimeout(() => {
        // Our CSV row has 9 columns (excluding FacilityCode) that are mapped to questions.
        assert.strictEqual(fakeDB.responses.length, 9);
        done();
      }, 100);
    });
  });
*/
  describe('getWaitingTimeStats', function() {
    it('should return correct average wait time and breakdown', function() {

      const patientId = 'abc123';
      fakeDB.responses.push({ patient_id: patientId, facility_id: 1, question_id: 8, answer_option_id: 1 }); // 30 minutes
      fakeDB.responses.push({ patient_id: patientId, facility_id: 1, question_id: 8, answer_option_id: 2 }); // 150 minutes
      fakeDB.responses.push({ patient_id: patientId, facility_id: 1, question_id: 8, answer_option_id: 2 }); // 150 minutes
      
      const stats = responseModel.getWaitingTimeStats(1);
      
      assert.strictEqual(stats.average_wait_time_minutes, 110);

      assert.strictEqual(stats.breakdown.length, 2);
    });
  });

  describe('getSatisfactionDistribution', function() {
    it('should return satisfaction distribution for question 17', function() {
      const patientId = 'xyz789';
   
      fakeDB.responses.push({ patient_id: patientId, facility_id: 1, question_id: 17, answer_option_id: 17 }); // "1"
      fakeDB.responses.push({ patient_id: patientId, facility_id: 1, question_id: 17, answer_option_id: 18 }); // "2"
      fakeDB.responses.push({ patient_id: patientId, facility_id: 1, question_id: 17, answer_option_id: 18 }); // "2"
      
      const distribution = responseModel.getSatisfactionDistribution(1);
      const group1 = distribution.find(item => item.satisfaction === '1');
      const group2 = distribution.find(item => item.satisfaction === '2');
      
      assert.strictEqual(group1.count, 1);
      assert.strictEqual(group2.count, 2);
    });
  });

  describe('getResponseCount', function() {
    it('should return total response count for a facility', function() {
      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 8, answer_option_id: 1 });
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 10, answer_option_id: 4 });
      
      const countObj = responseModel.getResponseCount(1);
      assert.strictEqual(countObj.total_responses, 2);
    });
  });

  describe('getSummaryStats', function() {
    it('should return summary statistics for a facility', function() {
      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 8, answer_option_id: 1 });
      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 10, answer_option_id: 4 });
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 8, answer_option_id: 2 });
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 9, answer_option_id: 6 });
      
      const summary = responseModel.getSummaryStats(1);
      // Distinct questions: 8, 10, 9 → 3; unique answers: 1,4,2,6 → 4; patients: p1, p2, p3 → 3.
      assert.strictEqual(summary.questions_answered, 3);
      assert.strictEqual(summary.unique_answers_given, 4);
      assert.strictEqual(summary.unique_patients, 3);
    });
    
  });


  describe('getConfidentialityStats', function() {
    it('should return confidentiality stats for question 10', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 10, answer_option_id: 4 }); // Yes
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 10, answer_option_id: 5 }); // No
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 10, answer_option_id: 4 }); // Yes

      const stats = responseModel.getConfidentialityStats(1);
      const yesGroup = stats.find(item => item.confidentiality === 'Yes');
      const noGroup = stats.find(item => item.confidentiality === 'No');

      assert.strictEqual(yesGroup.count, 2);
      assert.strictEqual(noGroup.count, 1);
    });
  });

  describe('getPermissionBeforeExamStats', function() {
    it('should return permission before exam stats for question 9', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 9, answer_option_id: 6 }); // Yes
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 9, answer_option_id: 7 }); // No

      const stats = responseModel.getPermissionBeforeExamStats(1);
      const yesGroup = stats.find(item => item.permission_before_exam === 'Yes');
      const noGroup = stats.find(item => item.permission_before_exam === 'No');

      assert.strictEqual(yesGroup.count, 1);
      assert.strictEqual(noGroup.count, 1);
    });
  });

  describe('getTestCompletionStats', function() {
    it('should return test completion stats for question 12', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 12, answer_option_id: 8 }); // Yes
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 12, answer_option_id: 9 }); // Some
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 12, answer_option_id: 9 }); // Some

      const stats = responseModel.getTestCompletionStats(1);
      const yesGroup = stats.find(item => item.test_completion_stats === 'Yes');
      const someGroup = stats.find(item => item.test_completion_stats === 'Some');

      assert.strictEqual(yesGroup.count, 1);
      assert.strictEqual(someGroup.count, 2);
    });
  });

  describe('getMedicationCompletionStats', function() {
    it('should return medication completion stats for question 14', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 14, answer_option_id: 11 }); // Yes
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 14, answer_option_id: 12 }); // Some

      const stats = responseModel.getMedicationCompletionStats(1);
      const yesGroup = stats.find(item => item.received_all_meds === 'Yes');
      const someGroup = stats.find(item => item.received_all_meds === 'Some');

      assert.strictEqual(yesGroup.count, 1);
      assert.strictEqual(someGroup.count, 1);
    });
  });

  describe('getServicePaymentModes', function() {
    it('should return service payment mode stats for question 16', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 16, answer_option_id: 14 }); // Free
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 16, answer_option_id: 15 }); // Cash
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 16, answer_option_id: 14 }); // Free

      const stats = responseModel.getServicePaymentModes(1);
      const freeGroup = stats.find(item => item.service_payment_mode === 'Free');
      const cashGroup = stats.find(item => item.service_payment_mode === 'Cash');

      assert.strictEqual(freeGroup.count, 2);
      assert.strictEqual(cashGroup.count, 1);
    });
  });

  describe('getProblemAreaFrequency', function() {
    it('should return frequency for problem areas (question 19)', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 19, answer_option_id: 22 }); // Area1
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 19, answer_option_id: 23 }); // Area2
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 19, answer_option_id: 22 }); // Area1

      const stats = responseModel.getProblemAreaFrequency(1);
      const area1 = stats.find(item => item.problem_area === 'Area1');
      const area2 = stats.find(item => item.problem_area === 'Area2');

      assert.strictEqual(area1.count, 2);
      assert.strictEqual(area2.count, 1);
    });
  });

  describe('getPositiveAreaFrequency', function() {
    it('should return frequency for positive areas (question 18)', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 18, answer_option_id: 24 }); // AreaA
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 18, answer_option_id: 25 }); // AreaB
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 18, answer_option_id: 24 }); // AreaA

      const stats = responseModel.getPositiveAreaFrequency(1);
      const areaA = stats.find(item => item.positive_area === 'AreaA');
      const areaB = stats.find(item => item.positive_area === 'AreaB');

      assert.strictEqual(areaA.count, 2);
      assert.strictEqual(areaB.count, 1);
    });
  });

  describe('getResponseBreakdownByQuestion', function() {
    it('should return breakdown for a given question', function() {

      fakeDB.responses.push({ patient_id: 'p1', facility_id: 1, question_id: 10, answer_option_id: 4 }); // Yes
      fakeDB.responses.push({ patient_id: 'p2', facility_id: 1, question_id: 10, answer_option_id: 5 }); // No
      fakeDB.responses.push({ patient_id: 'p3', facility_id: 1, question_id: 10, answer_option_id: 4 }); // Yes

      const breakdown = responseModel.getResponseBreakdownByQuestion(1, 10);
      const yesGroup = breakdown.find(item => item.answer === 'Yes');
      const noGroup = breakdown.find(item => item.answer === 'No');

      assert.strictEqual(yesGroup.count, 2);
      assert.strictEqual(noGroup.count, 1);
    });
  });

  describe('getLatestResponses', function() {
    it('should return latest responses based on submitted_at date', function() {
  
      fakeDB.responses.push({ response_id: 1, patient_id: 'p1', facility_id: 1, question_id: 8, answer_option_id: 1, submitted_at: '2025-04-05T10:00:00Z' });
      fakeDB.responses.push({ response_id: 2, patient_id: 'p2', facility_id: 1, question_id: 8, answer_option_id: 2, submitted_at: '2025-04-06T09:00:00Z' });
      fakeDB.responses.push({ response_id: 3, patient_id: 'p3', facility_id: 1, question_id: 8, answer_option_id: 3, submitted_at: '2025-04-04T11:00:00Z' });

      const latest = responseModel.getLatestResponses(1, '2025-04-05', 2);
    
      assert.strictEqual(latest.length, 2);
      assert.strictEqual(latest[0].response_id, 2); // Latest date
      assert.strictEqual(latest[1].response_id, 1);
    });
  });

  describe('getFacilityResponsesById', function() {
    it('should return facility responses with joined facility, question, and answer option data', function() {
    
      fakeDB.responses.push({
        patient_id: 'p1',
        facility_id: 1,
        question_id: 8,
        answer_option_id: 1,
        submitted_at: '2025-04-05T10:00:00Z'
      });

      fakeDB.prepare = function(query) {
        if (query.includes("SELECT \n            Facility.facility_id")) {
          return {
            all: function(facility_id) {
              return [{
                facility_id: facility_id,
                facility_name: "Test Facility",
                question_id: 8,
                question_text: "Waiting Time Question",
                answer_option_id: 1,
                answer_text: "Within 1 hour"
              }];
            }
          };
        }

        return {
          run: () => {},
          get: () => null,
          all: () => []
        };
      };

      const facilityResponses = responseModel.getFacilityResponsesById(1);
      assert.strictEqual(facilityResponses.length, 1);
      assert.strictEqual(facilityResponses[0].facility_name, "Test Facility");
      assert.strictEqual(facilityResponses[0].question_text, "Waiting Time Question");
      assert.strictEqual(facilityResponses[0].answer_text, "Within 1 hour");
    });
  });
 

  


});
