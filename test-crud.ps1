$base="http://localhost:3000"

Write-Host "Login..."

$body = @{
email="admin@center.sa"
password="admin123"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Invoke-WebRequest `
-Uri "$base/api/auth/login" `
-Method POST `
-Headers @{"Content-Type"="application/json"} `
-Body $body `
-WebSession $session | Out-Null


$apis=@(
"students",
"teachers",
"courses",
"groups",
"attendance",
"invoices",
"payments",
"users",
"certificates",
"classrooms",
"reports",
"settings"
)


foreach($api in $apis){

Write-Host "`nTesting $api"

try{

$r=Invoke-WebRequest `
-Uri "$base/api/$api" `
-WebSession $session `
-Method GET

Write-Host "$api OK $($r.StatusCode)"

}
catch{

Write-Host "$api FAILED $($_.Exception.Response.StatusCode)"

}

}