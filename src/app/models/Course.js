const { create } = require('express-handlebars');
const mongoose = require('mongoose');
const slugify = require('slugify');
const Schema = mongoose.Schema;
const mongooseDelete = require('mongoose-delete');

const Course = new Schema({
    name: { type: String, required: true },
    description: { type: String},
    image: { type: String},
    videoId: { type: String, maxLength: 255 },
    level: { type: String},
    slug: { type: String, unique: true }
}, {
    timestamps: true,
});

// TỰ TẠO SLUG
Course.pre('save', async function() {
    if (this.isModified('name')) {
        let slug = slugify(this.name, {
            lower: true,
            strict: true,
        });

        const existing = await this.constructor.findOne({ slug });

        if (existing) {
            slug = slug + '-' + Date.now();
        }

        this.slug = slug;
    }
});

Course.plugin(mongooseDelete, {
    deletedAt: true, 
    overrideMethods: 'all' 
});

module.exports = mongoose.model('Course', Course);