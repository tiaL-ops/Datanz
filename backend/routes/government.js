const express = require("express");
const router  = express.Router();
const { connectToDatabase } = require("../../db/database");
const FacilityModel          = require("../../db/models/FacilityModel");
const ResponseModel          = require("../../db/models/ResponseModel");

const db = connectToDatabase();
const facilityModel = new FacilityModel(db);
const responseModel = new ResponseModel(db);

router.get("/", (req, res) => {
  let toggled = false;
  const areas = ["Toilets", "Pharmacy/Drugs", "Reception", "Doctor's room"];
  const {
    region,
    waitThreshold,
    satThreshold,
    confiThreshold,
    permThreshold,
    testThreshold,
    medThreshold,
    problemArea,
    positiveArea,
    paymentMode,
    bestCategory,
    worstCategory,
    negativeCategory
  } = req.query;

 
  let facilities;
  if (region) {
    facilities = db
      .prepare(`SELECT * FROM Facility WHERE location LIKE ?`)
      .all(`${region}%`);
  } else {
    facilities = db.prepare(`SELECT * FROM Facility`).all();
  }


  const results = facilities.map(f => {
    const id = f.facility_id;
    const m  = {
      avgWait:    responseModel.getWaitingTimeStats(id).average_wait_time_minutes  || 0,
      avgSat:     Number(responseModel.getSatisfactionDistribution(id).average)    || 0,
      yesConfi:   Number(responseModel.getConfidentialityStats(id).average_percent_yes) || 0,
      yesPerm:    Number(responseModel.getPermissionBeforeExamStats(id).average_percent_yes) || 0,
      yesTests:   Number(responseModel.getTestCompletionStats(id).average_percent_yes) || 0,
      yesMeds:    Number(responseModel.getMedicationCompletionStats(id).average_percent_yes) || 0,
      topProblems:  responseModel.getProblemAreaFrequency(id).map(p => p.problem_area),
      topPositives: responseModel.getPositiveAreaFrequency(id).map(p => p.positive_area),
      topPayMode:   responseModel.getServicePaymentModes(id).most_common,
      areaSatisfaction: responseModel.getAreaSatisfactionWithScore(id)  // for negativeCategory
    };
    return { ...f, metrics: m };
  });

  
  let filtered = results.filter(f => {
    const m = f.metrics;
    if (waitThreshold   && m.avgWait   <= Number(waitThreshold))     return false;
    if (satThreshold    && m.avgSat    >= Number(satThreshold))      return false;
    if (confiThreshold  && (100 - m.yesConfi) < Number(confiThreshold)) return false;
    if (permThreshold   && (100 - m.yesPerm)  < Number(permThreshold))   return false;
    if (testThreshold   && (100 - m.yesTests) < Number(testThreshold))   return false;
    if (medThreshold    && (100 - m.yesMeds)  < Number(medThreshold))    return false;
    if (problemArea     && !m.topProblems.includes(problemArea))        return false;
    if (positiveArea    &&  m.topPositives.includes(positiveArea))       return false;
    if (paymentMode     &&  m.topPayMode !== paymentMode)               return false;
    return true;
  });

  
  if (negativeCategory) {
    filtered = filtered.filter(f => {
      const row = f.metrics.areaSatisfaction.find(r => r.area === negativeCategory);
      return row && row.bad_count > 0;
    });
  }

 
  let bestBy = null, worstBy = null;
  if (bestCategory) {
    bestBy = responseModel.getBestWorstByArea(bestCategory);
  }
  if (worstCategory) {
    worstBy = responseModel.getBestWorstByArea(worstCategory);
  }
  let allFacilities;
  try {
     allFacilities = facilityModel.getAllFacilities();
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch facilities");
  }

  res.render("government", {
    filters:          req.query,
    areas,
    bestBy,
    worstBy,
    results:          filtered,
    toggled: false,
    facilities:allFacilities
  });
});


module.exports = router;
