
"use strict";

import * as tl from "azure-pipelines-task-lib/task";
import * as tr from "azure-pipelines-task-lib/toolrunner";
import path = require('path');
import { isNullOrUndefined } from "util";

function exitWithError(message, exitCode) {
  tl.error(message);
  process.exit(exitCode);
}

async function doMain() {
  try {

    let FSIPathSelection: string = tl.getInput("FsiPathSelection", true);
    let scriptFile: string = tl.getPathInput("ScriptFile", true, true);
    let scriptArgs = tl.getInput("ScriptArguments");

    // get fsi.exe path from path selection
    var fsiPath = "";
    switch (FSIPathSelection) {
      case "Custom": {
        fsiPath = tl.getPathInput("CustomPath", true, false);
        break;
      }
      case "VisualStudio": {
        fsiPath = "C:\\Program Files (x86)\\Microsoft Visual Studio\\2017\\Enterprise\\Common7\\IDE\\CommonExtensions\\Microsoft\\FSharp\\fsi.exe"
        break;
      }
      case "MicrosoftSDK": {
        let FSharpVersion = tl.getInput("FSharpVersion", true);
        fsiPath = "C:\\Program Files (x86)\\Microsoft SDKs\\F#\\" + FSharpVersion + "\\Framework\\v4.0\\fsi.exe"
        break;
      }
      default: {
        console.log("fsi.exe path selection not given. Resolving to fsi.exe in PATH");
        fsiPath = tl.which("fsi.exe",)
      }
    }

    // checks if the fsi.exe path exist. Otherwise try to resolve through PATH variables
    if (!tl.exist(fsiPath)) {
      console.log("Could not find fsi.exe. Attempting to resolve fsi.exe in PATH");
      fsiPath = tl.which("fsi.exe");
    }

    // Check a final time if fsi.exe path exists. Otherwise fails
    if (!tl.exist(fsiPath)) {
      exitWithError(`Unable to resolve any fsi.exe paths`, 1);
      return;
    }

    tl.debug(`Using fsi.exe path '${fsiPath}'`);
    tl.debug(`Using scriptPath '${scriptFile}'`);
    var atool: tr.ToolRunner = tl.tool(fsiPath).arg(scriptFile);

    if (!isNullOrUndefined(scriptArgs)) {
      tl.debug(`Using arguments '${scriptArgs}'`);
      atool = atool.line(scriptArgs);
    }

    var code: number = await atool.exec();
  } catch (err) {
    exitWithError(err.message, 1);
  }
}

doMain();