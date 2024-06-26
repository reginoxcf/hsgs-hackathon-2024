const { query } = require('express');
const crypto = require('crypto');
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

function PromisedQuery(queryString, ErrMessage, SuccessMessage) {
    return new Promise((resolve, reject) => {
        try {
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
        }
        catch(err){
            return; //Error
        }
    });
}

function HashFunction(input){
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return hash;
}

async function __init(){
    let sus;
    try{
        sus = await PromisedQuery("USE SATserver;", "Error while connecting to the database", "Database connected");
    }    
    catch (err){
        return 1; //Error
    }
    try{
        sus = await PromisedQuery("INSERT INTO GlobalInformation VALUES (0, 0, 0, 0, 0, 0);", "Error while initializing", "Initialization finished");
    }
    catch(err){
        return 1; //Error
    }
}

async function CreateAccount(username, password){
    //We expect the username has no more than 20 characters
    var currentTime = new Date();
    var queryCode = 'INSERT INTO AccountInformation VALUES ("' + username + '","' + currentTime.toISOString().slice(0, 19).replace('T', ' ') + '","' + HashFunction(password) + '",0,0,0,0,0,0);';
    try{
        await PromisedQuery(queryCode, "Failed to create new account (account may have already existed)", "Account created successfully")
    }
    catch(err){
        return 1; //Error
    }
}

async function LoginPasswordVerify(username, password){
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + username + `";`;
    var hashpw;
    try{
        hashpw = await PromisedQuery(queryCode, `Invalid username or password`,"Valid username");
    }
    catch(err){
        return 1; //Error
    }
    if(hashpw.length == 0 || hashpw[0].User_password != HashFunction(password)){
        console.log("Wrong password");
        return 0;
    }
    else{
        console.log("Login successful");
        return 1;
    }
}

async function AddProblem(Difficulty, ProblemType, ProblemDescription, ChoiceA, ChoiceB, ChoiceC, ChoiceD, CorrectAnswer){
    var ProblemCategory = Difficulty + ProblemType + `ProblemsCount`;
    var queryCode = `SELECT * FROM GlobalInformation;`;
    
    var ProblemId = 1;
    //Calculate new problem's id
    try{
        var result = await PromisedQuery(queryCode, "Global information table error while adding problem", "");
    }
    catch(err){
        return 1; //Error
    }
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
    try{
        let sus = PromisedQuery(queryCode, "Database error while adding problem", "Problem added successfully");
    }
    catch(err){
        return 1; //Error
    }
    // console.log(queryCode);
    //Recalculate the variable in GlobalInformation
    queryCode = `UPDATE GlobalInformation SET ` + ProblemCategory + ' = ' + ProblemId + `;`;
    try{
        sus = await PromisedQuery(queryCode, "Database error while editing GlobalInformation variable", "Information updated successfully");
    }
    catch(err){
        return 1; //Error
    }
}

async function CreateNewSubmission(StudentUsername){
    //Check if the username is valid or not
    var StartedTime = new Date();
    var PartBeginTime = StartedTime;
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + StudentUsername + `";`;
    try{
        let sus = await PromisedQuery(queryCode, "Invalid username", "Valid username. Creating new submission");
    }
    catch(err){
        return 1; //Error
    }
    //Create a new submission
    queryCode = `INSERT INTO UserSubmissions (StudentUsername, StartedTime, CurrentPart, PartBeginTime) VALUES ("` + StudentUsername + '","' + StartedTime.toISOString().slice(0, 19).replace('T', ' ') + '","1","' + PartBeginTime.toISOString().slice(0, 19).replace('T', ' ') + `");`;
    // console.log(queryCode);
    try{
        sus = await PromisedQuery(queryCode, "Database error while creating new submission", "New submission created successfully");
    }
    catch(err){
        return 1; //Error
    }
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
    try{
        var result = await PromisedQuery(queryCode, "Error while finding submission (server error or invalid SubmissionId", "");
    }
    catch(err){
        return 1; //Error
    }
    if(result.length == 0){
        console.log("Error while finding submission (server error or invalid SubmissionId");
        return 1; //Error
    }
    var username = result[0].StudentUsername;
    //Calculate ProblemId (fetch new problem if neccessary)
    var ProblemCategory = Difficulty + ProblemType + `ProblemsCount`;
    queryCode = `SELECT ` + ProblemCategory + ` FROM AccountInformation WHERE Username = "` + username + '";';
    var ProblemId = 1, NumberOfProblemInDatabase = 0;
    try{
        result = await PromisedQuery(queryCode, "Global information table error while creating link", "");
    }
    catch(err){
        return 1; //Error
    }
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
    try{
        result = await PromisedQuery(queryCode, "Global information table error while creating link", "");
    }
    catch(err){
        return 1; //Error
    }
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
    queryCode = `INSERT INTO ProblemSubmissionLink(SubmissionId, ProblemId, ProblemIndex, ProblemPoint, Module) VALUES (` + SubmissionId + `,` + ProblemId + `,` + ProblemIndex + `,` + ProblemPoint + `,` + Module + `);`;
    // console.log(queryCode);
    try{
        let sus = await PromisedQuery(queryCode, "Server error while creating link", "Link created successfully");
    }
    catch(err){
        return 1; //Error
    }
}

async function ChangeSubmissionPart(SubmissionId)
{
    //Check if the Id is valid or not. Check if the submission is in part 6 or not
    var queryCode = `SELECT CurrentPart FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    var CurrentPart = 0;
    try{
        var result = await PromisedQuery(queryCode, "Invalid SubmissionId or server error", "");
    }
    catch(err){
        return 1; //Error
    }
    if(result.length == 0){
        console.log("Invalid SubmissionId or server error");
        return 1; //Error
    }
    else if(result[0].CurrentPart == `6`) console.log("Already ended test");
    else CurrentPart = parseInt(result[0].CurrentPart)+1;
    //Update CurrentPart and PartBeginTime correspondingly
    var StartedTime = new Date();
    queryCode = `UPDATE UserSubmissions SET CurrentPart = ` + CurrentPart + `, PartBeginTime = "` + StartedTime.toISOString().slice(0, 19).replace('T', ' ') + `" WHERE SubmissionId = ` + SubmissionId + `;`;
    try{
        let sus = await PromisedQuery(queryCode, "Server error while updating SubmissionPart", "Change submission part successfully");
    }
    catch(err){
        return 1; //Error
    }
}

async function main()
{
    let sus = await __init();
    sus = await CreateAccount("admin","8080");
    sus = await LoginPasswordVerify("admin","8080");
    sus = await AddProblem("Easy", "Math", "What is 1+1?", "5", "3", "2", "6", "C");
    sus = await AddProblem("Easy", "Math", "What is 1+2?", "5", "3", "2", "6", "B");
    sus = await CreateNewSubmission("admin");
    sus = await ChangeSubmissionPart(1);
    sus = await CreateLinkBetweenProblemAndSubmission(1, "Easy", "Math", 1, 1, 1);
}

main();
