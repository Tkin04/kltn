const Article = require('../models/Article');
const { multipleMongooseToObject } = require('../../util/mongoose')

class MeController {
    // [GET] /me/stored/articles
    storedArticles(req, res, next) {

        let articleQuery = Article.find({});

        if ('_sort' in req.query) {
            articleQuery = articleQuery.sort({
                [req.query.column]: req.query.type
            });
        }

        Promise.all([
            articleQuery,
            Article.countDocumentsDeleted(),
            Article.countDocuments(),
            Article.countDocuments({
                status: 'published',
            }),
            Article.countDocuments({
                status: 'draft',
            }),
            Article.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: {
                            $sum: '$views',
                        },
                    },
                },
            ]),
        ])
        .then(([articles, deletedCount, totalArticles, publishedCount, draftCount, totalViews]) => {
            res.locals.deletedCount = deletedCount;
            res.render('me/stored-articles', { 
                articles: multipleMongooseToObject(articles),
                analytics: {
                    totalArticles,
                    publishedCount,
                    draftCount,
                    totalViews: totalViews[0]?.totalViews || 0,
                },
                title: 'Quản lý bài viết',
            });
        })
        .catch(next);
    }

    // [GET] /me/trash/articles
    trashArticles(req, res, next) {
        Article.findDeleted({})
            .then(articles => {
                res.render('me/trash-articles', { articles: multipleMongooseToObject(articles), title: 'Bài viết đã xóa' });
            })
            .catch(next);

    }
}
module.exports = new MeController();
