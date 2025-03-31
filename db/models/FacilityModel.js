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
class FacilityModel{

    constructor(db){
        this.db=db;
    }

    async loadFromCSV(filepath) {
        const fileStream = fs.createReadStream(filepath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const insertQuery = this.db.prepare(`
            INSERT INTO Facility (name, location, facility_type, headO_name, headO_contact)
            VALUES (?, ?, ?, ?, ?)
        `);

        let isFirstLine = true;

        for await (const line of rl) {
            if (isFirstLine) {
                isFirstLine = false; // Skip header.. let's decide tho what type ofh eader, need to be consistent
                continue;
            }

            const cols = line.split('\t'); // If TSV, else use .split(','), since need to decide if wcsv

            const name = cols[2]?.trim(); // Facility Name
            const region = cols[4]?.trim();
            const district = cols[5]?.trim();
            const location = `${region}, ${district}`;
            const facility_type = cols[9]?.trim();
            const headO_name = cols[11]?.trim(); // Ownership
            const headO_contact = cols[13]?.trim(); // Official Phone Number

            if (name) {
                insertQuery.run(name, location, facility_type, headO_name, headO_contact);
            }
        }

        console.log("Facilities loaded successfully.");
    }

    getAllFacilities(filters){
// a little bit tricky, like what kind o flitler? i don't think we handle this here ? but in response
}

    getFacilityById(id){
        const query= `SELECT * FROM Facility WHERE facility_id = ?`
        const stmt= this.db.prepare(query);
        const result= stmt.get(id);
        return result;

    }

getFacilityHeadContact(id){
     const query= `SELECT headO_name, headO_contact  FROM Facility WHERE facility_id = ?`
     const stmt= this.db.prepare(query);
        const result= stmt.get(id);
        return result;


}


deleteFacility(id){
    const query= `DELETE FROM Facility WHERE facility_id = ?`
     const stmt= this.db.prepare(query);
    return stmt.run(id);


}



}