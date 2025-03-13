
# Datanz Facility Website Project Checklist

---

## 1. Project Planning & Design 
- [x] **Define Scope & Goals**  
  Establish clear objectives and deliverables.
- [ ] **User Flow & Wireframing**  
  Sketch out user interactions and page layouts.
- [x] **Database & Data Source Design**  
  Plan the data structure for healthcare and review data.

---

## 2. Backend Development
- [ ] **Server & Database Setup**
   - Create the database based on the csv
  - Set up an **Express.js** server and connect the database
- [ ] **Data Filtering Methods**
  - Develop functions to **sort and filter CSV data efficiently** ! Look at #5! 👀
  - Implement **data caching** for improved performance
- [ ] **Authentication & Authorization**
  - Integrate **user authentication** (JWT/OAuth)
  - Establish **role-based access control** (Doctors, Govt. Officials)
- [ ] **Routes Development**
  - Build APIS for **fetching healthcare data, reviews, ratings, and notifications**

---

## 3. Frontend Development
- [ ] **Build Responsive UI**
  - Design a **clean, user-friendly interface** for healthcare search
  - Implement interactive **filters and sorting options**
- [ ] **Facility Details Page**
  - Display **services, wait times, ratings, and reviews**
  - Include an embedded **map & directions** //optional



## 2. Tech Stack Selection
### **Frontend**
- HTML, CSS, JavaScript fundamentals  
- React.js or Vue.js for dynamic UI (will we or not?)

### **Backend**
- Node.js + Express.js framework   
- CSV Parsing

### **Database**
- Auth table to store authenitification for healthcare and doctors
- Database with Review

### **Authentication & Authorization**
- Implement JWT-based authentication

### **APIs & Integrations (Optional for now)**
- Google Maps API or OpenStreetMap for location services

---

## 5. Data Handling & Filtering

### **High Priority: Filter Functionality**
- [ ] **View Available Healthcare Facilities**  
  - Allow patients to see a list of all healthcare facilities.

- [ ] **Find Facilities Near Them**  
  - Use location data to display nearby facilities.

- [ ] **Find Facilities by Types**  
  - Enable filtering by facility type (e.g., hospital, clinic, lab, pharmacy).

- [ ] **Find Facilities by Waiting Times**  
  - Provide an option to sort facilities by waiting times.

- [ ] **Find Facilities That Do All Prescribed Tests**  
  - Show only facilities that perform every test prescribed.

- [ ] **Identify Best-Rated Facilities Based on Patient Feedback**  
  - Sort facilities by ratings and patient satisfaction.

- [ ] **Find Areas with the Best Satisfied Facilities**  
  - Highlight geographic areas with the highest-rated facilities.

- [ ] **Rank Facilities from Best to Worst**  
  - Order facilities based on overall treatment quality and feedback.

- [ ] **View Survey Results Related to Healthcare Experiences**  
  - Display patient survey outcomes to inform choices.

- [ ] **Find Open Facilities**  
  - Filter for facilities that are currently open or have favorable operating hours.


- [ ] **Advanced Sorting :**
  - [ ] Sort facilities by **patient satisfaction ratings**
  - [ ] Sort facilities that has improved/ downgrade
  
---

## 6. Government Official Features
- [ ] **Direct Contact with Facilities**
  - Create a direct channel for **government officials to contact healthcare centers** based on feedback

---


## 7. Testing 
- [ ] **Functional Testing**
  - Verify that all **filters and search features** work correctly
  - Test performance with large CSV datasets
- [ ] **Authentication**
- [ ] **Performance Testing**

---

## 8. Deployment & 
- [ ] **If in ssh**

---




