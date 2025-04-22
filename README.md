# Datanz

**Datanz** is a platform designed for district officials to monitor the performance of healthcare services and for patients to filter and explore available facilities that best suit their needs.

## Getting Started

Follow the steps below to set up and run the project.

### 1. Prepare the Database

Before starting the server, you need to ensure your database is clean and properly set up.

Open your terminal and run:

    ```bash
    cd db
    node initializedb.js
    ```





### 3. Run the Server

Now you're ready to run the backend server.

1. Navigate back to the project root directory if needed, then go to the backend folder:

    ```bash
    cd ..
    cd backend
    ```

2. Start the server:

    ```bash
    nodemon server.js
    ```

# User stories
# ✅ High-Priority Government Official Stories

- [x] As a government official, I want to read patient feedback on facilities, so that I can improve resource allocation.  
- [x] As a government official, I want to read patient feedback on healthcare workers and their services, so that I can instruct healthcare workers to improve.  
- [x] As a government official, I want to contact healthcare workers that have the lowest reviews to hold them accountable about services they provide.  
- [x] As a government official, I want to access an online system that provides me with patient feedback, so that I don’t spend funds on overseeing services.  
- [x] As a government official, I want to sort feedback by healthcare workers from best to worst, so that I can efficiently view the rating of the workers.  
- [x] As a government official, I want to authenticate my identity when creating an account in the online system, so that my role is clear.  
- [ ] As a government official, I want to sort feedback by time posted, so that I am up-to-date with the quality of overall service.  
- [x] As a government official, I want to sort feedback by facility, so that I am aware of the quality of service of that facility.  
- [ ] As a government official, I want an offline system to provide patients with the ability to give number-based feedback on waiting-times, cleanliness, staff behavior, treatment quality, and equipment quality, so that I have a clear 1–10 ranking on each of these issues.  

# ⛔️ High-Priority Patient Stories --> Refactored we do not need it  

- [ ] As a patient, I want to read feedback on a healthcare worker, so that I can decide if I want them to provide me services or not.  
- [ ] As a patient, I want to access an offline platform that allows me to give feedback on a healthcare worker or healthcare services, so that I am able to give feedback without the use of a smartphone.  
- [ ] As a patient, I want to access an offline platform to give feedback on the services I have received, so that I can help government and healthcare officials determine how to improve service quality in the future.  
- [ ] As a patient, I want to read feedback that is up-to-date, at least weekly, so that I am not viewing feedback that may be expired and does not hold with time.  
- [ ] As a patient, I want to give feedback anonymously so that I can share my concerns without being afraid of potential threats from the government.  
- [ ] As a patient, I want to give feedback on waiting times in facilities so that others are aware of the waiting times.  

# ⛔️ High-Priority Healthcare Worker Stories

- [ ] As a healthcare worker, I want to receive patient feedback after we have a consultation, so that I can improve my services.  
- [ ] As a healthcare worker, I want to interact with the feedback system in different ways, so that I can still use it even if I don’t have a computer on-site.  
- [ ] As a healthcare worker, I want to give feedback on the resource allocation in my facility, so that I can increase the quantity of resources we receive, if necessary.  
- [ ] As a healthcare worker, I want to authenticate my identity through the facility that I am working in, so that the system doesn’t misplace me within another facility.  
- [ ] As a healthcare worker, I want to give feedback on the cleanliness, waiting times, staff behavior, and equipment quality in the facility I am working in.  



# 🟡 Medium-Priority Patient Stories

- [ ] As a patient, I want access to reliable feedback, so that I know the reviews I am reading are truthful. (*Tested on filtering spam content).  

# 🟡 Medium-Priority Healthcare Worker Stories

- [x] As a healthcare worker, I want to view feedback on facilities in my area so that I can improve my services.  
- [ ] As a healthcare worker, I want to view reports on my performance so I know what areas to improve in.  

# 🟡 Medium-Priority Government Official Stories

- [x] As a government official, I want to sort reviews by facilities so I can easily access reviews for each facility.  
- [x] As a government official, I want to view already cleaned and visualized feedback so that I don't have to go through CSV files.  
- [x] As a government official, I want to see what services are being provided effectively, so that I can improve services in other facilities.  
- [x] As a government official, I want to sort feedback by priority, so that I am aware of which facilities to focus on improving.  
- [x] As a government official, I want a system that can help me prioritize which facilities to focus on improving, so that I support facilities that are struggling the most.  

# 🔽 Low-Priority Patient Stories

- [ ] As a patient, I want to give feedback in Swahili, so that I can easily express my concern.  
- [ ] As a patient, I want to receive an update on the complaint I sent so that I know that I am being heard.  

# 🔽 Low-Priority Government Official Stories

- [ ] As a government official, I want a system that can be scaled easily to other sectors of the Tanzanian government, so that we can improve other public services through citizen feedback platforms.  
- [ ] As a government official, I want to view the most unsatisfactory healthcare facilities every month, so that I can work on improving their services.  
- [ ] As a government official, I want to see which facilities are doing well, so that I can promote other facilities with similar support.  
- [ ] As a government official, I want additional forms of feedback on facilities and services, so that I have more feedback that can be used to improve services.  
