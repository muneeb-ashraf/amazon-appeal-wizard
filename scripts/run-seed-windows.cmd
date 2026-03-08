@echo off
REM Windows helper script to run seed-form-fields.ts
REM This ensures output is visible on Windows systems

echo Running seed-form-fields.ts...
echo.

node_modules\.bin\tsx.cmd scripts\seed-form-fields.ts

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Script completed successfully!
) else (
    echo.
    echo Script failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
