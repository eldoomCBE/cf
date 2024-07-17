// assets/JS/Controller/endPanelController.js

var App = App || {};

App.statisticsLoader = (function() {
    function displayStatistics() {
        $('#statistics').show();

        $('#table-card').show();
        App.statistics.generateTableContent(App.state.appState.data);

        $('#chart-card').show();
        App.chart.generateDoughnutChartContent(App.state.appState.data);

        $('#tagcloud-card').show();
        App.tagcloud.generateTagCloudContent();
    }

    function updateJsonOutput() {
        const outputElement = $('#floatingOutput');
        const exportButton = $('#exportButton');
        const jsonOutput = JSON.stringify(App.state.appState.data, null, 2); // Format JSON with 2 spaces
        
        outputElement.val(jsonOutput); // Update the Output field

        // Disable the Export button
        exportButton.prop('disabled', true);

        // Remove classes to reset the animation state
        outputElement.removeClass('animated done');

        // Delay before triggering the animation
        setTimeout(() => {
            outputElement.addClass('animated');
            // Add the 'done' class after the animation completes
            setTimeout(() => {
                outputElement.addClass('done');
                // Enable the Export button after animation
                exportButton.prop('disabled', false);
            }, 2000); // Duration of the animation
        }, 2000); // Initial delay before starting the animation
    }

    return {
        displayStatistics: displayStatistics,
        updateJsonOutput: updateJsonOutput
    };
})();

$(document).ready(function() {
    // Reinitialize animation on sidebar toggle
    $('#left-sidebarToggle, #right-sidebarToggle').on('click', function() {
        const outputElement = $('#floatingOutput');
        const exportButton = $('#exportButton');
        
        // Disable the Export button
        exportButton.prop('disabled', true);

        outputElement.removeClass('animated done');
        setTimeout(() => {
            outputElement.addClass('animated');
            setTimeout(() => {
                outputElement.addClass('done');
                // Enable the Export button after animation
                exportButton.prop('disabled', false);
            }, 2000);
        }, 2000);
    });
});

$(document).ready(function() {
    $('#statistics-container').hide();

    $('#csvFileInput').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            App.fileHandling.parseCSV(file).then(data => {
                App.statisticsLoader.displayStatistics();
                App.statisticsLoader.updateJsonOutput(); // Update JSON output after loading file
            });
        }
    });
});

App.details = (function() {
    function showDetails(nodes) {
        if (!nodes || nodes.length === 0) {
            $('#details').hide();
            return;
        }

        const detailsHtml = nodes.map(node => {
            if (!node.original) {
                return '';
            }

            const nodeId = node.original['ID number'] ?? node.id;
            const nodeData = App.state.appState.data.find(item => item['ID number'] === nodeId);

            const sanitizedId = App.state.sanitizeID(nodeId);
            const placeholders = nodeData;
            const shortName = App.tree.replacePlaceholders(_.get(nodeData, 'Short name', _.get(nodeData, 'Competency', '')), placeholders);
            const id = App.tree.replacePlaceholders(_.get(nodeData, 'ID number', _.get(nodeData, 'ID', '')), placeholders);
            const description = App.tree.replacePlaceholders(_.get(nodeData, 'Description', ''), placeholders);
            const crossReferencedIDs = createCrossReferencedHTML(nodeData);

            if (!id) {
                console.error("Node ID is undefined for node:", node);
                return '';
            }

            const level = App.state.getTaxonomyLevel(nodeData, App.state.appState.taxonomyLevels);
            const levelIndex = App.state.appState.taxonomyLevels.indexOf(level) + 1;

            let editableFields = '';
            for (const key in nodeData) {
                const value = App.tree.replacePlaceholders(_.get(nodeData, key, ''), placeholders);
                const keyClass = key.toLowerCase().replace(/[^a-z0-9]/g, '-'); // Sanitize key to use as class

                if (key === 'Description') {
                    editableFields += `
                        <div class="form-floating mb-2 ${keyClass}">
                            ${App.state.getEditMode() ? 
                                `<textarea id="${sanitizedId}_${key}" class="form-control editable" data-id="${sanitizedId}_${key}" rows="3">${value}</textarea>`
                                :
                                `<div class="form-control" readonly style="height: auto;">${value}</div>`
                            }
                            <label for="${sanitizedId}_${key}">${key}</label>
                        </div>
                    `;
                } else {
                    editableFields += `
                        <div class="form-floating mb-2 ${keyClass}">
                            ${App.state.getEditMode() ? 
                                `<input type="text" id="${sanitizedId}_${key}" class="form-control editable" data-id="${sanitizedId}_${key}" value="${value}">`
                                :
                                `<div class="form-control" readonly>${value}</div>`
                            }
                            <label for="${sanitizedId}_${key}">${key}</label>
                        </div>
                    `;
                }
            }

            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <span class="badge bg-secondary b-card level${levelIndex} ${level.toLowerCase()}">${level}</span>
                        <h5 class="card-title pb-3" data-sanitized-id="${sanitizedId}">${shortName} <kbd>${id}</kbd></h5>
                        ${editableFields}
                        ${crossReferencedIDs}
                    </div>
                </div>
            `;
        }).join('');

        $('#details').html(detailsHtml).show();
        $('#statistics').hide();

        App.editController.attachEventListeners();
        App.editController.toggleEditMode(App.state.getEditMode()); // Ensure edit mode is applied immediately
    }

    function createCrossReferencedHTML(node) {
        const crossReferencedIDs = _.get(node, 'Cross-referenced competency ID numbers', '').split(',').filter(id => id.trim() !== '');
        return crossReferencedIDs.length > 0 ? `
            <h6>Cross-referenced competencies:</h6>
            <p>${crossReferencedIDs.map(refId => `<button class="btn p-0 cross-ref-btn" onclick="App.details.selectNode('${refId.trim()}')"><kbd>${refId.trim()}</kbd></button>`).join('<br>')}</p>
        ` : '';
    }    

    function selectNode(nodeId) {
        App.editController.saveData(); // Save data before selecting a new node
        const sanitizedNodeId = App.state.sanitizeID(nodeId);
        const originalNodeId = App.state.getOriginalID(sanitizedNodeId);
        const nodeData = App.state.appState.data.find(node => node['ID number'] === originalNodeId);
        if (nodeData) {
            $('#tree').jstree('deselect_all');
            $('#tree').jstree('select_node', sanitizedNodeId);
            showDetails([{
                original: nodeData,
                id: sanitizedNodeId
            }]);
        }
    }

    function updateSelectedTitle(nodes) {
        const titleElement = $('#selected-title');
        if (nodes.length === 0) {
            titleElement.html('Selected <span class="badge bg-secondary">Competency Framework</span>');
        } else if (nodes.length === 1) {
            const node = nodes[0];
            const level = App.state.getTaxonomyLevel(node.original, App.state.appState.taxonomyLevels);
            const levelIndex = App.state.appState.taxonomyLevels.indexOf(level) + 1;
            titleElement.html(`Selected <span class="badge bg-secondary b-title level${levelIndex} ${level.toLowerCase()}">${level.toUpperCase()}</span>`);
        } else {
            titleElement.html(`Selected <span class="badge bg-secondary">${nodes.length} items</span>`);
        }
    }

    return {
        showDetails: showDetails,
        updateSelectedTitle: updateSelectedTitle,
        selectNode: selectNode
    };
})();