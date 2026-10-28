Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if backend is responding
On Error Resume Next
Set http = CreateObject("MSXML2.XMLHTTP")
http.Open "GET", "http://127.0.0.1:8000/api/status", False
http.Send

If http.Status <> 200 Then
    ' Start server in background
    cmd = """" & "c:\Users\rahul\anaconda3\python.exe" & """ -m uvicorn main:app --host 127.0.0.1 --port 8000"
    WshShell.CurrentDirectory = scriptDir & "\backend"
    WshShell.Run cmd, 0, False
    WScript.Sleep 2500
End If

' Open default browser
WshShell.Run "http://127.0.0.1:8000"
