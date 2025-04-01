// a command line to interact with database:

//const AnswerOptionModel = require("../models/AnswerOptionModel");
const AuthModel = require("./models/AuthModel");
const FacilityModel= require("./models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
const ResponseModel = require("./models/ResponseModel");

const { connectToDatabase } = require("./database");
const db = connectToDatabase();

const questionModel = new QuestionModel(db);

//check the table first to see if it is already populate the uncomment this if needed
//questionModel.importFromCSV("./csv/Question&Answer - Sheet1.csv"); 
const authModel= new AuthModel(db);
//authModel.createUser("hello", "hellotest@gmail.com", "doctor","hnfjsknfjsk%679");


const facilityModel= new FacilityModel(db);
//facilityModel.loadFromCSV("./csv/Facilities.csv");

const responseModel= new ResponseModel(db);

//responseModel.loadFromSurveyCSV("./csv/SampleCSV - Sheet1 (2).csv");
const waitTimeStats = responseModel.getWaitingTimeStats(1);
console.log("Average Wait Time Stats:", waitTimeStats);

const satisfactionStats = responseModel.getSatisfactionDistribution(1);
console.log(" Satisfaction Distribution:", satisfactionStats);

const confidentialityStats = responseModel.getConfidentialityStats(1);
console.log("Confidentiality Stats:", confidentialityStats);

const permissionStats = responseModel.getPermissionBeforeExamStats(1);
console.log("Permission Before Exam Stats:", permissionStats);
