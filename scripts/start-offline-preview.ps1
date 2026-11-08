$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:4176'
$node = Get-Command node -ErrorAction Stop
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'apps/offline/dist/index.html'))) {
    throw 'Compile a prévia com pnpm offline:build na raiz do projeto.'
}
try { $ready = (Invoke-WebRequest -Uri $previewUrl -TimeoutSec 2 -UseBasicParsing).StatusCode -eq 200 } catch { $ready = $false }
if (-not $ready) {
    $logDir = Join-Path $projectRoot 'work'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    Start-Process -FilePath $node.Source -ArgumentList @('scripts/serve-web.mjs', '--dir', 'apps/offline/dist', '--port', '4176') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'offline.stdout.log') -RedirectStandardError (Join-Path $logDir 'offline.stderr.log') | Out-Null
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        try { $ready = (Invoke-WebRequest -Uri $previewUrl -TimeoutSec 2 -UseBasicParsing).StatusCode -eq 200 } catch { $ready = $false }
        if ($ready) { break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready) { throw 'Não foi possível iniciar a prévia. Confira work/offline.stderr.log.' }
}
Start-Process $previewUrl
