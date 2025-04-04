const express = require('express');
const router = express.Router();
const facilityModel = require("../../db/models/FacilityModel");
const { connectToDatabase } = require("../../db/database");
const db = connectToDatabase();
router.get('/', async (req, res) => {
    const id = req.params.id;
    try {
        const facilityInstance = new facilityModel(db); // Use a different variable name
        const facilities = await facilityInstance.getAllFacilitiesByName(); // Fetch facilities
        res.render('facilities', {id, facilities}); // Pass facilities to the template
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

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id; // Get the facility ID from the URL
        const facilityInstance = new facilityModel(db); // Create an instance of the model
        const facilityResponses = facilityInstance.getFacilityResponsesById(id); // Fetch responses for the facility
        const facility = facilityInstance.getFacilityById(id); 
    res.render('facilities', { id, facility, facilityResponses }); // Pass data to the template
    } catch (error) {
        console.error('Error fetching facility responses:', error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router;
