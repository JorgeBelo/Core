$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:4174/home'
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js não encontrado. Instale o Node.js e tente novamente.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'apps/mobile/dist/index.html'))) {
    throw 'A versão web precisa ser compilada. Execute pnpm build:web na pasta do projeto.'
}
function Test-CorePreview {
    try {
        $response = Invoke-WebRequest -Uri $previewUrl -TimeoutSec 2 -UseBasicParsing
        return $response.StatusCode -eq 200 -and $response.Content -match '<title>Core'
    } catch { return $false }
}
if (-not (Test-CorePreview)) {
    $logDir = Join-Path $projectRoot 'work'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $server = Start-Process -FilePath $node.Source -ArgumentList @('scripts/serve-web.mjs', '--port', '4174') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'preview.stdout.log') -RedirectStandardError (Join-Path $logDir 'preview.stderr.log') -PassThru
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if (Test-CorePreview) { $ready = $true; break }
        if ($server.HasExited) { break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $ready) { throw 'Não foi possível iniciar o Core. Consulte work/preview.stderr.log na pasta do projeto.' }
}
Start-Process $previewUrl
Write-Host "Core aberto em $previewUrl"
