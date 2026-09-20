@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo   Singh Rent House - Docker Hub Build ^& Push Script
echo =======================================================
echo.

set /p DOCKER_USER="Enter your Docker Hub Username: "
if "%DOCKER_USER%"=="" (
    echo [ERROR] Docker Hub username cannot be empty!
    pause
    exit /b 1
)

set /p DOCKER_TAG="Enter Image Tag (default: latest): "
if "%DOCKER_TAG%"=="" (
    set DOCKER_TAG=latest
)

echo.
echo =======================================================
echo 1. Logging in to Docker Hub...
echo =======================================================
docker login
if errorlevel 1 (
    echo [ERROR] Docker login failed! Please verify credentials or start Docker Desktop.
    pause
    exit /b 1
)

echo.
echo =======================================================
echo 2. Building Backend Docker Image...
echo =======================================================
docker build -t %DOCKER_USER%/rent-management-backend:%DOCKER_TAG% ./rent-management-backend
if errorlevel 1 (
    echo [ERROR] Backend Docker build failed!
    pause
    exit /b 1
)

echo.
echo =======================================================
echo 3. Building Frontend Docker Image...
echo =======================================================
docker build -t %DOCKER_USER%/rent-management-frontend:%DOCKER_TAG% ./rent-management-frontend
if errorlevel 1 (
    echo [ERROR] Frontend Docker build failed!
    pause
    exit /b 1
)

echo.
echo =======================================================
echo 4. Pushing Backend Image to Docker Hub...
echo =======================================================
docker push %DOCKER_USER%/rent-management-backend:%DOCKER_TAG%
if errorlevel 1 (
    echo [ERROR] Failed to push Backend image to Docker Hub!
    pause
    exit /b 1
)

echo.
echo =======================================================
echo 5. Pushing Frontend Image to Docker Hub...
echo =======================================================
docker push %DOCKER_USER%/rent-management-frontend:%DOCKER_TAG%
if errorlevel 1 (
    echo [ERROR] Failed to push Frontend image to Docker Hub!
    pause
    exit /b 1
)

echo.
echo =======================================================
echo [SUCCESS] Both images successfully uploaded to Docker Hub!
echo   - %DOCKER_USER%/rent-management-backend:%DOCKER_TAG%
echo   - %DOCKER_USER%/rent-management-frontend:%DOCKER_TAG%
echo =======================================================
pause
