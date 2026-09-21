$base="http://localhost:3000/api"

$apis=@(
"students",
"teachers",
"courses",
"groups",
"users",
"attendance",
"invoices",
"payments"
)

foreach($api in $apis){
    Write-Host "Testing $api"
    try{
        Invoke-RestMethod "$base/$api"
        Write-Host "$api OK"
    }
    catch{
        Write-Host "$api FAILED"
    }
}