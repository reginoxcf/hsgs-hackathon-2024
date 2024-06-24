var mydb = require('mysql');

var mydb = mydb.createConnection({
    host: "localhost",
    user: "root",
    password: "password" /*Write the database's password*/ 
});

mydb.connect(function (err) {
    if(err) console.log(err);
    else console.log("Database connected");
});