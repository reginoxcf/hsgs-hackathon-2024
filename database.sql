drop database SATserver;
CREATE DATABASE SATserver;
USE SATserver;
CREATE TABLE GlobalInformation(
	EasyEnglishProblemsCount    INT     NOT NULL,
    MediumEnglishProblemsCount  INT     NOT NULL,
    HardEnglishProblemsCount    INT     NOT NULL,
	EasyMathProblemsCount       INT     NOT NULL,
    MediumMathProblemsCount     INT     NOT NULL,
    HardMathProblemsCount       INT     NOT NULL
);
CREATE TABLE AccountInformation(
	Username                   VARCHAR(20)   NOT NULL,
    Registered_date            DATETIME      NOT NULL,
    User_password              VARCHAR(50)   NOT NULL,
    EasyEnglishProblemsCount   INT           NOT NULL,
    MediumEnglishProblemsCount INT           NOT NULL,
	HardEnglishProblemsCount   INT           NOT NULL,
    EasyMathProblemsCount      INT           NOT NULL,
    MediumMathProblemsCount    INT           NOT NULL,
    HardMathProblemsCount      INT           NOT NULL,
    PRIMARY KEY (username)
);
CREATE TABLE UserSubmissions( 
	/*A submission correspond to a user. A user could have multiple submissions*/
	SubmissionId               BIGINT                             NOT NULL   PRIMARY KEY  AUTO_INCREMENT,
    StudentUsername            VARCHAR(50)                        NOT NULL,
    StartedTime                DATETIME                           NOT NULL,
    CurrentPart                ENUM('1', '2', '3', '4', '5', '6') NOT NULL, 
    /*Part 1: English module 1
    Part 2: English module 2
    Part 3: Breaktime
    Part 4: Math module 1
    Part 5: Math module 2
    Part 6: Ended test*/
    PartBeginTime              DATETIME                           NOT NULL,
    Score                      INT                                        ,
    FOREIGN KEY (StudentUsername)
		REFERENCES AccountInformation(username)
        ON DELETE CASCADE
);
CREATE TABLE SATproblems(
	/*Each SAT problem will be fetched to this table*/
    /*This database is not designed to be able to delete a problem from this table*/
	ProblemId          BIGINT                          NOT NULL,
    Difficulty         ENUM('Easy', 'Medium', 'Hard')  NOT NULL,
    ProblemType        ENUM('English', 'Math')         NOT NULL,
    ProblemDescription MEDIUMTEXT                      NOT NULL,
    ChoiceA            TEXT                            NOT NULL,
    ChoiceB            TEXT                            NOT NULL,
    ChoiceC            TEXT                            NOT NULL,
    ChoiceD            TEXT                            NOT NULL,
    CorrectAnswer      ENUM('A', 'B', 'C', 'D')        NOT NULL,
    PRIMARY KEY (ProblemId, Difficulty, ProblemType)
);
CREATE TABLE ProblemSubmissionLink(
	SubmissionId       BIGINT                          NOT NULL,
	ProblemId          BIGINT                          NOT NULL,
    ProblemIndex       INT                             NOT NULL,
    /*ProblemIndex: the index of that problem in a module*/
    ProblemPoint       INT                             NOT NULL,
    ProblemType        ENUM('English', 'Math')         NOT NULL,
    ProblemDifficulty  ENUM('Easy', 'Medium', 'Hard')  NOT NULL,
    Module             ENUM('1', '2')                  NOT NULL,
    UserAnswer         ENUM('A', 'B', 'C', 'D'), 
    PRIMARY KEY (SubmissionId, ProblemIndex, ProblemType, Module), 
    FOREIGN KEY (SubmissionId)
		REFERENCES UserSubmissions(SubmissionId)
        ON DELETE CASCADE
);
