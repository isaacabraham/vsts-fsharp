
"use strict";

import * as tl from "vsts-task-lib/task";
import * as toolLib from 'vsts-task-tool-lib/tool';
import * as trm from 'vsts-task-lib/toolrunner';
import * as fs from "fs";
import * as os from "os";
import * as tmp from "tmp";
import * as path from "path";
import * as common from "vsts-fsharp-task-common";
import * as vault from "./myvault";
import * as semver from "semver";
import * as rm from 'typed-rest-client';
import { isNullOrUndefined } from "util";
import * as ghTyped from "./githubTyped";

function exitWithError(message, exitCode) {
  tl.error(message);
  tl.setResult(tl.TaskResult.Failed, message);
  process.exit(exitCode);
}

let toolCacheName = "fake";


async function retrieveVersionEntry(targetVersion : semver.SemVer){
  let rest = new rm.RestClient('fake-vsts-task', 'https://api.github.com/');
  async function getPage(pageNum:number){
    let result = await rest.get<ghTyped.RootObject[]>(`repos/fsharp/fake/releases?page=${pageNum}`);
    if (result.statusCode != 200) {
      tl.warning(`retrieved status code '${result.statusCode}' from page '${pageNum}'`)
    } else {
      tl.debug(`retrieved status code '${result.statusCode}' from page '${pageNum}'`);
    }
    return result;
  }

  let pageNr = 1;
  let currentPage = await getPage(pageNr);
  while (currentPage.statusCode == 200 && currentPage.result.length > 0) {
    let result = currentPage.result.find((val) => {
      let version = semver.parse(val.name);
      if (!version){
        version = semver.parse(val.tag_name);
      }

      return targetVersion.compare(version) == 0;
    });

    if (result) {
      return result;
    } else {
      pageNr = pageNr + 1;
      currentPage = await getPage(pageNr);
    }
  }

  return null;
}

async function downloadPortableFake(targetVersion : semver.SemVer) {
  let release = await retrieveVersionEntry(targetVersion);
  if (!release) {
    return null;
  }

  let portableAsset = release.assets.find(asset => asset.name == "fake-dotnetcore-portable.zip");
  let downloadPath = await toolLib.downloadTool(portableAsset.browser_download_url);
  let extPath = await toolLib.extractZip(downloadPath);
  return await toolLib.cacheDir(extPath, toolCacheName, targetVersion.raw);
}

interface Variables {
  keyFile : string;
  iv : string;
  values : tl.VariableInfo[];
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
    let dotnetExecutable = tl.which("dotnet");
    if (!dotnetExecutable) {
      exitWithError("Require a `dotnet` executable in PATH for this task, consider using the 'DotNetCoreInstaller' task before this one.", 1);
      return;
    }
    
    let toolPath = toolLib.findLocalTool(toolCacheName, fakeVersion.raw);
    if (!toolPath){
      toolPath = await downloadPortableFake(fakeVersion);
      if(!toolPath){
        exitWithError(`Version '${fakeVersionRaw}' was not found in the official releases.`, 1);
        return;
      }
    }
    let fakeDll = path.join(toolPath, "fake.dll");

    // get json list of variables.
    let fakeBaseDir = path.join(scriptDir, ".fake");
    let fakeScriptDir = path.join(fakeBaseDir, scriptName);
    fs.mkdirSync(fakeBaseDir);
    fs.mkdirSync(fakeScriptDir);
    let secretFile = path.join(fakeScriptDir, ".secret");
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
    let json = JSON.stringify(<Variables>{ 
      keyFile: secretFile,
      iv: v.retrieveIVBase64(),
      values: variables });
    tl.debug("FAKE_VSTS_VAULT_VARIABLES: " + json);
    process.env["FAKE_VSTS_VAULT_VARIABLES"] = json;
    
    // run `dotnet fake.dll` with the specified arguments
    let args = `${fakeDll} ${fakeArgs}`;
    await tl.exec(dotnetExecutable, args, <trm.IExecOptions>{
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