
"use strict";

import * as tl from "vsts-task-lib";
import * as tmp from "tmp";
import * as path from "path";

export async function setup() {
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
    if (orig) {
      newCredPath = newCredPath + ";" + orig;
    }

    tl.setVariable("NUGET_CREDENTIALPROVIDERS_PATH", newCredPath);
    let auth = tl.getEndpointAuthorization("SYSTEMVSSCONNECTION", false);
    if (auth.scheme === "OAuth") {
      tl.setVariable("PAKET_VSS_NUGET_ACCESSTOKEN", auth.parameters["AccessToken"]);
    } else {
      tl.warning("Could not determine credentials to use for NuGet");
    }
}

export async function cleanup() {
    tl.setVariable("PAKET_VSS_NUGET_ACCESSTOKEN", "");
}