# How to build

```shell
# First time (https://chocolatey.org/)
choco install nodejs.install # if not already installed
dotnet tool restore

# create new version
dotnet fake run build.fsx
```

## Publisher Id

To change the name of the publisher for private builds set an environment variable befor building with `fake`.

```batchfile
SET PUBLISHER=<my publisher id>
```

## Develop extensions for Azure DevOps

For general information see
[documentation](https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=azure-devops)
at Microsoft.
