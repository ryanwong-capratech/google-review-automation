# Google Review Automation - TODO

## Database & Schema
- [x] Design and create accounts table (email, password, backup_codes, status)
- [x] Design and create businesses table (name, google_maps_link)
- [x] Design and create review_templates table (content, type: positive/negative, star_rating)
- [x] Design and create tasks table (account_id, business_id, template_id, status, scheduled_at)
- [x] Design and create execution_logs table (task_id, status, error_message, timestamps)

## Backend API
- [x] Account CRUD API (create, read, update, delete, batch import)
- [x] Business CRUD API (create, read, update, delete)
- [x] Review template CRUD API (create, read, update, delete)
- [x] Task CRUD API (create batch tasks, list, trigger, pause, cancel)
- [x] Execution log API (list logs with filters)
- [x] Task scheduling API (set daily execution time/frequency)

## Playwright Automation Engine
- [x] Google account login automation (handle 2FA with backup codes)
- [x] Google Maps review posting automation (navigate, rate, write, submit)
- [x] Window size 1920x1080 configuration
- [x] Error handling and retry logic
- [x] Anti-detection measures (random delays, user-agent rotation)

## Frontend Pages
- [x] Dashboard layout with sidebar navigation
- [x] Dashboard home page (overview stats)
- [x] Account management page (list, add, edit, delete, batch import, status display)
- [x] Business management page (list, add, edit, delete)
- [x] Review template management page (list, add, edit, delete, type filter)
- [x] Task creation page (select businesses, accounts, review type, batch create)
- [x] Task dashboard page (list tasks, status, trigger/pause/cancel actions)
- [x] Execution logs page (detailed logs with filters)

## Task Scheduling
- [x] Daily automatic execution time setting
- [x] Frequency control to avoid mass publishing
- [x] Staggered execution with random delays

## Design & Styling
- [x] Dark theme dashboard design
- [x] Responsive layout
- [x] Professional color scheme

## AI Review Generation Refactor
- [x] Remove Templates page and sidebar nav item
- [x] Add industry/category field to businesses table
- [x] Update Business form to include industry selection
- [x] Integrate LLM to auto-generate review content based on industry + sentiment
- [x] Update Create Tasks flow: remove template selection, add AI generation
- [x] Update task creation API to call LLM for review content
- [x] Remove templates router from backend
- [x] Update Dashboard stats (remove templates count)
- [x] Update unit tests for new flow


## Playwright Real Execution & Bug Fixes
- [ ] Remove simulation mode from reviewEngine.ts
- [ ] Fix Chinese character encoding in review content
- [ ] Implement real Playwright browser automation
- [ ] Test complete review publishing flow
- [ ] Verify reviews appear on Google Maps

## Railway Deployment
- [ ] Create Procfile for Railway
- [ ] Configure environment variables for Railway
- [ ] Add railway.json configuration
- [ ] Test deployment on Railway
- [ ] Verify Playwright works on Railway
