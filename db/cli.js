// a command line to interact with database:

//const AnswerOptionModel = require("../models/AnswerOptionModel");
const AuthModel = require("./models/AuthModel");
const FacilityModel= require("./models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
const ResponseModel = require("./models/ResponseModel");

const { connectToDatabase } = require("./database");
const db = connectToDatabase();

/*
check the table first to see if it is already populate the uncomment this if needed
const questionModel = new QuestionModel(db);


//questionModel.importFromCSV("./csv/Question&Answer - Sheet1.csv"); 
const authModel= new AuthModel(db);
//authModel.createUser("hello", "hellotest@gmail.com", "doctor","hnfjsknfjsk%679");


const facilityModel= new FacilityModel(db);
facilityModel.loadFromCSV("./csv/Facilities.csv");

responseModel.loadFromSurveyCSV("./csv/SampleCSV - Sheet1 (2).csv");
*/
const fs = require('fs');
const responseModel = new ResponseModel(db);

const reportLines = [];

reportLines.push("FACILITY DATA REPORT");
reportLines.push("====================");
reportLines.push(`Facility ID: 1`);
reportLines.push(`Date: ${new Date().toLocaleDateString()}`);
reportLines.push("\n");

// Helper to format sections
function addSection(title, data) {
    reportLines.push(`${title}`);
    reportLines.push("-".repeat(title.length));
    if (Array.isArray(data)) {
        if (data.length === 0) {
            reportLines.push("No data available.");
        } else {
            data.forEach(row => {
                reportLines.push(
                    Object.entries(row).map(([key, val]) => `  ${key}: ${val}`).join("\n")
                );
                reportLines.push(""); 
            });
        }
    } else {
        Object.entries(data).forEach(([key, val]) => {
            reportLines.push(`  ${key}: ${val}`);
        });
    }
    reportLines.push("\n");
}

// Add sections
addSection("Average Wait Time Stats", responseModel.getWaitingTimeStats(1));
addSection("Satisfaction Distribution", responseModel.getSatisfactionDistribution(1));
addSection("Confidentiality Stats", responseModel.getConfidentialityStats(1));
addSection("Permission Before Exam Stats", responseModel.getPermissionBeforeExamStats(1));
addSection("Test Completion Stats", responseModel.getTestCompletionStats(1));
addSection("Medication Completion Stats", responseModel.getMedicationCompletionStats(1));
addSection("Service Payment Modes", responseModel.getServicePaymentModes(1));
addSection("Problem Area Frequency", responseModel.getProblemAreaFrequency(1));
addSection("Positive Area Frequency", responseModel.getPositiveAreaFrequency(1));
addSection("Total Response Count", responseModel.getResponseCount(1));
addSection("Summary Stats", responseModel.getSummaryStats(1));
addSection("Latest Responses from March 1, 2025", responseModel.getLatestResponses(1, '2025-03-01', 10));

// Write to file
fs.writeFileSync('datareport.txt', reportLines.join('\n'), 'utf-8');
console.log("Report written to datareport.txt");
