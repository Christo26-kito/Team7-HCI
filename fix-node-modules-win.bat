@echo off
REM ============================================================
REM  Restores the Windows native binaries (esbuild & rollup)
REM  after a Linux/WSL `npm install` has replaced them.
REM  Run this if Vite/rollup errors with "Cannot find module
REM  @rollup/rollup-win32-x64-msvc" or an esbuild platform error.
REM ============================================================
setlocal
for /f "usebackq delims=" %%v in (`node -p "require('./node_modules/esbuild/package.json').version"`) do set ESBUILD_VER=%%v
for /f "usebackq delims=" %%v in (`node -p "require('./node_modules/rollup/package.json').version"`) do set ROLLUP_VER=%%v
echo Repairing Windows native binaries: @esbuild/win32-x64@%ESBUILD_VER% + @rollup/rollup-win32-x64-msvc@%ROLLUP_VER%
call npm install --force --no-save "@esbuild/win32-x64@%ESBUILD_VER%" "@rollup/rollup-win32-x64-msvc@%ROLLUP_VER%"
if errorlevel 1 (
  echo FAILED - as last resort run: rmdir /s /q node_modules ^&^& npm install
) else (
  echo Done. Restart your dev server (Ctrl+C then npm run dev).
)
pause
