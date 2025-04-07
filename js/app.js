import { parseEpub } from './epub-parser.js';
import { initReader, clearReader } from './reader.js';

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');  // Changed from 'epub-file'
    const loadButton = document.getElementById('load-epub');
    const contentArea = document.getElementById('content-area');  // Changed from 'content-display'

    if (!fileInput || !loadButton || !contentArea) {
        console.error('Required elements not found');
        return;
    }

    loadButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select an EPUB file first');
            return;
        }

        try {
            clearReader();
            const epubData = await parseEpub(file);
            await initReader(epubData, contentArea);
        } catch (error) {
            console.error('Error loading EPUB:', error);
            contentArea.innerHTML = '<p>Error loading EPUB file. Please try again.</p>';
        }
    });

    fileInput.addEventListener('change', () => {  // Changed from 'click' to 'change'
        if (!fileInput.files.length) {
            fileInput.value = '';
        }
    });
});