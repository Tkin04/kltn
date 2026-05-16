const express = require('express');
const router = express.Router();

const siteController = require('../app/controllers/SiteController');

router.get('/search', siteController.search);
router.get(
    '/profile',
    (req, res) => {

        res.json(
            req.session.user
        );
    }
);
router.get('/', siteController.index);

module.exports = router;
