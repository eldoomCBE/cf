// assets/JS/View/tagcloudView.js

var App = App || {};

App.tagcloud = (function() {
    const excludeWords = [
        'the', 'and', 'is', 'in', 'to', 'with', 'a', 'for', 'of', 'on', 'it', 'this',
        'that', 'by', 'an', 'be', 'are', 'as', 'at', 'or', 'from', 'was', 'were', 'which',
        'but', 'not', 'nbsp', 'le', 'la', 'les', 'des', 'de', 'et', 'en', 'dans', 'ce', 'sur', 'aux', 'ou', 'du', 'une', 'un', 'se', 'au', 'pour', 'avec'
    ];

    function extractTopWords(data) {
        const wordCounts = {};
        const regex = /(\p{L}[\p{L}\p{M}'’]*|\p{Emoji_Presentation}\p{Emoji_Modifier_Base}?\p{Emoji_Modifier}?\p{Emoji}*)/gu;

        data.forEach(item => {
            try {
                const text = ((item['Description'] ? item['Description'].replace(/<[^>]*>/g, '') : '') + ' ' +
                              (item['Short name'] ? item['Short name'] : ''));
                const words = text.match(regex);
                if (words) {
                    words.forEach(word => {
                        const lowerWord = word.toLowerCase();
                        if (lowerWord.length > 1 && !excludeWords.includes(lowerWord)) {
                            if (!wordCounts[lowerWord]) {
                                wordCounts[lowerWord] = { text: word, toBeSelectedItems: 0, occurrences: 0, description: 0 };
                            }
                            wordCounts[lowerWord].occurrences++;
                            if (item['Short name'] && item['Short name'].toLowerCase().includes(lowerWord)) {
                                wordCounts[lowerWord].toBeSelectedItems++;
                            }
                            if (item['Description'] && item['Description'].toLowerCase().includes(lowerWord)) {
                                wordCounts[lowerWord].description++;
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error processing item:', item, error);
            }
        });

        const sortedWords = Object.values(wordCounts).sort((a, b) => b.occurrences - a.occurrences);
        return sortedWords.slice(0, 100);
    }

    function generateTagCloudContent() {
        const words = extractTopWords(App.state.appState.temporaryData);
        const tagsList = $('#tags-list');

        if (!tagsList.length) {
            console.error('Tag list element not found');
            return;
        }

        $('#loader').show();

        const maxOccurrences = words.length > 0 ? words[0].occurrences : 1;
        tagsList.html(
            words.map(word => {
                const fontSize = Math.max(10, (word.occurrences / maxOccurrences) * 50); // Adjust font size based on occurrences
                return `<li><a href="#" title="${word.text} (${word.occurrences})" data-weight="${word.occurrences}" style="font-size:${fontSize}px;">${word.text}</a></li>`;
            }).join('')
        );

        waitForCanvasToBeVisible().then(() => {
            initializeTagCanvas(words.length);
            $('#loader').hide();
        });
    }

    function waitForCanvasToBeVisible() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const canvas = document.getElementById('tagcanvas');
                if (canvas && canvas.offsetParent !== null) { // Check if canvas is in the DOM and visible
                    clearInterval(interval);
                    resolve();
                }
            }, 100); // Adjust the interval if needed
        });
    }

    function initializeTagCanvas(wordCount) {
        const canvas = document.getElementById('tagcanvas');
        const tagsDiv = document.getElementById('tags');

        if (!canvas || !tagsDiv) {
            console.error('Canvas, tags div, or container not found');
            return;
        }

        adjustCanvasSize(); // Adjust size before initializing

        const maxSpeed = wordCount > 50 ? 0.03 : 0.05; // Adjust speed based on word count
        const textColour = wordCount > 50 ? '#FFF' : '#FFF';

        if (canvas && typeof TagCanvas !== 'undefined') {
            try {
                TagCanvas.Start('tagcanvas', 'tags', {
                    textFont: 'Impact, sans-serif',
                    textColour: textColour,
                    bgColour: 'transparent',
                    outlineColour: '#beebff',
                    weight: true,
                    reverse: true,
                    dragControl: true,
                    depth: 0.8,
                    maxSpeed: maxSpeed,
                    tooltip: 'native'
                });

                // Make event listeners passive
                canvas.addEventListener('touchstart', function() {}, { passive: true });
                canvas.addEventListener('touchmove', function() {}, { passive: true });
                canvas.addEventListener('mousewheel', function() {}, { passive: true });

            } catch(e) {
                console.log('Error initializing TagCanvas:', e);
            }
        } else {
            console.error('Canvas or TagCanvas library not found, or TagCanvas library not loaded');
        }

        // Adjust canvas size on window resize
        window.addEventListener('resize', debounce(adjustCanvasSize, 500));
    }

    function adjustCanvasSize() {
        const canvas = document.getElementById('tagcanvas');
        const container = document.getElementById('tagcloud-container');

        if (canvas && container) {
            const rect = container.getBoundingClientRect();
            const scale = window.devicePixelRatio || 1;
            canvas.width = rect.width * scale; 
            canvas.height = rect.width * 0.75 * scale; 
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.width * 0.75}px`;
        }
    }

    function showDetailsForWord(word) {
        const matchedItems = App.state.appState.temporaryData.filter(item => 
            (item.Description && item.Description.toLowerCase().includes(word.toLowerCase())) ||
            (item['Short name'] && item['Short name'].toLowerCase().includes(word.toLowerCase()))
        );
        $('#details').empty();
        const nodeIds = matchedItems.map(item => item['ID number'] || item['ID']);
        $('#tree').jstree('deselect_all');
        $('#tree').jstree('select_node', nodeIds);
    }

    $(document).on('click', '#tags a', function(event) {
        event.preventDefault();
        const word = $(this).text();
        showDetailsForWord(word);
    });

    function debounce(func, delay) {
        let timeoutId;
        return function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, arguments);
            }, delay);
        };
    }

    return {
        generateTagCloudContent: generateTagCloudContent,
        extractTopWords: extractTopWords,
        showDetailsForWord: showDetailsForWord
    };
})();
