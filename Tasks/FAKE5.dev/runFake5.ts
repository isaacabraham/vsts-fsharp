
"use strict";

import * as tl from 'azure-pipelines-task-lib/task';
import * as trm from 'azure-pipelines-task-lib/toolrunner';
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

const mkdirSync = function (dirPath) {
  try {
    fs.mkdirSync(dirPath)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

async function doMain() {
  try {
    console.log(`setup paket credential manager`);
    await common.setupPaketCredentialManager();

    let scriptPath = tl.getPathInput("FakeScript", true);
    tl.debug(`Using scriptPath '${scriptPath}'.`);
    let scriptDir = path.dirname(scriptPath);
    let scriptName = path.basename(scriptPath);
    let workingDir = tl.getPathInput("WorkingDirectory");
    if (isNullOrUndefined(workingDir) || workingDir == "") {
      tl.debug(`Using scriptdir '${scriptDir}' as working directory as workingDir was empty.`);
      workingDir = scriptDir;
    }

    let scriptArgs = tl.getInput("ScriptArguments");
    if (isNullOrUndefined(scriptArgs)) {
      scriptArgs = "";
    }

    let fakeArgs = tl.getInput("FakeArguments");
    if (!fakeArgs) {
      if (scriptDir == workingDir) {
        fakeArgs = `run "${scriptName}" ${scriptArgs}`;
      } else {
        fakeArgs = `run "${scriptPath}" ${scriptArgs}`;
      }
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
    let result = await common.downloadFakeAndReturnInvocation(fakeVersion, fakeArgs);
    if (!result) {
      exitWithError("Could not download fake", 1);
      return;
    }

    let [ executable, args ] = result;

    // get json list of variables.
    let fakeBaseDir = path.join(scriptDir, ".fake");
    let fakeScriptDir = path.join(fakeBaseDir, scriptName);
    mkdirSync(fakeBaseDir);
    mkdirSync(fakeScriptDir);
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