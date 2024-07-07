// assets/JS/Model/csvParser.js

var App = App || {};

App.fileHandling = (function() {
    const STANDARD_HEADERS = `"Parent ID number","ID number","Short name",Description,"Description format","Scale values","Scale configuration","Rule type (optional)","Rule outcome (optional)","Rule config (optional)","Cross-referenced competency ID numbers","Exported ID (optional)","Is framework",Taxonomy`;

    function parseCSV(file, isText = false) {
        return new Promise((resolve, reject) => {
            const config = {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.data.length === 0) {
                        App.alerts.showAlert('No data found in the CSV file.');
                        hideLoadingEffects();
                        return;
                    }
                    handleFileParsingComplete(results);
                    resolve(results.data);
                },
                error: function(error) {
                    reject(error);
                }
            };

            if (isText) {
                file = replaceFirstLine(file, STANDARD_HEADERS);
                Papa.parse(file, config);
            } else {
                const reader = new FileReader();
                reader.onload = function(event) {
                    let text = event.target.result;
                    text = replaceFirstLine(text, STANDARD_HEADERS);
                    Papa.parse(text, config);
                };
                reader.onerror = function(event) {
                    reject(event.target.error);
                };
                reader.readAsText(file);
            }
        });
    }

    function fetchAndParseCSV(path, fileName) {
        return fetch(path)
            .then(response => response.text())
            .then(csvText => parseCSV(csvText, true).then(data => ({ data, fileName })));
    }

    function replaceFirstLine(csvText, newFirstLine) {
        const lines = csvText.split('\n');
        lines[0] = newFirstLine;
        return lines.join('\n');
    }

    function handleFileParsingComplete(results) {
        App.state.appState.temporaryData = results.data;
        App.state.updateTaxonomyLevels();

        const frameworkId = results.data.find(row => row['Is framework'] === '1')['ID number'];
        const newFrameworkData = {
            id: frameworkId,
            data: results.data,
        };

        const nodeMap = createNodeMap(newFrameworkData.data);

        if (nodeMap[frameworkId]) {
            const rootNode = nodeMap[frameworkId];
            Object.values(nodeMap).forEach(node => {
                if (!node['Parent ID number'] && node['ID number'] !== frameworkId) {
                    rootNode.children.push(node);
                }
            });
            createFrameworkUI(rootNode);
        } else {
            console.error('Root node not found in nodeMap');
        }

        App.state.appState.data = results.data;  // Copy temporary data to final data
        App.statistics.displayStatistics();
        hideLoadingEffects();
    }

    function createNodeMap(data) {
        const nodeMap = {};
        data.forEach(item => {
            if (item['ID number'] && item['Short name']) {
                nodeMap[item['ID number']] = {
                    ...item,
                    children: []
                };
            }
        });

        // Ensure the framework node is processed first
        const frameworkNode = data.find(item => item['Is framework'] === '1');
        if (frameworkNode) {
            const frameworkId = frameworkNode['ID number'];
            nodeMap[frameworkId].children = data.filter(item => item['Parent ID number'] === frameworkId);
        }

        Object.values(nodeMap).forEach(node => {
            const parentId = node['Parent ID number'];
            if (parentId && nodeMap[parentId]) {
                nodeMap[parentId].children.push(node);
            }
        });

        return nodeMap;
    }

    function createFrameworkUI(rootNode) {
        App.tree.createTree(rootNode);
    }

    function showLoadingEffects() {
        $('#tree-loading').show();
        $('#details-loading').show();
        $('#stats-loading').show();
        $('#tree').hide();
        $('#details').hide();
    }

    function hideLoadingEffects() {
        $('#tree-loading').hide();
        $('#details-loading').hide();
        $('#stats-loading').hide();
    }

function populateSampleFilesDropdown(sampleFiles) {
    const dropdown = $('#sampleFilesDropdown');
    dropdown.empty();

    const categories = [...new Set(sampleFiles.map(file => file.category))];
    categories.forEach(category => {
        const categoryItem = $('<li><h6 class="dropdown-header">' + category + '</h6></li>');
        dropdown.append(categoryItem);
        sampleFiles.filter(file => file.category === category).forEach(file => {
            const item = $('<li><a class="dropdown-item" href="#" data-path="' + file.path + '" data-message="' + file.message + '">' + file.name + '</a></li>');
            dropdown.append(item);
        });
    });

    dropdown.on('click', '.dropdown-item', function(e) {
        e.preventDefault();
        const filePath = $(this).data('path');
        const fileName = filePath.split('/').pop(); // Extract the file name from the path
        const fileMessage = $(this).data('message');
        if (filePath && fileName) {
            fetchAndParseCSV(filePath, fileName)
                .then(() => {
                    App.alerts.showAlert(fileMessage || `Sample loaded: ${fileName}`);
                    $('#csvFileName').val(fileName).show();
                    $('#csvFileInput').val('');
                    App.state.appState.fileName = fileName; // Ensure fileName is set in the appState
                    App.utilities.updateURL('preview', fileName, App.state.appState.selectedIDs); // Update the URL with the file name
                    App.utilities.updatePageTitle(fileName); // Update the page title with the file name
                })
                .catch(error => console.error('Error fetching and parsing file:', error));
        }
    });
}

    return {
        parseCSV: parseCSV,
        fetchAndParseCSV: fetchAndParseCSV,
        handleFileParsingComplete: handleFileParsingComplete,
        showLoadingEffects: showLoadingEffects,
        hideLoadingEffects: hideLoadingEffects,
        populateSampleFilesDropdown: populateSampleFilesDropdown
    };
})();
