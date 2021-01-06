# FAKE 5 Tasks for Azure DevOps

## Introduction

This extension contains build tasks for use within Azure DevOps that are particularly
useful for build and release automation.

Contributors: @isaacabraham, @matthid.

## Note

It is not recommended to install the extension [Fake Tasks for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fake-build) in combination with [F# Helpers for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fsharp-helpers-extension) as it is a subset of the later. Please see the note regarding the incompatibilty in the [F# Helpers for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fsharp-helpers-extension) page.

## Tasks

### FAKE 5 Runner

Use the **FAKE 5 Runner** task to execute any FAKE 5 script in the repository. This task downloads
and caches the given FAKE 5 version. In addition to the path of the FAKE script, you can supply
an optional target as well as any other arbitrary arguments that are required.

### FAKE 5 Vault

Use the **FAKE 5 Vault** task to create a fake 5 vault. This task is useful if you want to use secret variables and run your own fake 5 bootstrapping method (ie not the `FAKE 5 Runner` Task). See [the official FAKE documentation](https://fake.build/apidocs/v5/fake-buildserver-teamfoundation.html)
