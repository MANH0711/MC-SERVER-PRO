param(
    [Parameter(Position=0)]
    [string]$CustomMessage = ""
)

﻿# ==============================================================================
# SCRIPT TỰ ĐỘNG ĐẨY CODE LÊN GITHUB (MC-SERVER-PRO) TỪNG BƯỚC CHI TIẾT
# Tác giả: MC Server Pro System
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "MC-SERVER-PRO - Git Push Automation Tool"

function Write-StepHeader($stepNum, $stepTitle) {
    Write-Host ""
    Write-Host "══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  [BƯỚC $stepNum] : $stepTitle" -ForegroundColor Yellow -NoNewline
    Write-Host ""
    Write-Host "══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "  [THÀNH CÔNG] $msg" -ForegroundColor Green
}

function Write-Info($msg) {
    Write-Host "  [THÔNG BÁO]  $msg" -ForegroundColor Gray
}

function Write-WarningMsg($msg) {
    Write-Host "  [CẢNH BÁO]   $msg" -ForegroundColor Yellow
}

function Write-ErrorMsg($msg) {
    Write-Host "  [LỖI]        $msg" -ForegroundColor Red
}

Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor DarkCyan
Write-Host "║           CÔNG CỤ TỰ ĐỘNG ĐẨY MÃ NGUỒN LÊN GITHUB                ║" -ForegroundColor Cyan
Write-Host "║               DỰ ÁN: MANH0711 / MC-SERVER-PRO                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor DarkCyan

# Đặt thư mục làm việc về đúng thư mục dự án
Set-Location -Path $PSScriptRoot

# ------------------------------------------------------------------------------
# BƯỚC 1: KIỂM TRA MÔI TRƯỜNG GIT VÀ CẤU HÌNH REMOTE REPOSITORY
# ------------------------------------------------------------------------------
Write-StepHeader "1/7" "Kiểm tra môi trường Git & Cấu hình Remote"

try {
    $gitVersion = git --version
    Write-Success "Đã tìm thấy Git: $gitVersion"
} catch {
    Write-ErrorMsg "Không tìm thấy Git trên máy tính! Vui lòng cài đặt Git và thử lại."
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

# Đảm bảo remote origin trỏ đúng URL với username MANH0711 để xác thực mượt mà
$currentRemote = git remote get-url origin 2>$null
$expectedRemote = "https://MANH0711@github.com/MANH0711/MC-SERVER-PRO.git"

if ($currentRemote -ne $expectedRemote) {
    Write-Info "Đang cấu hình lại URL Remote tối ưu: $expectedRemote"
    git remote set-url origin $expectedRemote
    Write-Success "Đã cập nhật Git Remote URL thành công."
} else {
    Write-Success "Git Remote URL hợp lệ: $currentRemote"
}

# Lấy tên nhánh hiện tại
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    $currentBranch = "main"
}
Write-Success "Nhánh làm việc hiện tại: [$currentBranch]"

# ------------------------------------------------------------------------------
# BƯỚC 2: KIỂM TRA CÁC TỆP TIN THAY ĐỔI TRONG DỰ ÁN
# ------------------------------------------------------------------------------
Write-StepHeader "2/7" "Kiểm tra danh sách tệp tin thay đổi (git status)"

$statusOutput = git status --short
if (-not $statusOutput) {
    Write-WarningMsg "Không có bất kỳ thay đổi nào mới cần đẩy lên GitHub!"
    Write-Info "Mã nguồn hiện tại đã đồng bộ 100% với Remote."
    Write-Host ""
    $forceSync = Read-Host "Bạn có muốn kiểm tra và kéo (pull) bản mới nhất về không? (Y/N, mặc định N)"
    if ($forceSync -eq "Y" -or $forceSync -eq "y") {
        Write-Info "Đang kéo mã nguồn mới nhất từ remote..."
        git pull origin $currentBranch
        Write-Success "Đã đồng bộ xong."
    }
    Write-Host ""
    Read-Host "Nhấn Enter để hoàn tất..."
    exit 0
}

Write-Info "Danh sách các tệp có thay đổi:"
Write-Host ""
$statusOutput | ForEach-Object {
    $line = $_
    if ($line -match "^\s*M" -or $line -match "^M") {
        Write-Host "   [SỬA ĐỔI] $line" -ForegroundColor Yellow
    } elseif ($line -match "^\?\?") {
        Write-Host "   [TẠO MỚI] $line" -ForegroundColor Green
    } elseif ($line -match "^\s*D" -or $line -match "^D") {
        Write-Host "   [ĐÃ XÓA]  $line" -ForegroundColor Red
    } else {
        Write-Host "   [FILE]    $line" -ForegroundColor White
    }
}
Write-Host ""

# ------------------------------------------------------------------------------
# BƯỚC 3: THÊM CÁC TỆP TIN VÀO DANH SÁCH CHỜ LƯU (git add .)
# ------------------------------------------------------------------------------
Write-StepHeader "3/7" "Thêm các tệp tin vào hàng đợi lưu trữ (git add .)"

Write-Info "Đang thực hiện lệnh: git add . ..."
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Success "Đã thêm toàn bộ tệp tin thay đổi vào Staging Area."
} else {
    Write-ErrorMsg "Lỗi khi chạy git add. Vui lòng kiểm tra quyền tệp tin."
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

# ------------------------------------------------------------------------------
# BƯỚC 4: NHẬP THÔNG ĐIỆP GHI CHÚ BẢN CẬP NHẬT (COMMIT MESSAGE)
# ------------------------------------------------------------------------------
Write-StepHeader "4/7" "Nhập thông điệp ghi chú bản cập nhật (Commit Message)"

$defaultCommitMsg = "feat: update mc-server-pro $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "  Mẹo: Nhập ghi chú chi tiết về các thay đổi bạn vừa thực hiện." -ForegroundColor DarkGray
Write-Host "  (Hoặc nhấn [ENTER] để sử dụng ghi chú tự động mặc định)" -ForegroundColor DarkGray
Write-Host ""
if (-not [string]::IsNullOrWhiteSpace($CustomMessage)) {
    $userMsg = $CustomMessage
    Write-Info "Nhận ghi chú từ tham số: '$CustomMessage'"
} else {
    $userMsg = Read-Host "  >> Nhập nội dung commit"
}

if ([string]::IsNullOrWhiteSpace($userMsg)) {
    $commitMsg = $defaultCommitMsg
    Write-Info "Sử dụng ghi chú tự động: '$commitMsg'"
} else {
    $commitMsg = $userMsg.Trim()
    Write-Info "Ghi chú cập nhật: '$commitMsg'"
}

# ------------------------------------------------------------------------------
# BƯỚC 5: THỰC HIỆN ĐÓNG GÓI BẢN CẬP NHẬT (git commit)
# ------------------------------------------------------------------------------
Write-StepHeader "5/7" "Đóng gói bản cập nhật vào Git (git commit)"

git commit -m "$commitMsg"
if ($LASTEXITCODE -eq 0) {
    $lastHash = git log -1 --format="%h - %s (%cr)"
    Write-Success "Đã tạo bản commit thành công:"
    Write-Host "     Hash: $lastHash" -ForegroundColor Cyan
} else {
    Write-WarningMsg "Không tạo được commit (có thể không có thay đổi nội dung)."
}

# ------------------------------------------------------------------------------
# BƯỚC 6: ĐỒNG BỘ VỚI BẢN MỚI TRÊN REMOTE (git pull --rebase)
# ------------------------------------------------------------------------------
Write-StepHeader "6/7" "Kiểm tra và đồng bộ nhánh từ GitHub (git pull --rebase)"

Write-Info "Đang kiểm tra xem trên GitHub có bản cập nhật mới nào không..."
git pull --rebase origin $currentBranch 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Đồng bộ nhánh [$currentBranch] hoàn tất, sẵn sàng đẩy lên."
} else {
    Write-WarningMsg "Không thể tự động rebase hoặc nhánh đã ở trạng thái mới nhất. Tiếp tục đẩy code..."
}

# ------------------------------------------------------------------------------
# BƯỚC 7: ĐẨY TOÀN BỘ MÃ NGUỒN LÊN GITHUB (git push origin main)
# ------------------------------------------------------------------------------
Write-StepHeader "7/7" "Đẩy mã nguồn lên GitHub (git push origin $currentBranch)"

Write-Info "Đang đẩy dữ liệu lên máy chủ GitHub: $expectedRemote ..."
$pushOutput = git push origin $currentBranch 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║               ĐẨY CODE LÊN GITHUB THÀNH CÔNG 100%!               ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Success "Nhánh: [$currentBranch] đã được cập nhật thành công lên GitHub."
    Write-Success "Kho lưu trữ: https://github.com/MANH0711/MC-SERVER-PRO"
    Write-Host ""
    Write-Host "Chi tiết kết quả Git:" -ForegroundColor Gray
    Write-Host $pushOutput -ForegroundColor DarkGray
} else {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                  ĐẨY CODE THẤT BẠI! CẦN KIỂM TRA                 ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-ErrorMsg "Chi tiết lỗi từ Git:"
    Write-Host $pushOutput -ForegroundColor Yellow
    Write-Host ""
    Write-Info "Gợi ý khắc phục:"
    Write-Info "1. Kiểm tra kết nối Internet."
    Write-Info "2. Kiểm tra thông tin đăng nhập GitHub trong Windows Credential Manager."
    Write-Info "3. Thử chạy: git push origin $currentBranch --force (nếu có xung đột lịch sử commit)."
}

Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Read-Host "Nhấn Enter để đóng cửa sổ..."
