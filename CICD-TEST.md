# CI/CD Pipeline Test

This file is created to test the complete CI/CD pipeline for the Points project.

## Test Information

- **Date**: 2025-09-13
- **Purpose**: Verify complete CI/CD workflow
- **Branch**: test-cicd-pipeline

## Expected Workflow

1. ✅ PR Creation triggers CI workflow
2. ✅ CI performs build verification
3. ✅ After merge, Docker image builds and pushes to GHCR
4. ✅ Manual deployment trigger to production
5. ✅ Verification of deployed application

## Test Changes

- Added this test documentation file
- Updated application title for testing

## Verification Points

- [ ] CI workflow passes
- [ ] Docker image builds successfully
- [ ] Image pushes to GHCR
- [ ] Deployment workflow succeeds
- [ ] Application accessible at http://47.120.74.212:5002