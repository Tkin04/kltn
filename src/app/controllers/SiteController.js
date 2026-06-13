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

            // SEARCH
            if (search) {
                const safeSearch = escapeRegex( search );
                query.name = {
                    $regex: safeSearch,
                    $options: 'i',
                };
            }

            // CATEGORY
            if (category) { query.category = category; }

            const articles = await Article.find(query);

            const topViewedArticles = await Article.find({ status: 'published', })
                .sort({ views: -1 })
                .limit(3);

            // HERO CONTENT


            let heroTitle = 'Cập nhật tin tức bóng đá nhanh nhất';

            let heroDescription = 'Tin tức nóng hổi, chuyển nhượng và diễn biến mới nhất từ thế giới bóng đá.';

            // SEARCH ưu tiên cao nhất
            if (search) {
                heroTitle =
                    `Kết quả tìm kiếm: ${search}`;
                heroDescription = articles.length > 0
                    ? `Tìm thấy ${articles.length} bài viết phù hợp với "${search}"`
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
                    articles.length > 0
                        ? `Có ${articles.length} bài viết thuộc chuyên mục ${heroTitle}`
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
                title:
                    search
                        ? `Tìm kiếm: ${search}`
                        : category
                        ? heroTitle
                        : 'Trang chủ',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SiteController();