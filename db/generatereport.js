const fs = require('fs');
const path = require('path');
const ResponseModel = require('./models/ResponseModel');
const FacilityModel = require('./models/FacilityModel');
const { connectToDatabase } = require("./database");
const db = connectToDatabase();


const responseModel = new ResponseModel(db);
const facilityModel = new FacilityModel(db);

// Target location filter
const TARGET_REGION = "Kilimanjaro Region";

// Fetch facilities in the specified region
const getFacilitiesByRegion = (region) => {
    const query = `
        SELECT * FROM Facility
        WHERE location LIKE ?
    `;
    const stmt = db.prepare(query);
    return stmt.all(`${region}%`);
};

// Main report generation
const generateReportForRegion = (region) => {
    const facilities = getFacilitiesByRegion(region);

    if (facilities.length === 0) {
        console.log(`No facilities found in ${region}`);
        return;
    }

    const reportLines = [];
    reportLines.push(`Report for Region: ${region}`);
    reportLines.push(`Generated on: ${new Date().toLocaleString()}`);
    reportLines.push('='.repeat(50));

    facilities.forEach(facility => {
        reportLines.push(`\nFacility: ${facility.name}`);
        reportLines.push(`Code: ${facility.facility_code}`);
        reportLines.push(`Location: ${facility.location}`);
        reportLines.push('-'.repeat(40));

        const waitStats = responseModel.getWaitingTimeStats(facility.facility_id);
        const satisfaction = responseModel.getSatisfactionDistribution(facility.facility_id);
        const confidentiality = responseModel.getConfidentialityStats(facility.facility_id);
        const permission = responseModel.getPermissionBeforeExamStats(facility.facility_id);
        const tests = responseModel.getTestCompletionStats(facility.facility_id);
        const meds = responseModel.getMedicationCompletionStats(facility.facility_id);
        const payment = responseModel.getServicePaymentModes(facility.facility_id);
        const problems = responseModel.getProblemAreaFrequency(facility.facility_id);
        const positives = responseModel.getPositiveAreaFrequency(facility.facility_id);

        reportLines.push(`Total Responses: ${responseModel.getResponseCount(facility.facility_id)?.total_responses}`);
        reportLines.push(`Avg Wait Time: ${waitStats?.average_wait_time_minutes?.toFixed(1) || 'N/A'} mins`);
        reportLines.push(`Avg Satisfaction Score: ${satisfaction.average}`);
        reportLines.push(`Confidentiality: ${confidentiality.average_percent_yes}% said Yes`);
        reportLines.push(`Permission Before Exam: ${permission.average_percent_yes}% said Yes`);
        reportLines.push(`Received All Tests: ${tests.average_percent_yes}% said Yes`);
        reportLines.push(`Received All Medication: ${meds.average_percent_yes}% said Yes`);
        reportLines.push(`Most Common Payment Mode: ${payment.most_common}`);

        reportLines.push(`Top Positive Feedback Areas:`);
        positives.slice(0, 3).forEach(p => {
            reportLines.push(`  - ${p.positive_area}: ${p.count}`);
        });

        reportLines.push(`Top Problem Areas:`);
        problems.slice(0, 3).forEach(p => {
            reportLines.push(`  - ${p.problem_area}: ${p.count}`);
        });

        reportLines.push('-'.repeat(50));
    });

    const filePath = path.join(__dirname, 'reportdataByRegion.txt');
    fs.writeFileSync(filePath, reportLines.join('\n'), 'utf8');
    console.log(`Report generated: ${filePath}`);
};


generateReportForRegion(TARGET_REGION);
