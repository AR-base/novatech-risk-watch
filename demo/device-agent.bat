@echo off
rem NOVATECH Risk Watch demo: double-click to start the device agent (locks this PC when IT isolates it).
rem To shut down instead of locking, run:  device-agent.bat -Shutdown
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0device-agent.ps1" %*
pause
