$base = 'http://127.0.0.1:3099'
function T($n, $m, $u, $b) {
    $p = @{ Method = $m; Uri = "$base$u"; SkipHttpErrorCheck = $true }
    if ($b) { $p.Body = ($b | ConvertTo-Json); $p.ContentType = 'application/json' }
    $r = Invoke-WebRequest @p
    $c = $r.Content
    if ($c.Length -gt 90) { $c = $c.Substring(0, 90) }
    Write-Host "[$n] $m $u -> $($r.StatusCode) $c"
}
T 'health' 'GET' '/healthz'
T 'me-old' 'GET' '/api/me'
T 'eventos-old' 'GET' '/api/eventos'
T 'auth-me-nocookie' 'GET' '/api/auth/me'
T 'login-bademail' 'POST' '/api/auth/login' @{ email = 'x@gmail.com'; senha = '12345678' }
T 'login-shortpw' 'POST' '/api/auth/login' @{ email = 'a@faesa.br'; senha = '123' }
T 'login-nodb' 'POST' '/api/auth/login' @{ email = 'a@faesa.br'; senha = '12345678' }
T 'ativar-nodb' 'POST' '/api/auth/ativar' @{ matricula = '23110145'; email = 'a@faesa.br'; senha = '12345678' }
T 'logout' 'POST' '/api/auth/logout'
