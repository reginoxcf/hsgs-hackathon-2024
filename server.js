var mydb = require('mysql');

var myServer = mydb.createConnection({
    host: "localhost",
    user: "root",
    password: "password" /*Write the database's password*/ 
});

myServer.connect(function (err) {
    if(err) console.log(err);
    else console.log("MySQL connected");
}); 
       
function HashFunction(input){
    //Currently it's the identity function. It could be changed to other cryptographic hash functions 
    //such as SHA-256 in the future
    return input;
}
function __init(){
    myServer.query("USE SATserver;", function(err, result){
        if(err) console.log(err);
        else console.log("Database connected");
    });
    myServer.query("INSERT INTO GlobalInformation VALUES (0, 0, 0, 0, 0, 0);", function(err, result){
        if(err) console.log(err);
        else console.log("Initialization finished");
    });
}
function CreateAccount(username, password){
    //We expect the username has no more than 20 characters
    var currentTime = new Date();
    var queryCode = 'INSERT INTO AccountInformation VALUES ("' + username + '","' + currentTime.toISOString().slice(0, 19).replace('T', ' ') + '","' + HashFunction(password) + '",0,0,0,0,0,0);'; 
    console.log(queryCode);
    myServer.query(queryCode, function (err, result){
        if(err) return 1;
        else console.log("Account created successfully");
    })
    return 0;
}

__init();
CreateAccount("ad", "1");
CreateAccount("min", "2");
