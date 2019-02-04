import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let taskPath = path.join(__dirname, '..', 'runFSharpScript.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('FsiPathSelection', 'VisualStudio');
tmr.setInput('ScriptFile', '/mock/test.fsx');
tmr.setInput('ScriptArguments', '-t test');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers>{
    "checkPath":{
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\CommonExtensions\\Microsoft\\FSharp\\fsi.exe': true,
        '/mock/test.fsx': true
    },
    'exist': {
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\CommonExtensions\\Microsoft\\FSharp\\fsi.exe': true
    },
    "exec": {
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\CommonExtensions\\Microsoft\\FSharp\\fsi.exe /mock/test.fsx -t test': {
            "code": 0,
            "stdout": "executed fsharp script",
            "stderr": ""
        }
    }
};

tmr.registerMock("azure-pipelines-task-lib/toolrunner", require("azure-pipelines-task-lib/mock-toolrunner"));

tmr.setAnswers(a);
tmr.run();
