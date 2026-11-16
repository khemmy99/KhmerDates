# Publishes a KCalendar installer zip to Cloudflare (R2 bucket + kcalendar-updates Worker).
#
#   powershell -ExecutionPolicy Bypass -File publish.ps1 -Version 2026.11.16 -Zip C:\path\KCalendar-Install.zip
#   powershell -ExecutionPolicy Bypass -File publish.ps1 -DeployOnly      (bucket + Worker only)
#
# 1. creates the R2 bucket and deploys the Worker if needed (skip with -SkipDeploy)
# 2. uploads the zip as v<Version>/KCalendar-Install.zip
# 3. uploads latest.json LAST, so the stable link never points at a missing file
# 4. checks the live links return exactly this file
# Then point docs/kcalendar/version.json "download" at the printed versioned link.
param(
    [string]$Version,
    [string]$Zip,
    [switch]$SkipDeploy,
    [switch]$DeployOnly,
    # wrangler login used for this account, kept apart from the default login
    # (created once with:  npx wrangler auth create kcalendar)
    [string]$AuthProfile = "kcalendar"
)
$ErrorActionPreference = "Stop"
$bucket = "kcalendar-releases"
$base = "https://kcalendar-updates.my-khem-ebm.workers.dev"
if (-not $DeployOnly) {
    # Exactly yyyy.mm.dd: installed KCalendar ignores anything not matching "####.##.##"
    # (FetchUpdateInfo), so 2026.1.5 would never be offered to anyone.
    if ($Version -notmatch '^\d{4}\.\d{2}\.\d{2}$') { throw "-Version must be yyyy.mm.dd with two-digit month and day, e.g. 2026.11.16" }
    if (-not $Zip) { throw "-Zip is required" }
    $zipPath = (Resolve-Path $Zip).Path
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $z = [IO.Compression.ZipFile]::OpenRead($zipPath)
    try { $names = @($z.Entries | ForEach-Object { $_.FullName -replace '\\', '/' }) } finally { $z.Dispose() }
    if (-not ($names -match 'KCalendar\.xlam$')) { throw "$zipPath does not contain KCalendar.xlam" }
}

Set-Location $PSScriptRoot
# npx.cmd, not the npx.ps1 shim: the shim can lose wrangler's exit code, so failures went unnoticed.
# Every command names the auth profile, so the default wrangler login (other projects) is never used here.
function Wrangler { & npx.cmd --yes wrangler@4 @args --profile $AuthProfile; if ($LASTEXITCODE -ne 0) { throw "wrangler $($args -join ' ') failed (exit $LASTEXITCODE)" } }

# Stop unless the profile can reach the account wrangler.toml is pinned to (asked of Cloudflare itself).
$account = ([regex]'(?m)^\s*account_id\s*=\s*"([0-9a-f]{32})"').Match((Get-Content (Join-Path $PSScriptRoot "wrangler.toml") -Raw)).Groups[1].Value
$raw = (& npx.cmd --yes wrangler@4 auth token --profile $AuthProfile 2>&1) | Out-String
$token = ([regex]'[A-Za-z0-9_\-\.]{30,}').Matches($raw) | Select-Object -Last 1 | ForEach-Object { $_.Value }
$ids = @()
if ($token) { try { $ids = @((Invoke-RestMethod "https://api.cloudflare.com/client/v4/accounts?per_page=50" -Headers @{ Authorization = "Bearer $token" }).result.id) } catch {} }
if ($ids -notcontains $account) {
    throw "The wrangler profile '$AuthProfile' cannot reach Cloudflare account $account (the one that owns my-khem-ebm.workers.dev). Run:  npx wrangler auth create $AuthProfile  and sign in with that account (a private browser window helps), then run this again."
}

if (-not $SkipDeploy) {
    $list = (& npx.cmd --yes wrangler@4 r2 bucket list --profile $AuthProfile 2>&1) | Out-String
    if ($LASTEXITCODE -ne 0) { throw "Could not list R2 buckets:`n$list" }
    if ($list -notmatch "(?m)name:\s+$bucket\s*$") { Wrangler r2 bucket create $bucket }
    Wrangler deploy
}
if ($DeployOnly) {
    # Our Worker answers unknown files with exactly "Not found"; Cloudflare's "no such Worker" page does not.
    # curl.exe, because Windows PowerShell 5.1 can lose the body of a 404. A new Worker may need a few seconds.
    for ($i = 1; $i -le 6; $i++) {
        $code = & curl.exe -s -o NUL -w "%{http_code}" --max-time 30 "$base/latest.json"
        $body = & curl.exe -s --max-time 30 "$base/latest.json"
        if ($code -eq "200") { "Live: $base (a release is already published)"; return }
        if ($code -eq "404" -and $body -eq "Not found") { "Live: $base (Worker running; no release published yet)"; return }
        Start-Sleep -Seconds 5
    }
    throw "The Worker is not answering at $base (HTTP $code): $body"
}

Wrangler r2 object put "$bucket/v$Version/KCalendar-Install.zip" --file $zipPath --content-type "application/zip" --remote
$tmp = Join-Path ([IO.Path]::GetTempPath()) "kcalendar-latest.json"
[IO.File]::WriteAllText($tmp, ('{"version":"' + $Version + '","published":"' + (Get-Date -Format "yyyy-MM-dd") + '"}'), (New-Object Text.UTF8Encoding $false))
try { Wrangler r2 object put "$bucket/latest.json" --file $tmp --content-type "application/json" --remote } finally { Remove-Item $tmp -ErrorAction SilentlyContinue }

# check what the world now gets
$size = (Get-Item $zipPath).Length
$versioned = "$base/v$Version/KCalendar-Install.zip"
$stable = "$base/KCalendar-Install.zip"
foreach ($u in $versioned, $stable) {
    $r = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing
    if ([long]$r.Headers["Content-Length"] -ne $size) { throw "$u returned $($r.Headers['Content-Length']) bytes, expected $size" }
}
$latest = Invoke-RestMethod "$base/latest.json"
if ($latest.version -ne $Version) { throw "latest.json says $($latest.version), expected $Version" }
""
"Published KCalendar $Version ($size bytes)"
"  download page link : $stable"
"  version.json link  : $versioned"
