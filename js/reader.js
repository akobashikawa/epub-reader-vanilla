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
    
            const spineItem = chapter.cfi 
                ? await currentBook.spine.get(chapter.cfi)
                : await currentBook.spine.get(chapter.href.split('#')[0]);
    
            if (!spineItem) {
                throw new Error(`Chapter not found: ${chapter.label}`);
            }
    
            const html = await spineItem.load();
            const content = document.createElement('div');
            content.innerHTML = html.innerHTML;
    
            // Procesar recursos
            content.querySelectorAll('[src],[href]').forEach(element => {
                const attr = element.hasAttribute('src') ? 'src' : 'href';
                const originalSrc = element.getAttribute(attr);
                
                if (originalSrc && !/^(https?:|#)/.test(originalSrc)) {
                    try {
                        element.setAttribute(attr, currentBook.resolve(originalSrc));
                    } catch (e) {
                        console.warn(`Failed to resolve URL: ${originalSrc}`, e);
                    }
                }
            });
    
            contentArea.innerHTML = '';
            contentArea.appendChild(content);
            currentChapterIndex = index;
            updatePageInfo();
            contentArea.scrollTo(0, 0);
    
        } catch (error) {
            console.error('Error rendering chapter:', error);
            contentArea.innerHTML = `<p>Error: ${error.message}</p>`;
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