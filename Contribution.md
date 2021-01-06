# How to build

```shell
# First time (https://chocolatey.org/)
choco install nodejs.install # if not already installed
dotnet tool restore

# create new version
dotnet fake run build.fsx
```
