# strip-bom.ps1
# Removes UTF-8 BOM from common text files in this folder tree.

$extensions = @("*.json","*.js","*.jsx","*.ts","*.tsx","*.css","*.html","*.cjs","*.mjs","*.gitignore","*.md")

Get-ChildItem -Recurse -File | Where-Object {
  $name = $_.Name.ToLower()
  ($extensions | ForEach-Object { $name -like $_ }) -contains $true
} | ForEach-Object {
  $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $newBytes = $bytes[3..($bytes.Length-1)]
    [System.IO.File]::WriteAllBytes($_.FullName, $newBytes)
    Write-Host "Stripped BOM:" $_.FullName
  }
}
