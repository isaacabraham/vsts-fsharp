#r "paket:
// Currently we use 'old' FAKE in the task because
// not all APIs (StrongNameKeyPair) are available in netcore
// And Mono.Cecil has removed support for Strong naming in netcore version
// Sadly we run into a size limitation when trying to bundle all binaries
// -> therefore we download stuff when running the task first time.
//nuget FAKE prerelease
//nuget Microsoft.Build.Utilities.Core
//nuget NuGet.CommandLine

nuget FSharp.Core
nuget Fake.Core.Process prerelease
nuget Fake.IO.FileSystem prerelease
nuget Fake.Core.Target prerelease
nuget Fake.DotNet.Cli prerelease
nuget Fake.Core.Environment prerelease
//"
#load ".fake/build.fsx/intellisense.fsx"

open System
open System.Text
open System.Text.RegularExpressions
open System.IO
open System.Collections.Generic
open Fake.Core
open Fake.IO
open Fake.IO.FileSystemOperators
open Fake.IO.Globbing.Operators
open Fake.DotNet


open System.Net.Http
open System.Collections.Generic

let publisher = Environment.environVarOrDefault "PUBLISHER" "IsaacAbraham"

module Util =
    open System.Net

    let retryIfFails maxRetries f =
        let rec loop retriesRemaining =
            try
                f ()
            with _ when retriesRemaining > 0 ->
                loop (retriesRemaining - 1)
        loop maxRetries

    let (|RegexReplace|_|) =
        let cache = new Dictionary<string, Regex>()
        fun pattern (replacement: string) input ->
            let regex =
                match cache.TryGetValue(pattern) with
                | true, regex -> regex
                | false, _ ->
                    let regex = Regex pattern
                    cache.Add(pattern, regex)
                    regex
            let m = regex.Match(input)
            if m.Success
            then regex.Replace(input, replacement) |> Some
            else None

    let join pathParts =
        Path.Combine(Array.ofSeq pathParts)

    let run workingDir fileName args =
        printfn "CWD: %s" workingDir
        let fileName, args =
            if Environment.isUnix
            then fileName, args else "cmd", ("/C " + fileName + " " + args)
        let exitCode =
            Process.execSimple (fun info ->
                { info with
                    FileName = fileName
                    WorkingDirectory = workingDir
                    Arguments = args }) TimeSpan.MaxValue
        if exitCode <> 0 then failwith (sprintf "'%s> %s %s' task failed with code %d" workingDir fileName args exitCode)

    let start workingDir fileName args =
        let p = new System.Diagnostics.Process()
        p.StartInfo.FileName <- fileName
        p.StartInfo.WorkingDirectory <- workingDir
        p.StartInfo.Arguments <- args
        p.Start() |> ignore
        p

    let runAndReturn workingDir fileName args =
        printfn "CWD: %s" workingDir
        let fileName, args =
            if Environment.isUnix
            then fileName, args else "cmd", ("/C " + args)
        Process.execWithResult (fun info ->
            { info with
                FileName = fileName
                WorkingDirectory = workingDir
                Arguments = args}) TimeSpan.MaxValue
        |> fun p -> p.Messages |> String.concat "\n"

    let rmdir dir =
        if Environment.isUnix
        then Shell.rm_rf dir
        // Use this in Windows to prevent conflicts with paths too long
        else run "." "cmd" ("/C rmdir /s /q " + Path.GetFullPath dir)

    let visitFile (visitor: string->string) (fileName : string) =
        File.ReadAllLines(fileName)
        |> Array.map (visitor)
        |> fun lines -> File.WriteAllLines(fileName, lines)

    let replaceLines (replacer: string->Match->string option) (reg: Regex) (fileName: string) =
        fileName |> visitFile (fun line ->
            let m = reg.Match(line)
            if not m.Success
            then line
            else
                match replacer line m with
                | None -> line
                | Some newLine -> newLine)

    let normalizeVersion (version: string) =
        let i = version.IndexOf("-")
        if i > 0 then version.Substring(0, i) else version

    type ComparisonResult = Smaller | Same | Bigger

    let foldi f init (xs: 'T seq) =
        let mutable i = -1
        (init, xs) ||> Seq.fold (fun state x ->
            i <- i + 1
            f i state x)

    let compareVersions (expected: string) (actual: string) =
        if actual = "*" // Wildcard for custom fable-core builds
        then Same
        else
            let expected = expected.Split('.', '-')
            let actual = actual.Split('.', '-')
            (Same, expected) ||> foldi (fun i comp expectedPart ->
                match comp with
                | Bigger -> Bigger
                | Same when actual.Length <= i -> Smaller
                | Same ->
                    let actualPart = actual.[i]
                    match Int32.TryParse(expectedPart), Int32.TryParse(actualPart) with
                    // TODO: Don't allow bigger for major version?
                    | (true, expectedPart), (true, actualPart) ->
                        if actualPart > expectedPart
                        then Bigger
                        elif actualPart = expectedPart
                        then Same
                        else Smaller
                    | _ ->
                        if actualPart = expectedPart
                        then Same
                        else Smaller
                | Smaller -> Smaller)


module Npm =
    let script workingDir script args =
        sprintf "run %s -- %s" script (String.concat " " args)
        |> Util.run workingDir "npm"

    let install workingDir modules =
        let npmInstall () =
            sprintf "install %s" (String.concat " " modules)
            |> Util.run workingDir "npm"

        // On windows, retry npm install to avoid bug related to https://github.com/npm/npm/issues/9696
        Util.retryIfFails (if Environment.isWindows then 3 else 0) npmInstall

    let prune workingDir isProd =
        // https://docs.npmjs.com/cli/prune
        sprintf "prune %s" (if isProd then "--production" else "--no-production")
        |> Util.run workingDir "npm"

    let command workingDir command args =
        sprintf "%s %s" command (String.concat " " args)
        |> Util.run workingDir "npm"

    let commandAndReturn workingDir command args =
        sprintf "%s %s" command (String.concat " " args)
        |> Util.runAndReturn workingDir "npm"

    let getLatestVersion package tag =
        let package =
            match tag with
            | Some tag -> package + "@" + tag
            | None -> package
        commandAndReturn "." "show" [package; "version"]

    let updatePackageKeyValue f pkgDir keys =
        let pkgJson = Path.Combine(pkgDir, "package.json")
        let reg =
            String.concat "|" keys
            |> sprintf "\"(%s)\"\\s*:\\s*\"(.*?)\""
            |> Regex
        let lines =
            File.ReadAllLines pkgJson
            |> Array.map (fun line ->
                let m = reg.Match(line)
                if m.Success then
                    match f(m.Groups.[1].Value, m.Groups.[2].Value) with
                    | Some(k,v) -> reg.Replace(line, sprintf "\"%s\": \"%s\"" k v)
                    | None -> line
                else line)
        File.WriteAllLines(pkgJson, lines)

module Node =
    let run workingDir script args =
        let args = sprintf "%s %s" script (String.concat " " args)
        Util.run workingDir "node" args

open Fake.Core
open Fake.Core.TargetOperators
let dirs =
    [ "PaketCredentialCleanup";"SetPaketCredentialProvider";
      "FSharpScript"; "FAKE4Runner"; "PaketRestore"; "FAKE5"; "FAKE5Vault" ]
let asDevel d = 
    let devDir = d + ".dev"
    if Directory.Exists devDir then devDir else d

Target.create "Clean" (fun _ ->
    Shell.CleanDir "_build"
)

Target.create "NpmInstall" (fun _ ->
    Npm.install "." []
    for dir in dirs |> Seq.map asDevel do
        if File.Exists (dir </> "package.json") then
            try Npm.install dir []
            with _ ->
                printfn "npm install failed, trying to delete the lockfile"
                File.Delete (dir </> "package-lock.json")
                Npm.install dir []        
)

//Target "PrepareBinaries" (fun _ ->
//    Directory.ensure "CreateSignedPackages.dev/bin/Fake"
//    Shell.cp_r ".fake/build.fsx/packages/FAKE/tools" "CreateSignedPackages.dev/bin/Fake"
//    Directory.ensure "CreateSignedPackages.dev/bin/Microsoft.Build.Utilities.Core"
//    Shell.cp_r ".fake/build.fsx/packages/Microsoft.Build.Utilities.Core/lib/net46" "CreateSignedPackages.dev/bin/Microsoft.Build.Utilities.Core"
//    Directory.ensure "CreateSignedPackages.dev/bin/NuGet"
//    Shell.cp_r ".fake/build.fsx/packages/NuGet.CommandLine/tools" "CreateSignedPackages.dev/bin/NuGet"
//)

Target.create "CompileCredentialManager" (fun _ ->
    Shell.CleanDir "SetPaketCredentialProvider.dev/CredentialProvider"
    DotNet.publish (fun c ->
        { c with
            Runtime = None
            Configuration = DotNet.Release
            OutputPath = Some (Path.GetFullPath "SetPaketCredentialProvider.dev/CredentialProvider")
        }) "CredentialProvider.PaketTeamBuild/CredentialProvider.PaketTeamBuild.fsproj"

    // Copy to all required locations
    Shell.CleanDir "FAKE5.dev/CredentialProvider"
    Shell.cp_r "SetPaketCredentialProvider.dev/CredentialProvider" "FAKE5.dev/CredentialProvider"

)

Target.create "Common" (fun _ ->

    Npm.install "Common" []
    Npm.script "Common" "tsc" []
    Npm.command "Common" "pack" []

    Directory.ensure "_build"
    !! "Common/vsts-fsharp-task-common-*.tgz"
    |> Seq.iter (fun file ->
        let name = Path.GetFileName(file)
        File.Copy(file, "_build" </> name, true)
        File.Delete(file))
)


Target.create "Compile" (fun _ ->
    for dir in dirs |> Seq.map asDevel do
        if File.Exists (dir </> "package.json") then
            Npm.script dir "tsc" []
)

type ExtensionReplacement =
    { NamePostfix : string
      IdPostfix : string
      Public : bool }
    member x.AsList =
        [ "{Name-Postfix}", x.NamePostfix
          "{ID-Postfix}", x.IdPostfix
          "\"{PublicFlag}\"", x.Public.ToString().ToLowerInvariant()
          "{Publisher}", publisher ]

let replaceInFile sourceFile targetFile (replacements: (string * string) list)=
    (File.ReadAllText(sourceFile), replacements)
    ||> Seq.fold (fun state (template, replacement) ->
        state.Replace(template, replacement))
    |> fun text -> File.WriteAllText(targetFile, text)

let replaceTaskJsons () =
    // fixup task-ids:
    printfn "fixing task-ids for sub-extensions."
    let replacements =
        [ "a2dadf20-1a83-4220-a4ee-b52f6c77f3cf", "dd88f622-7838-44dc-96d6-2372af78775b" // FAKE5 Runner
          "26d2a628-d5fe-4d5a-943d-33c78b2d76f3", "e5090f4d-0f56-4401-9bbc-d7af2b5c1bd1" // FAKE5 Vault
          "33416f37-5fe8-488d-a2aa-48f52e7a14f9", "1c4d173c-798c-4636-a842-2da42eb2c20e" // PaketCredentialCleanup
          "1ba72b0a-f476-4a91-90a0-b8e7a0cc4338", "90d5ae45-3fc2-4ede-b572-9a57379fbf8a" // PaketRestore
          "5bfdd7ca-9bf4-40f7-b753-fd674e7ff85c", "c2aea098-6aab-4cd3-9a0c-57b074df3df5" // SetPaketCredentialProvider
        ]

    for dir in dirs do
        let taskJson = (dir </> "task.json")
        replaceInFile taskJson taskJson replacements

Target.create "FixTaskJson" (fun _ ->
    replaceTaskJsons()
)

Target.create "Bundle" (fun _ ->
    // Workaround for not having an "exclude" feature...
    for dir in dirs do
        let devel = asDevel dir
        if devel <> dir then
            Shell.CleanDir dir
            Shell.cp_r devel dir
    // delete stuff we don't want
    
    // cleanup node_modules to only contain --production dependencies
    for dir in dirs do
        if File.Exists (dir </> "package.json") then
            Npm.prune dir true

    // delete existing vsix files
    !! "*.vsix"
    |> Seq.iter File.Delete

    // Bundle vsix files
    let replacements = 
        [ { NamePostfix = ""; IdPostfix = ""; Public = true }
          { NamePostfix = " (Private)"; IdPostfix = "-private"; Public = false } ]
    
    let createExtension ext =
        for repl in replacements do
            let sourceName = sprintf "ext-%s.json" ext
            let targetName = sprintf "ext-%s%s.temp.json" ext repl.IdPostfix
            
            replaceInFile sourceName targetName repl.AsList
                
            Npm.script "." "tfx" ["extension"; "create"; "--manifest-globs"; targetName]
            File.Delete(targetName)
    
    createExtension "fsharp-helpers-extension"

    replaceTaskJsons()

    createExtension "fake-build"
    createExtension "paket"
)

Target.create "Publish" (fun _ ->
    let token =
        match Environment.environVarOrNone "vsts-token" with
        | Some tok -> tok
        | None -> Environment.environVarOrFail "VSTS_TOKEN"
    let publishPrivate = Boolean.Parse(Environment.environVarOrDefault "publishPrivate" "false")

    let repl =
        if publishPrivate
        then { NamePostfix = " (Private)"; IdPostfix = "-private"; Public = false } 
        else { NamePostfix = ""; IdPostfix = ""; Public = true }
    
    let exts = [ "fsharp-helpers-extension";"fake-build"; "paket"]
    for ext in exts do
        let prefix = sprintf "%s.%s%s-" publisher ext repl.IdPostfix
        let vsixFile =
           !! (sprintf "%s*.vsix" prefix)
           |> Seq.filter (fun file -> 
                let name = Path.GetFileName(file)
                not <| name.Substring(prefix.Length).Contains("-"))
           |> Seq.exactlyOne
   
        Npm.script "." "tfx" ["extension"; "publish"; "--token"; token; "--vsix"; vsixFile ]
    )

Target.create "Default" (fun _ -> ())

"Clean"
    ==> "Common"
    ==> "NpmInstall"
    //==> "PrepareBinaries"
    ==> "Compile"
    ==> "CompileCredentialManager"
    ==> "Bundle"
    ==> "Default"

"Bundle"
    ==> "Publish"

Target.runOrDefault "Default"