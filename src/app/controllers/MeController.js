const Article = require('../models/Article');
const HeaderConfig = require('../models/HeaderConfig');
const { multipleMongooseToObject } = require('../../util/mongoose')

class MeController {
    // [GET] /me/stored/articles
    storedArticles(req, res, next) {

        const page = Math.max( 1, parseInt( req.query.page ) || 1 );
        const limit = 5;
        const startIndex = (page - 1) * limit;
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim() || '';
        let queryFilter = {};

        const escapedSearch =
            search.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );
        if (search) {
            queryFilter = {
                $or: [
                    {
                        name: { $regex: escapedSearch, $options: 'i', },
                    },
                    {
                        description: { $regex: escapedSearch, $options: 'i', },
                    },
                ],
            };
        }



        let articleQuery = Article.find( queryFilter );

        if ( req.query.column && req.query.type ) {
            articleQuery = articleQuery.sort({ [req.query.column]: req.query.type });
        }

        articleQuery = articleQuery
            .skip(skip)
            .limit(limit);

        Promise.all([
            articleQuery,
            Article.countDocumentsDeleted(),
            Article.countDocuments( queryFilter ),
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
                        totalViews: totalViews[0]?.totalViews || 0,
                    },
                    pagination: {
                        page,
                        totalPages,
                        hasPrev: page > 1,
                        hasNext: page < totalPages,
                        prevPage: page - 1,
                        nextPage: page + 1,
                    },
                    sortQuery:
                        req.query.column &&
                        req.query.type
                            ? `_sort&column=${req.query.column}&type=${req.query.type}&`
                            : '',

                    searchQuery:
                        search
                            ? `search=${encodeURIComponent(search)}&`
                            : '',
                    search,
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
    // [GET] /me/header-settings
    async headerSettings(
        req,
        res,
        next
    ) {
        try {

            let config =
                await HeaderConfig
                    .findOne();

            // First time create
            if (!config) {

                config =
                    await HeaderConfig
                        .create({
                            headerItems: [
                                'world-cup',
                                'champions-league',
                                'premier-league',
                                'laliga',
                            ],
                        });
            }

            // Backward compatibility
            if (
                !config.headerItems
                || !config.headerItems.length
            ) {

                config.headerItems = [
                    config.featuredCategory
                    || 'world-cup',

                    'champions-league',
                    'premier-league',
                    'laliga',
                ];

                await config.save();
            }

            res.render(
                'me/header-settings',
                {
                    title:
                        'Tùy chỉnh Header',

                    headerItems:
                        config
                            .headerItems,
                    categories: [
                        {
                            slug: 'world-cup',
                            name: 'World Cup',
                        },
                        {
                            slug: 'euro',
                            name: 'Euro',
                        },
                        {
                            slug: 'u23-asia',
                            name: 'U23 Châu Á',
                        },
                        {
                            slug:
                                'champions-league',
                            name:
                                'Champions League',
                        },
                        {
                            slug:
                                'premier-league',
                            name:
                                'Ngoại hạng Anh',
                        },
                        {
                            slug: 'laliga',
                            name: 'La Liga',
                        },
                    ],
                }
            );
        }
        catch (error) {
            next(error);
        }
    }
    // [POST] /me/header-settings
    async updateHeaderSettings(
        req,
        res,
        next
    ) {
        try {

            await HeaderConfig
                .findOneAndUpdate(
                    {},
                    {
                        headerItems: [
                            req.body.slot1,
                            req.body.slot2,
                            req.body.slot3,
                            req.body.slot4,
                        ],
                    },
                    {
                        upsert:
                            true,
                    }
                );

            res.redirect(
                '/me/header-settings'
            );
        }
        catch (error) {
            next(error);
        }
    }
}

module.exports = new MeController();
