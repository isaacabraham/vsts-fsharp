// Learn more about F# at http://fsharp.org

open System

let printErr msg =
    printfn """
{ "Username" : null,
  "Password" : null,
  "Message"  : "%s" }""" msg
    Console.Error.WriteLine(msg)

let tryGetArg (name:string) (argv: string array) =
    let lowerName = name.ToLowerInvariant()
    match 
        argv |> Seq.tryFindIndex (fun s ->
            let arg = s.ToLowerInvariant() 
            arg = sprintf "/%s" lowerName || arg = sprintf "-%s" lowerName || arg = sprintf "--%s" lowerName)
        with
    | Some i ->
        if argv.Length > i + 1 then
            Some argv.[i + 1]
        else failwithf "Argument for '%s' is missing" argv.[i]
    | None -> None                    

[<EntryPoint>]
let main argv =
    try
        let token = Environment.GetEnvironmentVariable("PAKET_VSS_NUGET_ACCESSTOKEN")
        let uriStr = Environment.GetEnvironmentVariable("SYSTEM_TEAMFOUNDATIONCOLLECTIONURI")
        let givenUri =
            match tryGetArg "uri" argv with
            | Some givenUriStr -> System.Uri givenUriStr
            | None -> failwithf "the -uri argument is required"
        let isResponsible =
            if String.IsNullOrWhiteSpace uriStr then
                givenUri.Host.Contains "dev.azure.com" ||
                givenUri.Host.Contains "visualstudio.com" || givenUri.PathAndQuery.StartsWith "/tfs/"
            else
                let uri = System.Uri uriStr
                uri.Host = givenUri.Host

        if not isResponsible then
            printfn """
{ "Message"  : "%s" }""" "This credential provider only serves teamfoundation or vsts links (check 'SYSTEM_TEAMFOUNDATIONCOLLECTIONURI' environment variable!)."
            1
        else  
            if String.IsNullOrWhiteSpace(token) then
                printErr("This credential provider must be run under the Team Build tasks for NuGet")
                1
            else
                printfn """
{ "Username" : "%s",
  "Password" : "%s",
  "Message"  : "" }""" "ApiKey" token
                0
    with e ->
        eprintf "Error: %O" e
        137
