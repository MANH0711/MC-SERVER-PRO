param(
    [Parameter(Position=0)]
    [string]$CustomMessage = ""
)

# ==============================================================================
# SCRIPT TU DONG DAY CODE LEN GITHUB (MC-SERVER-PRO) TUNG BUOC CHI TIET
# Tac gia: MC Server Pro System
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "MC-SERVER-PRO - Git Push Automation Tool"

function Write-StepHeader($stepNum, $stepTitle) {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "  [BUOC $stepNum] : $stepTitle" -ForegroundColor Yellow
    Write-Host "==================================================================" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "  [THANH CONG] $msg" -ForegroundColor Green
}

function Write-Info($msg) {
    Write-Host "  [THONG BAO]  $msg" -ForegroundColor Gray
}

function Write-WarningMsg($msg) {
    Write-Host "  [CANH BAO]   $msg" -ForegroundColor Yellow
}

function Write-ErrorMsg($msg) {
    Write-Host "  [LOI]        $msg" -ForegroundColor Red
}

Clear-Host
Write-Host ""
Write-Host "==================================================================" -ForegroundColor DarkCyan
Write-Host "       CONG CU TU DONG DAY MA NGUON LEN GITHUB (MC-SERVER-PRO)    " -ForegroundColor Cyan
Write-Host "               REPOSITORY: MANH0711 / MC-SERVER-PRO               " -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor DarkCyan

# Dat thu muc lam viec ve dung thu muc du an
Set-Location -Path $PSScriptRoot

# ------------------------------------------------------------------------------
# BUOC 1: KIEM TRA MOI TRUONG GIT VA CAU HINH REMOTE
# ------------------------------------------------------------------------------
Write-StepHeader "1/7" "Kiem tra moi truong Git & Cau hinh Remote Repository"

try {
    $gitVersion = git --version
    Write-Success "Da tim thay Git: $gitVersion"
} catch {
    Write-ErrorMsg "Khong tim thay Git tren he thong! Vui long cai dat Git."
    Read-Host "Nhan Enter de thoat..."
    exit 1
}

# Dam bao remote origin tro dung URL co MANH0711@ de xac thuc tu dong
$currentRemote = git remote get-url origin 2>$null
$expectedRemote = "https://MANH0711@github.com/MANH0711/MC-SERVER-PRO.git"

if ($currentRemote -ne $expectedRemote) {
    Write-Info "Dang cau hinh lai Git Remote: $expectedRemote"
    git remote set-url origin $expectedRemote
    Write-Success "Da cap nhat Remote URL thanh cong."
} else {
    Write-Success "Remote URL hop le: $currentRemote"
}

# Lay ten nhanh lam viec
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    $currentBranch = "main"
}
Write-Success "Nhanh lam viec hien tai: [$currentBranch]"

# ------------------------------------------------------------------------------
# BUOC 2: KIEM TRA TRANG THAI CAC TEP TIN (git status)
# ------------------------------------------------------------------------------
Write-StepHeader "2/7" "Kiem tra danh sach tep tin thay doi (git status)"

$statusOutput = git status --short
if (-not $statusOutput) {
    Write-WarningMsg "Khong co tep tin nao moi can day len GitHub!"
    Write-Info "Ma nguon hien tai da dong bo 100% voi Remote."
    Write-Host ""
    $pullCheck = Read-Host "Ban co muon kiem tra va keo (pull) ma nguon moi nhat ve khong? (Y/N, mac dinh N)"
    if ($pullCheck -eq "Y" -or $pullCheck -eq "y") {
        Write-Info "Dang dong bo tu GitHub..."
        git pull origin $currentBranch
        Write-Success "Dong bo hoan tat."
    }
    Write-Host ""
    Read-Host "Nhan Enter de hoan tat..."
    exit 0
}

Write-Info "Danh sach cac tep tin co thay doi:"
Write-Host ""
$statusOutput | ForEach-Object {
    $line = $_
    if ($line -match "^\s*M" -or $line -match "^M") {
        Write-Host "   [SUA DOI] $line" -ForegroundColor Yellow
    } elseif ($line -match "^\?\?") {
        Write-Host "   [TAO MOI] $line" -ForegroundColor Green
    } elseif ($line -match "^\s*D" -or $line -match "^D") {
        Write-Host "   [DA XOA]  $line" -ForegroundColor Red
    } else {
        Write-Host "   [FILE]    $line" -ForegroundColor White
    }
}
Write-Host ""

# ------------------------------------------------------------------------------
# BUOC 3: THEM CAC TEP TIN VAO HANG DOI LUU TRU (git add .)
# ------------------------------------------------------------------------------
Write-StepHeader "3/7" "Them cac tep tin vao hang doi (git add .)"

Write-Info "Dang thuc hien lenh: git add . ..."
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Success "Da them toan bo tep tin thay doi vao Staging Area."
} else {
    Write-ErrorMsg "Loi khi chay git add. Vui long kiem tra quyen truy cap tep."
    Read-Host "Nhan Enter de thoat..."
    exit 1
}

# ------------------------------------------------------------------------------
# BUOC 4: NHAP THONG DIEP GHI CHU CAP NHAT (COMMIT MESSAGE)
# ------------------------------------------------------------------------------
Write-StepHeader "4/7" "Ghi chu noi dung cap nhat (Commit Message)"

$defaultCommitMsg = "feat: update mc-server-pro $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

if (-not [string]::IsNullOrWhiteSpace($CustomMessage)) {
    $commitMsg = $CustomMessage.Trim()
    Write-Info "Nhan ghi chu tu tham so: '$commitMsg'"
} else {
    Write-Host "  Meo: Nhap noi dung ban vua sua doi." -ForegroundColor DarkGray
    Write-Host "  (Nhan ENTER de su dung ghi chu mac dinh tu dong)" -ForegroundColor DarkGray
    Write-Host ""
    $userMsg = Read-Host "  >> Nhap noi dung commit"
    if ([string]::IsNullOrWhiteSpace($userMsg)) {
        $commitMsg = $defaultCommitMsg
        Write-Info "Su dung ghi chu tu dong: '$commitMsg'"
    } else {
        $commitMsg = $userMsg.Trim()
        Write-Info "Ghi chu ban da nhap: '$commitMsg'"
    }
}

# ------------------------------------------------------------------------------
# BUOC 5: DONG GOI BAN CAP NHAT (git commit)
# ------------------------------------------------------------------------------
Write-StepHeader "5/7" "Tao ban commit dong goi (git commit)"

git commit -m "$commitMsg"
if ($LASTEXITCODE -eq 0) {
    $lastHash = git log -1 --format="%h - %s (%cr)"
    Write-Success "Da tao commit thanh cong:"
    Write-Host "     Hash: $lastHash" -ForegroundColor Cyan
} else {
    Write-WarningMsg "Khong co thay doi moi de commit."
}

# ------------------------------------------------------------------------------
# BUOC 6: DONG BO VOI GITHUB (git pull --rebase)
# ------------------------------------------------------------------------------
Write-StepHeader "6/7" "Kiem tra & dong bo nhanh voi GitHub (git pull --rebase)"

Write-Info "Dang kiem tra cap nhat tu remote origin/$currentBranch..."
git pull --rebase origin $currentBranch 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Dong bo nhanh [$currentBranch] thanh cong, san sang day len."
} else {
    Write-WarningMsg "Nhanh da o trang thai moi nhat hoac khong can rebase. Tiep tuc day code..."
}

# ------------------------------------------------------------------------------
# BUOC 7: DAY MA NGUON LEN GITHUB (git push origin main)
# ------------------------------------------------------------------------------
Write-StepHeader "7/7" "Day ma nguon len GitHub (git push origin $currentBranch)"

Write-Info "Dang day du lieu len: $expectedRemote ..."
$pushOutput = git push origin $currentBranch 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "          DAY CODE LEN GITHUB THANH CONG 100%!                    " -ForegroundColor Green
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Success "Nhanh: [$currentBranch] da duoc cap nhat len GitHub."
    Write-Success "Kho luu tru: https://github.com/MANH0711/MC-SERVER-PRO"
    Write-Host ""
    Write-Host "Chi tiet ket qua:" -ForegroundColor Gray
    Write-Host $pushOutput -ForegroundColor DarkGray
} else {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host "                 DAY CODE THAT BAI! CAN KIEM TRA                  " -ForegroundColor Red
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host ""
    Write-ErrorMsg "Chi tiet loi tu Git:"
    Write-Host $pushOutput -ForegroundColor Yellow
    Write-Host ""
    Write-Info "Huong dan khac phuc:"
    Write-Info "1. Kiem tra ket noi Internet."
    Write-Info "2. Kiem tra token / mat khau GitHub trong Windows Credential Manager."
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Read-Host "Nhan Enter de dong cua so..."
