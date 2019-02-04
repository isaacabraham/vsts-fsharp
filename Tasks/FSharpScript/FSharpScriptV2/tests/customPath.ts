import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'runFSharpScript.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('FsiPathSelection', 'Custom');
tmr.setInput('ScriptFile', '/mock/test.fsx');
tmr.setInput('CustomPath', '/mock/path/fsi.exe');
tmr.setInput('ScriptArguments', '-t test');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath":{
        '/mock/path/fsi.exe': true,
        '/mock/test.fsx': true
    },
    'exist': {
        '/mock/path/fsi.exe': true
    },
    "exec": {
        '/mock/path/fsi.exe /mock/test.fsx -t test': {
            "code": 0,
            "stdout": "executed fsharp script",
            "stderr": ""
        }
    }
};

tmr.registerMock("azure-pipelines-task-lib/toolrunner", require("azure-pipelines-task-lib/mock-toolrunner"));

tmr.setAnswers(a);
tmr.run();
