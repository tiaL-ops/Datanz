const express = require('express');
const router = express.Router();
const facilityModel = require("../../db/models/FacilityModel");
const responseModel = require("../../db/models/ResponseModel");
const { connectToDatabase } = require("../../db/database");
const db = connectToDatabase();

router.get('/', async (req, res) => {
    const id = req.params.id;
    const gov = false;
    try {
        const facilityInstance = new facilityModel(db); 
        const facilities = await facilityInstance.getAllFacilitiesByName(); 
        res.render('facilities', {id, gov, facilities}); 
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get the facility ID from the URL
        const facilityInstance = new facilityModel(db); // Create an instance of the model
      
        const facilityDetails = facilityInstance.getFacilityById(id); // Fetch responses for the facility
        const gov = false;
        const head0_name = null;
        const facility = facilityInstance.getFacilityById(id); 
        res.render('facilities_id', {id, gov, facilityDetails,facility, head0_name}); // Pass grouped data to the template
    } catch (error) {
        console.error('Error fetching facility responses:', error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router;
