# ============================================================
# scripts/wait-dev.ps1
# Aguarda o servidor de desenvolvimento responder em /healthz
# antes de liberar a abertura do navegador (preLaunchTask).
# Faz polling ate receber HTTP 200 ou estourar o timeout.
# ============================================================
param(
    [int]$Port = 3010,
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = 'SilentlyContinue'
# Usa 127.0.0.1 (IPv4) explicitamente: o servidor escuta em 0.0.0.0 (IPv4) e
# 'localhost' pode resolver para ::1 (IPv6), causando timeout no Invoke-WebRequest.
$url = "http://127.0.0.1:$Port/healthz"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

Write-Host "Aguardando servidor em $url ..."

while ((Get-Date) -lt $deadline) {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -eq 200) {
            Write-Host "Servidor online (HTTP 200) — liberando navegador."
            exit 0
        }
    } catch {
        Start-Sleep -Milliseconds 400
    }
}

Write-Error "Timeout: servidor nao respondeu em $url apos $TimeoutSeconds s."
exit 1
