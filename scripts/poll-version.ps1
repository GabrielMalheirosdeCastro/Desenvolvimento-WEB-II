$alvo = '1.7.0'
$url = 'https://acolhimento.faesa.gmcsistemas.com.br/version'
$ok = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri $url -TimeoutSec 8
        Write-Host ("[{0,2}] version={1}" -f $i, $r.version)
        if ($r.version -eq $alvo) { $ok = $true; break }
    } catch {
        Write-Host ("[{0,2}] sem resposta ainda" -f $i)
    }
    Start-Sleep -Seconds 12
}
if ($ok) { Write-Host "PUBLICADO $alvo" } else { Write-Host 'NAO_CONVERGIU' }
