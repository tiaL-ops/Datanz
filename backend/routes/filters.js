const express = require('express');
const router = express.Router();
const facilityModel = require("../../db/models/FacilityModel");
const responseModel = require("../../db/models/ResponseModel");
const { connectToDatabase } = require("../../db/database");
const db = connectToDatabase();

router.get('/', async (req, res) => {
    const name = 'Landy';
    res.render('filters', {name});
});
module.exports = router;