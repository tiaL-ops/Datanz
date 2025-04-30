// a command line to interact with database:

//const AnswerOptionModel = require("../models/AnswerOptionModel");
const AuthModel = require("./models/AuthModel");
const FacilityModel= require("./models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
const ResponseModel = require("./models/ResponseModel");

const { connectToDatabase } = require("./database");
const db = connectToDatabase();



// use this to add user to the database

const authModel= new AuthModel(db);
authModel.createUser("hi", "hi@gmail", "hi","government");

const responseModel = new ResponseModel(db);

const results = responseModel.getAverageSatisfactionOverTime('2024-04-01', '2024-04-30');











