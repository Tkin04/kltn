const express = require('express');
const router = express.Router();
const authMiddleware = require('../app/middlewares/AuthMiddleware');
const roleMiddleware = require('../app/middlewares/RoleMiddleware');
const upload = require('../app/middlewares/UploadMiddleware');

const articleController = require('../app/controllers/ArticleController');
router.get(
    '/create',
    authMiddleware,
    roleMiddleware(['admin']),
    articleController.create
);
router.post(
    '/store',
    authMiddleware,
    roleMiddleware(['admin']),
    upload.single('image'),
    articleController.store
);
router.get(
    '/:id/edit',
    authMiddleware,
    roleMiddleware(['admin']),
    articleController.edit
);
router.post(
    '/handle-form-actions',
    authMiddleware,
    roleMiddleware(['admin']),
    articleController.handleFormActions
);
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    upload.single('image'),
    articleController.update
);
router.patch(
    '/:id/restore',
    authMiddleware,
    roleMiddleware(['admin']),
    articleController.restore
);
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['admin']),
    articleController.destroy
);
router.delete(
    '/:id/force',
    authMiddleware,
    roleMiddleware(['admin']),
    articleController.forcedestroy
);
router.get(
    '/:slug',
    articleController.show
);

module.exports = router;
