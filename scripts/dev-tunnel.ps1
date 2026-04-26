# ============================================================
# scripts/dev-tunnel.ps1
# Tunel SSH do Windows 11 -> Postgres self-hosted na VPS
# ============================================================
# CONTEXTO
#   O Postgres da VPS (vps.gmcsistemas.com.br / 187.77.47.53)
#   roda dentro da rede Docker `supabase_default` e NAO eh
#   publicado no host. Para acessa-lo via SSH, mantemos dois
#   containers `socat` no servidor que expoem em loopback:
#       127.0.0.1:15432  ->  supabase-pooler:6543  (Supavisor)
#       127.0.0.1:15433  ->  supabase-db:5432      (Postgres direto)
#
#   Este script abre um tunel SSH local mapeando:
#       localhost:6543 (Windows) -> 127.0.0.1:15432 (VPS)
#       localhost:5432 (Windows) -> 127.0.0.1:15433 (VPS)
#
#   Assim, no .env.local use:
#       DATABASE_URL=postgresql://postgres.gmc:SENHA@localhost:6543/postgres?pgbouncer=true
#       DIRECT_URL=postgresql://postgres:SENHA@localhost:5432/postgres
#
# PRE-REQUISITOS
#   - Cliente OpenSSH instalado no Windows
#       (Configuracoes > Aplicativos > Recursos opcionais > "Cliente OpenSSH")
#   - Acesso SSH liberado para o usuario (chave SSH OU senha).
#   - Os containers proxy `pg-tunnel-pooler` e `pg-tunnel-db` rodando na VPS
#       (provisionamento documentado em docs/setup-desenvolvimento-windows.md).
#
# USO
#   pwsh ./scripts/dev-tunnel.ps1                      # usa chave SSH (recomendado)
#   pwsh ./scripts/dev-tunnel.ps1 -UsePassword         # solicita senha interativa
#   pwsh ./scripts/dev-tunnel.ps1 -EnsureProxy         # checa se o socat existe na VPS
# ============================================================

[CmdletBinding()]
param(
    [string] $RemoteHost       = '187.77.47.53',
    [string] $User             = 'root',
    [int]    $LocalDirectPort  = 5432,
    [int]    $LocalPoolerPort  = 6543,
    [int]    $RemoteDirectPort = 15433,
    [int]    $RemotePoolerPort = 15432,
    [switch] $UsePassword,
    [switch] $EnsureProxy
)

$ErrorActionPreference = 'Stop'

function Write-Section($t) {
    Write-Host ""
    Write-Host "-- $t --" -ForegroundColor Cyan
}

Write-Section "Tunel SSH FAESA -> $User@$RemoteHost"
Write-Host "Mapeamentos:"
Write-Host "  localhost:$LocalDirectPort   ->  VPS 127.0.0.1:$RemoteDirectPort  (supabase-db,    DIRECT_URL)"
Write-Host "  localhost:$LocalPoolerPort   ->  VPS 127.0.0.1:$RemotePoolerPort  (supabase-pooler, DATABASE_URL)"

# Sanity check: portas locais livres?
foreach ($p in @($LocalDirectPort, $LocalPoolerPort)) {
    $busy = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($busy) {
        Write-Warning "Porta local $p ja esta em uso (provavelmente Postgres local). Encerre o servico ou troque o parametro."
        exit 2
    }
}

# Validacao opcional dos containers proxy na VPS
if ($EnsureProxy) {
    Write-Section "Validando containers proxy na VPS"
    & ssh "$User@$RemoteHost" "docker ps --filter name=pg-tunnel --format '{{.Names}}: {{.Status}}'"
    Write-Host ""
    Write-Host "Se algum container faltar, rode na VPS UMA VEZ:"
    Write-Host "  docker run -d --name pg-tunnel-pooler --restart=unless-stopped --network supabase_default \"
    Write-Host "    -p 127.0.0.1:${RemotePoolerPort}:${RemotePoolerPort} alpine/socat \"
    Write-Host "    -d -d TCP-LISTEN:${RemotePoolerPort},fork,reuseaddr TCP:supabase-pooler:6543"
    Write-Host "  docker run -d --name pg-tunnel-db --restart=unless-stopped --network supabase_default \"
    Write-Host "    -p 127.0.0.1:${RemoteDirectPort}:${RemoteDirectPort} alpine/socat \"
    Write-Host "    -d -d TCP-LISTEN:${RemoteDirectPort},fork,reuseaddr TCP:supabase-db:5432"
}

Write-Section "Abrindo tunel (Ctrl+C para encerrar)"

$sshArgs = @(
    "-N",
    "-L", "${LocalDirectPort}:127.0.0.1:${RemoteDirectPort}",
    "-L", "${LocalPoolerPort}:127.0.0.1:${RemotePoolerPort}",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=3",
    "-o", "ExitOnForwardFailure=yes"
)

if ($UsePassword) {
    Write-Host "Modo SENHA: o sshd ira solicitar a senha do usuario '$User' interativamente."
    Write-Host "  (Recomendado configurar chave SSH para evitar prompts e permitir reconexao.)"
} else {
    $sshArgs += @("-o", "BatchMode=yes")
}

& ssh @sshArgs "$User@$RemoteHost"
