// Learn more about F# at http://fsharp.org

open System

let printErr msg =
    printfn """
{ "Username" : null,
  "Password" : null,
  "Message"  : "%s" }""" msg
    Console.Error.WriteLine(msg)

[<EntryPoint>]
let main argv =
    let token = Environment.GetEnvironmentVariable("PAKET_VSS_NUGET_ACCESSTOKEN");
    if String.IsNullOrWhiteSpace(token) then
        printErr("This credential provider must be run under the Team Build tasks for NuGet")
        1
    else
        printfn """
{ "Username" : "%s",
  "Password" : "%s",
  "Message"  : "" }""" "ApiKey" token
        0 // return an integer exit code
