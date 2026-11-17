Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()
$script:Log = New-Object System.Collections.Generic.List[string]
$script:Busy = $false
function Add-Log([string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  $script:Log.Add($line); $logBox.AppendText($line + [Environment]::NewLine)
}
function Save-Report {
  $dir = Join-Path ([Environment]::GetFolderPath('Desktop')) 'SAHROUD-WINDOWS-DOCTOR-Reports'
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  $file = Join-Path $dir ("Doctor-{0}.txt" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
  $script:Log | Set-Content -LiteralPath $file -Encoding UTF8
  Add-Log "گزارش ذخیره شد: $file"
}
function Run-Admin([string]$Command, [string]$Title) {
  if ($script:Busy) { return }; $script:Busy = $true; Add-Log "درخواست مجوز مدیر: $Title"
  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
  try { $p = Start-Process "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $encoded" -Verb RunAs -Wait -PassThru; Add-Log "$Title پایان یافت. کد خروج: $($p.ExitCode)" }
  catch { Add-Log "عملیات لغو شد یا خطا داشت: $($_.Exception.Message)" }
  finally { $script:Busy = $false }
}
function Run-ReadOnly([scriptblock]$Action,[string]$Title) {
  Add-Log "شروع بررسی: $Title"
  try { & $Action | Out-String -Width 180 | ForEach-Object { if ($_.Trim()) { Add-Log $_.TrimEnd() } } } catch { Add-Log "خطا: $($_.Exception.Message)" }
}
$form=New-Object Windows.Forms.Form
$form.Text='SAHROUD WINDOWS DOCTOR 1.0.0'; $form.Size=New-Object Drawing.Size(1080,720); $form.MinimumSize=New-Object Drawing.Size(900,620); $form.StartPosition='CenterScreen'; $form.RightToLeft='Yes'; $form.RightToLeftLayout=$true; $form.BackColor=[Drawing.Color]::FromArgb(242,246,250)
$header=New-Object Windows.Forms.Label; $header.Text="SAHROUD WINDOWS DOCTOR"+[Environment]::NewLine+"مرکز تشخیص، نگهداری و تعمیر ویندوز"; $header.Font=New-Object Drawing.Font('Tahoma',18,[Drawing.FontStyle]::Bold); $header.ForeColor=[Drawing.Color]::FromArgb(20,42,67); $header.Location=New-Object Drawing.Point(25,18); $header.Size=New-Object Drawing.Size(1000,65); $form.Controls.Add($header)
$menu=New-Object Windows.Forms.Panel; $menu.Location=New-Object Drawing.Point(820,100); $menu.Size=New-Object Drawing.Size(220,550); $form.Controls.Add($menu)
$logBox=New-Object Windows.Forms.TextBox; $logBox.Location=New-Object Drawing.Point(25,100); $logBox.Size=New-Object Drawing.Size(775,550); $logBox.Multiline=$true; $logBox.ReadOnly=$true; $logBox.ScrollBars='Both'; $logBox.Font=New-Object Drawing.Font('Consolas',9); $logBox.RightToLeft='No'; $form.Controls.Add($logBox)
function Add-Button([string]$Text,[int]$Y,[scriptblock]$Click,[bool]$Danger=$false) {
 $b=New-Object Windows.Forms.Button; $b.Text=$Text; $b.Location=New-Object Drawing.Point(5,$Y); $b.Size=New-Object Drawing.Size(205,40); $b.Font=New-Object Drawing.Font('Tahoma',9,[Drawing.FontStyle]::Bold); $b.FlatStyle='Flat'; if($Danger){$b.BackColor=[Drawing.Color]::MistyRose}else{$b.BackColor=[Drawing.Color]::White}; $b.Add_Click($Click); $menu.Controls.Add($b)
}
Add-Button 'بررسی وضعیت سیستم' 5 { Run-ReadOnly { Get-CimInstance Win32_OperatingSystem | Select Caption,Version,OSArchitecture,LastBootUpTime; Get-CimInstance Win32_Processor | Select Name,LoadPercentage; Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select DeviceID,@{N='FreeGB';E={[math]::Round($_.FreeSpace/1GB,2)}},@{N='SizeGB';E={[math]::Round($_.Size/1GB,2)}} } 'مشخصات سیستم' }
Add-Button 'بررسی RAM و برنامه‌های شروع' 50 { Run-ReadOnly { Get-CimInstance Win32_StartupCommand | Select Name,Location,Command; Get-CimInstance Win32_OperatingSystem | Select @{N='TotalRAM_GB';E={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}},@{N='FreeRAM_GB';E={[math]::Round($_.FreePhysicalMemory/1MB,2)}} } 'RAM و Startup' }
Add-Button 'ترمیم ویندوز (DISM)' 95 { if([Windows.Forms.MessageBox]::Show('DISM ممکن است چندین دقیقه طول بکشد. ادامه؟','تأیید',[Windows.Forms.MessageBoxButtons]::YesNo) -eq 'Yes'){Run-Admin 'DISM.exe /Online /Cleanup-Image /RestoreHealth' 'DISM'} }
Add-Button 'بررسی و ترمیم فایل‌ها (SFC)' 140 { if([Windows.Forms.MessageBox]::Show('اجرای SFC را تأیید می‌کنید؟','تأیید',[Windows.Forms.MessageBoxButtons]::YesNo) -eq 'Yes'){Run-Admin 'sfc.exe /scannow' 'SFC'} }
Add-Button 'بررسی دیسک C:' 185 { Run-Admin 'chkdsk.exe C: /scan' 'CHKDSK Scan' }
Add-Button 'پاک‌سازی فایل‌های موقت' 230 { if([Windows.Forms.MessageBox]::Show('فقط TEMP کاربر جاری پاک می‌شود؛ فایل‌های قفل‌شده رد می‌شوند. ادامه؟','تأیید',[Windows.Forms.MessageBoxButtons]::YesNo) -eq 'Yes'){ $n=0; Get-ChildItem -LiteralPath $env:TEMP -Force -ErrorAction SilentlyContinue | ForEach-Object {try{Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop;$n++}catch{}}; Add-Log "موارد حذف‌شده: $n" } }
Add-Button 'بررسی Microsoft Defender' 275 { Run-ReadOnly { if(Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue){Get-MpComputerStatus | Select AntivirusEnabled,RealTimeProtectionEnabled,AntivirusSignatureLastUpdated}else{'اطلاعات Defender در دسترس نیست.'} } 'وضعیت Defender' }
Add-Button 'به‌روزرسانی Defender' 320 { if([Windows.Forms.MessageBox]::Show('برای دریافت امضاهای جدید اینترنت لازم است. ادامه؟','تأیید',[Windows.Forms.MessageBoxButtons]::YesNo) -eq 'Yes'){Run-Admin 'Update-MpSignature' 'Defender Update'} }
Add-Button 'پاک‌سازی DNS' 365 { if([Windows.Forms.MessageBox]::Show('کش DNS پاک شود؟','تأیید',[Windows.Forms.MessageBoxButtons]::YesNo) -eq 'Yes'){Run-Admin 'ipconfig.exe /flushdns' 'Flush DNS'} }
Add-Button 'بازنشانی شبکه (حساس)' 410 { if([Windows.Forms.MessageBox]::Show('Winsock بازنشانی می‌شود و شاید Restart لازم باشد. ادامه؟','هشدار',[Windows.Forms.MessageBoxButtons]::YesNo,[Windows.Forms.MessageBoxIcon]::Warning) -eq 'Yes'){Run-Admin 'netsh.exe winsock reset' 'Winsock Reset'} } $true
Add-Button 'ذخیره گزارش' 455 { Save-Report }
Add-Button 'بازکردن Task Manager' 500 { Start-Process taskmgr.exe }
Add-Log 'برنامه آماده است. ابتدا بررسی وضعیت سیستم را اجرا کنید.'
[void]$form.ShowDialog()
