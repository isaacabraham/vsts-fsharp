
"use strict";

import * as tl from "vsts-task-lib/task";
import * as fs from "fs";
import * as os from "os";
import * as tmp from "tmp";
import * as path from "path";
import * as common from "vsts-fsharp-task-common";
import * as vault from "./myvault"
import { IExecOptions } from "vsts-task-lib/toolrunner";

function exitWithError(message, exitCode) {
  tl.error(message);
  tl.setResult(tl.TaskResult.Failed, message);
  process.exit(exitCode);
}

interface Variables {
  keyFile : string;
  values : tl.VariableInfo[];
}

async function doMain() {
  try {
    await common.setupPaketCredentialManager();

    let scriptPath = tl.getPathInput("FakeScript", true);
    let workingDir = tl.getPathInput("WorkingDirectory");
    let scriptArgs = tl.getInput("ScriptArguments");
    let fakeArgs = tl.getInput("FakeArguments");
    let fakeVersion = tl.getInput("FakeVersion");
    let preventSecrets = tl.getBoolInput("PreventSecrets");

    // get json list of variables.
    let secretFile = path.join(scriptPath, ".fake", ".secret");
    let v = new vault.Vault(secretFile);
    let variables : tl.VariableInfo[] =
      tl.getVariables()
      .map((entry, _) => {
        if (entry.secret) {
          let encrypted = v.encryptSecret(entry.value);
          return <tl.VariableInfo>{ secret: true, value: encrypted, name: entry.name };
        }else {
          return <tl.VariableInfo>{ secret: false, value: entry.value, name: entry.name }
        }
      })
      .filter((entry, _) =>{
        if (preventSecrets && entry.secret) {
          return false;
        } else {
          return true;
        }
      });
    let json = JSON.stringify(<Variables>{ keyFile: secretFile, values: variables });
    tl.warning("json: " + json);
    
    
    

    await common.cleanupPaketCredentialManager();
  } catch (e) {
    exitWithError(e.message, 1);
  }
}

doMain()