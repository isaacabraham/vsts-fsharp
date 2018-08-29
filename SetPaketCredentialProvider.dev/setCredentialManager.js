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
const common = require("vsts-fsharp-task-common");
function exitWithError(message, exitCode) {
    tl.error(message);
    tl.setResult(tl.TaskResult.Failed, message);
    process.exit(exitCode);
}
function doMain() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield common.setupPaketCredentialManager();
        }
        catch (e) {
            exitWithError(e.message, 1);
        }
    });
}
doMain();
