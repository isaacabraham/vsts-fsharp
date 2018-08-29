
"use strict";

import * as semver from "semver";
import * as credMgr from "./paketCredMgr";
import * as vault from "./myvault";
import * as fake5 from "./fake5";

export async function setupPaketCredentialManager() {
    await credMgr.setup();
}

export async function cleanupPaketCredentialManager() {
    await credMgr.cleanup();
}

export type Vault = vault.Vault

export function createFakeVariablesJson(secretPath : string, filterSecrets : boolean) {
    return fake5.createFakeVariablesJson(secretPath, filterSecrets);
}

export function downloadFakeAndReturnInvocation(fakeVersion:semver.SemVer, fakeArgs : string) {
    return fake5.downloadAndReturnInvocation(fakeVersion, fakeArgs);
}