@echo off
echo Regenerating Prisma Client...
cd /d "%~dp0"
call npx prisma generate
echo.
echo Done! You can now restart your development server with: npm run dev
pause