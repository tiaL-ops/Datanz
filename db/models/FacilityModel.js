/**
 * 
 * 
 * About facility
 * 
createFacility(data) – Add a new facility // load from csv

getAllFacilities(filters) – List all facilities with optional filters

getFacilityById(id) – Get facility by ID

getFacilityHeadContact(id) – Get head of facility's contact info

updateFacility(id, data) – Update facility data

deleteFacility(id) – Remove a facility


CREATE TABLE IF NOT EXISTS Facility (
    facility_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    facility_type TEXT,
    headO_name TEXT,
    headO_contact TEXT
);


 */
const fs = require('fs');
const csv = require('csv-parser');
class FacilityModel{

    constructor(db){
        this.db=db;
    }


    generateRandomName() {
        const firstNames = [
            'Amina', 'Juma', 'Neema', 'Baraka', 'Zawadi',
            'Rehema', 'Abdul', 'Halima', 'Hassan', 'Fatma',
            'Salma', 'Omari', 'Saidi', 'Mwajuma', 'Bakari'
        ];
        const lastNames = [
            'Mwakalinga', 'Ngowi', 'Msuya', 'Mshana', 'Kimaro',
            'Nassor', 'Kibwana', 'Chilongani', 'Maganga', 'Mnyika',
            'Shabani', 'Lemashon', 'Mollel', 'Mtui', 'Nyambura'
        ];
        const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
        return `Dr. ${random(firstNames)} ${random(lastNames)}`;
    }

    loadFromCSV(filePath) {
        const insertFacility = this.db.prepare(`
            INSERT INTO Facility (
                facility_code, name, location, facility_type, headO_name, headO_contact, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const facility_code = row['Facility Number']?.trim();
                const name = row['Facility Name']?.trim();

                const parts = [
                    row['Region'],
                    row['District'],
                    row['Ward'],
                    row['Village'],
                    row['Street']
                ].filter(Boolean).map(p => p.trim());

                const location = parts.join(', ');
                const facility_type = row['Facility Type']?.trim() || 'Unknown';
                const headO_name = this.generateRandomName();
                const headO_contact = row['Official Phone Number']?.trim() || null;
                const date_opened = row['Date Opened']?.trim() || null;

                if (facility_code && name) {
                    insertFacility.run(
                        facility_code,
                        name,
                        location,
                        facility_type,
                        headO_name,
                        headO_contact,
                        date_opened
                    );
                }
            })
            .on('end', () => {
                console.log('Facilities CSV import completed.');
            });
    }


    getAllFacilitiesByName(){
        const stmt = this.db.prepare(`SELECT facility_id, name FROM Facility`);
        const facilities = stmt.all();
        return facilities;
        // a little bit tricky, like what kind o flitler? i don't think we handle this here ? but in response
    }

    getFacilityById(id){
        const query= `SELECT * FROM Facility WHERE facility_id = ?`
        const stmt= this.db.prepare(query);
        const result= stmt.get(id);
        return result;

    }

    getFacilityByCode(code){
        console.log("this is the code",code)
        const query= `SELECT facility_id FROM Facility WHERE facility_code = ?`
        const stmt= this.db.prepare(query);
        const result= stmt.get(code);
        console.log("this is resule",result);
        return result;

    }

getFacilityHeadContact(id){
     const query= `SELECT headO_name, headO_contact  FROM Facility WHERE facility_id = ?`
     const stmt= this.db.prepare(query);
        const result= stmt.get(id);
        return result;


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
        JOIN 
            Response ON Facility.facility_id = Response.facility_id
        JOIN 
            Question ON Response.question_id = Question.question_id
        JOIN
            AnswerOption ON Response.answer_option_id = AnswerOption.answer_value
            AND Question.question_id = AnswerOption.question_id
        WHERE 
            Facility.facility_id = ?
        ORDER BY 
            Question.question_id;
    `;
    const stmt = this.db.prepare(query);
    return stmt.all(facility_id);
}

deleteFacility(id){
    const query= `DELETE FROM Facility WHERE facility_id = ?`
     const stmt= this.db.prepare(query);
    return stmt.run(id);
}

}
module.exports = FacilityModel;