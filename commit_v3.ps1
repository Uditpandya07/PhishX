$files = git status -s | Where-Object { $_ -match "^ M " -or $_ -match "^M  " -or $_ -match "^\?\? " -or $_ -match "^ D " -or $_ -match "^D  " }
foreach ($line in $files) {
    $status = $line.Substring(0, 2)
    $file = $line.Substring(3).Trim()
    
    if ($file -match 'scratch' -or $file -match '\.env') {
        continue
    }

    git add $file
    
    $commitMsg = ""
    if ($status -match "D") {
        $commitMsg = "Delete deprecated file: $file"
    } elseif ($file -match "phyloc") {
        $commitMsg = "feat(phyloc): Integrate $file into V3 architecture"
    } elseif ($file -match "README|CHANGELOG|JOURNEY|readme") {
        $commitMsg = "docs: Update $file for V3 rollout"
    } elseif ($file -match "\.css") {
        $commitMsg = "style: Enhance UI and animations in $file"
    } elseif ($file -match "\.jsx") {
        $commitMsg = "feat(ui): Upgrade $file for V3 premium design"
    } elseif ($file -match "backend") {
        $commitMsg = "feat(backend): Optimize $file for V3 heuristics"
    } elseif ($file -match "model") {
        $commitMsg = "feat(ml): Upgrade $file to 20 Elite Features"
    } else {
        $commitMsg = "chore: Update $file for V3 release"
    }

    git commit -m $commitMsg
}

git push origin HEAD
