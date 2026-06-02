const Article = require('../models/Article');
const { multipleMongooseToObject } = require('../../util/mongoose')

class MeController {
    // [GET] /me/stored/articles
    storedArticles(req, res, next) {

        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        const limit = 5;
        const startIndex = (page - 1) * limit;
        const skip = (page - 1) * limit;

        let articleQuery = Article.find({});

        if ('_sort' in req.query) {
            articleQuery = articleQuery.sort({ [req.query.column]: req.query.type});
        }

        articleQuery = articleQuery
            .skip(skip)
            .limit(limit);
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
                        totalViews: { $sum: '$views', },
                    },
                },
            ]),
        ])
        .then(([
            articles,
            deletedCount,
            totalArticles,
            publishedCount,
            draftCount,
            totalViews
        ]) => { const totalPages = Math.ceil( totalArticles / limit );
            res.locals.deletedCount = deletedCount;
            res.render( 'me/stored-articles',
                {
                    articles: multipleMongooseToObject( articles ),
                    analytics: {
                        totalArticles,
                        publishedCount,
                        draftCount,
                        totalViews: totalViews[0] ?.totalViews || 0,
                    },
                    pagination: {
                        page,
                        totalPages,
                        hasPrev: page > 1,
                        hasNext: page < totalPages,
                        prevPage: page - 1,
                        nextPage: page + 1,
                    },
                    startIndex,
                    title: 'Quản lý bài viết',
                }
            );
        })
        .catch(next);
    }

    // [GET] /me/trash/articles
    trashArticles( req, res, next ) {
        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        const limit = 5;
        const startIndex = (page - 1) * limit;
        const skip = (page - 1) * limit;
        Promise.all([
            Article.findDeleted({})
                .skip(skip)
                .limit(limit),
            Article.countDocumentsDeleted()
        ])
        .then(([ articles, totalTrash ]) => {
            const totalPages = Math.ceil( totalTrash / limit );
            res.render( 'me/trash-articles',
                {
                    articles: multipleMongooseToObject( articles ),
                    pagination: {
                        page,
                        totalPages,
                        hasPrev: page > 1,
                        hasNext: page < totalPages,
                        prevPage: page - 1,
                        nextPage: page + 1,
                    },
                    startIndex,
                    title: 'Bài viết đã xóa',
                }
            );
        })
        .catch(next);
    }
}
module.exports = new MeController();
