param(
  [int]$LookbackMinutes = 10,
  [int]$MaxItems = 60
)

$regexPattern = if ($env:OTP_REGEX -and $env:OTP_REGEX.Trim()) { $env:OTP_REGEX.Trim() } else { '(\d{6})' }
$subjectHint = if ($env:OTP_EMAIL_SUBJECT_HINT -and $env:OTP_EMAIL_SUBJECT_HINT.Trim()) { $env:OTP_EMAIL_SUBJECT_HINT.Trim() } else { 'verification' }
$notBeforeIso = if ($env:OTP_NOT_BEFORE_ISO -and $env:OTP_NOT_BEFORE_ISO.Trim()) { $env:OTP_NOT_BEFORE_ISO.Trim() } else { '' }

try {
  $outlook = New-Object -ComObject Outlook.Application
  $namespace = $outlook.GetNamespace('MAPI')
  $inbox = $namespace.GetDefaultFolder(6)
  $items = $inbox.Items
  $items.Sort('[ReceivedTime]', $true)

  $cutoff = (Get-Date).AddMinutes(-1 * $LookbackMinutes)
  if ($notBeforeIso) {
    try {
      $notBefore = [DateTime]::Parse($notBeforeIso).ToLocalTime()
      if ($notBefore -gt $cutoff) {
        $cutoff = $notBefore
      }
    }
    catch {
      # Ignore malformed timestamps and continue with default lookback cutoff.
    }
  }
  $seen = 0

  foreach ($item in $items) {
    if ($seen -ge $MaxItems) { break }
    $seen++

    if (-not $item -or -not $item.ReceivedTime) { continue }
    if ($item.ReceivedTime -lt $cutoff) { break }

    $subject = [string]$item.Subject
    $body = [string]$item.Body

    $subjectEligible = $true
    if ($subjectHint) {
      $subjectEligible = $subject -match [regex]::Escape($subjectHint)
    }

    if ($subjectEligible) {
      $subjectMatch = [regex]::Match($subject, $regexPattern)
      if ($subjectMatch.Success) {
        Write-Output $subjectMatch.Groups[1].Value
        exit 0
      }
    }

    $bodyMatch = [regex]::Match($body, $regexPattern)
    if ($bodyMatch.Success) {
      Write-Output $bodyMatch.Groups[1].Value
      exit 0
    }
  }

  exit 0
}
catch {
  exit 1
}
