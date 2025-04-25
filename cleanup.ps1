# Cleanup script for removing frontend-related files
Write-Host "Cleaning up frontend-related files..."

# Remove frontend directories
if (Test-Path "frontend") {
    Remove-Item -Path "frontend" -Recurse -Force
}
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
}
if (Test-Path "static") {
    Remove-Item -Path "static" -Recurse -Force
}
if (Test-Path "templates") {
    Remove-Item -Path "templates" -Recurse -Force
}

# Remove frontend-related files
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force
}

# Clean up brainwave directory
if (Test-Path "brainwave") {
    # Remove frontend-related files from brainwave
    $filesToRemove = @(
        "src",
        "public",
        "tailwind.config.js",
        "vite.config.js",
        "package-lock.json",
        "package.json",
        "postcss.config.js",
        ".eslintrc.cjs",
        "index.html"
    )

    foreach ($file in $filesToRemove) {
        $path = Join-Path "brainwave" $file
        if (Test-Path $path) {
            Remove-Item -Path $path -Recurse -Force
        }
    }
}

Write-Host "Cleanup completed!" 