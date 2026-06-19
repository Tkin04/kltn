const express = require('express');
const router = express.Router();
const siteController = require('../app/controllers/SiteController');

router.get(
    '/profile',
    (req, res) => {

        res.json(
            req.session.user
        );
    }
);
router.get(
    '/categories',
    siteController.categories
);
router.get('/', siteController.index);
module.exports = router;
