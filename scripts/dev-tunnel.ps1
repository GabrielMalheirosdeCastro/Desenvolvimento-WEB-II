# ============================================================
# scripts/dev-tunnel.ps1
# Abre o túnel SSH do Windows 11 para o Postgres da VPS.
# Mantenha este terminal aberto durante o desenvolvimento local.
# ============================================================
# Pré-requisitos:
#   - Cliente OpenSSH instalado no Windows (Configurações ▸ Apps ▸ Recursos opcionais)
#   - Chave SSH cadastrada na VPS (~/.ssh/authorized_keys do root)
#
# Uso:
#   pwsh ./scripts/dev-tunnel.ps1
#   (em outro terminal) npm run dev   # já enxerga DATABASE_URL=...localhost:6543
# ============================================================

[CmdletBinding()]
param(
        [string] $RemoteHost = 'vps.gmcsistemas.com.br',
        [string] $User = 'root',
        [int]    $LocalDirectPort  = 5432,
        [int]    $LocalPoolerPort  = 6543
)

$ErrorActionPreference = 'Stop'

Write-Host "[dev-tunnel] abrindo túnel SSH para $User@$RemoteHost ..." -ForegroundColor Cyan
Write-Host "[dev-tunnel] mapeamentos:"
Write-Host "    localhost:$LocalDirectPort  -> supabase-db:5432       (DIRECT_URL — migrations)"
Write-Host "    localhost:$LocalPoolerPort  -> supabase-pooler:6543   (DATABASE_URL — runtime)"
Write-Host ""
Write-Host "[dev-tunnel] mantenha este terminal aberto. Ctrl+C para encerrar." -ForegroundColor Yellow

# Túneis encadeados em uma única conexão SSH.
& ssh `
        "-L" "${LocalDirectPort}:supabase-db:5432" `
        "-L" "${LocalPoolerPort}:supabase-pooler:6543" `
        "-N" `
        "-o" "ServerAliveInterval=30" `
        "-o" "ExitOnForwardFailure=yes" `
        "$User@$RemoteHost"
