# ============================================
# TAKIDOC - SCRIPT DE MISE À JOUR DES HEADERS
# L'équipe Meurphy - 2026
# ============================================

# Configuration
$projectRoot = $PSScriptRoot
$htmlFiles = Get-ChildItem -Path $projectRoot -Filter "*.html" -File
$backupFolder = Join-Path $projectRoot "_headers_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Créer le dossier de sauvegarde
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TAKIDOC - MISE À JOUR DES HEADERS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dossier du projet : $projectRoot" -ForegroundColor Yellow
Write-Host "Sauvegarde dans   : $backupFolder" -ForegroundColor Yellow
Write-Host "Fichiers trouvés  : $($htmlFiles.Count)" -ForegroundColor Yellow
Write-Host ""

$modifiedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($file in $htmlFiles) {
    Write-Host "Traitement : $($file.Name)" -ForegroundColor White
    
    try {
        # Lire le contenu
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # Sauvegarder l'original
        $backupPath = Join-Path $backupFolder $file.Name
        Copy-Item -Path $file.FullName -Destination $backupPath -Force
        
        $originalContent = $content
        $fileModified = $false
        
        # ============================================
        # ÉTAPE 1 : Supprimer les anciens headers
        # ============================================
        
        # Pattern 1 : header class="app-header"
        $content = $content -replace '(?s)<header\s+class="app-header".*?</header>', ''
        
        # Pattern 2 : header class="editor-header"
        $content = $content -replace '(?s)<header\s+class="editor-header".*?</header>', ''
        
        # Pattern 3 : header class="td-top"
        $content = $content -replace '(?s)<header\s+class="td-top".*?</header>', ''
        
        # Pattern 4 : Tout header restant
        $content = $content -replace '(?s)<header\s[^>]*>.*?</header>', ''
        
        # Pattern 5 : header sans attributs
        $content = $content -replace '(?s)<header>.*?</header>', ''
        
        # Nettoyer les lignes vides multiples
        $content = $content -replace '(\r?\n){3,}', "`r`n`r`n"
        
        # ============================================
        # ÉTAPE 2 : Insérer le nouveau conteneur
        # ============================================
        
        # Chercher la position après <body>
        $bodyTagPattern = '(?i)<body[^>]*>'
        
        if ($content -match $bodyTagPattern) {
            $bodyMatch = $Matches[0]
            $bodyIndex = $content.IndexOf($bodyMatch)
            $afterBody = $bodyIndex + $bodyMatch.Length
            
            # Insérer juste après <body> - Utilisation de [Environment]::NewLine
            $newHeader = [Environment]::NewLine + "    <!-- HEADER DYNAMIQUE TAKIDOC -->" + [Environment]::NewLine + "    <div id=`"td-header-container`"></div>" + [Environment]::NewLine
            $content = $content.Insert($afterBody, $newHeader)
            $fileModified = $true
        } else {
            Write-Host "   Balise body non trouvee !" -ForegroundColor Yellow
        }
        
        # ============================================
        # ÉTAPE 3 : Ajouter le lien CSS dans le <head>
        # ============================================
        
        $cssLink = '    <!-- HEADER TAKIDOC -->' + [Environment]::NewLine + '    <link rel="stylesheet" href="css/header.css">'
        
        # Chercher la balise fermante </head>
        $headClosePattern = '(?i)</head>'
        
        if ($content -match $headClosePattern) {
            $headCloseIndex = $content.IndexOf('</head>')
            
            # Vérifier si le lien existe déjà
            if ($content -notmatch 'css/header\.css') {
                $content = $content.Insert($headCloseIndex, $cssLink + [Environment]::NewLine)
                $fileModified = $true
            } else {
                Write-Host "   Lien CSS deja present" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "   Balise /head non trouvee !" -ForegroundColor Yellow
        }
        
        # ============================================
        # ÉTAPE 4 : Sauvegarder si modifié
        # ============================================
        
        if ($fileModified -and $content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "   Modifie avec succes" -ForegroundColor Green
            $modifiedCount++
        } else {
            Write-Host "   Aucun changement necessaire" -ForegroundColor DarkGray
            $skippedCount++
        }
        
    } catch {
        Write-Host "   Erreur : $_" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

# ============================================
# RAPPORT FINAL
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RAPPORT FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichiers modifies : $modifiedCount" -ForegroundColor Green
Write-Host "Fichiers ignores  : $skippedCount" -ForegroundColor Yellow
Write-Host "Erreurs           : $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { 'Red' } else { 'Green' })
Write-Host ""
Write-Host "Sauvegarde des originaux : $backupFolder" -ForegroundColor Blue
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "TOUT EST PARFAIT ! Tu peux tester ton site." -ForegroundColor Green
} else {
    Write-Host "Il y a eu des erreurs. Verifie les fichiers concernes." -ForegroundColor Yellow
    Write-Host "Tu peux restaurer depuis : $backupFolder" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuie sur Entree pour fermer..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")