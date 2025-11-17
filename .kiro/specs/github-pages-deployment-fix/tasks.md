# Implementation Plan

- [x] 1. Verify and validate current workflow configuration
  - Review the root-level `.github/workflows/deploy.yml` to ensure it has all required components
  - Confirm permissions block includes `contents: read`, `pages: write`, and `id-token: write`
  - Verify the workflow uses modern GitHub Pages actions (`actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`)
  - Check that the workflow correctly references the `Gorweld/` subdirectory paths
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Remove duplicate and redundant files
  - Delete the duplicate workflow file at `Gorweld/.github/workflows/deploy.yml`
  - Remove the redundant `CNAME` file from the repository root
  - Verify that `Gorweld/CNAME` remains as the single source for custom domain configuration
  - _Requirements: 1.1, 1.2, 2.1, 5.1, 5.4_

- [x] 3. Validate build and configuration management
  - Verify that `Gorweld/config.production.js` exists and contains correct production settings
  - Confirm the workflow step that copies `config.production.js` to `config.js` is working correctly
  - Check that the `package.json` script `build:production` is properly configured
  - Ensure the workflow logs configuration application status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1_

- [x] 4. Test CNAME and static file copying
  - Verify the workflow step that copies CNAME to the dist directory
  - Confirm that `Gorweld-Logo.png` is copied if it exists
  - Check that `metadata.json` is copied if it exists
  - Validate that the CNAME file contains "gorweld.fun"
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Validate deployment artifact structure
  - Review the `actions/upload-pages-artifact@v3` step configuration
  - Confirm the path parameter points to `./Gorweld/dist`
  - Verify that the artifact will include all necessary files (HTML, JS, CSS, CNAME, assets)
  - _Requirements: 2.3, 5.3_

- [-] 6. Test workflow execution
  - Commit the changes to a test branch
  - Trigger the workflow manually using `workflow_dispatch`
  - Monitor the GitHub Actions logs for each step
  - Verify all steps complete successfully without errors
  - Check that the deployment artifact is created correctly
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Verify deployment and custom domain
  - Confirm the site deploys to GitHub Pages successfully
  - Access the site via `gorweld.fun` to verify custom domain works
  - Check that HTTPS certificate is valid
  - Verify all assets load correctly (images, scripts, styles)
  - Test site functionality (wallet connection, navigation, project cards)
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 8. Clean up repository structure
  - Remove the empty `.github` directory from `Gorweld/` subdirectory if it exists
  - Verify the repository structure matches the target state in the design document
  - Update any documentation that references the old workflow structure
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. Document the deployment process
  - Add comments to the workflow file explaining each step
  - Create or update README with deployment instructions
  - Document troubleshooting steps for common issues
  - _Requirements: 4.1, 4.2_
