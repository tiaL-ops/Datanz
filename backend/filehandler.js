const fs = require('fs');


fs.writeFileSync('message.txt', 'Hello, Datanz Facility!');


const data = fs.readFileSync('message.txt', 'utf8');
console.log('File Content:', data);
