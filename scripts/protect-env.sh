#!/bin/bash
# Backup and restore .env file script
# This ensures your .env is never lost during git operations

ENV_FILE=".env"
BACKUP_FILE=".env.backup"

# Function to backup .env
backup_env() {
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_FILE"
        echo "✅ Backed up $ENV_FILE to $BACKUP_FILE"
    else
        echo "⚠️  No $ENV_FILE file found to backup"
    fi
}

# Function to restore .env
restore_env() {
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$ENV_FILE"
        echo "✅ Restored $ENV_FILE from $BACKUP_FILE"
    else
        echo "⚠️  No backup file found"
    fi
}

# Check command
case "$1" in
    backup)
        backup_env
        ;;
    restore)
        restore_env
        ;;
    *)
        echo "Usage: $0 {backup|restore}"
        echo ""
        echo "Commands:"
        echo "  backup  - Create a backup of .env file"
        echo "  restore - Restore .env from backup"
        exit 1
        ;;
esac
