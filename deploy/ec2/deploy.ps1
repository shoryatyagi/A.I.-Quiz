$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$FrontendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$WorkspaceRoot = Split-Path $FrontendRoot -Parent
$BackendRoot = Join-Path $WorkspaceRoot 'flask-backend'
$ConfigPath = Join-Path $PSScriptRoot '.env.deploy'
$StatePath = Join-Path $PSScriptRoot '.deployment-state.json'
$KeyDirectory = Join-Path $PSScriptRoot '.keys'
$BootstrapPath = Join-Path $PSScriptRoot 'bootstrap.sh'

function Stop-WithMessage([string]$Message) { throw $Message }

function Get-AwsValue([string[]]$Arguments) {
    $value = & aws @Arguments
    if ($LASTEXITCODE -ne 0) { Stop-WithMessage "AWS CLI failed: aws $($Arguments -join ' ')" }
    return ($value | Out-String).Trim()
}

function Read-DeployConfig([string]$Path) {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith('#')) { continue }
        $separator = $line.IndexOf('=')
        if ($separator -lt 1) { continue }
        $values[$line.Substring(0, $separator).Trim()] = $line.Substring($separator + 1).Trim()
    }
    return $values
}

function Invoke-Ssh([string]$HostIp, [string]$Command) {
    $arguments = @('-i', $script:KeyPath, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=10', "ec2-user@$HostIp", $Command)
    $result = & ssh @arguments 2>&1
    if ($LASTEXITCODE -ne 0) { Stop-WithMessage "SSH command failed: $result" }
    return $result
}

foreach ($tool in @('aws', 'docker', 'ssh', 'scp')) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Stop-WithMessage "Required program '$tool' was not found. Install AWS CLI v2, Docker Desktop, and Windows OpenSSH."
    }
}
if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Stop-WithMessage "Copy .env.deploy.example to .env.deploy, fill it in, and rerun. Keep the filled file private."
}
if (-not (Test-Path -LiteralPath (Join-Path $BackendRoot 'Dockerfile'))) {
    Stop-WithMessage "Place the Flask backend repository beside my-app at '$BackendRoot'."
}
if (-not (Test-Path -LiteralPath $BootstrapPath)) { Stop-WithMessage "Missing bootstrap file: $BootstrapPath" }

$config = Read-DeployConfig $ConfigPath
$required = @(
    'MONGODB_URI', 'MONGODB_DB_NAME', 'GROQ_API_KEY', 'SECRET_KEY', 'FIREBASE_CREDENTIALS_JSON',
    'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'
)
foreach ($name in $required) {
    if (-not $config.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($config[$name])) {
        Stop-WithMessage "Missing '$name' in .env.deploy."
    }
}
try { $null = $config['FIREBASE_CREDENTIALS_JSON'] | ConvertFrom-Json }
catch { Stop-WithMessage 'FIREBASE_CREDENTIALS_JSON must be valid compact JSON on one line.' }

$Region = Read-Host 'AWS region (press Enter for eu-west-1)'
if ([string]::IsNullOrWhiteSpace($Region)) { $Region = 'eu-west-1' }
$InstanceType = Read-Host 'Free Tier eligible instance type (press Enter for t3.small)'
if ([string]::IsNullOrWhiteSpace($InstanceType)) { $InstanceType = 't3.small' }
Write-Host "This creates one EC2 instance, one security group, one key pair, and a 12 GB encrypted EBS disk in $Region. Confirm in Billing that your new account is on the Free plan and has remaining eligibility. Check the EC2 console's launch estimate before proceeding." -ForegroundColor Yellow
if ((Read-Host 'Type DEPLOY to continue') -cne 'DEPLOY') { Stop-WithMessage 'Deployment cancelled.' }

$account = & aws sts get-caller-identity --region $Region --query Account --output text 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($account)) {
    Stop-WithMessage 'AWS CLI is not authenticated. Configure an AWS CLI identity with EC2 permissions first.'
}
$eligible = Get-AwsValue @('ec2', 'describe-instance-types', '--region', $Region, '--filters', "Name=instance-type,Values=$InstanceType", 'Name=free-tier-eligible,Values=true', '--query', 'InstanceTypes[0].InstanceType', '--output', 'text')
if ($eligible -ne $InstanceType) { Stop-WithMessage "$InstanceType is not listed as Free Tier eligible in $Region. Check the AWS Console and choose an eligible type." }

$vpcId = Get-AwsValue @('ec2', 'describe-vpcs', '--region', $Region, '--filters', 'Name=isDefault,Values=true', '--query', 'Vpcs[0].VpcId', '--output', 'text')
if ($vpcId -eq 'None' -or [string]::IsNullOrWhiteSpace($vpcId)) { Stop-WithMessage "No default VPC exists in $Region. Create one in the EC2 console first." }
$subnetId = Get-AwsValue @('ec2', 'describe-subnets', '--region', $Region, '--filters', "Name=vpc-id,Values=$vpcId", 'Name=default-for-az,Values=true', '--query', 'Subnets[0].SubnetId', '--output', 'text')
if ($subnetId -eq 'None' -or [string]::IsNullOrWhiteSpace($subnetId)) { Stop-WithMessage "No default subnet exists in $Region." }
$amiId = Get-AwsValue @('ec2', 'describe-images', '--region', $Region, '--owners', 'amazon', '--filters', 'Name=architecture,Values=x86_64', 'Name=state,Values=available', 'Name=name,Values=al2023-ami-2023.*-x86_64', 'Name=free-tier-eligible,Values=true', '--query', 'Images | sort_by(@, &CreationDate)[-1].ImageId', '--output', 'text')
if ($amiId -eq 'None' -or [string]::IsNullOrWhiteSpace($amiId)) { Stop-WithMessage "No Free Tier eligible Amazon Linux 2023 x86_64 image was found in $Region." }

$state = $null
if (Test-Path -LiteralPath $StatePath) {
    $state = Get-Content -Raw -LiteralPath $StatePath | ConvertFrom-Json
    if ($state.Region -ne $Region) { Stop-WithMessage "This deployment is in $($state.Region). Use that region or run destroy.ps1 first." }
    $instanceState = Get-AwsValue @('ec2', 'describe-instances', '--region', $Region, '--instance-ids', $state.InstanceId, '--query', 'Reservations[0].Instances[0].State.Name', '--output', 'text')
    if ($instanceState -eq 'terminated' -or $instanceState -eq 'None') { Stop-WithMessage 'The saved instance is gone. Run destroy.ps1 and deploy again.' }
    $KeyPath = Join-Path $KeyDirectory $state.KeyFile
    if (-not (Test-Path -LiteralPath $KeyPath)) { Stop-WithMessage "SSH key is missing: $KeyPath" }
    if ($instanceState -eq 'stopped') { $null = Get-AwsValue @('ec2', 'start-instances', '--region', $Region, '--instance-ids', $state.InstanceId) }
    $null = Get-AwsValue @('ec2', 'wait', 'instance-status-ok', '--region', $Region, '--instance-ids', $state.InstanceId)
    $InstanceId = $state.InstanceId
} else {
    $sshCidr = Read-Host 'Your public IPv4 CIDR for SSH (example 203.0.113.10/32; never use 0.0.0.0/0)'
    if ($sshCidr -notmatch '^\d{1,3}(\.\d{1,3}){3}/(\d|[12]\d|3[0-2])$') { Stop-WithMessage 'Enter an IPv4 CIDR such as 203.0.113.10/32.' }
    New-Item -ItemType Directory -Force -Path $KeyDirectory | Out-Null
    $stamp = Get-Date -Format 'yyyyMMddHHmmss'
    $KeyName = "quizmaster-$stamp"
    $KeyFile = "$KeyName.pem"
    $KeyPath = Join-Path $KeyDirectory $KeyFile
    $keyMaterial = Get-AwsValue @('ec2', 'create-key-pair', '--region', $Region, '--key-name', $KeyName, '--key-type', 'rsa', '--query', 'KeyMaterial', '--output', 'text')
    Set-Content -LiteralPath $KeyPath -Value $keyMaterial -NoNewline -Encoding ascii
    $null = & icacls $KeyPath /inheritance:r /grant:r "$($env:USERNAME):(R)" 2>&1
    if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Could not restrict SSH key file permissions: $KeyPath" }

    $SecurityGroupId = Get-AwsValue @('ec2', 'create-security-group', '--region', $Region, '--group-name', "quizmaster-$stamp", '--description', 'QuizMaster EC2; SSH restricted to operator CIDR; public HTTP', '--vpc-id', $vpcId, '--query', 'GroupId', '--output', 'text')
    $null = Get-AwsValue @('ec2', 'authorize-security-group-ingress', '--region', $Region, '--group-id', $SecurityGroupId, '--protocol', 'tcp', '--port', '22', '--cidr', $sshCidr)
    $null = Get-AwsValue @('ec2', 'authorize-security-group-ingress', '--region', $Region, '--group-id', $SecurityGroupId, '--protocol', 'tcp', '--port', '80', '--cidr', '0.0.0.0/0')

    $network = "DeviceIndex=0,SubnetId=$subnetId,Groups=$SecurityGroupId,AssociatePublicIpAddress=true,DeleteOnTermination=true"
    $disk = 'DeviceName=/dev/xvda,Ebs={VolumeSize=12,VolumeType=gp3,DeleteOnTermination=true,Encrypted=true}'
    $InstanceId = Get-AwsValue @('ec2', 'run-instances', '--region', $Region, '--image-id', $amiId, '--instance-type', $InstanceType, '--key-name', $KeyName, '--network-interfaces', $network, '--block-device-mappings', $disk, '--user-data', "file://$BootstrapPath", '--metadata-options', 'HttpTokens=required,HttpEndpoint=enabled', '--tag-specifications', 'ResourceType=instance,Tags=[{Key=Name,Value=quizmaster-free-tier}]', '--count', '1', '--query', 'Instances[0].InstanceId', '--output', 'text')
    $state = [pscustomobject]@{ Region = $Region; InstanceId = $InstanceId; SecurityGroupId = $SecurityGroupId; KeyName = $KeyName; KeyFile = $KeyFile; CreatedAt = (Get-Date).ToString('o') }
    $state | ConvertTo-Json | Set-Content -LiteralPath $StatePath -Encoding utf8
    Write-Host "Waiting for EC2 $InstanceId to start..."
    $null = Get-AwsValue @('ec2', 'wait', 'instance-status-ok', '--region', $Region, '--instance-ids', $InstanceId)
}

$PublicIp = Get-AwsValue @('ec2', 'describe-instances', '--region', $Region, '--instance-ids', $InstanceId, '--query', 'Reservations[0].Instances[0].PublicIpAddress', '--output', 'text')
if ($PublicIp -eq 'None' -or [string]::IsNullOrWhiteSpace($PublicIp)) { Stop-WithMessage 'The instance has no public IPv4 address.' }
$AppUrl = "http://$PublicIp"
Write-Host "Waiting for EC2 setup at $AppUrl..."
$bootstrapReady = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $status = Invoke-Ssh $PublicIp 'sudo test -f /var/lib/cloud/instance/quizmaster-bootstrap.done && echo READY || true'
        if (($status | Out-String) -match 'READY') { $bootstrapReady = $true; break }
    } catch { }
    Start-Sleep -Seconds 10
}
if (-not $bootstrapReady) { Stop-WithMessage 'EC2 setup did not finish within 10 minutes. Check the instance system log/cloud-init output before retrying.' }

Write-Host 'Building images locally. This may take several minutes.'
$frontendArgs = @('build', '--tag', 'quizmaster-frontend:latest', '--build-arg', "NEXT_PUBLIC_API_URL=$AppUrl")
foreach ($name in @('NEXT_PUBLIC_FIREBASE_API_KEY','NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN','NEXT_PUBLIC_FIREBASE_PROJECT_ID','NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET','NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID','NEXT_PUBLIC_FIREBASE_APP_ID')) {
    $frontendArgs += @('--build-arg', "$name=$($config[$name])")
}
$frontendArgs += @($FrontendRoot)
& docker @frontendArgs
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Frontend Docker build failed.' }
& docker build --tag quizmaster-backend:latest $BackendRoot
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Backend Docker build failed.' }

$bundlePath = Join-Path $env:TEMP 'quizmaster-images.tar'
& docker save --output $bundlePath quizmaster-frontend:latest quizmaster-backend:latest
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Could not export the Docker images.' }
$sshOptions = @('-i', $KeyPath, '-o', 'StrictHostKeyChecking=accept-new')
& scp @sshOptions $bundlePath "ec2-user@${PublicIp}:/tmp/quizmaster-images.tar"
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Could not upload images to EC2.' }
& scp @sshOptions $ConfigPath "ec2-user@${PublicIp}:/tmp/quizmaster.env"
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Could not upload the private environment file to EC2.' }

$remoteScriptText = @'
set -euo pipefail
sudo install -d -m 700 /opt/quizmaster
sudo install -m 600 /tmp/quizmaster.env /opt/quizmaster/.env
sudo rm -f /tmp/quizmaster.env
sudo docker load --input /tmp/quizmaster-images.tar
sudo rm -f /tmp/quizmaster-images.tar
sudo docker network inspect quizmaster >/dev/null 2>&1 || sudo docker network create quizmaster
sudo docker rm -f quizmaster-backend quizmaster-frontend >/dev/null 2>&1 || true
sudo docker run -d --name quizmaster-backend --restart unless-stopped --network quizmaster --env-file /opt/quizmaster/.env -e FLASK_ENV=production -e FLASK_DEBUG=false -e USE_EVENTLET=true -e HOST=0.0.0.0 -e PORT=5000 -e FRONTEND_URL=__APP_URL__ -e ALLOWED_ORIGINS=__APP_URL__ -p 127.0.0.1:5000:5000 quizmaster-backend:latest
sudo docker run -d --name quizmaster-frontend --restart unless-stopped --network quizmaster -e NODE_ENV=production -e HOSTNAME=0.0.0.0 -e PORT=3000 -p 127.0.0.1:3000:3000 quizmaster-frontend:latest
for n in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:5000/api/health >/dev/null && curl -fsS http://127.0.0.1:3000/ >/dev/null; then exit 0; fi
  sleep 5
done
sudo docker logs --tail 100 quizmaster-backend || true
sudo docker logs --tail 100 quizmaster-frontend || true
exit 1
'@
$remoteScript = $remoteScriptText.Replace('__APP_URL__', $AppUrl)
$sshScriptArgs = @('-i', $KeyPath, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=10', "ec2-user@$PublicIp", 'bash -s')
$remoteScript | & ssh @sshScriptArgs
if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Remote deployment failed. Inspect the instance over SSH or run destroy.ps1 to remove its AWS resources.' }
Remove-Item -LiteralPath $bundlePath -Force -ErrorAction SilentlyContinue
Write-Host "Deployment complete: $AppUrl" -ForegroundColor Green
Write-Host "EC2 instance: $InstanceId ($InstanceType, $Region)"
Write-Host 'Run destroy.ps1 to remove this deployment and stop instance charges.'
