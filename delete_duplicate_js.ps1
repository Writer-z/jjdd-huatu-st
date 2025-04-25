# 获取所有.jsx文件
$jsxFiles = Get-ChildItem -Path "." -Recurse -File -Include "*.jsx"

# 对每个.jsx文件，检查是否存在同名的.js文件，如果有则删除
foreach ($file in $jsxFiles) {
    $jsFile = $file.FullName -replace "\.jsx$", ".js"
    if (Test-Path $jsFile) {
        Write-Output "删除重复文件: $jsFile"
        Remove-Item -Path $jsFile -Force
    }
}

Write-Output "清理完成！" 