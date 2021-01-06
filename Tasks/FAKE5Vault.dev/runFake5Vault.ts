
"use strict";

import * as tl from 'azure-pipelines-task-lib/task';
import * as common from "vsts-fsharp-task-common";

function exitWithError(message, exitCode) {
  tl.error(message);
  tl.setResult(tl.TaskResult.Failed, message);
  process.exit(exitCode);
}

async function doMain() {
  try {
    let secretFilePath = tl.getPathInput("SecretFile", true);
    let preventSecrets = !tl.getBoolInput("IncludeSecrets");
    let varName = tl.getInput("VariableName");
    let json = common.createFakeVariablesJson(secretFilePath, preventSecrets);
    tl.setVariable(varName, json);
  } catch (e) {
    exitWithError(e.message, 1);
  }
}

doMain()