"use strict";

import * as tl from "azure-pipelines-task-lib/task";
import * as fs from "fs";
import * as os from "os";
import * as tmp from "tmp";
import * as path from "path";
import * as common from "vsts-fsharp-task-common";
import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";

function exitWithError(message, exitCode) {
  tl.error(message);
  tl.setResult(tl.TaskResult.Failed, message);
  process.exit(exitCode);
}

async function doMain() {
  try {
    common.setupPaketCredentialManager();

    //fs.exists()

    common.cleanupPaketCredentialManager();
  } catch (e) {
    exitWithError(e.message, 1);
  }
}

doMain()