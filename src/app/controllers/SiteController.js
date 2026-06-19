const Article = require('../models/Article');
const categories = require('../../constants/categories');
const { multipleMongooseToObject,} = require('../../util/mongoose');
const escapeRegex =(text) => text.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

class SiteController {
    // [GET] /
    async index(req, res, next) {
        try {
            const search = req.query.search || '';
            const category = req.query.category || '';
            const query = { status: 'published', };

            const page =
                Math.max(
                    1,
                    parseInt(req.query.page) || 1
                );

            const PAGE_SIZE = 6;

            const skip =
                (page - 1) * PAGE_SIZE;

            // SEARCH
            if (search) {

                const safeSearch =
                    escapeRegex(search);

                const keyword =
                    search.toLowerCase();

                const matchedCategories = categories.filter(category => {
                    if (
                        category.name
                            .toLowerCase()
                            .includes(keyword)
                    ) {
                        return true;
                    }

                    return (
                        category.keywords || []
                    ).some(item =>
                        item
                            .toLowerCase()
                            .includes(keyword)
                    );

                })
                .map(category => category.slug);

                query.$or = [

                    {
                        name: {
                            $regex: safeSearch,
                            $options: 'i',
                        },
                    },

                    {
                        description: {
                            $regex: safeSearch,
                            $options: 'i',
                        },
                    },

                    {
                        category: {
                            $in: matchedCategories,
                        },
                    },

                ];

            }

            // CATEGORY
            if (category) { query.category = category; }

            const articles =
                await Article.find(query)
                    .sort({
                        createdAt: -1
                    })
                    .skip(skip)
                    .limit(PAGE_SIZE);

            const totalArticles =
                await Article.countDocuments(
                    query
                );

            const topViewedArticles = await Article.find({ status: 'published', })
                .sort({ views: -1 })
                .limit(3);

            const totalPages =
                Math.max(
                    1,
                    Math.ceil(
                        totalArticles /
                        PAGE_SIZE
                    )
                );

            const pages =
                Array.from(
                    {
                        length: totalPages
                    },
                    (_, i) => i + 1
                );
            const showPagination =
                totalPages > 1;
            // HERO CONTENT
            let heroTitle = 'Cập nhật tin tức bóng đá nhanh nhất';

            let heroDescription = 'Tin tức nóng hổi, chuyển nhượng và diễn biến mới nhất từ thế giới bóng đá.';

            // SEARCH ưu tiên cao nhất
            if (search) {
                heroTitle =
                    `Kết quả tìm kiếm: ${search}`;
                heroDescription = totalArticles > 0
                    ? `Tìm thấy ${totalArticles} bài viết phù hợp với "${search}"`
                    : `Không tìm thấy bài viết phù hợp với "${search}"`;
            }

            // CATEGORY
            else if (category) {

                const currentCategory =
                    categories.find(
                        (
                            item
                        ) =>
                            item.slug ===
                            category
                    );

                heroTitle =
                    currentCategory
                        ?.name
                    || 'Tin tức bóng đá';

                heroDescription =
                    totalArticles > 0
                        ? `Có ${totalArticles} bài viết thuộc chuyên mục ${heroTitle}`
                        : `Hiện chưa có bài viết nào thuộc chuyên mục ${heroTitle}`;
            }

            res.render( 'home', {
                articles: multipleMongooseToObject(articles),
                topViewedArticles: multipleMongooseToObject(topViewedArticles),
                search,
                category,
                heroTitle,
                heroDescription,
                metaDescription: heroDescription,
                ogImage: '/img/logo.png',
                isHome: !search && !category,
                title:
                    search
                        ? `Tìm kiếm: ${search}`
                        : category
                        ? heroTitle
                        : 'Trang chủ',
                totalArticles,
                pagination: {
                    page,
                    pages,
                    totalPages,
                    hasPrev: page > 1,
                    hasNext: page < totalPages,
                    prevPage: page - 1,
                    nextPage: page + 1,
                },
                showPagination,
                searchQuery:
                    search
                        ? `search=${encodeURIComponent(search)}&`
                        : '',
                categoryQuery:
                    category
                        ? `category=${category}&`
                        : '',       
            });
        } catch (error) {
            next(error);
        }
    }

    // [GET] /categories
    async categories(
        req,
        res,
        next
    ) {
    const categoryCounts =
        await Article.aggregate([
            {
                $match: {
                    status: 'published',
                },
            },
            {
                $group: {
                    _id: '$category',
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]);

    const categoryList =
        categories.map(category => {

            const found =
                categoryCounts.find(
                    item =>
                        item._id ===
                        category.slug
                );

            return {

                ...category,

                count:
                    found
                        ? found.count
                        : 0,
            };

        });

    categoryList.sort((a, b) => {

        if (b.count !== a.count) {
            return b.count - a.count;
        }

        return a.name.localeCompare(
            b.name,
            'vi'
        );

    });

    res.render(
        'categories',
        {
            title:
                'Tất cả chuyên mục',
            categoryPage: true,
            categories: categoryList,
        }
    );

    }
}

module.exports = new SiteController();