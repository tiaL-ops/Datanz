const express = require('express');
const router = express.Router();
const facilityModel = require("../../db/models/FacilityModel");
const responseModel = require("../../db/models/ResponseModel");
const { connectToDatabase } = require("../../db/database");
const db = connectToDatabase();

router.get('/', async(req, res) => {
    res.render('government');
});

router.get('/facilities', async(req, res) => {
    const id = req.params.id;
    const gov = true;
    try {
        const facilityInstance = new facilityModel(db); // Use a different variable name
        const facilities = await facilityInstance.getAllFacilitiesByName(); // Fetch facilities
        res.render('facilities', {id, gov, facilities}); // Pass facilities to the template
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).send('Internal Server Error');
    }
});


// router.get('/:id', (req, res) => {
//     const id = req.params.id;
//     const facilityInstance = new facilityModel(db); // Use a different variable name
//     const facility = facilityInstance.getFacilityById(id); // Fetch facilities
//     const head0_name = facility.headO_name;
//     res.render('facilities', {id, facility, head0_name}); // Pass facilities to the template
// });
router.get('/facilities/:id', async(req, res) => {
    try {
        const id = req.params.id; // Get the facility ID from the URL
        const facilityInstance = new facilityModel(db); // Create an instance of the model
        const responseInstance = new responseModel(db); // Create an instance of the model
        const facilityResponses = responseInstance.getFacilityResponsesById(id); // Fetch responses for the facility
        const gov = true;
        // Group responses by question_id
        const groupedResponses = {};
        facilityResponses.forEach(response => {
            if (!groupedResponses[response.question_id]) {
                groupedResponses[response.question_id] = {
                    question_text: response.question_text,
                    answers: []
                };
            }
            groupedResponses[response.question_id].answers.push(response.answer_text);
        });
        const facility = facilityInstance.getFacilityById(id); 
        const head0_name = facility.headO_name;
        res.render('facilities', { id, gov, facilityResponses,facility, groupedResponses, head0_name }); // Pass grouped data to the template
    } catch (error) {
        console.error('Error fetching facility responses:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
