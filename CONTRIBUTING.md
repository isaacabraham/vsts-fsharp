# Contribution Guide

This document expains the current testing process (as extensions are painfully hard to test).

Currently the process works the following way:

- CI builds the task artifacts (the task folders)
  - Build the CredentialProvider F# project
  - Build the `Common` npm package (`npm install && npm pack`)
  - Copy the `Common`-npm package to `_build/`
  - Call `npm install` for all `Tasks/<Task>.dev` folders (references the `Common` package)
  - Call `tsc` for all relevant task folders
  - Copy the `Tasks/<Task>.dev` folder to `Tasks/<Task>` and remove files we don't want in our task
  - zip everything into `publish/tasks.zip`

- CD Release process
  - extract `publish/tasks.zip`
  - packaged via extension manifest templates (see `tfx/ext-*.json`) and variables
  - push packages to marketplace (we can package them as `public` and as `private` extensions)

Our release process looks like this:

CI triggers on every change
 -> CD for "DogFooding" Stage
 -> Manual push (empty commit or space change) to https://dev.azure.com/fakebuild/FSProjects/_git/Test_Extensions
 -> Some testing CI processes are triggered with the new extensions
 -> When all CIs report green manual approval to CD for "Marketplace" Stage is given
