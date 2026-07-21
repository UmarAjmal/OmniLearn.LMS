const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../server/src/index.ts');
let code = fs.readFileSync(indexPath, 'utf-8');

// Ensure middlewares are imported
if (!code.includes("import { authenticateToken, requireAdmin, requireTrainer, requireStudent, requireAdminOrTrainer } from './middleware/auth';")) {
  code = code.replace(
    "import express from 'express';",
    "import express from 'express';\nimport { authenticateToken, requireAdmin, requireTrainer, requireStudent, requireAdminOrTrainer } from './middleware/auth';"
  );
}

// Helper to inject middleware
function protect(route, middlewares) {
  const mwStr = middlewares.join(', ') + ', ';
  // Handle both get, post, put, delete
  const methods = ['get', 'post', 'put', 'delete'];
  for (const method of methods) {
    const searchStr = `app.${method}('${route}', async (req, res) => {`;
    const replaceStr = `app.${method}('${route}', ${mwStr}async (req, res) => {`;
    if (code.includes(searchStr)) {
      code = code.replace(searchStr, replaceStr);
    }
  }
}

// 1. Admin Routes
const adminRoutes = [
  '/api/courses',
  '/api/courses/:id',
  '/api/courses/:id/sections',
  '/api/sections/:sectionId/lessons',
  '/api/courses/:id/publish',
  '/api/courses/:id/import-curriculum',
  '/api/courses/:id/bulk-curriculum',
  '/api/sections/:id',
  '/api/lessons/:id',
  '/api/users',
  '/api/applicants',
  '/api/applicants/:id/approve',
  '/api/applicants/:id/reject',
  '/api/training-applications',
  '/api/training-applications/count',
  '/api/training-applications/:id/approve',
  '/api/training-applications/:id/reject',
  '/api/dashboard/admin-stats',
  '/api/finance/stats',
  '/api/finance/fees',
  '/api/finance/fees/:studentId',
  '/api/finance/fees/:studentId/total',
  '/api/finance/fees/:studentId/pay',
  '/api/students/full-report',
  '/api/tasks/assign-with-email',
  '/api/announcements'
];

adminRoutes.forEach(route => protect(route, ['authenticateToken', 'requireAdmin']));

// 2. Admin OR Trainer Routes
const adminOrTrainerRoutes = [
  '/api/students', // Trainers need to see students
  '/api/trainers',
  '/api/tasks',
  '/api/tasks/:id',
  '/api/tasks/assignments/by-course/:courseId',
  '/api/tasks/assignments/:assignmentId',
  '/api/tasks/assignments/:assignmentId/grade',
  '/api/tasks/assignments/:assignmentId/publish',
  '/api/attendance',
  '/api/attendance/summary',
  '/api/attendance/date/:date',
  '/api/tasks/submitted'
];

adminOrTrainerRoutes.forEach(route => protect(route, ['authenticateToken', 'requireAdminOrTrainer']));

// 3. Student Routes
const studentRoutes = [
  '/api/students/profile',
  '/api/students/:studentId/tasks',
  '/api/students/:studentId/dashboard-stats',
  '/api/students/:studentId/performance',
  '/api/student/:studentId/fees',
  '/api/attendance/student/:studentId',
  '/api/tasks/assignments/:assignmentId/submit'
];

studentRoutes.forEach(route => protect(route, ['authenticateToken', 'requireStudent']));

// 4. Trainer Routes
const trainerRoutes = [
  '/api/trainers/profile',
  '/api/trainers/dashboard-stats'
];

trainerRoutes.forEach(route => protect(route, ['authenticateToken', 'requireTrainer']));

// Any route starting with '/api/announcements/:id'
protect('/api/announcements/:id', ['authenticateToken', 'requireAdminOrTrainer']);

// Note: '/api/auth/login' is intentionally NOT protected.
// What about '/api/upload'? Let's protect it for all authenticated users
protect('/api/upload', ['authenticateToken']);

// Remove req.headers['x-user-role'] checks
code = code.replace(/\\s*if\\s*\\(req\\.headers\\[['"]x-user-role['"]\\]\\s*!==\\s*['"]admin['"]\\)\\s*\\{\\s*return\\s*res\\.status\\(403\\)\\.json\\(\\{[^}]+\\}\\);\\s*\\}/g, '');
code = code.replace(/\\s*if\\s*\\(req\\.headers\\[['"]x-user-role['"]\\]\\s*!==\\s*['"]admin['"]\\)\\s*\\{\\s*res\\.status\\(403\\)\\.json\\(\\{[^}]+\\}\\);\\s*return;\\s*\\}/g, '');
code = code.replace(/\\s*if\\s*\\(req\\.headers\\[['"]x-user-role['"]\\]\\s*!==\\s*['"]admin['"]\\)\\s*\\{\\s*return\\s*res\\.status\\(403\\)\\.json\\(\\{[^}]+\\}\\);?\\s*\\}/g, '');

fs.writeFileSync(indexPath, code, 'utf-8');
console.log('Routes protected successfully!');
