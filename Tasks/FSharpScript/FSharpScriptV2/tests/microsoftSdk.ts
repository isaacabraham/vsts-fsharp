import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'runFSharpScript.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('FsiPathSelection', 'MicrosoftSDK');
tmr.setInput('FsharpVersion', '4.1');
tmr.setInput('ScriptFile', '/mock/test.fsx');
tmr.setInput('ScriptArguments', '-t test');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath":{
        'C:\\Program Files (x86)\\Microsoft SDKs\\F#\\4.1\\Framework\\v4.0\\fsi.exe': true,
        '/mock/test.fsx': true
    },
    'exist': {
        'C:\\Program Files (x86)\\Microsoft SDKs\\F#\\4.1\\Framework\\v4.0\\fsi.exe': true,
    },
    "exec": {
        'C:\\Program Files (x86)\\Microsoft SDKs\\F#\\4.1\\Framework\\v4.0\\fsi.exe /mock/test.fsx -t test': {
            "code": 0,
            "stdout": "executed fsharp script",
            "stderr": ""
        }
    }
};

tmr.registerMock("azure-pipelines-task-lib/toolrunner", require("azure-pipelines-task-lib/mock-toolrunner"));

tmr.setAnswers(a);
tmr.run();
