const mongoose =
    require('mongoose');

const Schema =
    mongoose.Schema;

const HeaderConfig =
    new Schema(
        {
            headerItems:
            {
                type: [String],

                default: [
                    'world-cup',
                    'champions-league',
                    'premier-league',
                    'laliga',
                ],
            },
        },
        {
            timestamps:
                true,
        }
    );

module.exports =
    mongoose.model(
        'HeaderConfig',
        HeaderConfig
    );