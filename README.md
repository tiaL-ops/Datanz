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
- [x] As a government official, I want to sort feedback by time posted, so that I am up-to-date with the quality of overall service.  
- [x] As a government official, I want to sort feedback by facility, so that I am aware of the quality of service of that facility.  


# 🟡 Medium-Priority Healthcare Worker Stories

- [x] As a healthcare worker, I want to view feedback on facilities in my area so that I can improve my services.  
- [x] As a healthcare worker, I want to view reports on my performance so I know what areas to improve in.  

# 🟡 Medium-Priority Government Official Stories

- [x] As a government official, I want to sort reviews by facilities so I can easily access reviews for each facility.  
- [x] As a government official, I want to view already cleaned and visualized feedback so that I don't have to go through CSV files.  
- [x] As a government official, I want to see what services are being provided effectively, so that I can improve services in other facilities.  
- [x] As a government official, I want to sort feedback by priority, so that I am aware of which facilities to focus on improving.  
- [x] As a government official, I want a system that can help me prioritize which facilities to focus on improving, so that I support facilities that are struggling the most.  


# 🔽 Low-Priority Government Official Stories

- [x] As a government official, I want to view the most unsatisfactory healthcare facilities every month, so that I can work on improving their services.  
- [x] As a government official, I want to see which facilities are doing well, so that I can promote other facilities with similar support.  

