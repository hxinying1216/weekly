@echo off
REM Compile updated classes for Spring Boot DevTools to reload the running service.
call mvn -q -DskipTests compile
if errorlevel 1 exit /b %errorlevel%
echo Reload signal sent. Check the running backend terminal for restart completion.
