const multer = require('multer');
const path = require('path');

// nơi lưu file
const storage = multer.diskStorage({
    destination: function (
        req,
        file,
        cb
    ) {
        cb(
            null,
            'src/public/uploads'
        );
    },

    filename: function (
        req,
        file,
        cb
    ) {

        const uniqueName =
            Date.now() +
            path.extname(
                file.originalname
            );

        cb(
            null,
            uniqueName
        );
    }
});

// chỉ cho ảnh
const fileFilter = (
    req,
    file,
    cb
) => {

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg'
    ];

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                'Chỉ hỗ trợ file ảnh'
            ),
            false
        );
    }
};

module.exports =
    multer({
        storage,
        fileFilter,
        limits: {
            fileSize:
                5 * 1024 * 1024
        }
    });