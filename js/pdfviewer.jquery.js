/**
 * @author Benjamin Mbuyi Beya <borntocode8@gmail.com>
 */
(function ($) {
    if ($ === null || $ === undefined) {
        throw new ReferenceError('This plugin require javascript to run correctly.');
    }

    let version = $().jquery;
    version = version.split('.');
    //Define the pdf viewer plugin
    $.fn.pdfViewer = function (url, options) {
        const date = new Date();
        const defaultOptions = {
            orientation: 'landscape',
            pageSize: 'A4',
            documentUrl: url,
            isBase64: false,
            filename: "DOCUMENT_" + date.getDay() + '_' + date.getMonth() + '_' + date.getFullYear(),
            width: 900,
            height: 600
        };

        let settings = $.extend({}, defaultOptions, options);
        let documentName = settings.documentUrl;

        //The separator of the base64 pdf data and its mime type
        const base64Marker = ';base64,';
        let rawPdfData = null;
        if (settings.isBase64)
            rawPdfData = convertDataURIToBinary(url);

        const initialState = {
            pdfDoc: null,
            lastPageIndex: 1,
            currentPage: 1,
            pageCount: 0,
            scrollTop: 0,
            zoom: 1.0
        }

        //Add the toolbar to the pdf viewer
        $(this).append('<div class="pdf-toolbar">' +
            '<span class="pdf-toolbar-title" id="doc-title">Pdf Viewer 1.0</span>' +
            '<span class="pdf-toolbar-btn" id="btn-print" title="Print">&#x1F5B6;</span>' +
            '<span class="pdf-toolbar-btn" id="btn-download" title="Download">&#x2193;</span>' +
            '<span class="pdf-toolbar-btn" id="btn-first" title="First page">&#8249;&#8249;</span>' +
            '<span class="pdf-toolbar-btn" id="btn-prev" title="Previous page">&#8249;</span>' +
            '<span class="pdf-toolbar-btn" id="btn-next" title="Next page">&#8250;</span>' +
            '<span class="pdf-toolbar-btn" id="btn-last" title="Last page">&#8250;&#8250;</span>' +
            '<input type="number" placeholder="0" id="current-page"><span id="page-number-sep">of</span> ' +
            '<span id="page-number">0</span>' +
            '<select class="pdf-toolbar-zoom" id="zoom-list"><option value="0.25">25%</option><option value="0.50">50%</option><option value="0.75">75%</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.50">150%</option><option value="2.0">200%</option></select>' +
            '<span class="pdf-toolbar-btn" id="btn-zoom-in" title="Zoom In">+</span>' +
            '<span class="pdf-toolbar-btn" id="btn-zoom-out" title="Zoom Out">-</span>' +
            '</div>');

        //Add the pdf body
        $(this).append('<div class="pdf-viewer-body" id="page-container"></div>');
        //Set the default zoom to 100%
        $('#zoom-list').prop('selectedIndex', 3);
        //Set the widht and height of the pdf viewer
        $('div#pdfviewer').css({'width': settings.width + 'px', 'height': settings.height + 'px'});
        //Get the parent that will host all pages
        const container = document.getElementById('page-container');
        //Read the whole document
        pdfjsLib.getDocument(documentName).promise.then((doc) => {
            initialState.pdfDoc = doc;
            //store the document raw data for download and print purpose
            doc.getData().then(arrayBuffer => {
                rawPdfData = arrayBuffer;//Uint8Array
            });
            doc.getMetadata().then(metadata => {
                //if the document has a title
                if (metadata.info.Title)
                    $('#doc-title').text(metadata.info.Title);
            });
            //Set the total page number
            $('span#page-number').text(initialState.pdfDoc.numPages);
            if (initialState.pdfDoc.numPages <= 50)
                initialState.pdfDoc.lastPageIndex = initialState.pdfDoc.numPages;
            //Render the first page
            renderPages();
        }).catch((err) => {
            alert(err.message);
        });

        //This function renders a page inside the canvas
        const renderPages = () => {
            $('#current-page').val(initialState.currentPage);
            //clear the previous page
            $('#page-container').empty();
            //Rerender all the pages
            initialState.pdfDoc
                //Load the first page
                .getPage(initialState.currentPage)
                .then(renderPage);
        };
        //This function render a single page to the pdf viewer
        const renderPage = (page) => {
            const canvas = document.createElement('canvas');
            canvas.style.display = 'block';
            canvas.id = 'page-' + initialState.currentPage;
            canvas.classList.add('pdf-page');
            const ctx = canvas.getContext('2d');
            const viewport = page.getViewport({scale: initialState.zoom});
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            //Render the pdf page into the canvas context
            const renderingContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            page.render(renderingContext);

            container.appendChild(canvas);
            //Move to the next page
            initialState.currentPage++;

            if (initialState.pdfDoc !== null && initialState.currentPage <= initialState.pdfDoc.numPages) {
                initialState.pdfDoc
                    //Load the next page in the pdf file
                    .getPage(initialState.currentPage)
                    .then(renderPage);
            } else
                initialState.currentPage = 1;
        };

        /**
         * Convert tye URI data to a typed array
         * @param dataURI The data to convert
         * @returns {Uint8Array} a typed array of the same data
         */
        const convertDataURIToBinary = (dataURI) => {
            const base64Index = dataURI.indexOf(base64Marker) + base64Marker.length;
            const base64 = dataURI.substring(base64Index);
            const raw = window.atob(base64);
            const rawLength = raw.length;
            const array = new Uint8Array(new ArrayBuffer(rawLength));

            for (let i = 0; i < rawLength; i++) {
                array[i] = raw.charCodeAt(i);
            }
            return array;
        }

        /**
         * Force a file to be downloaded within the browser
         * @param data the file data to be downloaded
         * @param filename the name of the file to download
         */
        const downloadInBrowser = (function () {
            let a = document.createElement('a');
            a.style.display = "none";
            container.appendChild(a);
            return function (data, filename, isBase64) {
                data = new Blob([rawPdfData], {type: "application/pdf"});
                //generate the link
                a.href = window.URL.createObjectURL(data);
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(data);
            };
        }());

        //This function navigate to the previous age
        const showPreviousPage = () => {
            if (initialState.pdfDoc === null || initialState.currentPage === 1)
                return;
            //Render the previous page
            goToPage(initialState.currentPage - 1);
        };

        //This function navigate to the next page
        const showNextPage = () => {
            if (initialState.pdfDoc === null || initialState.currentPage === initialState.pdfDoc.numPages)
                return;
            //Render the next page
            goToPage(initialState.currentPage + 1);
        };

        //THis function navigate to the first page
        const showFirstPage = () => {
            if (initialState.pdfDoc == null)
                return;
            //Render the first page
            goToPage(1);
        };

        //This function navigate to the last page
        const showLastPage = () => {
            if (initialState.pdfDoc == null)
                return;
            //render the last page
            goToPage(initialState.pdfDoc._pdfInfo.numPages)
        };
        //This function navigate to indexed page
        const goToPage = (pageIndex) => {
            initialState.currentPage = pageIndex;
            let targetPage = $('canvas#page-' + pageIndex + '.pdf-page');
            let scrollDistance = (pageIndex - 1) * (targetPage.height() + 20);//There's a 20px margin top and bottom of each page
            //Render the page
            $('#page-container').animate({
                scrollTop: scrollDistance
            }, 700);
            //Update the current page number
            $('#current-page').val(initialState.currentPage);
        }

        //Scale down the current page
        const zoomOut = () => {
            if (initialState === null)
                return;
            initialState.zoom *= 2 / 3.0;
            //render the scaled page
            zoomTo(initialState.zoom);
        };

        //Scale up the current page
        const zoomIn = () => {
            if (initialState === null)
                return;
            initialState.zoom *= 4 / 3.0;
            //render the scaled page
            zoomTo(initialState.zoom);
        };

        //Scale to a specified ration
        const zoomTo = (ratio) => {
            if (initialState === null)
                return;
            initialState.zoom = ratio;
            //render the page at the specified ratio
            renderPages()
        };

        $('#current-page').on('keypress', function (e) {
            if (initialState.pdfDoc === null)
                return;
            // Get the key code.
            const keycode = event.keyCode ? event.keyCode : event.which;
            //if the user presses the Enter key
            if (keycode === 13) {
                // Get the new page number and render it.
                let pageNumber = window.parseInt($(this).val());

                initialState.currentPage = Math.min(Math.max(pageNumber, 1), initialState.pdfDoc._pdfInfo.numPages);
                goToPage(initialState.currentPage);
                $(this).val(initialState.currentPage);
            }
        });

        //Navigation functionalities
        $('span#btn-first').on('click', function (e) {
            showFirstPage();
        });
        $('span#btn-prev').on('click', function (e) {
            showPreviousPage();
        });
        $('span#btn-next').on('click', function (e) {
            showNextPage();
        });
        $('span#btn-last').on('click', function (e) {
            showLastPage();
        });
        //Zoom functionalities
        $('span#btn-zoom-in').on('click', function (e) {
            zoomIn();
        });
        $('span#btn-zoom-out').on('click', function (e) {
            zoomOut();
        });
        $('span#btn-download').on('click', function (e) {
            downloadInBrowser(rawPdfData, settings.filename, settings.isBase64);
        });
        $('span#btn-print').on('click', function (e) {
            let data = new Blob([rawPdfData], {type: "application/pdf"});
            let dataUrl = window.URL.createObjectURL(data);

            if (typeof printJS === "function") {
                printJS(dataUrl);
            } else {
                console.log('PrintJS is required to print document');
                //open the window
                let printWindow = window.open(dataUrl);
                printWindow.print();
            }

        });
        $('select#zoom-list').on('change', function (e) {
            let selectedZoom = $('select#zoom-list option:selected').val();
            selectedZoom = window.parseFloat(selectedZoom);
            zoomTo(selectedZoom);
        });
        //Listen to scroll events inside the pdf viewer
        $('#page-container').on('scroll', function (e) {
            e.preventDefault();
            if (initialState.pdfDoc === null)
                return;
            //Get the scroll distance and update the page number
            initialState.scrollTop = $(this).scrollTop();
            const pageHeight = $('#page-1').height() + 20;//The page height + top margin
            const pageIndex = Math.round(Math.ceil(initialState.scrollTop / pageHeight));//
            $('#current-page').val(pageIndex);
        });
    };
})(jQuery);