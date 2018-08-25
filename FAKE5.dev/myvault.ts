
// This is a defensive copy from https://raw.githubusercontent.com/Microsoft/vsts-task-lib/91e03a14f1188edc658954320f9d75565b2d1da5/node/vault.ts
// To save ourself from breaking changes...
// Add some members for retrieving the decrypted value and use IV.

import Q = require('q');
import fs = require('fs');
import path = require('path');
import crypto = require('crypto');

var algorithm = "aes-256-ctr";

//
// Store sensitive data in proc.
// Main goal: Protects tasks which would dump envvars from leaking secrets inadvertently
//            the task lib clears after storing.
// Also protects against a dump of a process getting the secrets
// The secret is generated and stored externally for the lifetime of the task.
//
export class Vault {
    constructor(keyFile: string) {
        this._keyFile = keyFile;
        this.genKey();
        this._iv = crypto.randomBytes(16);
    }

    private _keyFile: string;
    private _iv: Buffer;

    public initialize(): void {

    }

    public encryptSecret(data: string) : string {
        var key = this.getKey();
        var cipher = crypto.createCipheriv(algorithm, key, this._iv);
        var crypted = cipher.update(data,'utf8','base64')
        crypted += cipher.final('base64');
        return crypted;
    }

    public retrieveIVBase64(): string {
        return this._iv.toString('base64');
    }

    private getKey() {
        let readData = fs.readFileSync(this._keyFile, 'utf8');
        return Buffer.from(readData, 'base64');
    }

    private genKey(): void {
        let base64String = crypto.randomBytes(32).toString('base64');
        fs.writeFileSync(this._keyFile, base64String, 'utf8');
    } 
}