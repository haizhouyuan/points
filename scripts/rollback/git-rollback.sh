#!/bin/bash

# Git Rollback Script for Major Refactor
# Version: v2.2.0-major-refactor -> v2.1.9-stable
# Created: 2025-09-13

set -e  # Exit on any error

echo "🚨 EMERGENCY ROLLBACK SCRIPT 🚨"
echo "Rolling back from v2.2.0-major-refactor to v2.1.9-stable"
echo ""

# Safety checks
echo "1. Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

echo ""
echo "2. Checking git status..."
git status --porcelain

if [ ! -z "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: Working directory not clean!"
    echo "Uncommitted changes detected. Stash or commit before rollback."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Rollback cancelled."
        exit 1
    fi
fi

echo ""
echo "3. Creating emergency backup branch..."
BACKUP_BRANCH="emergency-backup-$(date +%Y%m%d-%H%M%S)"
git checkout -b $BACKUP_BRANCH
git push origin $BACKUP_BRANCH
echo "✅ Emergency backup created: $BACKUP_BRANCH"

echo ""
echo "4. Rolling back to stable version..."
git checkout $CURRENT_BRANCH
git reset --hard v2.1.9-stable

echo ""
echo "5. Force pushing rollback (DESTRUCTIVE)..."
read -p "⚠️  This will OVERWRITE remote branch. Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin $CURRENT_BRANCH --force-with-lease
    echo "✅ Rollback pushed to remote"
else
    echo "⚠️  Rollback completed locally only"
fi

echo ""
echo "6. Rollback Summary:"
echo "   - Backup branch: $BACKUP_BRANCH"
echo "   - Current HEAD: $(git rev-parse --short HEAD)"
echo "   - Target version: v2.1.9-stable"
echo ""
echo "🔧 Next steps:"
echo "   1. Run database rollback script if needed"
echo "   2. Verify application functionality"
echo "   3. Monitor for issues"
echo "   4. Update deployment if applicable"

echo ""
echo "✅ Git rollback completed successfully!"