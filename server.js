const { query } = require('express');
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
        if(err){
            console.log(err);
            return 1; //Error
        }
        else console.log("Account created successfully");
    })
    return 0; //Success
}
/**/
/*The "dangerous" boundary: All functions below haven't been tested (or even coded) yet*/ 
/**/
function LoginPasswordVerify(username, password){
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + username + `";`;
    myServer.query(queryCode, function(err, result, fields){
        if(err || result.length == 0 || result[0].User_password != password){
            console.log(`Invalid username or password`);
            return 1; //Error
        }
        else console.log("Login successfully");
    });
    return 0; //Success
}

function AddProblem(Difficulty, ProblemType, ProblemDescription, ChoiceA, ChoiceB, ChoiceC, ChoiceD, CorrectAnswer){
    var ProblemCategory = Difficulty + ProblemType + `ProblemsCount`;
    var queryCode = `SELECT ` + ProblemCategory + ` FROM GlobalInformation;`;
    
    var ProblemId = 1;
    //Calculate new problem's id
    myServer.query(queryCode, function(err, result, fields){
        if(err || result.length == 0){
            console.log("Global information table error while adding problem"); //This should never happen
            return 1; //Error
        }
        else{
            switch (ProblemCategory){
                case 'EasyEnglishProblemsCount': ProblemId += result[0].EasyEnglishProblemsCount;
                case 'MediumEnglishProblemsCount': ProblemId += result[0].MediumEnglishProblemsCount;
                case 'HardEnglishProblemsCount': ProblemId += result[0].HardEnglishProblemsCount;
                case 'EasyMathProblemsCount': ProblemId += result[0].EasyMathProblemsCount;
                case 'MediumMathProblemsCount': ProblemId += result[0].MediumMathProblemsCount;
                default: ProblemId += result[0].HardMathProblemsCount;
            }
        }
    });
    //Insert the problem to the database
    queryCode = 'INSERT INTO SATproblems VALUES (' + ProblemId + ',"' + Difficulty + `","` + ProblemType + '","' + ProblemDescription + '","' + ChoiceA + '","' + ChoiceB + '","' + ChoiceC + '","' + ChoiceD + `");`;
    myServer.query(queryCode, function(err, result){
        if(err){
            console.log("Database error while adding problem"); //This should never happen
            return 1; //Error
        }
        else console.log("Problem added successfully");
    });
    return 0;
}

function CreateNewSubmission(StudentUsername){
    //Check if the username is valid or not
    var StartedTime = new Date();
    var PartBeginTime = StartedTime;
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + StudentUsername + `";`;
    myServer.query(queryCode, function(err, result, fields){
        if(err || result.length == 0){
            console.log(`Invalid username`);
            return 1; //Error
        }
        else console.log("Valid username. Creating new submission");
    });
    //Create a new submission
    queryCode = `INSERT INTO UserSubmissions (StudentUsername, StartedTime, CurrentPart, PartBeginTime) VALUES ("` StudentUsername + '","' + StartedTime.toISOString().slice(0, 19).replace('T', ' ') + '","1","' + PartBeginTime.toISOString().slice(0, 19).replace('T', ' ') + ");";
    myServer.query(queryCode, function(err, result){
        if(err){
            console.log("Database error while creating new submissiong"); //This should never happen
            return 1; //Error
        }
        else console.log("New submission created successfully");
    });
    return 0;
}
function FetchNewProblem(Difficulty, ProblemType){
    /*This function is intentionally left blank, because we didn't have the code to fetch new problems from LLM yet*/
    /*For the server to run properly, this function should have something instead of nothing :)))*/
    return 0;
}
function CreateLinkBetweenProblemAndSubmission(SubmissionId, Difficulty, ProblemType, ProblemIndex, ProblemPoint, Module){
    //Check if SubmissionId is valid or not
    //Calculate ProblemId (fetch new problem if neccessary)
    //Create link
}
function ChangeSubmissionPart(SubmissionId)
{
    //Check if the Id is valid or not. Check if the submission is in part 6 or not
    //Update CurrentPart and PartBeginTime correspondingly
}
