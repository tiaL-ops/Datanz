const fs = require("fs");
const path = require("path");
const { connectToDatabase, closeDatabase } = require("./database");
//const AuthModelModel= require("./models/AuthModel");
const FacilityModel= require("./models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
const ResponseModel = require("./models/ResponseModel");

const dropSqlPath = path.resolve(__dirname, "sql", "drop_tables.sql");
const createSqlPath = path.resolve(__dirname, "sql", "create_tables.sql");

const dropSql = fs.readFileSync(dropSqlPath, "utf8");
const createSql = fs.readFileSync(createSqlPath, "utf8");

try {
  const db = connectToDatabase();

  db.exec(dropSql);
  console.log("Dropped existing table.");

  
  db.exec(createSql);
  console.log("Created tables");

 
const questionModel = new QuestionModel(db); 
questionModel.importFromCSV("./csv/Question&Answer - Sheet1.csv"); 


const facilityModel= new FacilityModel(db);
facilityModel.loadFromCSV("./csv/SampleCSV - Facilities.csv");

const responseModel= new ResponseModel(db);

responseModel.loadFromSurveyCSV("./csv/SampleCSV - SampleMock.csv");

console.log("all data imported to db");

  
} catch (err) {
  console.error("❌ Error initializing database:", err.message);
  process.exit(1);
}
