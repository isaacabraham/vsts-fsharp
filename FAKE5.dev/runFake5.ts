
"use strict";

import * as tl from "vsts-task-lib/task";
import * as trm from 'vsts-task-lib/toolrunner';
import * as path from "path";
import * as fs from "fs";
import * as common from "vsts-fsharp-task-common";
import * as semver from "semver";
import { isNullOrUndefined } from "util";

function exitWithError(message, exitCode) {
  tl.error(message);
  tl.setResult(tl.TaskResult.Failed, message);
  process.exit(exitCode);
}

async function doMain() {
  try {
    console.log(`setup paket credential manager`);
    await common.setupPaketCredentialManager();

    let scriptPath = tl.getPathInput("FakeScript", true);
    let scriptDir = path.dirname(scriptPath);
    let scriptName = path.basename(scriptPath);
    let workingDir = tl.getPathInput("WorkingDirectory");
    if (isNullOrUndefined(workingDir) || workingDir == "") {
      workingDir = scriptDir;
    }

    let scriptArgs = tl.getInput("ScriptArguments");
    if (isNullOrUndefined(scriptArgs)) {
      scriptArgs = "";
    }

    let fakeArgs = tl.getInput("FakeArguments");
    if (!fakeArgs){
      fakeArgs = `run "${scriptName}" ${scriptArgs}`;
    }
    let fakeVersionRaw = tl.getInput("FakeVersion");
    let fakeVersion = semver.parse(fakeVersionRaw);
    if(!fakeVersion) {
      exitWithError(`Version '${fakeVersionRaw}' is not a valid version.`, 1);
      return;
    }

    let preventSecrets = tl.getBoolInput("PreventSecrets");
    let failOnStdError = tl.getBoolInput("FailOnStdError");
    
    // Download and cache fake as tool
    let executable, args = common.downloadFakeAndReturnInvocation(fakeVersion, fakeArgs);

    // get json list of variables.
    let fakeBaseDir = path.join(scriptDir, ".fake");
    let fakeScriptDir = path.join(fakeBaseDir, scriptName);
    fs.mkdirSync(fakeBaseDir);
    fs.mkdirSync(fakeScriptDir);
    let secretFile = path.join(fakeScriptDir, ".secret");
    let json = common.createFakeVariablesJson(secretFile, preventSecrets);
    tl.debug("FAKE_VSTS_VAULT_VARIABLES: " + json);
    process.env["FAKE_VSTS_VAULT_VARIABLES"] = json;
    
    // run `dotnet fake.dll` with the specified arguments
    await tl.exec(executable, args, <trm.IExecOptions>{
      failOnStdErr: failOnStdError,
      cwd: workingDir
    });

    console.log(`cleanup paket credential manager`);
    await common.cleanupPaketCredentialManager();
  } catch (e) {
    exitWithError(e.message, 1);
  }
}

doMain()