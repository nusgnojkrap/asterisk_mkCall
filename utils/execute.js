const childProcess = require("child_process");

function execute(command) {
    return new Promise(function (resolve, reject) {
        childProcess.exec(command, function (error, standardOutput, standardError) {
            if (error) {
                reject();
                return;
            }

            if (standardError) {
                reject(standardError);
                return;
            }

            resolve(standardOutput);
        });
    });
}

module.exports = execute;
