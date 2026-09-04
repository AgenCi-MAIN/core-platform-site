param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$dashboardRoot = $PSScriptRoot
$serverPath = Join-Path $dashboardRoot 'server.py'
$dashboardUrl = 'http://127.0.0.1:5001/access'
$runtimeRoot = Join-Path (Split-Path $dashboardRoot -Parent) '.codex-runtime'

function Test-Dashboard {
    try {
        $status = Invoke-RestMethod -Uri 'http://127.0.0.1:5001/api/status' -TimeoutSec 4
        return ($status.scope -eq 'private-local-read-only' -and
                $status.writes_enabled -eq $false -and
                $status.runtime.bind -eq '127.0.0.1:5001' -and
                $status.evidence.source -eq $dashboardRoot)
    } catch { return $false }
}

try {
    $listener = @(Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue)
    if ($listener.Count -gt 0) {
        if (-not (Test-Dashboard)) {
            throw 'Port 5001 is occupied by a different or unhealthy app. Close that app and try again. No process was stopped.'
        }
        Write-Output 'Verified dashboard already running.'
    } else {
        $pythonPath = (Get-Command python -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
        New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
        $process = Start-Process -FilePath $pythonPath -ArgumentList ('"' + $serverPath + '"') `
            -WorkingDirectory $dashboardRoot -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $runtimeRoot "dashboard-$stamp.out.log") `
            -RedirectStandardError (Join-Path $runtimeRoot "dashboard-$stamp.err.log")
        $ready = $false
        for ($attempt = 0; $attempt -lt 12; $attempt++) {
            Start-Sleep -Milliseconds 500
            $process.Refresh()
            if ($process.HasExited) { break }
            if (Test-Dashboard) { $ready = $true; break }
        }
        if (-not $ready) { throw "Dashboard did not become ready. Inspect logs in $runtimeRoot." }
        Write-Output "Verified dashboard started (PID $($process.Id))."
    }
    if (-not $NoBrowser) { Start-Process $dashboardUrl }
} catch {
    if (-not $NoBrowser) {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Personal Control launcher') | Out-Null
    }
    throw
}
