@echo off
setlocal
REM ============================================================
REM  Start Claude Code against the shared Claude Max via LiteLLM
REM  Sets env vars for THIS window only, then launches claude.
REM ============================================================

REM --- Proxy URL (GCP-hosted, stable) ---
set "DEFAULT_URL=https://litellm.ktinformatik.com"

echo(
echo  Shared Claude Max - Claude Code launcher
echo  ----------------------------------------

REM --- Virtual key: use the 1st argument if given, else prompt ---
set "KEY_FROM_ARG="
set "VKEY=%~1"
if defined VKEY (
  set "KEY_FROM_ARG=1"
  REM consume the key arg so the rest pass through to claude
  shift
) else (
  set /p "VKEY=Enter your virtual key (sk-...): "
)
if not defined VKEY (
  echo  ERROR: no key entered. Aborting.
  pause
  exit /b 1
)

REM --- URL: skip the prompt when the key came from an arg (one-liner mode) ---
if defined KEY_FROM_ARG (
  set "VURL=%DEFAULT_URL%"
) else (
  set "VURL="
  set /p "VURL=Proxy URL [%DEFAULT_URL%]: "
  if not defined VURL set "VURL=%DEFAULT_URL%"
)

REM --- Set env vars for this session only ---
REM  (No ANTHROPIC_MODEL: let Claude Code use its default model, which the
REM   subscription serves. The proxy wildcard forwards whatever it requests.)
set "ANTHROPIC_BASE_URL=%VURL%"
set "ANTHROPIC_CUSTOM_HEADERS=x-litellm-api-key: %VKEY%"

echo(
echo  Base URL : %ANTHROPIC_BASE_URL%
echo  Launching Claude Code...
echo(

REM --- Collect any remaining args (%* ignores shift, so rebuild them) ---
set "ARGS="
:collect_args
if "%~1"=="" goto run
set "ARGS=%ARGS% %1"
shift
goto collect_args

:run
REM --- Launch Claude Code, passing along any extra args ---
call claude%ARGS%

endlocal
