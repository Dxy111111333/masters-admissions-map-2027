$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$NodeExecutable = "C:\Users\Du\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$SiteUrl = "http://127.0.0.1:52837/"

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "out\index.html"))) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show("网站还没有完成构建，请先联系 Codex 重新生成。", "留学罗盘") | Out-Null
  exit 1
}

if (-not (Test-Path -LiteralPath $NodeExecutable)) {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($null -eq $NodeCommand) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show("未找到本机 Node.js，暂时无法启动网站。", "留学罗盘") | Out-Null
    exit 1
  }
  $NodeExecutable = $NodeCommand.Source
}

$ServerReady = $false
try {
  $Response = Invoke-WebRequest -Uri $SiteUrl -UseBasicParsing -TimeoutSec 1
  $ServerReady = $Response.StatusCode -eq 200
} catch {
  $ServerReady = $false
}

if (-not $ServerReady) {
  Start-Process -FilePath $NodeExecutable -ArgumentList "scripts\serve-static.mjs" -WorkingDirectory $ProjectRoot -WindowStyle Hidden
  for ($Attempt = 0; $Attempt -lt 20; $Attempt++) {
    Start-Sleep -Milliseconds 150
    try {
      $Response = Invoke-WebRequest -Uri $SiteUrl -UseBasicParsing -TimeoutSec 1
      if ($Response.StatusCode -eq 200) {
        $ServerReady = $true
        break
      }
    } catch {
      continue
    }
  }
}

if (-not $ServerReady) {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show("网站服务没有成功启动，请联系 Codex 检查。", "留学罗盘") | Out-Null
  exit 1
}

$EdgeCandidates = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)
$EdgeExecutable = $EdgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if ($EdgeExecutable) {
  Start-Process -FilePath $EdgeExecutable -ArgumentList @("--new-tab", $SiteUrl)
} else {
  Start-Process $SiteUrl
}
