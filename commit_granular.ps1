git reset --soft origin/main

$files = git status --porcelain | ForEach-Object {
    $status = $_.Substring(0, 2)
    $file = $_.Substring(3).Trim().Trim('"')
    if ($file -ne '.env' -and $file -notmatch 'scratch') {
        return @{ Status=$status; File=$file }
    }
} | Where-Object { $_ -ne $null }

# Unstage all files first so we can commit them one by one
git reset HEAD

foreach ($item in $files) {
    $file = $item.File
    $status = $item.Status
    
    git add $file
    
    $commitMsg = ""
    if ($status -match "D") {
        $commitMsg = "Delete deprecated file: $file"
    } elseif ($file -match "phyloc_service|phyloc.py|threat_graph") {
        $commitMsg = "feat(backend): Implement Phyloc Intelligence service in $file"
    } elseif ($file -match "phyloc.*\.jsx|phyloc.*\.css") {
        $commitMsg = "feat(ui): Integrate Phyloc V3 component: $(Split-Path $file -Leaf)"
    } elseif ($file -match "phishing_model.pkl") {
        $commitMsg = "feat(ml): Upgrade phishing model to 20 Elite Features (LFS)"
    } elseif ($file -match "README|CHANGELOG|JOURNEY|docs|security.txt") {
        $commitMsg = "docs: Update documentation and rollout logs for V3"
    } elseif ($file -match "package.json|package-lock.json|requirements.txt") {
        $commitMsg = "chore: Bump dependencies for V3 deployment"
    } elseif ($file -match "\.css") {
        $commitMsg = "style: Overhaul UI styling for V3 release in $(Split-Path $file -Leaf)"
    } elseif ($file -match "Admin|Dashboard|Scan|CustomCursor|api.py|live_ai") {
        $commitMsg = "feat(core): Upgrade core component $(Split-Path $file -Leaf) to V3"
    } else {
        $commitMsg = "refactor: Modernize $file for V3 compatibility"
    }

    git commit -m $commitMsg
}

git push origin feature/v3-final-model -f
