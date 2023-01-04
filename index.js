const mysql = require("mysql");
const fs = require("fs");
const asteriskOutgoingPath = "/var/spool/asterisk/outgoing/";
const execute = require("./utils/execute");

let calledMaxCount = 0;
let matchingCount = 0;
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "vkvkdltm",
    database: "JONG",
});

connection.connect();

async function main() {
    calledMaxCount = await query("select count(*) as count from CALLEDLIST", "count");
    console.log("max count = " + calledMaxCount);

    // 완벽한 calledNumber List (add)
    let calledNumberListComplete = await query("select * from CALLEDLIST", "calledNumber", "array");
    console.log("max calledNumber = " + calledNumberListComplete);

    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////

    let checkMatching = setInterval(async () => {
        let outgoingList = await execute(`ls ${asteriskOutgoingPath}`);
        outgoingList = outgoingList.split("\n").reduce((prev, current) => {
            if (current != "") {
                current = current.split(".")[0];
                prev.push(current);
            }
            return prev;
        }, []);

        let calledNumberListCurrent = await query("select * from CALLEDLIST", "calledNumber", "array");
        let calledNumberListEveryThings = [...outgoingList, ...calledNumberListCurrent];

        // outgoing + nowcalledMaxCount와  calledMaxCount 가 다르면 사라진 calledNumber 찾아야 함
        if (Number(calledMaxCount) != outgoingList.length + calledNumberListCurrent.length) {
            //사라진 calledNumber 찾기
            let hiddenCalledNumberList = calledNumberListComplete.filter((val) => {
                if (
                    calledNumberListEveryThings.some((val2) => {
                        return val2 == val;
                    })
                ) {
                    // 같은 값이니 아무것도 안하고
                } else {
                    return val;
                }
            });

            // 사라진 calledNumber 로 카드넘버 찾아서 DB 저장
            hiddenCalledNumberList.map(async (_hiddenNumber) => {
                let _cardNumber = await query(`select cardNumber from MATCHING where calledNumber = '${_hiddenNumber}' ORDER BY id DESC LIMIT 1`, "cardNumber");

                // 카드넘버 DB 저장
                await query(`insert into CARDLIST(cardNumber) values ('${_cardNumber}')`);

                // CalledNumber DB 저장
                await query(`insert into CALLEDLIST(calledNumber) values ('${_hiddenNumber}')`);
                console.log(`cardNumber : ${_cardNumber}, calledNumber : ${_hiddenNumber} 를 insert 하였습니다.`);
            });

            console.log(++matchingCount);
        }
    }, 5000);

    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////

    let readCalledFile = setInterval(async () => {
        let calledNumber = await query("select * from CALLEDLIST LIMIT 1", "calledNumber");
        let cardNumber = await query("select * from CARDLIST LIMIT 1", "cardNumber");
        let currentCount = await query("select count(*) as count from CALLEDLIST", "count");

        // 카드넘버가 존재하지 않으면, 현재 카운트랑 저장된 카운트랑 같으면 프로세스를 종료합니다.
        if ((cardNumber == "" || cardNumber == undefined) && currentCount == calledMaxCount) {
            clearInterval(readCalledFile);
            clearInterval(checkMatching);
            process.exit(0);
        }

        // 카드넘버와 수신번호가 존재하면 파일을 생성하고 두개의 파일을 다시 씁니다.
        if (calledNumber != "" && cardNumber != "" && calledNumber != undefined && cardNumber != undefined && calledNumber != null && cardNumber != null) {
            let channel = `Channel: sip/junsst/08315` + "\n";
            let CallerID = `CallerID: 0312700370` + "\n";
            let MaxRetries = `MaxRetries: 1` + "\n";
            let WaitTime = `WaitTime: 35` + "\n";
            let Context = `Context: from-internal` + "\n";
            let Extension = "Extension:" + cardNumber.trim() + calledNumber.trim() + "\n";
            let Prioirity = `Priority: 1`;
            let callFileText = channel + CallerID + MaxRetries + WaitTime + Context + Extension + Prioirity;
            console.log("----------------------------------------------------");
            console.log(callFileText);
            console.log("----------------------------------------------------");

            fs.writeFileSync(asteriskOutgoingPath + calledNumber + ".txt", callFileText, { encoding: "utf8" });

            await query(`DELETE FROM CALLEDLIST WHERE calledNumber='${calledNumber}'`);
            await query(`DELETE FROM CARDLIST WHERE cardNumber='${cardNumber}'`);
            await query(`insert into MATCHING (calledNumber, cardNumber) VALUES ('${calledNumber}', '${cardNumber}')`);
        }
    }, 2000);
}

function query(str, column, type) {
    return new Promise((resolve, reject) => {
        connection.query(str, function (err, result) {
            if (err) {
                reject(err);
            } else {
                if (column) {
                    if (type == "array") {
                        let arr = result.reduce((prev, current) => {
                            prev.push(current[column]);
                            return prev;
                        }, []);

                        return resolve(arr);
                    } else if (result[0] == undefined || result[0] == null) {
                        return resolve("");
                    } else {
                        return resolve(result[0][column]);
                    }
                } else {
                    return resolve();
                }
            }
        });
    });
}

main();

