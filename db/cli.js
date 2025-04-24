// a command line to interact with database:

//const AnswerOptionModel = require("../models/AnswerOptionModel");
const AuthModel = require("./models/AuthModel");
const FacilityModel= require("./models/FacilityModel");
const QuestionModel = require("./models/QuestionModel");
const ResponseModel = require("./models/ResponseModel");

const { connectToDatabase } = require("./database");
const db = connectToDatabase();


// ! important , please drop tables and create new one because we d
// check the table first to see if it is already populate the uncomment this if needed
const questionModel = new QuestionModel(db); 


const authModel= new AuthModel(db);


const facilityModel= new FacilityModel(db);


const responseModel= new ResponseModel(db);
authModel.createUser("hi", "hi@gmail", "hi","government");






const fs = require('fs');





//const tes = responseModel.getServicePaymentModes(1);
//console.log(tes);
