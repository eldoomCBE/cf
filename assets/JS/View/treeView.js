// assets/JS/View/treeView.js

var App = App || {};

App.details = (function() {
    function showDetails(nodes) {
        if (!nodes || nodes.length === 0) {
            $('#details').hide();
            return;
        }
    
        const settings = App.settings.getSettings();
    
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
            const importantFields = ['parent-id-number','id-number', 'short-name', 'description','description-format','scale-values','scale-configuration','scale-configuration-optional','rule-type','rule-type-optional','rule-outcome','rule-type--optional-','rule-config','rule-config--optional-','cross-referenced-competency-id-numbers','exported-id','exported-id--optional-','is-framework','taxonomy'   
    ];
            for (const key in nodeData) {
                const value = App.tree.replacePlaceholders(_.get(nodeData, key, ''), placeholders);
                const keyClass = key.toLowerCase().replace(/[^a-z0-9]/g, '-'); // Sanitize key to use as class
    
                if (importantFields.includes(keyClass) || settings.preview[keyClass] || App.state.getEditMode() && settings.edit[keyClass]) {
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
                    } else if (key === 'Short name') {
                        editableFields += `
                            <div class="form-floating mb-2 ${keyClass}">
                                <input type="text" id="${sanitizedId}_${key}" class="form-control editable" data-id="${sanitizedId}_${key}" value="${value}" maxlength="100" required>
                                <label for="${sanitizedId}_${key}">${key}</label>
                                <div class="invalid-feedback">
                                    Short name is required and must be less than 100 characters.
                                </div>
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
            }
    
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div>
                            ${App.state.getEditMode() && nodeData['Is framework'] !== '1' ? 
                                `<div class="dropdown">
                                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="treeDotsEdit" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fa-solid fa-ellipsis-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="treeDotsEdit">
                                        <li><a class="dropdown-item delete-item" href="#" data-id="${sanitizedId}">Delete</a></li>
                                    </ul>
                                </div>`
                                : ''}
                            <span class="badge bg-secondary b-card level${levelIndex} ${level.toLowerCase()}">${level}</span>
                        </div>
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
    
        if (App.state.getEditMode()) {
            $('.delete-item').on('click', function(e) {
                e.preventDefault();
                const nodeId = $(this).data('id');
                App.editController.deleteNode(nodeId);
            });
        }
    }      

    function createCrossReferencedHTML(node) {
        const crossReferencedIDs = _.get(node, 'Cross-referenced competency ID numbers', '').split(',').filter(id => id.trim() !== '');
        return crossReferencedIDs.length > 0 ? `
            <h6>Cross-referenced competencies:</h6>
            <p>${crossReferencedIDs.map(refId => `<button class="btn p-0 cross-ref-btn" onclick="App.details.selectNode('${refId.trim()}')"><kbd>${refId.trim()}</kbd></button>`).join('<br>')}</p>
        ` : '';
    }

    function selectNode(nodeId) {
        const originalNodeId = App.state.getOriginalID(nodeId);    
        const nodeData = App.state.appState.data.find(node => node['ID number'] === originalNodeId);
        if (nodeData) {
            $('#tree').jstree('deselect_all');
            $('#tree').jstree('select_node', originalNodeId, true); // Select the node using original ID
            showDetails([{
                original: nodeData,
                id: originalNodeId
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

$(document).ready(function() {
    const container = document.getElementById('tree-container');
    if (container) {
        App.details.updateSelectedTitle([]);

        container.addEventListener('touchstart', function() {}, { passive: true });
        container.addEventListener('touchmove', function() {}, { passive: true });
        container.addEventListener('mousewheel', function() {}, { passive: true });
    }
});

