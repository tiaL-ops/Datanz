
Datanz
Datanz is a platform designed for district officials to monitor the performance of healthcare services and for patients to filter and explore available facilities that best suit their needs.

## Getting Started
To Run our project, make sure you have node.js 20 or later. Follow the steps below to set up and run the project.

1. Install all packages
npm install

### 2. Prepare the Database

Before starting the server, you need to ensure your database is clean and properly set up.

Open your terminal and run:

    ```bash
    cd db
    node initializedb.js
    ```

### 4. Run the Server

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

### 5. Run the test

If you would like to see the test coverage, go to the directory and run

    ```bash
    npm run coverage
    ```
### 5. API Key
In order to use the google maps, you will have to use your won Api key, e