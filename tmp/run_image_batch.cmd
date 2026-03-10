@echo off
setlocal EnableExtensions EnableDelayedExpansion
for /f "tokens=3" %%A in ('reg query HKCU\Environment /v OPENAI_API_KEY ^| find "OPENAI_API_KEY"') do set OPENAI_API_KEY=%%A
if not defined OPENAI_API_KEY (
  echo OPENAI_API_KEY=missing
  exit /b 1
)
cd /d C:\Users\TOT\Documents\MOVEVPE
python tmp\image_gen.py generate-batch --input tmp\imagegen\apple_ios_assets_v1.jsonl --out-dir output\imagegen\apple-ios-v1 --max-attempts 3 --concurrency 2 --force
endlocal
