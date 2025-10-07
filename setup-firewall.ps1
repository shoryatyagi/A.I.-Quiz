# Add Windows Firewall Rule for Node.js
# Run this script as Administrator

Write-Host "Adding Windows Firewall rule for Node.js..." -ForegroundColor Cyan

# Find Node.js executable path
$nodePath = (Get-Command node).Source

if (-not $nodePath) {
    Write-Host "Error: Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "Node.js found at: $nodePath" -ForegroundColor Green

# Remove existing rule if it exists
$existingRule = Get-NetFirewallRule -DisplayName "Node.js Quiz App Server" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "Removing existing firewall rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Node.js Quiz App Server"
}

# Add new firewall rule for inbound connections
try {
    New-NetFirewallRule `
        -DisplayName "Node.js Quiz App Server" `
        -Direction Inbound `
        -Program $nodePath `
        -Action Allow `
        -Profile Private,Public `
        -Protocol TCP `
        -LocalPort 3000 `
        -Description "Allow Node.js server for Quiz App multiplayer"
    
    Write-Host "`nFirewall rule added successfully!" -ForegroundColor Green
    Write-Host "Node.js can now accept connections on port 3000" -ForegroundColor Green
    
} catch {
    Write-Host "`nError: Failed to add firewall rule" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPlease run this script as Administrator" -ForegroundColor Yellow
    exit 1
}

# Display current IP addresses
Write-Host "`nYour IP addresses:" -ForegroundColor Cyan
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object IPAddress, InterfaceAlias | Format-Table

Write-Host "Use one of these IPs in your .env.local file" -ForegroundColor Yellow
Write-Host "Example: NEXT_PUBLIC_WEBSOCKET_URL=http://192.168.1.5:3000" -ForegroundColor Yellow
