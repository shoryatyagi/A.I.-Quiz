$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$StatePath = Join-Path $PSScriptRoot '.deployment-state.json'
$KeyDirectory = Join-Path $PSScriptRoot '.keys'
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw 'AWS CLI v2 is required.' }
if (-not (Test-Path -LiteralPath $StatePath)) { throw 'No deployment state was found; nothing from this helper was identified to remove.' }
$state = Get-Content -Raw -LiteralPath $StatePath | ConvertFrom-Json
Write-Host "This will terminate EC2 instance $($state.InstanceId) in $($state.Region), delete security group $($state.SecurityGroupId), and remove its AWS key-pair registration. The attached 12 GB disk is configured to delete with the instance."
if ((Read-Host 'Type DELETE to continue') -cne 'DELETE') { throw 'Cleanup cancelled.' }

$instanceState = & aws ec2 describe-instances --region $state.Region --instance-ids $state.InstanceId --query 'Reservations[0].Instances[0].State.Name' --output text
if ($LASTEXITCODE -eq 0 -and $instanceState -ne 'terminated' -and $instanceState -ne 'None') {
    & aws ec2 terminate-instances --region $state.Region --instance-ids $state.InstanceId | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not terminate the EC2 instance.' }
    & aws ec2 wait instance-terminated --region $state.Region --instance-ids $state.InstanceId
    if ($LASTEXITCODE -ne 0) { throw 'Timed out waiting for EC2 termination; retry destroy.ps1 later.' }
}

& aws ec2 delete-security-group --region $state.Region --group-id $state.SecurityGroupId
if ($LASTEXITCODE -ne 0) { throw 'Could not delete the security group. Confirm the instance is terminated, then retry.' }
& aws ec2 delete-key-pair --region $state.Region --key-name $state.KeyName
if ($LASTEXITCODE -ne 0) { Write-Warning 'Could not delete the AWS key-pair registration; delete it manually from EC2 Key Pairs.' }
$keyPath = Join-Path $KeyDirectory $state.KeyFile
if (Test-Path -LiteralPath $keyPath) { Remove-Item -LiteralPath $keyPath -Force }
Remove-Item -LiteralPath $StatePath -Force
Write-Host 'Deployment resources created by this helper were removed. Keep .env.deploy private; it was not deleted.' -ForegroundColor Green
