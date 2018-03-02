
"use strict";

import * as tl from "vsts-task-lib/task";
import * as fs from "fs";
import * as os from "os";
import * as tmp from "tmp";
import * as path from "path";
import { IExecOptions } from "vsts-task-lib/toolrunner";

function exitWithError(message, exitCode) {
  tl.error(message);
  tl.setResult(tl.TaskResult.Failed, message);
  process.exit(exitCode);
}

async function doMain() {
  try {
    tmp.setGracefulCleanup();
    let credentialProviderPath = path.join(__dirname, "CredentialProvider");
    var tmpDir = tmp.dirSync();
    var cwd = process.cwd();

    var isDebug = process.env.DEBUG == "true";
    var requireWhenRelease = true;
    if (isDebug) {
      requireWhenRelease = false;
    }

    var orig = process.env["NUGET_CREDENTIALPROVIDERS_PATH"];
    var newCredPath = credentialProviderPath
    if (orig){
      newCredPath = newCredPath + ";" + orig;
    }

    tl.setVariable("NUGET_CREDENTIALPROVIDERS_PATH", newCredPath);
    let auth = tl.getEndpointAuthorization("SYSTEMVSSCONNECTION", false);
    if (auth.scheme === "OAuth") {
      tl.setVariable("PAKET_VSS_NUGET_ACCESSTOKEN", auth.parameters["AccessToken"]);
    } else {
      tl.warning("Could not determine credentials to use for NuGet");
    }

  } catch (e) {
    exitWithError(e.message, 1);
  }
}

doMain()