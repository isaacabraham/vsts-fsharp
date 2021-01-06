
"use strict";

import * as tl from "azure-pipelines-task-lib";
import * as tmp from 'tmp';
import * as path from "path";
import * as fs from 'fs';

export async function setup() {
    tmp.setGracefulCleanup();
    let credentialProviderPath = path.join(__dirname, "CredentialProvider");

    if (!fs.existsSync(`${credentialProviderPath}/CredentialProvider.PaketTeamBuild.dll`)) {
      tl.warning(`'${credentialProviderPath}/CredentialProvider.PaketTeamBuild.dll' doesnt exist!`);
      tl.debug("Skipping 'NUGET_CREDENTIALPROVIDERS_PATH'.");
      return;
    } else {
      tl.debug(`Adding '${credentialProviderPath}' to 'NUGET_CREDENTIALPROVIDERS_PATH'`);
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