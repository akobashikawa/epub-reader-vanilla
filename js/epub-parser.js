export function parseEpub(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const book = ePub(arrayBuffer);
                
                await book.ready;
                
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
            const content = await chapter.load();
            resolve(content);
        } catch (error) {
            reject(error);
        }
    });
}