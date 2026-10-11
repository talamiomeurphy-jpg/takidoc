# ============================================
# TAKIDOC - AJOUTER LE LIEN JS DU HEADER
# ============================================

$projectRoot = $PSScriptRoot
$htmlFiles = Get-ChildItem -Path $projectRoot -Filter "*.html" -File

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AJOUT DU LIEN JS HEADER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$modifiedCount = 0

foreach ($file in $htmlFiles) {
    Write-Host "Traitement : $($file.Name)" -ForegroundColor White
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # Vérifier si le lien existe déjà
        if ($content -notmatch 'js/header\.js') {
            # Chercher </body>
            if ($content -match '(?i)</body>') {
                $bodyCloseIndex = $content.IndexOf('</body>')
                
                # Insérer les scripts avant </body>
                $scripts = [Environment]::NewLine + "    <!-- HEADER TAKIDOC -->" + [Environment]::NewLine + "    <script src=`"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`"></script>" + [Environment]::NewLine + "    <script src=`"js/header.js`"></script>" + [Environment]::NewLine
                
                $content = $content.Insert($bodyCloseIndex, $scripts)
                
                Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
                Write-Host "   Ajoute avec succes" -ForegroundColor Green
                $modifiedCount++
            } else {
                Write-Host "   Balise /body non trouvee" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   Lien JS deja present" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "   Erreur : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Fichiers modifies : $modifiedCount" -ForegroundColor Green
Write-Host ""
Write-Host "Appuie sur Entree pour fermer..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")