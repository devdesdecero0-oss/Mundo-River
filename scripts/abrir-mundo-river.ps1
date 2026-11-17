param(
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'

$ProjectDir = Split-Path -Parent $PSScriptRoot
$Url = 'http://localhost:3000'
$Port = 3000

function Test-Port {
    param([int]$PortNumber)

    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect('127.0.0.1', $PortNumber, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne(500)) { return $false }
        $client.EndConnect($async)
        return $true
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Test-Http {
    try {
        $request = [System.Net.HttpWebRequest]::Create($Url)
        $request.Method = 'GET'
        $request.Timeout = 4000
        $request.Proxy = $null
        $response = $request.GetResponse()
        $code = [int]$response.StatusCode
        $response.Close()
        return ($code -ge 200 -and $code -lt 500)
    } catch {
        if ($_.Exception.Response) { return $true }
        return $false
    }
}

function Open-Page {
    if ($NoBrowser) {
        Write-Host 'Modo de prueba: no se abre el navegador.'
        return
    }
    Start-Process $Url | Out-Null
}

Write-Host ''
Write-Host '  MUNDO RIVER - acceso directo' -ForegroundColor White
Write-Host '  ----------------------------------------' -ForegroundColor DarkGray

$alreadyUp = $false
if (Test-Port $Port) {
    $alreadyUp = Test-Http
}
if ($alreadyUp) {
    Write-Host '  El servidor ya esta corriendo.' -ForegroundColor Green
    Write-Host "  Abriendo $Url" -ForegroundColor Green
    Open-Page
    exit 0
}

if (-not (Test-Path (Join-Path $ProjectDir 'node_modules'))) {
    Write-Host '  Faltan las dependencias del proyecto.' -ForegroundColor Yellow
    Write-Host '  Abre una terminal en la carpeta y ejecuta: pnpm install' -ForegroundColor Yellow
    exit 1
}

$pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue

if ($pnpm) {
    $runner = $pnpm.Source
    $arguments = @('dev')
} elseif ($npm) {
    $runner = $npm.Source
    $arguments = @('run', 'dev')
} else {
    Write-Host '  No se encontro pnpm ni npm en el sistema.' -ForegroundColor Red
    exit 1
}

Write-Host '  Iniciando el servidor (puede tardar unos segundos)...' -ForegroundColor Cyan
Start-Process -FilePath $runner -ArgumentList $arguments -WorkingDirectory $ProjectDir -WindowStyle Minimized | Out-Null

$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    if (Test-Http) {
        Write-Host ''
        Write-Host '  Servidor listo.' -ForegroundColor Green
        Write-Host "  Abriendo $Url" -ForegroundColor Green
        Open-Page
        exit 0
    }
    Start-Sleep -Milliseconds 1000
    Write-Host '.' -NoNewline
}

Write-Host ''
Write-Host '  El servidor tardo demasiado en responder.' -ForegroundColor Red
Write-Host '  Revisa la ventana minimizada llamada "Mundo River" o ejecuta pnpm dev.' -ForegroundColor Yellow
exit 1
