let currentBook = null;
let currentChapterIndex = 0;

export async function initReader(epubData, contentArea) {
    currentBook = epubData.book;
    const tocList = document.getElementById('toc-list');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const currentPage = document.getElementById('current-page');

    // Initialize navigation buttons
    prevButton.addEventListener('click', () => navigateChapter('prev'));
    nextButton.addEventListener('click', () => navigateChapter('next'));

    // Render table of contents
    epubData.toc.forEach((chapter, index) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = chapter.label;
        link.href = '#';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentChapterIndex = index;
            renderChapter(index);
        });
        li.appendChild(link);
        tocList.appendChild(li);
    });

    // Render first chapter
    await renderChapter(0);

    function updatePageInfo() {
        currentPage.textContent = `Chapter: ${currentChapterIndex + 1}/${epubData.toc.length}`;
    }

    async function renderChapter(index) {
        try {
            const chapter = epubData.toc[index];
            await currentBook.ready;

            // Get spine item using the cfi if available, otherwise use href
            let spineItem;
            if (chapter.cfi) {
                spineItem = await currentBook.spine.get(chapter.cfi);
            } else {
                const cleanHref = chapter.href.split('#')[0];
                spineItem = await currentBook.spine.get(cleanHref);
            }

            if (!spineItem) {
                throw new Error(`Could not find spine item for chapter: ${chapter.label}`);
            }

            // Load the content
            const html = await spineItem.load();

            // Usamos un div temporal para procesar el HTML
            const content = document.createElement('div');
            Array.from(html.childNodes).forEach(node => {
                content.appendChild(node.cloneNode(true));
            });

            // Fix resource URLs before rendering
            const resources = content.querySelectorAll('img, link[rel="stylesheet"], a[href]');
            resources.forEach(element => {
                const originalSrc = element.getAttribute('src') || element.getAttribute('href');
                if (originalSrc && !originalSrc.startsWith('http') && !originalSrc.startsWith('#')) {
                    try {
                        const resolvedUrl = currentBook.resolve(originalSrc);
                        if (element.tagName === 'IMG') {
                            element.src = resolvedUrl;
                        } else if (element.tagName === 'LINK') {
                            element.href = resolvedUrl;
                        } else if (element.tagName === 'A') {
                            if (!originalSrc.startsWith('#')) {
                                element.href = resolvedUrl;
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to resolve URL: ${originalSrc}`, e);
                    }
                }
            });

            // Clear the content area first
            contentArea.innerHTML = content.innerHTML;
            
            currentChapterIndex = index;
            updatePageInfo();

        } catch (error) {
            console.error('Error rendering chapter:', error);
            contentArea.innerHTML = `<p>Error loading chapter content: ${error.message}</p>`;
        }
    }

    async function navigateChapter(direction) {
        if (direction === 'prev' && currentChapterIndex > 0) {
            await renderChapter(currentChapterIndex - 1);
        } else if (direction === 'next' && currentChapterIndex < epubData.toc.length - 1) {
            await renderChapter(currentChapterIndex + 1);
        }
    }
}

export function clearReader() {
    currentBook = null;
    currentChapterIndex = 0;
    document.getElementById('toc-list').innerHTML = '';
    document.getElementById('current-page').textContent = 'Page: 0/0';
    document.getElementById('content-area').innerHTML = '<p>Please load an EPUB file to start reading.</p>';
}