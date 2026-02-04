#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/faceseek"
DATA_DIR="/opt/faceseek/data"

sudo apt-get update -y
sudo apt-get install -y git curl ca-certificates build-essential python3-venv python3-pip nginx

if ! id -u faceseek >/dev/null 2>&1; then
  sudo useradd -m -s /bin/bash faceseek
fi

sudo mkdir -p "$APP_DIR" "$DATA_DIR"
sudo chown -R faceseek:faceseek "$APP_DIR" "$DATA_DIR"

echo "OK"

