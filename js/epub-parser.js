async function debugBookStructure(book) {
    console.log('Book Structure:', {
        spine: book.spine.items.map(item => ({
            href: item.href,
            id: item.idref,
            index: item.index
        })),
        navigation: book.navigation.toc,
        resources: Object.keys(book.resources.resources),
        archive: Object.keys(book.archive.zip.files)
    });
}

async function safeLoad(spineItem, book) {
    try {
        const href = spineItem.href;
        const canonical = spineItem.canonical;
        
        // 1. Get the Blob from archive
        // const blob = await book.archive.getBlob(canonical);
        const content = await book.archive.request(canonical, 'blob');
        if (!content) {
            throw new Error('El contenido del capítulo está vacío');
        }
        
        // 2. Convert Blob to text
        const text = await content.text();
        
        // 3. Parse the text content
        const parser = new DOMParser();
        const html = parser.parseFromString(text, 'text/html');
        console.log('Parsed Document:', html);
        
        // 4. Return only the body content
        return html.body;
    } catch (error) {
        console.error('Error in safeLoad:', error);
        throw new Error(`Failed to load chapter: ${error.message}`);
    }
}

export function parseEpub(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const book = ePub(arrayBuffer, { openAs: 'binary', storage: 'memory' });
                
                await book.ready;
                await debugBookStructure(book);

                // Forzar carga en memoria
                book.loaded.resources = {};
                book.loaded.manifest = {};
                
                const metadata = await book.loaded.metadata;
                const navigation = await book.loaded.navigation;
                
                const epubData = {
                    metadata: metadata,
                    toc: navigation.toc,
                    book: book
                };
                
                resolve(epubData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

export function getChapterContent(book, chapterId) {
    return new Promise(async (resolve, reject) => {
        try {
            const chapter = await book.spine.get(chapterId);
            // const content = await chapter.load();
            const content = await safeLoad(chapter, book);
            resolve(content);
        } catch (error) {
            reject(error);
        }
    });
}