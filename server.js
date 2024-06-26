const { query } = require('express');
var mydb = require('mysql');

var myServer = mydb.createConnection({
    host: "localhost",
    user: "root",
    password: "password" /*Write the database's password*/ 
});

myServer.connect(err => {
    if(err) console.log("Connection failed");
    else console.log("Connected");
});

async function PromisedQuery(queryString, ErrMessage, SuccessMessage) {
    return new Promise((resolve, reject) => {
        myServer.query(queryString, function(err, result){
            if(err){
                console.log(ErrMessage);
                reject(err);
            }
            else{
                console.log(SuccessMessage);
                resolve(result);
            }
        });
    });
}

function HashFunction(input){
    //Currently it's the identity function. It could be changed to other cryptographic hash functions 
    //such as SHA-256 in the future
    return input;
}

async function __init(){
    await PromisedQuery("USE SATserver;", "Error while connecting to the database", "Database connected");
    await PromisedQuery("INSERT INTO GlobalInformation VALUES (0, 0, 0, 0, 0, 0);", "Error while initializing", "Initialization finished");
}

async function CreateAccount(username, password){
    //We expect the username to have no more than 20 characters
    var currentTime = new Date();
    if(myServer.query("SELECT * FROM AccountInformation WHERE Username = '" + username + "';")){
        console.log("Account with username '" + username + "' already registered");
    }
    else{
        var queryCode = 'INSERT INTO AccountInformation VALUES ("' + username + '","' + currentTime.toISOString().slice(0, 19).replace('T', ' ') + '","' + HashFunction(password) + '",0,0,0,0,0,0);'; 
        PromisedQuery(queryCode, "Account creation failed", "Account created successfully");
    }
}

async function LoginPasswordVerify(username, password){
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + username + `";`;
    PromisedQuery(queryCode, `Invalid username or password`,"Login successfully");
}


async function AddProblem(Difficulty, ProblemType, ProblemDescription, ChoiceA, ChoiceB, ChoiceC, ChoiceD, CorrectAnswer){
    var ProblemCategory = Difficulty + ProblemType + `ProblemsCount`;
    var queryCode = `SELECT * FROM GlobalInformation;`;
    
    var ProblemId = 1;
    //Calculate new problem's id
    var result = await PromisedQuery(queryCode, "Global information table error while adding problem", "");
    //console.log(result);
    switch (ProblemCategory){
        case 'EasyEnglishProblemsCount': ProblemId += result[0].EasyEnglishProblemsCount; break;
        case 'MediumEnglishProblemsCount': ProblemId += result[0].MediumEnglishProblemsCount; break;
        case 'HardEnglishProblemsCount': ProblemId += result[0].HardEnglishProblemsCount; break;
        case 'EasyMathProblemsCount': ProblemId += result[0].EasyMathProblemsCount; break;
        case 'MediumMathProblemsCount': ProblemId += result[0].MediumMathProblemsCount; break;
        default: ProblemId += result[0].HardMathProblemsCount; break;
    }
    //Insert the problem to the database
    queryCode = 'INSERT INTO SATproblems VALUES (' + ProblemId + ',"' + Difficulty + `","` + ProblemType + '","' + ProblemDescription + '","' + ChoiceA + '","' + ChoiceB + '","' + ChoiceC + '","' + ChoiceD + '","' + CorrectAnswer + `");`;
    PromisedQuery(queryCode, "Database error while adding problem", "Problem added successfully");
    // console.log(queryCode);
    //Recalculate the variable in GlobalInformation
    queryCode = `UPDATE GlobalInformation SET ` + ProblemCategory + ' = ' + ProblemId + `;`;
    PromisedQuery(queryCode, "Database error while editing GlobalInformation variable", "Information updated successfully");
}

async function CreateNewSubmission(StudentUsername){
    //Check if the username is valid or not
    var StartedTime = new Date();
    var PartBeginTime = StartedTime;
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + StudentUsername + `";`;
    PromisedQuery(queryCode, "Invalid username", "Valid username. Creating new submission");
    //Create a new submission
    queryCode = `INSERT INTO UserSubmissions (StudentUsername, StartedTime, CurrentPart, PartBeginTime) VALUES ("` + StudentUsername + '","' + StartedTime.toISOString().slice(0, 19).replace('T', ' ') + '","1","' + PartBeginTime.toISOString().slice(0, 19).replace('T', ' ') + '");';
    PromisedQuery(queryCode, "Database error while creating new submission", "New submission created successfully");
}

async function ChangeSubmissionPart(SubmissionId)
{
    //Check if the Id is valid or not. Check if the submission is in part 6 or not
    var queryCode = `SELECT CurrentPart FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    var CurrentPart = 0;
    var result = await PromisedQuery(queryCode, "Invalid SubmissionId or server error", "");
    if(result.length == 0){
        console.log("Invalid SubmissionId or server error");
        return 1; //Error
    }
    else if(result[0].CurrentPart == `6`) console.log("Already ended test");
    else CurrentPart = parseInt(result[0].CurrentPart)+1;
    //Update CurrentPart and PartBeginTime correspondingly
    var StartedTime = new Date();
    queryCode = `UPDATE UserSubmissions SET CurrentPart = ` + CurrentPart + `, PartBeginTime = "` + StartedTime.toISOString().slice(0, 19).replace('T', ' ') + `" WHERE SubmissionId = ` + SubmissionId + `;`;
    await PromisedQuery(queryCode, "Server error while updating SubmissionPart", "Change submission part successfully");
}

/**/
/*The "dangerous" boundary: All functions below haven't been tested (or even coded) yet*/ 
/**/

async function FetchNewProblem(Difficulty, ProblemType){
    /*This function is intentionally left blank, because we didn't have the code to fetch new problems from LLM yet*/
    /*For the server to run properly, this function should have something instead of nothing :)))*/
    return 0;
}

async function CreateLinkBetweenProblemAndSubmission(SubmissionId, Difficulty, ProblemType, ProblemIndex, ProblemPoint, Module){
    //Check if submissionID is valid or not
    var queryCode = `SELECT * FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    var result = await PromisedQuery(queryCode, "Error while finding submission (server error or invalid SubmissionId", "");
    if(result.length == 0){
        console.log("Error while finding submission (server error or invalid SubmissionId");
        return 1; //Error
    }
    var username = result[0].StudentUsername;
    //Calculate ProblemId (fetch new problem if neccessary)
    var ProblemCategory = Difficulty + ProblemType + `ProblemsCount`;
    queryCode = `SELECT ` + ProblemCategory + ` FROM AccountInformation WHERE Username = "` + username + '";';
    var ProblemId = 1, NumberOfProblemInDatabase = 0;
    result = await PromisedQuery(queryCode, "Global information table error while creating link", "");
    switch (ProblemCategory){
        case 'EasyEnglishProblemsCount': ProblemId += result[0].EasyEnglishProblemsCount; break;
        case 'MediumEnglishProblemsCount': ProblemId += result[0].MediumEnglishProblemsCount; break;
        case 'HardEnglishProblemsCount': ProblemId += result[0].HardEnglishProblemsCount; break;
        case 'EasyMathProblemsCount': ProblemId += result[0].EasyMathProblemsCount; break;
        case 'MediumMathProblemsCount': ProblemId += result[0].MediumMathProblemsCount; break;
        default: ProblemId += result[0].HardMathProblemsCount; break;
    }
    //Calculate the number of problems (in that category) in the database
    queryCode = `SELECT ` + ProblemCategory + ` FROM GlobalInformation;`;
    result = await PromisedQuery(queryCode, "Global information table error while creating link", "");
    switch (ProblemCategory){
        case 'EasyEnglishProblemsCount': NumberOfProblemInDatabase = result[0].EasyEnglishProblemsCount; break;
        case 'MediumEnglishProblemsCount': NumberOfProblemInDatabase = result[0].MediumEnglishProblemsCount; break;
        case 'HardEnglishProblemsCount': NumberOfProblemInDatabase = result[0].HardEnglishProblemsCount; break;
        case 'EasyMathProblemsCount': NumberOfProblemInDatabase = result[0].EasyMathProblemsCount; break;
        case 'MediumMathProblemsCount': NumberOfProblemInDatabase = result[0].MediumMathProblemsCount; break;
        default: NumberOfProblemInDatabase = result[0].HardMathProblemsCount; break;
    }
    if(ProblemId > NumberOfProblemInDatabase){
        var NewProblem = FetchNewProblem(Difficulty, ProblemType); //Currently we shouldn't let this happen, because FetchNewProblem() isn't defined yet
        AddProblem(NewProblem.Difficulty, NewProblem.ProblemType, NewProblem.ProblemDescription, NewProblem.ChoiceA, NewProblem.ChoiceB, NewProblem.ChoiceC, NewProblem.ChoiceD, NewProblem.CorrectAnswer);
    }
    //Create link
    queryCode = `INSERT INTO ProblemSubmissionLink(SubmissionId, ProblemId, ProblemIndex, ProblemPoint, Module) VALUES (` + SubmissionId + `,` + ProblemId + `,` + ProblemIndex + `,` + ProblemPoint + `,"` + Module + `);`;
    await PromisedQuery(queryCode, "Server error while creating link", "Link created successfully");
}

async function main() //Run program here
{
    let sus = await __init();
    sus = await CreateAccount("admin","8080");
    sus = await LoginPasswordVerify("admin","8080");
    sus = await AddProblem("Easy", "Math", "What is 1+1?", "5", "3", "2", "6", "C");
    sus = await AddProblem("Easy", "Math", "What is 1+2?", "5", "3", "2", "6", "B");
    sus = await CreateNewSubmission("admin");
    sus = await ChangeSubmissionPart(1);
}

main();
