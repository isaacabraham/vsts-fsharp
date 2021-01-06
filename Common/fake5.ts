
import * as path from "path";
import * as tl from "azure-pipelines-task-lib";
import * as semver from "semver";
import * as rm from 'typed-rest-client';
import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as ghTyped from "./githubTyped";
import * as vault from "./myvault";

interface Variables {
    keyFile : string;
    iv : string;
    values : tl.VariableInfo[];
  }

export function createFakeVariablesJson(secretFile : string, filterSecrets : boolean) {
    let v = new vault.Vault(secretFile);
    let variables : tl.VariableInfo[] =
      tl.getVariables()
      .map((entry, _) => {
        if (entry.secret) {
          let encrypted = v.encryptSecret(entry.value);
          return <tl.VariableInfo>{ secret: true, value: encrypted, name: entry.name };
        } else {
          return <tl.VariableInfo>{ secret: false, value: entry.value, name: entry.name }
        }
      })
      .filter((entry, _) =>{
        if (filterSecrets && entry.secret) {
          return false;
        } else {
          return true;
        }
      });
    let json = JSON.stringify(<Variables>{
      keyFile: secretFile,
      iv: v.retrieveIVBase64(),
      values: variables });
    return json;
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

export async function downloadAndReturnInvocation(fakeVersion:semver.SemVer, fakeArgs : string) {
  let dotnetExecutable = tl.which("dotnet");
  if (!dotnetExecutable) {
    // In the future we could download the not-portable version here...
    tl.error("Require a `dotnet` executable in PATH for this task, consider using the 'DotNetCoreInstaller' task before this one.");
    return null;
  }

  let toolPath = toolLib.findLocalTool(toolCacheName, fakeVersion.raw);
  if (!toolPath){
    toolPath = await downloadPortableFake(fakeVersion);
    if(!toolPath) {
      tl.error(`Version '${fakeVersion.raw}' was not found in the official releases.`);
      return null;
    }
  }

  let fakeDll = path.join(toolPath, "fake.dll");
  if (fakeArgs === null || fakeArgs === undefined || fakeArgs === "") {
    return [ dotnetExecutable, fakeDll ]
  } else {
    return [ dotnetExecutable, `${fakeDll} ${fakeArgs}`]
  }
}