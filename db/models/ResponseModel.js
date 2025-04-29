
/**
 * This class will help get the filter running.
 *

wait_time	Q8	Grouped into categories (under 1 hr, 2–3 hrs, 3+)
satisfaction	Q17	1–5 scale (id)
confidentiality	Q10	Yes/No 
permission_before_exam	Q9	Yes/No2
received_all_tests	Q12	Yes/Some/None
received_all_meds	Q14	Yes/Some/None
service_payment_mode	Q16	Free/Cash/Insurance
problem_area	Q19	Multiple areas can be selected
positive_area	Q18	Multiple areas too


   response_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    facility_id INTEGER,
    question_id INTEGER,
    answer_option_id INTEGER,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (facility_id) REFERENCES Facility(facility_id),
    FOREIGN KEY (question_id) REFERENCES Question(question_id),
    FOREIGN KEY (answer_option_id) REFERENCES AnswerOption(id)

    loadfromcsv answer()
    

    getWaitingTimeStats(facility_id)
getSatisfactionDistribution(facility_id)
getConfidentialityStats(facility_id)
getPermissionBeforeExamStats(facility_id)

getTestCompletionStats(facility_id)
getMedicationCompletionStats(facility_id)
getServicePaymentModes(facility_id)
getProblemAreaFrequency(facility_id)

getPositiveAreaFrequency(facility_id)
getResponseCount(facility_id)
getResponseBreakdownByQuestion(facility_id, question_id)
getLatestResponses(facility_id, limit)
getSummaryStats(facility_id)


 */

const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');
const FacilityModel= require("./FacilityModel");

const { connectToDatabase } = require("../database");
const db = connectToDatabase();

class ResponseModel{

    constructor(db){
        this.db=db;
    }
    parseDate(raw) {
        if (!raw || typeof raw !== 'string') return null;
    
        // Try MM/DD/YYYY or M/D/YYYY
        const parts = raw.trim().split('/');
        if (parts.length === 3) {
          let [m, d, y] = parts;
          if (y.length === 2) y = '20' + y;
          m = m.padStart(2,'0');
          d = d.padStart(2,'0');
          const iso = `${y}-${m}-${d}T00:00:00Z`;
          if (!isNaN(Date.parse(iso))) {
            return iso;
          }
        }
    
        // Try ISO
        const dt = new Date(raw);
        if (!isNaN(dt.getTime())) {
          return dt.toISOString();
        }
    
        // on failure, return null
        return null;
      }

    generatePatientId() {
        return crypto.randomBytes(6).toString('hex'); // e.g. 'ab12cd34ef56'
    }

    loadFromSurveyCSV(filePath) {
        const facilityModel = new FacilityModel(db);
    
        const getFacilityId = this.db.prepare(`
            SELECT facility_id FROM Facility WHERE facility_code = ?
        `);
    
        const getQuestionId = this.db.prepare(`
            SELECT question_id FROM Question WHERE question_text = ?
        `);
    
        const getAnswerOptionId = this.db.prepare(`
            SELECT id FROM AnswerOption WHERE question_id = ? AND answer_text = ?
        `);
    
        const insertResponse = this.db.prepare(`
            INSERT INTO Response (patient_id, facility_id, question_id, answer_option_id, submitted_at)
            VALUES (?, ?, ?, ?, ?)
        `);
    
        // Map CSV headers to database questions
        const questionMap = {
            'Language': 'Thank you for reaching out to the government Client Feedback system for health services. Select your preferred language.',
            'FacilityCode': "Please enter the health facility code as written on the poster/leaflet or shared by the Health facility worker.",
            'Age': 'Please enter your age in years (between 10 and 99 years)',
            'Gender': 'What is your gender?',
            'Pregnant': 'Are you currently pregnant?',
            'GestionalAge': 'Please state your gestational age (pregnancy) by week. (If you answered 1 in question 5)',
            'Location': 'Where are you located as you provide this feedback?',
            'WaitingTime': 'After arriving at the facility, how long did it take you to get attended?',
            'Confidentiality': 'Were you satisfied with the confidentiality while receiving treatment?',
            'Communication': 'Did the HCW use easy language to help you understand what services you were receiving?',
            'GotAllTests': 'Did you get all the tests that had been written/prescribed?',
            'TestReasons': 'Why didnt you get all the tests you were prescribed? (If you answer 2 or 3 to question 12)',
            'Permission': 'Were you asked for permission before being examined?',
            'GotAllMedecines': 'Did you get all your prescribed medication?',
            'MedecineReason': 'Why didnt you get all the prescribed medicines? (If you answered 2 or 3 to question 14)',
            'Payment method': 'How did you pay for services at the health center?',
            'Overall satisfaction': 'Are you satisfied with all our services in general?',
            'Good': 'Which area has satisfied you? (If you answer 4 or 5 to question 17)',
            'Bad': 'Which area did not satisfy you? (If you answered 1, 2 or 3 to question 17)',
            'Time received': 'Time submitted' // internal mapping
        };
    
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const patientId = this.generatePatientId();
    
                const facilityCode = row['FacilityCode']?.trim();
                if (!facilityCode) return;
    
                const facility = facilityModel.getFacilityByCode(facilityCode);
                if (!facility) return;
    
                const facilityId = facility.facility_id;
    
                const timeReceivedRaw = row['Time received']?.trim();
                const timeReceived = this.parseDate(timeReceivedRaw); // 👈 parse date properly
    
                if (!timeReceived) return; // if no time, skip
    
                for (const [csvKey, questionText] of Object.entries(questionMap)) {
                    if (csvKey === 'FacilityCode' || csvKey === 'Time received') {
                        continue; // skip these special fields
                    }
    
                    const answerText = row[csvKey]?.trim();
                    if (!answerText) continue;
    
                    const question = getQuestionId.get(questionText);
                    if (!question) continue;
    
                    const questionId = question.question_id;
    
                    const answer = getAnswerOptionId.get(questionId, answerText);
                    if (!answer) continue;
    
                    insertResponse.run(patientId, facilityId, questionId, answer.id, timeReceived);
                }
            })
            .on('end', () => {
                console.log('All patient responses inserted into the Response table.');
            });
    }
    



    getWaitingTimeStats(facility_id) {
        const query = `
            SELECT 
                COUNT(*) AS count,
                ao.answer_text AS wait_time,
                r.facility_id,
                CASE
                    WHEN ao.answer_text = 'Within 1 hour' THEN 30
                    WHEN ao.answer_text = 'Between 2-3 hours' THEN 150
                    WHEN ao.answer_text = 'More than 3 hours' THEN 240
                    ELSE NULL
                END AS wait_minutes
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 8
            GROUP BY r.answer_option_id, r.facility_id
        `;
    
        const stmt = this.db.prepare(query);
        const rows = stmt.all(facility_id);
    
        let totalTime = 0;
        let totalCount = 0;
    
        for (const row of rows) {
            if (row.wait_minutes !== null) {
                totalTime += row.wait_minutes * row.count;
                totalCount += row.count;
            }
        }
    
        const averageWaitTime = totalCount > 0 ? totalTime / totalCount : null;
      
    
        return {
            facility_id,
            average_wait_time_minutes: averageWaitTime,
            breakdown: rows
        };
    }
    

    getSatisfactionDistribution(facility_id) {
        const query = `
            SELECT ao.answer_text AS satisfaction, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 17
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
    
        // New score mapping
        const scores = {
            'Bad service': 1,
            'Not satisfied': 2,
            'Normal': 3,
            'Good Service': 4,
            'Very good': 5
        };
    
        let totalScore = 0;
        let totalCount = 0;
    
        results.forEach(entry => {
            const score = scores[entry.satisfaction];
            if (score !== undefined) {
                totalScore += score * entry.count;
                totalCount += entry.count;
            }
        });
    
        const average = totalCount ? (totalScore / totalCount).toFixed(2) : null;
    
        return {
            average: average,
            total: totalCount,
            breakdown: results
        };
    }
    
    
    
    
    getConfidentialityStats(facility_id) {
        const query = `
            SELECT ao.answer_text AS confidentiality, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 10
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
    
        // Calculate percentage of "Yes"
        let yesCount = 0;
        let totalCount = 0;
    
        results.forEach(entry => {
            if (entry.confidentiality === 'Yes') {
                yesCount += entry.count;
            }
            totalCount += entry.count;
        });
    
        const average = totalCount ? ((yesCount / totalCount) * 100).toFixed(2) : null;
    
        return {
            average_percent_yes: average,   
            total: totalCount,
            breakdown: results
        };
    }
    
    getPermissionBeforeExamStats(facility_id) {
        const query = `
            SELECT ao.answer_text AS permission_before_exam, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 9
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
    
        // Calculate % of "Yes"
        let yesCount = 0;
        let totalCount = 0;
    
        results.forEach(entry => {
            if (entry.permission_before_exam === 'Yes') {
                yesCount += entry.count;
            }
            totalCount += entry.count;
        });
    
        const average = totalCount ? ((yesCount / totalCount) * 100).toFixed(2) : null;
    
        return {
            average_percent_yes: average,
            total: totalCount,
            breakdown: results
        };
    }
    
    getTestCompletionStats(facility_id) {
        const query = `
            SELECT ao.answer_text AS test_completion_stats, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 12
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
    
        // Calculate % of "Yes"
        let yesCount = 0;
        let totalCount = 0;
    
        results.forEach(entry => {
            if (entry.test_completion_stats === 'Yes') {
                yesCount += entry.count;
            }
            totalCount += entry.count;
        });
    
        const average = totalCount ? ((yesCount / totalCount) * 100).toFixed(2) : null;
    
        return {
            average_percent_yes: average,
            total: totalCount,
            breakdown: results
        };
    }
    

    getMedicationCompletionStats(facility_id) {
        const query = `
            SELECT ao.answer_text AS received_all_meds, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 14
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        const results = this.db.prepare(query).all(facility_id);
    
        let yesCount = 0;
        let totalCount = 0;
    
        results.forEach(entry => {
            if (entry.received_all_meds === 'Yes') {
                yesCount += entry.count;
            }
            totalCount += entry.count;
        });
    
        const average = totalCount ? ((yesCount / totalCount) * 100).toFixed(2) : null;
    
        return {
            average_percent_yes: average,
            total: totalCount,
            breakdown: results
        };
    }
    
    getServicePaymentModes(facility_id) {
        const query = `
            SELECT ao.answer_text AS service_payment_mode, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 16
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        const results = this.db.prepare(query).all(facility_id);
    
        const mostCommon = results[0]?.service_payment_mode || null;

        return {
            most_common: mostCommon,
            breakdown: results
        };
    }
    
    
    getProblemAreaFrequency(facility_id) {
        const query = `
            SELECT ao.answer_text AS problem_area, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 19
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        return this.db.prepare(query).all(facility_id);
    }

    getPositiveAreaFrequency(facility_id) {
        const query = `
            SELECT ao.answer_text AS positive_area, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 18
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        return this.db.prepare(query).all(facility_id);
    }
    getResponseCount(facility_id) {
        const query = `
            SELECT COUNT(*) AS total_responses
            FROM Response
            WHERE facility_id = ?
        `;
        return this.db.prepare(query).get(facility_id);  
    }
    
// In ResponseModel.js, replace getResponseBreakdownByQuestion with:

getResponseBreakdownByQuestion(facility_id, question_id) {
    const query = `
      SELECT 
        ao.answer_text   AS answer_text, 
        COUNT(*)         AS count
      FROM Response r
      JOIN AnswerOption ao 
        ON r.answer_option_id = ao.id
       AND ao.question_id     = r.question_id
      WHERE r.facility_id = ?
        AND r.question_id = ?
      GROUP BY ao.answer_text
      ORDER BY count DESC
    `;
    const rows = this.db.prepare(query).all(facility_id, question_id);
    console.log(rows);
    return rows.map(r => ({
      answer: r.answer_text,
      count:  r.count
    }));
  }
  
    getLatestResponses(facility_id, fromDate, limit) {
        // Validate and coerce input types
        facility_id = Number(facility_id);
        limit = Number(limit) || 10;
    
        if (!fromDate) fromDate = '1970-01-01';
        else fromDate = new Date(fromDate).toISOString().split('T')[0];
    
        const query = `
            SELECT r.response_id, r.question_id, ao.answer_text, r.submitted_at
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ?
            AND DATE(r.submitted_at) >= DATE(?)
            ORDER BY r.submitted_at DESC
            LIMIT ?
        `;
    
        return this.db.prepare(query).all(facility_id, fromDate, limit);
    }
    
    
    
    getSummaryStats(facility_id) {
        const query = `
            SELECT 
                COUNT(DISTINCT r.question_id) AS questions_answered,
                COUNT(DISTINCT r.answer_option_id) AS unique_answers_given,
                COUNT(DISTINCT r.patient_id) AS unique_patients
            FROM Response r
            WHERE r.facility_id = ?
        `;
        return this.db.prepare(query).get(facility_id);
    }
    
    getFacilityResponsesById(facility_id) {
        const query = `
            SELECT 
            Facility.facility_id,
            Facility.name AS facility_name,
            Question.question_id,
            Question.question_text,
            Response.answer_option_id,
            AnswerOption.answer_text
        FROM 
            Facility
        LEFT JOIN 
            Response ON Facility.facility_id = Response.facility_id
        LEFT JOIN 
            Question ON Response.question_id = Question.question_id
        LEFT JOIN 
            AnswerOption ON Response.answer_option_id = AnswerOption.id
            AND Response.question_id = AnswerOption.question_id
        WHERE 
            Facility.facility_id = ?
        ORDER BY 
            Question.question_id, AnswerOption.answer_value;
        `;
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
        return results;
    }
    getAreaSatisfactionSummary(facility_id) {
        const query = `
            SELECT
                ao.answer_text AS area,
                SUM(CASE WHEN r.question_id = 18 THEN 1 ELSE 0 END) AS good_count,
                SUM(CASE WHEN r.question_id = 19 THEN 1 ELSE 0 END) AS bad_count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id IN (18, 19)
            GROUP BY ao.answer_text
            ORDER BY bad_count DESC, good_count DESC
        `;
    
        return this.db.prepare(query).all(facility_id);
    }
    getAreaSatisfactionWithScore(facility_id) {
        const query = `
            SELECT
                ao.answer_text AS area,
                SUM(CASE WHEN r.question_id = 18 THEN 1 ELSE 0 END) AS good_count,
                SUM(CASE WHEN r.question_id = 19 THEN 1 ELSE 0 END) AS bad_count,
                SUM(CASE WHEN r.question_id = 18 THEN 1 ELSE 0 END) -
                SUM(CASE WHEN r.question_id = 19 THEN 1 ELSE 0 END) AS net_score
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id IN (18, 19)
            GROUP BY ao.answer_text
            ORDER BY net_score DESC
        `;
    
        return this.db.prepare(query).all(facility_id);
    }

    getWeightOfFacility(facility_id) {
        const query = `
            WITH weighted_responses AS (
                SELECT 
                    r.patient_id,
                    r.facility_id,
                    SUM(a.answer_weight) AS total_patient_weight
                FROM Response r
                JOIN AnswerOption a ON r.answer_option_id = a.id
                WHERE r.facility_id = ?
                  AND r.question_id IN (8, 9, 10, 12, 14, 17)
                  AND a.answer_weight IS NOT NULL
                GROUP BY r.patient_id, r.facility_id
            )
            SELECT 
                f.facility_id,
                f.name,
                AVG(wr.total_patient_weight) AS average_weight,
                SUM(wr.total_patient_weight) AS total_weight,
                COUNT(wr.patient_id) AS total_responses
            FROM Facility f
            JOIN weighted_responses wr ON f.facility_id = wr.facility_id
            WHERE f.facility_id = ?
            GROUP BY f.facility_id;
        `;
    
        return this.db.prepare(query).get(facility_id, facility_id);
    }
    
    
    
 

  
getBestWorstByArea(areaName) {
    const query = `
      SELECT
        f.name              AS facility_name,
        f.facility_code     AS facility_code,      -- ← use facility_code here
        SUM(
          CASE 
            WHEN r.question_id = 18 
             AND ao.answer_text = ? THEN 1 
            ELSE 0 
          END
        ) AS good_count,
        SUM(
          CASE 
            WHEN r.question_id = 19 
             AND ao.answer_text = ? THEN 1 
            ELSE 0 
          END
        ) AS bad_count
      FROM Response r
      JOIN AnswerOption ao 
        ON r.answer_option_id = ao.id
      JOIN Facility f      
        ON r.facility_id       = f.facility_id
      GROUP BY f.facility_id
    `;
    
   
    const rows = this.db.prepare(query).all(areaName, areaName);
  
    let best = null, worst = null;
    for (const row of rows) {
      if (!best  || row.good_count > best.good_count)  best  = row;
      if (!worst || row.bad_count  > worst.bad_count) worst = row;
    }
    return { area: areaName, best, worst };
  }


  getFacilityWeightByQuestion(question_id) {
    const query = `
      SELECT
        f.facility_id,
        f.name AS facility_name,
        f.facility_code AS facility_code,
        AVG(ao.answer_weight) AS average_weight,
        COUNT(*) AS response_count
      FROM Facility f
      JOIN Response r ON f.facility_id = r.facility_id
      JOIN AnswerOption ao ON r.answer_option_id = ao.id
      WHERE r.question_id = ?
        AND ao.answer_weight IS NOT NULL
      GROUP BY f.facility_id
      ORDER BY average_weight ASC
    `;
    return this.db.prepare(query).all(question_id);
  }
  
  

  getFacilityWeightbyTime(question_id, startDate, endDate) {
    const query = `
      SELECT
        f.facility_id,
        f.name AS facility_name,
        f.facility_code,
        AVG(ao.answer_weight) AS average_weight,
        COUNT(r.response_id) AS response_count
      FROM Facility f
      JOIN Response r ON f.facility_id = r.facility_id
      JOIN AnswerOption ao ON r.answer_option_id = ao.id
      WHERE r.question_id = ?
        AND ao.answer_weight IS NOT NULL
        AND DATE(r.submitted_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY f.facility_id
      ORDER BY average_weight ASC
    `;
    
    return this.db.prepare(query).all(question_id, startDate, endDate);
}
getAverageSatisfactionOverTime(startDate, endDate) {
    const query = `
      SELECT 
        DATE(submitted_at) as date,
        AVG(CASE WHEN ao.answer_weight IS NOT NULL THEN ao.answer_weight ELSE NULL END) as average_satisfaction
      FROM Response r
      JOIN AnswerOption ao ON r.answer_option_id = ao.id
      WHERE r.question_id = 17
        AND DATE(submitted_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY DATE(submitted_at)
      ORDER BY DATE(submitted_at)
    `;
    return this.db.prepare(query).all(startDate, endDate);
  }
  
  getAverageSatisfactionOverTimeFacilities(facilityid, startDate, endDate) {
    const query = `
      SELECT 
        DATE(submitted_at) AS date,
        AVG(CASE WHEN ao.answer_weight IS NOT NULL THEN ao.answer_weight ELSE NULL END) AS average_satisfaction
      FROM Response r
      JOIN AnswerOption ao ON r.answer_option_id = ao.id
      WHERE r.question_id = 17
        AND r.facility_id = ?
        AND DATE(submitted_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY DATE(submitted_at)
      ORDER BY DATE(submitted_at)
    `;
    return this.db.prepare(query).all(facilityid, startDate, endDate);
  }
  
  getAverageSatisfactionOverTimeRegion(regionName, startDate, endDate) {
    const query = `
      SELECT 
        DATE(r.submitted_at) AS date,
        AVG(CASE WHEN ao.answer_weight IS NOT NULL THEN ao.answer_weight ELSE NULL END) AS average_satisfaction
      FROM Response r
      JOIN Facility f ON r.facility_id = f.facility_id
      JOIN AnswerOption ao ON r.answer_option_id = ao.id
      WHERE r.question_id = 17
        AND f.location LIKE ?
        AND DATE(r.submitted_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY DATE(r.submitted_at)
      ORDER BY DATE(r.submitted_at)
    `;
    return this.db.prepare(query).all(`${regionName} Region%`, startDate, endDate);
  }
  
  

    
    
   
    

    


    
}
module.exports=ResponseModel;