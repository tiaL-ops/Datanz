# Datanz

**Datanz** is a platform designed for district officials to monitor the performance of healthcare services and for patients to filter and explore available facilities that best suit their needs.

## Getting Started

Follow the steps below to set up and run the project.

### 1. Prepare the Database

Before starting the server, you need to ensure your database is clean and properly set up.

#### a. Drop Existing Tables

Open your terminal and run:

```bash
sqlite3 .open dbsqlite < sql/drop_tables.sql
```

#### b. Create New Tables

Then run:

```bash
sqlite3 .open dbsqlite < sql/create_tables.sql
```

### 2. Populate the Database

Next, populate your database with initial data.

1. Navigate to the `db` directory:

    ```bash
    cd db
    ```

2. Open `cli.js` and **uncomment** the section labeled:  
   `"uncomment this if the database is still empty"`

3. Run the script:

    ```bash
    node cli.js
    ```

4. After successful population, **comment out** the same section in `cli.js` to avoid duplicate data entries in the future.

### 3. Run the Server

Now you're ready to run the backend server.

1. Navigate back to the project root directory if needed, then go to the backend folder:

    ```bash
    cd backend
    ```

2. Start the server:

    ```bash
    node mon.js
    ```

