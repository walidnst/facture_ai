#!/usr/bin/env python
import os
import sys

def main():
    try:
        from dotenv import load_dotenv
        from pathlib import Path
        env_path = Path(__file__).resolve().parent / '.env'
        load_dotenv(dotenv_path=env_path)
    except ImportError:
        pass
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'facture_ai.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError('Couldn''t import Django.') from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
