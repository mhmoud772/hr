#!/usr/bin/env bash
set -euo pipefail

python manage.py check --deploy
python manage.py test
