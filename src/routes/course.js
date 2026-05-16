const express = require('express');
const router = express.Router();
const authMiddleware = require('../app/middlewares/AuthMiddleware');
const roleMiddleware = require('../app/middlewares/RoleMiddleware');

const courseController = require('../app/controllers/CourseController');
router.get(
    '/create',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.create
);
router.post(
    '/store',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.store
);
router.get(
    '/:id/edit',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.edit
);
router.post(
    '/handle-form-actions',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.handleFormActions
);
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.update
);
router.patch(
    '/:id/restore',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.restore
);
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.destroy
);
router.delete(
    '/:id/force',
    authMiddleware,
    roleMiddleware(['admin']),
    courseController.forcedestroy
);
router.get(
    '/:slug',
    courseController.show
);

module.exports = router;
