Add-Type -AssemblyName System.Drawing
$templatePath = "C:\Users\patrick.parco\Oracle-FAI-Photos\Test Sample PRETEST v2\Template"

foreach ($i in 1..3) {
    $srcFile = Join-Path $templatePath "LS$i.png"
    $dstFile = Join-Path $templatePath "RS$i.png"

    $bmp = New-Object System.Drawing.Bitmap($srcFile)
    $bmp.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
    $bmp.Save($dstFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Host "Created RS$i.png (mirrored from LS$i.png)"
}

Write-Host "Done!"
