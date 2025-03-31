
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
class ResponseModel{

    constructor(db){
        this.db=db;
    }

    async loadFromCSV(filepath) {
        const fileStream = fs.createReadStream(filepath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let isHeader = true;
        let questionCount = 19; // Q1 to Q19
        const insert = this.db.prepare(`
            INSERT INTO Response (patient_id, facility_id, question_id, answer_option_id, submitted_at)
            VALUES (?, ?, ?, ?, ?)
        `);

        for await (const line of rl) {
            const cols = line.split(',');

            if (isHeader) {
                isHeader = false;
                continue;
            }

            const patient_id = cols[0]?.trim();
    
            const facility_id = parseInt(cols[2]?.trim());
            const submitted_at = cols[1]?.trim();

            const answers = cols.slice(3); // From Q1 to Q19

            answers.forEach((ans, idx) => {
                const answer_option_id = ans.trim().toUpperCase() === "NULL" ? null : parseInt(ans.trim());
                const question_id = idx + 1; // Q1 = 1, Q2 = 2, ...

                if (answer_option_id && patient_id && facility_id) {
                    insert.run(patient_id, facility_id, question_id, answer_option_id, submitted_at);
                }
            });
        }

        console.log("Responses loaded successfully.");
    }


    getWaitingTimeStats(facility_id) {
        const query = `
            SELECT ao.option_text AS wait_time, COUNT(*) AS count
            FROM Response r
            JOIN AnswerOption ao ON r.answer_option_id = ao.id
            WHERE r.facility_id = ? AND r.question_id = 8
            GROUP BY r.answer_option_id
            ORDER BY count DESC
        `;
    
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
        return results;
    }

    getSatisfactionDistribution(facility_id){
        const query = `
        SELECT ao.option_text AS satisfaction, COUNT(*) AS count
        FROM Response r
        JOIN AnswerOption ao ON r.answer_option_id=ao.id
        WHERE r.facility_id= ? AND r.question_id=17
        GROUP BY r.answer_option_id
        ORDER BY count DESC
        `
        const stmt = this.db.prepare(query);
        const results = stmt.all(facility_id);
        return results;

    }
    
    




    
}
module.exports=ResponseModel;