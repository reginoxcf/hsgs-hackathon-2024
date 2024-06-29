//const { query } = require('express');
const { query } = require('express');
const crypto = require('crypto');
var mydb = require('mysql');
const API_KEY = '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'

var myServer = mydb.createConnection({
    host: "localhost",
    user: "root",
    password: "password" /*Write the database's password*/ 
});

myServer.connect(err => {
    if(err) console.log(err);
    else console.log("Connected");
});

function PromisedQuery(queryString, ErrMessage, SuccessMessage) {
    return new Promise((resolve, reject) => {
        try {
            myServer.query(queryString, function(err, result){
                if(err){
                    console.log(ErrMessage);
                    console.log(err);
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
    const hash = crypto.createHash('sha256').update(input).digest('base64');
    return hash;
}

async function __init(){
    let sus;
    try{
        sus = await PromisedQuery("USE SATserver;", "Error while connecting to the database", "Database connected");
    }    
    catch (err){
        return -1; //Error
    }
    try{
        sus = await PromisedQuery("INSERT INTO GlobalInformation VALUES (0, 0, 0, 0, 0, 0);", "Error while initializing", "Initialization finished");
    }
    catch(err){
        return -1; //Error
    }
}

async function CreateAccount(username, password){
    //We expect the username has no more than 20 characters
    var currentTime = new Date();
    var queryCode = 'INSERT INTO AccountInformation VALUES ("' + username + '","' + currentTime.toISOString().slice(0, 19).replace('T', ' ') + '","' + HashFunction(password) + '",0,0,0,0,0,0);'; 
    try{
        await PromisedQuery(queryCode, "Failed to create new account", "Account created successfully")
    }
    catch(err){
        return -1; //Error
    }
    return 0;
}

async function LoginPasswordVerify(username, password){
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + username + `";`;
    var hashpw;
    try{
        hashpw = await PromisedQuery(queryCode, `Invalid username or password`,"Login successfully");
    }
    catch(err){
        return -1; //Error
    }
    if(hashpw.length == 0 || hashpw[0].User_password != HashFunction(password)){
        console.log("Wrong password");
        return -1;
    }
    else return 0;
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
        return -1; //Error
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
        return -1; //Error
    }
    // console.log(queryCode);
    //Recalculate the variable in GlobalInformation
    queryCode = `UPDATE GlobalInformation SET ` + ProblemCategory + ' = ' + ProblemId + `;`;
    try{
        sus = await PromisedQuery(queryCode, "Database error while editing GlobalInformation variable", "Information updated successfully");
    }
    catch(err){
        return -1; //Error
    }
    return 0;
}

async function CreateNewSubmission(StudentUsername){
    //Check if the username is valid or not
    var StartedTime = new Date();
    var PartBeginTime = StartedTime;
    var queryCode = `SELECT User_password FROM AccountInformation WHERE Username = "` + StudentUsername + `";`;
    var result;
    try{
        result = await PromisedQuery(queryCode, "Server error", "");
    }
    catch(err){
        return -1; //Error
    }
    if(result.length == 0){
        console.log("Invalid username");
        return -1;
    }
    else console.log("Valid username. Creating new submission");
    //Create a new submission
    queryCode = `INSERT INTO UserSubmissions (StudentUsername, StartedTime, CurrentPart, PartBeginTime) VALUES ("` + StudentUsername + '","' + StartedTime.toISOString().slice(0, 19).replace('T', ' ') + '","1","' + PartBeginTime.toISOString().slice(0, 19).replace('T', ' ') + `");`;
    try{
        sus = await PromisedQuery(queryCode, "Database error while creating new submission", "New submission created successfully");
    }
    catch(err){
        return -1; //Error
    }
    queryCode = `SELECT COUNT(*) FROM UserSubmissions`;
    var SubmissionId;
    try{
        SubmissionId = await PromisedQuery(queryCode, "Error", "Count successfully");
    }
    catch(err){
        return -1; //Error
    }
    return SubmissionId[0]['COUNT(*)'];
}
// Math
function genRandomSubject() {
    let subj = ['linear equation', 'system of linear equations', 'inequalities', 'system of inequalities',
    'ratios, rates, proportional relationships', 'units and rates', 'interpret one- and two-variable data',
    'geometry problem of perimeter, area, volume', 'angles and triangles', 'trigonometry', 'circles',
    'word problem', 'polynomial', 'intersection point of 2 lines', 'x-intercept', 'y-intercept', 'probability']
    for (var i = subj.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = subj[i];
        subj[i] = subj[j];
        subj[j] = temp;
    }
    return subj[Math.floor(Math.random()*subj.length)]
}
async function getRandomSatMultipleChoiceQuestion(difficulty) {
    const prompt = `Generate a random SAT math question of difficulty level ${difficulty}/10 about ${genRandomSubject()}. Provide 4 multiple choices A), B), C), D) so that there is exactly one correct answer without explanation. Ensure the mathematical operations follow standard arithmetic rules (PEMDAS/BODMAS). Clearly label the correct answer after "Answer: ". The format should be:
Question: [your question here]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Answer: [correct option]`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`, // Replace with your actual API key
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o', // Ensure this model is suitable and available
                prompt: prompt,
                max_tokens: 10000000,
                temperature: 0.4,
            }),
        });
        const data = await response.json();
        const question = data.choices[0].text.trim();
        return question;
    } catch (error) {
        console.error('Error fetching data from OpenAI API:', error);
        return 'Failed to fetch question. Please try again later.';
    }
}

function getAnswer(question) {
    const answerRegex = /Answer:\s*([A-D])/; // Regex to find "Answer: X"
    const match = question.match(answerRegex);
    if (match) {
        const answer = match[1];
        const options = ['A', 'B', 'C', 'D'];
        if (options.includes(answer)) {
            return answer;
        }
    }
    return 'Answer not found or incorrect format';
}
function extractChoices(question) {
    const choices = {};
    const choiceRegex = /([A-D])\)\s*([^A-D]+)/g;
    let match;

    while ((match = choiceRegex.exec(question)) !== null) {
        choices[match[1]] = match[2].trim();
    }

    return choices;
}
// End of Math

// English
async function GenerateQuestion(difficulty, QuestionType) {
    //Generate Question
    console.log(QuestionType);
    console.log("Difficulty: " + difficulty + "/10");
    let ParagraphQuery = "Generate one digital SAT paragraph of about 200 words (without answers,choices,or anything, just the paragraph) with the type " + QuestionType + " with a difficulty of " + difficulty + "/10";
    const message = [
      {"role": "system", "content": "Be descriptive and clear, make sure to have everything that a digital SAT question needs and be sure to have 4 choices and exactly one single correct answer, add ('A)' before choice A, 'B)' before choice B, and similar to choice C and D) and DON'T ADD ANY EXTRA TEXT/WORD NOT RELATED TO THE SAT QUESTION"},
      {"role": "user", "content": ParagraphQuery}
    ];
    const fetchParagraph = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o",
        "messages": message
      })
    });
    const ParagraphJSON = await fetchParagraph.json();
    let GeneratedParagraph = ParagraphJSON.choices[0].message.content;
    message.push({"role": "assistant", "content": GeneratedParagraph});
    //Fetch question
    message.push({"role":"user","content": "Generate a question to the paragraph above (only the question, without the choices, ONLY the question)"});
    const fetchQuestion = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-4o",
          "messages": message
        })
      });
    const QuestionJSON = await fetchQuestion.json();
    let MainQuestion = QuestionJSON.choices[0].message.content;
    message.push({"role": "assistant", "content": MainQuestion});
    //Generate choice A
    message.push({"role":"user","content": "Give me choice A of the question above"});
    const fetchChoiceA = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-4o",
          "messages": message
        })
      });
    const choiceA_JSON = await fetchChoiceA.json();
    let choiceA = choiceA_JSON.choices[0].message.content;
    message.push({"role": "assistant", "content": choiceA});
    //Generate choice B
    message.push({"role":"user","content": "Give me choice B of the question above"});
    const fetchChoiceB = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-4o",
          "messages": message
        })
      });
    const choiceB_JSON = await fetchChoiceB.json();
    let choiceB = choiceB_JSON.choices[0].message.content;
    message.push({"role": "assistant", "content": choiceB});
    //Generate choice C
    message.push({"role":"user","content": "Give me choice C of the question above"});
    const fetchChoiceC = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-4o",
          "messages": message
        })
      });
    const choiceC_JSON = await fetchChoiceC.json();
    let choiceC = choiceC_JSON.choices[0].message.content;
    message.push({"role": "assistant", "content": choiceC});
    //Generate choice D
    message.push({"role":"user","content": "Give me choice D of the question above"});
    const fetchChoiceD = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "openai/gpt-4o",
          "messages": message
        })
      });
    const choiceD_JSON = await fetchChoiceD.json();
    let choiceD = choiceD_JSON.choices[0].message.content;
    message.push({"role": "assistant", "content": choiceD});
    //Generate Answer & Explanation
    message.push({"role": "user", "content": "Give me the answer to the question above in only 1 letter (A/B/C/D)"});
    const fetchResultwithAnswer = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o",
        "messages": message
      })
    });
    const AnswerJSON = await fetchResultwithAnswer.json();
    let Answer = AnswerJSON.choices[0].message.content;
    return [GeneratedParagraph,MainQuestion,choiceA,choiceB,choiceC,choiceD,Answer];
}
// End of English


async function FetchNewProblem(Difficulty, ProblemType){
    /*This function is intentionally left blank, because we didn't have the code to fetch new problems from LLM yet*/
    /*For the server to run properly, this function should have something instead of nothing :)))*/
    if (ProblemType == 'Math') {
        let question = await getRandomSatMultipleChoiceQuestion(Difficulty)
        const ans = getAnswer(question);
        const choice = extractChoices(question)
        AddProblem(Difficulty, ProblemType, question, choice['A'], choice['B'], choice['C'], choice['D'], ans)
    } else {
        const QuestionTypes = [
            "words in context (example: what does the word ... in the text nearly mean and then give some other words and the student has to find the word with a similar meaning)", 
            "central ideas and details",
            "command of evidence (textual)",
            "cross-text connections (given 2 paragraphs each paragraph with at least 75 words, how would the author of text 2 respond to text 1 or vice versa / what is the relationship between the two texts)",
            "transitions (fill in the blank (only one blank) with the correct transition)", 
            "which choice most logically completes the text",
            "given a hypothesis, which answer (if accurate) is most likely to strengthen/weaken the hypothesis",
            "main idea of the text",
            "fill in the blank with the suitable word (make sure to have only one blank)",
            "text structure and purpose"
      
        ];
        for (let i=0;i<1;i++) {
            let [satParagraph,Question,choiceA,choiceB,choiceC,choiceD,Answer] = await GenerateQuestion(Math.floor(Math.random()*6)+5,QuestionTypes[Math.floor(Math.random()*QuestionTypes.length)]);
            AddProblem(Difficulty, ProblemType, satParagraph + '\n' + Question, choiceA, choiceB, choiceC, choiceD, Answer)
        }
    }
    return 0;
}

async function CreateLinkBetweenProblemAndSubmission(SubmissionId, Difficulty, ProblemType, ProblemIndex, ProblemPoint, Module){
    //Check if submissionID is valid or not
    var queryCode = `SELECT * FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    try{
        var result = await PromisedQuery(queryCode, "Error while finding submission (server error or invalid SubmissionId", "");
    }
    catch(err){
        return -1; //Error
    }
    if(result.length == 0){
        console.log("Error while finding submission (server error or invalid SubmissionId");
        return -1; //Error
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
        return -1; //Error
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
        return -1; //Error
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
        // var NewProblem = FetchNewProblem(Difficulty, ProblemType); //Currently we shouldn't let this happen, because FetchNewProblem() isn't defined yet
        // AddProblem(NewProblem.Difficulty, NewProblem.ProblemType, NewProblem.ProblemDescription, NewProblem.ChoiceA, NewProblem.ChoiceB, NewProblem.ChoiceC, NewProblem.ChoiceD, NewProblem.CorrectAnswer);
        FetchNewProblem(Difficulty, ProblemType)
    }
    //Create link
    queryCode = `INSERT INTO ProblemSubmissionLink(SubmissionId, ProblemId, ProblemIndex, ProblemPoint, ProblemType, Module) VALUES (` + SubmissionId + `,` + ProblemId + `,` + ProblemIndex + `,` + ProblemPoint + `,"` + ProblemType + `","` + Module + `");`;
    // console.log(queryCode);
    try{
        let sus = await PromisedQuery(queryCode, "Server error while creating link", "Link created successfully");
    }
    catch(err){
        return -1; //Error
    }
    return ProblemId;
}

async function TakeNewProblemForUser(username, Difficulty, ProblemType)
{
    //Return the problemId
    var ProblemCategory = Difficulty + ProblemType + `ProblemsCount`;
    queryCode = `SELECT ` + ProblemCategory + ` FROM AccountInformation WHERE Username = "` + username + '";';
    var ProblemId = 1, NumberOfProblemInDatabase = 0;
    try{
        result = await PromisedQuery(queryCode, "Global information table error while creating link", "");
    }
    catch(err){
        return -1; //Error
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
        return -1; //Error
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
        FetchNewProblem(Difficulty, ProblemType);
    }
    return ProblemId;
}
async function CreateLinkBetweenProblemAndSubmission(SubmissionId, Difficulty, ProblemType, ProblemIndex, ProblemPoint, Module){
    //Need to test a little bit more
    
    //Check if submissionID is valid or not
    var queryCode = `SELECT * FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    try{
        var result = await PromisedQuery(queryCode, "Error while finding submission (server error or invalid SubmissionId", "");
    }
    catch(err){
        return -1; //Error
    }
    if(result.length == 0){
        console.log("Error while finding submission (server error or invalid SubmissionId)");
        return -1; //Error
    }
    var username = result[0].StudentUsername;
    //Calculate ProblemId (fetch new problem if neccessary)
    var ProblemId = TakeNewProblemForUser(username, Difficulty, ProblemType);
    //Create link
    queryCode = `INSERT INTO ProblemSubmissionLink(SubmissionId, ProblemId, ProblemIndex, ProblemPoint, ProblemType, ProblemDifficulty, Module) VALUES (` + SubmissionId + `,` + ProblemId + `,` + ProblemIndex + `,` + ProblemPoint + `,"` + ProblemType + `","` + Difficulty + `","` + Module + `");`;
    try{
        let sus = await PromisedQuery(queryCode, "Server error while creating link", "Link created successfully");
    }
    catch(err){
        return -1; //Error
    }
    return ProblemId;
}

async function EditUserAnswer(SubmissionId, ProblemIndex, ProblemType, Module, UserAnswer)
{
    var queryCode = `SELECT * FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    try{
        var result = await PromisedQuery(queryCode, "Error while finding submission (server error or invalid SubmissionId", "");
    }
    catch(err){
        return -1; //Error
    }
    if(result.length == 0 || parseInt(result[0].CurrentPart)){
        console.log("Error while finding submission (server error or invalid SubmissionId");
        return -1; //Error
    }
    queryCode = 'UPDATE ProblemSubmissionLink SET UserAnswer = "' + UserAnswer + `" WHERE SubmissionId = ` + SubmissionId + `, ProblemIndex = ` + ProblemIndex + `, ProblemType = ` + ProblemType + `, Module = "` + Module + `";`
    try{
        var tmp = await PromisedQuery(queryCode, "Error while editing user answer", "");
    }
    catch(err){
        return -1; //Error
    }
    return 0;
}

async function QueryProblem(ProblemId, Difficulty, ProblemType){
    //Returning the problem itself
    queryCode = `SELECT * FROM SATproblems WHERE ProblemId = ` + ProblemId + `, Difficulty = "` + Difficulty + `", ProblemType = "` + ProblemType + `";`;
    try{
        result = await PromisedQuery(queryCode, "Server error while finding problem", "");
    }
    catch(err){
        return -1; //Error
    }
    if(result.length == 0) return -1;
    return result;
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
        return -1; //Error
    }
    if(result.length == 0){
        console.log("Invalid SubmissionId or server error");
        return -1; //Error
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
        return -1; //Error
    }
    return 0;
}

async function GradeUserAnswer(SubmissionId, ProblemType, Module){
    //Haven't tested yet

    //Check if the SubmissionId is valid or not
    var queryCode = `SELECT * FROM UserSubmissions WHERE SubmissionId = "` + SubmissionId + `";`;
    try{
        let sus = await PromisedQuery(queryCode, "Error while finding submission (server error or invalid SubmissionId", "");
    }
    catch(err){
        return -1; //Error
    }
    if(result.length == 0){
        console.log("Error while finding submission (server error or invalid SubmissionId)");
        return -1; //Error
    }
    //Take all links and grade them
    var TotalPoint = 0;
    var queryCode = `SELECT * FROM ProblemSubmissionLink WHERE SubmissionId = "` + SubmissionId + `", ProblemType = "` + ProblemType + `", Module = "` + Module + `";`;
    try{
        var result = await PromisedQuery(queryCode, "Error while finding submissionLinks (server error or invalid parameters", "");
    }
    catch(err){
        return -1; //Error
    }
    for(let i = 0; i < result.length; i++){
        let CorrespondingProblem = QueryProblem(result[i].ProblemId, result[i].ProblemDifficulty, result[i].ProblemType);
        if(CorrespondingProblem == -1){
            console.log("Grading system error");
            return -1; //Error;
        }
        if(result[i].UserAnswer == CorrespondingProblem.CorrectAnswer) TotalPoint += result[i].ProblemPoint;
    }
    return TotalPoint;
}

function temporaryContainer()
{
    __init();
    const express = require(`express`);
    const app = express();
    app.use(express.json());
    const cors = require("cors")
    app.use(cors())
    const PORT = process.env.PORT || 1301; 
    app.listen(PORT, () => {
        console.log("Listening to port: " + PORT); 
    });

    app.post("/", (req, res) => res.send("üwu"))

    app.post("/AddAccountToDatabase", async (request, response) =>{
        console.log("Request received");
        console.log(request.body.username, request.body.password)
        var temp = await CreateAccount(request.body.username, request.body.password)
        console.log("A " + temp);
        const status = {
            "Status": temp
        };
        response.send(status);
    });

    app.post("/LoginPasswordVerify", async (request, response) => {
        var temp = await LoginPasswordVerify(request.body.username, request.body.password)
        // var temp = LoginPasswordVerify(request.body.username, request.body.password);
        const status = {
            "Status": temp
        };
        response.send(status);
    });

    app.post("/CreateNewSubmission", async (request, response) => {
        var temp = await CreateNewSubmission(request.body.username);
        const status = {
            "ReturnValue": temp
        }
        response.send(status);
    });

    app.post("/GenerateProblemForSubmission", async (request, response) => {
        var temp = await CreateLinkBetweenProblemAndSubmission(request.body.SubmissionId, request.body.Difficulty, request.body.ProblemType, request.body.ProblemIndex, request.body.ProblemPoint, request.body.Module);
        if(temp == -1){
            const status = {
                "Status": -1
            }
            response.send(status);
        }
        else{
            const status = {
                "Status": 0,
                "ProblemId": temp
            }
            response.send(status);
        }
    });

    app.get("/FindNewProblem", async (request, response) => {
        var temp = await TakeNewProblemForUser(request.body.Username, request.body.Difficulty, request.body.ProblemType);
        if(temp == -1){
            const status = {
                "Status ": -1
            }
            response.send(status);
        }
        else{
            const status = {
                "Status": 0,
                "ProblemId": temp
            }
            response.send(status);
        }
    });

    app.get("/GradeModule", async (request, response) => {
        var temp = await GradeUserAnswer(request.body.SubmissionId, request.body.ProblemType, request.body.Module);
        if(temp == -1){
            const status = {
                "Status ": -1
            }
            response.send(status);
        }
        else{
            const status = {
                "Status": 0,
                "Score": temp
            }
            response.send(status);
        }
    });

    app.post("/NextPart", async (request, response) =>  {
        var temp = await ChangeSubmissionPart(request.body.SubmissionId);
        const status = {
            "Status": temp
        };
        response.send(status);
    });

    app.post("/EditUserAnswer", async (request, response) => {
        var temp = await EditUserAnswer(request.body.SubmissionId, request.body.ProblemIndex, request.body.ProblemType, request.body.Module, request.body.UserAnswer);
        const status = {
            "Status": temp
        };
        response.send(status);
    });

    app.post("/ProblemInfo", async (request, response) => {
        var temp = await QueryProblem(request.body.ProblemId, request.body.Difficulty, request.body.ProblemType);
        if(temp == -1){
            const status = {
                "Status": -1
            }
            response.send(status);
        }
        else{
            const status = {
                "Status": 0,
                "ProblemId": temp.ProblemId,
                "Difficulty": temp.Difficulty,
                "ProblemType": temp.ProblemType,
                "ProblemDescription": temp.ProblemDescription,
                "ChoiceA": temp.ChoiceA,
                "ChoiceB": temp.ChoiceB,
                "ChoiceC": temp.ChoiceC,
                "ChoiceD": temp.ChoiceD,
                "CorrectAnswer": temp.CorrectAnswer
            }
            response.send(status);
        }
    });
}

async function main(){
    let tmp = await __init();
    tmp = await CreateAccount("admin", "toilamotcuccut");
    tmp = await LoginPasswordVerify("admin", "toilamemay");
    tmp = await LoginPasswordVerify("admin", "toilamotcuccut");
    tmp = await AddProblem("Easy", "Math", "What is 1+1?", "2", "4", "3", "5", "A");
    tmp = await CreateNewSubmission("admi");
    tmp = await CreateNewSubmission("admin");
    tmp = await CreateLinkBetweenProblemAndSubmission(1, "Easy", "Math", 1, 1, 1);
}

temporaryContainer();
//main();
