// a command line to interact with database:

//const AnswerOptionModel = require("../models/AnswerOptionModel");
//const AuthModel = require("../models/AuthModel");
//const FacilityModel= require("../models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
//const ResponseModel = require("../models/ResponseModel");

const { connectToDatabase } = require("./database");
const db = connectToDatabase();

const questionModel = new QuestionModel(db);
questionModel.importFromCSV("./csv/Question&Answer - Sheet1.csv");