F# Helpers for Visual Studio Team Services
==========================================

Introduction
------------
This extension contains build tasks for use within VSTS Team Build that are particularly
useful within the F# world. At the current time, the extension contains the following tasks.

Contributors: @isaacabraham, @matthid.

Tasks
-----

### Setup Paket Credential Provider
Use the **Setup Paket Credential Provider** task to setup the required credential manager to access your internal VSTS/TFS NuGet feeds within your own build script running paket.

> Note: For this task to work correctly you need to have the dotnet SDK installed on your agent (or installed via "DotNet Install" task).

### Paket Credential Provider Cleanup
Cleanup the credential manager to prevent follow-up-tasks to access the internal NuGet feed.

> Note: After the build, no other build has access to the credentials - they will be safely cleaned up after the build no matter if you use that task.

### Paket Restore
Use the **Paket Restore** task to download the full Paket executable via the Paket Bootstrapper
that you have committed into source control, and automatically run ```paket restore```. You can
override the location of the bootstrapper, but this defaults to the ```.paket``` folder.

### FAKE Runner
Use the **FAKE Runner** task to execute any FAKE script in the repository. This task assumes that
the FAKE executable is located at ```packages\Fake\tools\Fake.exe```. In addition to the path of
the FAKE script, you can supply an optional target as well as any other arbitrary arguments that are
required.

### Execute F# Script
Use the **Execute F# Script** task to run any ```.fsx``` file located in the repository as part of
your build - simply supply the path to the ```.fsx``` file.