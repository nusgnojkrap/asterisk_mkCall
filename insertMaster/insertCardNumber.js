const mysql = require("mysql");
const fs = require("fs");
const connection = mysql.createConnection({
		  host : "localhost",
		  user : "root",
		  password : "vkvkdltm",
		  database : "JONG",
});


let cardNumberText = fs.readFileSync("./cardNumber", "utf8");

let cardNumberList = cardNumberText.split('\n');

let cardNumbersql = "INSERT INTO CARDLIST (cardNumber) VALUES ";

for(let i = 0 ; i < cardNumberList.length - 2; i++){
	cardNumbersql = cardNumbersql + `('${cardNumberList[i]}'),`
}
cardNumbersql = cardNumbersql + `('${cardNumberList[cardNumberList.length - 2]}')`

connection.connect();
connection.query(cardNumbersql, function(error, results, fields){
	if(error){
		console.log("error : " + error)
	}
})

connection.end()
