@echo off
echo ========================================
echo   Updating Project on GitHub...
echo ========================================

:: Check for Git in common paths if not in PATH
where git >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\bin\git.exe" (
        set "PATH=%PATH%;C:\Program Files\Git\bin"
    ) else if exist "C:\Program Files\Git\cmd\git.exe" (
        set "PATH=%PATH%;C:\Program Files\Git\cmd"
    ) else (
        echo [ERROR] Git is not installed or not in PATH.
        echo Please restart your computer or install Git from https://git-scm.com/
        pause
        exit /b
    )
)

:: Step 1: Add all changes (respects .gitignore)
echo [1/3] Adding changes...
git add .

:: Step 2: Commit with timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set commit_msg=Auto-update: %datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%
echo [2/3] Committing changes: %commit_msg%
git commit -m "%commit_msg%"

:: Step 3: Push to the main branch
echo [3/3] Pushing to GitHub...
git push

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   DONE! Your site is now updating on Render.
    echo ========================================
) else (
    echo.
    echo [ERROR] Failed to push to GitHub. Please check your connection or git credentials.
)

pause
