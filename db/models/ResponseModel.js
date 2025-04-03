
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

    generatePatientId() {
        return crypto.randomBytes(6).toString('hex'); // e.g. 'ab12cd34ef56'
    }

    loadFromSurveyCSV(filePath) {
        const facilityModel= new FacilityModel(db);
        console.log("here");
        const getFacilityId = this.db.prepare(`SELECT facility_id FROM Facility WHERE facility_code = ?`);
        const getQuestionId = this.db.prepare(`SELECT question_id FROM Question WHERE question_text = ?`);
        const getAnswerOptionId = this.db.prepare(`
            SELECT id FROM AnswerOption WHERE question_id = ? AND answer_text = ?
        `);
        const insertResponse = this.db.prepare(`
            INSERT INTO Response (patient_id, facility_id, question_id, answer_option_id)
            VALUES (?, ?, ?, ?)
        `);

        // Map CSV headers to question text in DB
        const questionMap = {
           'Language': 'Thank you for reaching out to the government Client Feedback system for health services. Select your preferred language.',
           'FacilityCode': "Please enter the health facility code as written on the poster/leaflet or shared by the Health facility worker.",
           'Age':'Please enter your age in years (between 10 and 99 years)',
    'Gender': 'What is your gender?',
    'Pregnant': 'Are you currently pregnant?',
    'GestionalAge':'Please state your gestational age (pregnancy) by week. (If you answered 1 in question 5)',
    'Location':'Where are you located as you provide this feedback?',
    "WaitingTime":'After arriving at the facility, how long did it take you to get attended?',
    "Confidentiality" :'Were you satisfied with the confidentiality while receiving treatment?',
    "Communication": 'Did the HCW use easy language to help you understand what services you were receiving?',
    'GotAllTests': 'Did you get all the tests that had been written/prescribed?',
    "TestReasons":'Why didnt you get all the tests you were prescribed? (If you answer 2 or 3 to question 12)',
    "Permission":'Were you asked for permission before being examined?',
    'GotAllMedecines': 'Did you get all your prescribed medication?',
    'MedecineReason': 'Why didnt you get all the prescribed medicines? (If you answered 2 or 3 to question 14)',


    'Payment method': 'How did you pay for services at the health center?',
    'Overall satisfaction': 'Are you satisfied with all our services in general?',
    'Good':'Which area has satisfied you? (If you answer 4 or 5 to question 17)',
    'Bad':'Which area did not satisfy you? (If you answered 1, 2 or 3 to question 17)',
        };

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const patientId = this.generatePatientId();
                const facilityCode = row['FacilityCode']?.trim();
                const facility =  facilityModel.getFacilityByCode(facilityCode);

                console.log("here are information", patientId, facility);
                if (!facility) return;

                const facilityId = facility.facility_id;

                for (const [csvKey, questionText] of Object.entries(questionMap)) {
                    const answerText = row[csvKey]?.trim();
                    if (!answerText) continue;

                    const question = getQuestionId.get(questionText);
                    if (!question) {
                        console.warn(`Question not found: ${questionText}`);
                        continue;
                    }

                    const questionId = question.question_id;
                    const answer = getAnswerOptionId.get(questionId, answerText);
                    if (!answer) {
                        console.warn(`Answer option not found: "${answerText}" for question "${questionText}"`);
                        continue;
                    }
                    

                    insertResponse.run(patientId, facilityId, questionId, answer.id);
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
        return results;
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
        return results;
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
        return results;
    }
    getTestCompletionStats(facility_id){
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
    return results;
        
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
        return this.db.prepare(query).all(facility_id);
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
        return this.db.prepare(query).all(facility_id);
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
    
    /// bug in this one 
    getResponseBreakdownByQuestion(facility_id, question_id) {
        const query = `
            SELECT ao.answer_text AS answer, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = ?
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
        return this.db.prepare(query).all(facility_id, question_id);
    }

    getLatestResponses(facility_id, fromDate, limit) {
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
    
        
    

    




    
}
module.exports=ResponseModel;