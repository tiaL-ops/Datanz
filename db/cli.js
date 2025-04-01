// a command line to interact with database:

//const AnswerOptionModel = require("../models/AnswerOptionModel");
const AuthModel = require("./models/AuthModel");
const FacilityModel= require("./models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
//const ResponseModel = require("../models/ResponseModel");

const { connectToDatabase } = require("./database");
const db = connectToDatabase();

const questionModel = new QuestionModel(db);

//check the table first to see if it is already populate the uncomment this if needed
//questionModel.importFromCSV("./csv/Question&Answer - Sheet1.csv"); 
const authModel= new AuthModel(db);
//authModel.createUser("hello", "hellotest@gmail.com", "doctor","hnfjsknfjsk%679");


const facilityModel= new FacilityModel(db);
facilityModel.loadFromCSV("./csv/Facilities.csv");