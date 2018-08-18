
"use strict";

import * as credMgr from "./paketCredMgr";

export async function setupPaketCredentialManager() {
    await credMgr.setup();
}

export async function cleanupPaketCredentialManager() {
    await credMgr.cleanup();
}