(function (window) {

    'use strict';

    function dataURLToFile(dataUrl, fileName) {

        const parts = dataUrl.split(',');

        const mime =
            parts[0].match(/:(.*?);/)[1];

        const binary =
            atob(parts[1]);

        const length =
            binary.length;

        const bytes =
            new Uint8Array(length);

        for (
            let i = 0;
            i < length;
            i++
        ) {
            bytes[i] =
                binary.charCodeAt(i);
        }

        return new File(
            [bytes],
            fileName,
            {
                type: mime
            }
        );
    }

    function getBase64Images(editor) {
        return Array.from(

            editor.editor.querySelectorAll(
                'img[src^="blob:"]'
            )

        ).filter(img =>

            !img.dataset.uploading &&
            !img.dataset.googlePaste

        );
    }
    async function uploadImages(images) {
        if (!images.length) {
            return [];
        }

        const formData = new FormData();

        for (const [index, img] of images.entries()) {

            img.dataset.uploading = '1';

            const blob = await fetch(img.src)
                .then(res => res.blob());

            const ext = blob.type.split('/')[1] || 'png';

            const file = new File(
                [blob],
                `clipboard-${index}.${ext}`,
                {
                    type: blob.type
                }
            );

            formData.append(
                `files[${index}]`,
                file
            );

        }

        const response = await fetch(

            '/articles/upload-editor-image',

            {
                method: 'POST',
                body: formData
            }

        );

        if (!response.ok) {
            throw new Error(
                'Upload images failed.'
            );

        }
        
        const result = await response.json();

        if (result.url) {

            return [

                {
                    url: result.url
                }

            ];

        }

        return result.files || [];

    }
    async function replaceImages(editor) {
        const images =
            getBase64Images(editor);
        if (!images.length) {
            return;
        }
        try {
            const uploaded = await uploadImages(images);

            images.forEach((img, index) => {

                if (!uploaded[index]) {
                    return;
                }

                img.dataset.googlePaste = 'done'; 
                delete img.dataset.uploading;
                img.src = uploaded[index].url;

            });

            editor.synchronizeValues();

        } catch (err) {
            images.forEach(img => {
                delete img.dataset.uploading;
            });
        }
    }
    window.attachGooglePaste = function (editor) {
        let timer = null;

        editor.events.on('change', function () {
            if (
                !editor.value.includes('data:image')
            ) {
                return;
            }

            clearTimeout(timer);

            timer = setTimeout(function () {
                replaceImages(editor);

            }, 150);

        });

    };

})(window);