# ============================================================
# scripts/stop-dev.ps1
# Encerra o servidor Express de desenvolvimento que escuta na
# porta informada (default 3010). Usado como postDebugTask do
# VS Code para parar o servidor ao fechar o navegador.
# ============================================================
param(
    [int]$Port = 3010
)

$ErrorActionPreference = 'SilentlyContinue'

$ids = Get-NetTCPConnection -LocalPort $Port -State Listen |
    Select-Object -ExpandProperty OwningProcess -Unique

if ($ids) {
    foreach ($procId in $ids) {
        Stop-Process -Id $procId -Force
    }
    Write-Host "Servidor Express (porta $Port) encerrado."
} else {
    Write-Host "Nenhum processo escutando na porta $Port."
}
