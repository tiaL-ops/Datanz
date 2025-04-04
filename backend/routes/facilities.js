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
        res.render('facilities', {id, facilities }); // Pass facilities to the template
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    res.render('facilities', {id, facilities});
});

module.exports = router;
