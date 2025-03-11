/**
 * This Class is created to manage reviews
 * It handles methods where it receive reviews, store it in database, retrieve it from database
 * 
 * 
 * Flows --> Patient give reviews, ( foreignkey) and the review is baout either doctors or facility( foreign key)
 * 
 * 
 */
class Review{
    constructor(
        id,
        userId,
        rating,
        reviewType, 
        entityId, 
        isSpam ,
        timestamp,
        submittedFrom,
        waitingTime,
        cleanliness,
        staffBehavior,
        treatmentEquality,
        equipmentEquality,
        comments
    ) {
        this.id = id; 
        this.userId = userId; 
        this.rating = rating;
        this.reviewType = reviewType; 
        this.entityId = entityId; 
        this.isSpam = isSpam;
        this.timestamp = timestamp;
        this.submittedFrom = submittedFrom; 
        this.waitingTime = waitingTime;
        this.cleanliness = cleanliness;
        this.staffBehavior = staffBehavior;
        this.treatmentEquality = treatmentEquality;
        this.equipmentEquality = equipmentEquality;
        this.comments = comments;
    }
    //CRUD
    createReview(reviewData) {
        try {
            const { userId, rating, reviewType, entityId, isSpam, submittedFrom, 
                waitingTime, cleanliness, staffBehavior, treatmentEquality, 
                equipmentEquality, comments 
            } = reviewData;

            const timestamp = new Date().toISOString();
            const query = `
                INSERT INTO reviews 
                (userId, rating, reviewType, entityId, isSpam, timestamp, submittedFrom, 
                 waitingTime, cleanliness, staffBehavior, treatmentEquality, equipmentEquality, comments) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const stmt = db.prepare(query);
            const info = stmt.run(userId, rating, reviewType, entityId, isSpam, timestamp, submittedFrom, 
                                  waitingTime, cleanliness, staffBehavior, treatmentEquality, 
                                  equipmentEquality, comments);

            return new Review({ id: info.lastInsertRowid, ...reviewData, timestamp });
        } catch (error) {
            console.error("Error creating review:", error);
            throw error;
        }
    }
    
   //  updateReview()? i don't think we should update it
    deleteReview(){

    }
    getReviewById(){

    }
    getReviewsByPatient(patientId){

    }
    getReviewForDoctor(){

    }
    getReviewForFacilities(){

    }
    getReviewsByDate(){

    }



    //Review Processing
    validateReview(){

    }
    checkSpam(){

    }
    
    calculateAverageRating(){

    }

    //Filtering & Searching
    

 /*   
 data of a reviews:
 
 - id: int  
- rating: int
- review_type: String
- is_spam: Boolean
- timestamp: DateTime
- submitted_from: String
- waiting_time: int
- cleanliness: int
- staff_behavior: int
- treatment_equality: int
- equipment_equality: int
- comments: String
*/

}