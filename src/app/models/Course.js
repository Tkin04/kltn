const mongoose = require('mongoose');

const slugify = require('slugify');

const mongooseDelete = require('mongoose-delete');

const Schema = mongoose.Schema;

const Post = new Schema(
    {
        // tiêu đề
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },

        // nội dung ngắn
        description: {
            type: String,
            default: '',
        },

        // ảnh thumbnail
        image: {
            type: String,
            default: '',
        },

        // nội dung bài
        content: {
            type: String,
            default: '',
        },

        // slug url
        slug: {
            type: String,
            unique: true,
        },

        // người tạo bài
        author: {
            type:
            mongoose.Schema
            .Types.ObjectId,

            ref: 'User',

            required: true,
        },

        // trạng thái bài
        status: {
            type: String,
            enum: [
                'draft',
                'published',
            ],
            default:
            'published',
        },

        // lượt xem
        views: {
            type: Number,
            default: 0,
        },

        // danh mục
        category: {
            type: String,
            default:
            'Tin tức',
        },
    },
    {
        timestamps: true,
    }
);

// AUTO SLUG
Post.pre(
    'save',
    async function () {

        if (
            this.isModified(
                'name'
            )
        ) {

            let slug =
                slugify(
                    this.name,
                    {
                        lower: true,
                        strict: true,
                    }
                );

            const existing = await this
                .constructor
                .findOne({ slug, });

            if (existing) {
                slug = slug + '-' + Date.now();
            }
            this.slug = slug;
        }
    }
);

// SOFT DELETE
Post.plugin( mongooseDelete, {
        deletedAt:
        true,
        overrideMethods:
        'all',
    }
);

module.exports = mongoose.model('Course', Post);