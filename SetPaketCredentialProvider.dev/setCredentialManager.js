"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tl = require("vsts-task-lib/task");
const tmp = require("tmp");
const path = require("path");
function exitWithError(message, exitCode) {
    tl.error(message);
    tl.setResult(tl.TaskResult.Failed, message);
    process.exit(exitCode);
}
function doMain() {
    return __awaiter(this, void 0, void 0, function* () {
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
            var newCredPath = credentialProviderPath;
            if (orig) {
                newCredPath = newCredPath + ";" + orig;
            }
            tl.setVariable("NUGET_CREDENTIALPROVIDERS_PATH", newCredPath);
            let auth = tl.getEndpointAuthorization("SYSTEMVSSCONNECTION", false);
            if (auth.scheme === "OAuth") {
                tl.setVariable("PAKET_VSS_NUGET_ACCESSTOKEN", auth.parameters["AccessToken"]);
            }
            else {
                tl.warning("Could not determine credentials to use for NuGet");
            }
        }
        catch (e) {
            exitWithError(e.message, 1);
        }
    });
}
doMain();
