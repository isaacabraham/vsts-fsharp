Paket Tasks for Azure DevOps
==========================================

Introduction
------------
This extension contains [paket](https://fsprojects.github.io/Paket/) tasks for use within Azure DevOps. At the current time, the extension contains the following tasks.

Contributors: @isaacabraham, @matthid.

Note
-----

It is not recommended to install the extension [Paket Tasks for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.paket) in combination with [F# Helpers for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fsharp-helpers-extension) as it is a subset of the later. Please see the note regarding the incompatibilty in the [F# Helpers for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=isaacabraham.fsharp-helpers-extension) page.

Tasks
-----

### Paket Restore
Use the **Paket Restore** task to download the full Paket executable via the Paket Bootstrapper
that you have committed into source control, and automatically run ```paket restore```. You can
override the location of the bootstrapper, but this defaults to the ```.paket``` folder.

### Setup Paket Credential Provider
Use the **Setup Paket Credential Provider** task to setup the required credential manager to access your internal Azure DevOps NuGet feeds within your own build script running paket.

> Note: For this task to work correctly you need to have the dotnet SDK installed on your agent (or installed via "DotNet Install" task).

### Paket Credential Provider Cleanup
Cleanup the credential manager to prevent follow-up-tasks to access the internal NuGet feed.

> Note: After the build, no other build has access to the credentials - they will be safely cleaned up after the build no matter if you use that task.
