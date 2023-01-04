const mysql = require("mysql");
const fs = require("fs");
const connection = mysql.createConnection({
		  host : "localhost",
		  user : "root",
		  password : "vkvkdltm",
		  database : "JONG",
});

async function test(){

    let calledNumberText = fs.readFileSync("./calledNumber", "utf8");

    let calledNumberList = calledNumberText.split('\n');

    let calledNumbersql = "INSERT INTO CALLEDLIST (calledNumber) VALUES ";

    for(let i = 0 ; i < calledNumberList.length - 2; i++){
	    calledNumbersql = calledNumbersql + `('${calledNumberList[i]}'),`
    }
    calledNumbersql = calledNumbersql + `('${calledNumberList[calledNumberList.length - 2]}')`

    connection.connect();
    connection.query(calledNumbersql, function(error, results, fields){
	    if(error){
	       	console.log("error : " + error)
	    }
})

connection.end()






}




