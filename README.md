# F\# Helpers for Azure DevOps

## Introduction

This extension contains build tasks for use within Azure Devops that are particularly
useful within the F# world. At the current time, the extension contains the following tasks.

Contributors: @isaacabraham, @matthid.

## Note

There are some smaller extensions you can install instead of this one:

- [FAKE Tasks for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fake-build)
- [Paket Tasks for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.paket)

it is not recommeded to install these together with the [F# Helpers for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fsharp-helpers-extension) extension (ie they should not be installed at the same time). You can either install the "F# Helpers for Azure DevOps" extension for an all-in-one solution or any combination of the smaller ones. You can switch back and forth between the all-in-one and subset-packages any time by uninstalling the extensions. Your existing build and release processes will continue to work, but might no longer receive updates for already used tasks!

## Tasks

### Setup Paket Credential Provider

Use the **Setup Paket Credential Provider** task to setup the required credential manager to access your internal Azure DevOps NuGet feeds within your own build script running paket.

> Note: For this task to work correctly you need to have the dotnet SDK installed on your agent (or installed via "DotNet Install" task).

### Paket Credential Provider Cleanup

Cleanup the credential manager to prevent follow-up-tasks to access the internal NuGet feed.

> Note: After the build, no other build has access to the credentials - they will be safely cleaned up after the build no matter if you use that task.

### Paket Restore

Use the **Paket Restore** task to download the full Paket executable via the Paket Bootstrapper
that you have committed into source control, and automatically run ```paket restore```. You can
override the location of the bootstrapper, but this defaults to the ```.paket``` folder.

### FAKE 5 Runner

Use the **FAKE 5 Runner** task to execute any FAKE 5 script in the repository. This task downloads
and caches the given FAKE 5 version. In addition to the path of the FAKE script, you can supply
an optional target as well as any other arbitrary arguments that are required.

### FAKE 5 Vault

Use the **FAKE 5 Vault** task to create a fake 5 vault. This task is useful if you want to use secret variables and run your own fake 5 bootstrapping method (ie not the `FAKE 5 Runner` Task). See [the official FAKE documentation](https://fake.build/apidocs/v5/fake-buildserver-teamfoundation.html)

### FAKE Runner

Use the **FAKE Runner** task to execute any FAKE script in the repository. This task assumes that
the FAKE executable is located at ```packages\Fake\tools\Fake.exe```. In addition to the path of
the FAKE script, you can supply an optional target as well as any other arbitrary arguments that are
required.

### Execute F# Script

Use the **Execute F# Script** task to run any ```.fsx``` file located in the repository as part of
your build - simply supply the path to the ```.fsx``` file.

## Build

See [Contribution](./Contribution.md)
