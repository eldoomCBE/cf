// assets/JS/View/treeView.js

var App = App || {};

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

            const sanitizedId = App.state.sanitizeID(node.original['ID number'] ?? node.id);
            const placeholders = node.original;
            const name = App.tree.replacePlaceholders(_.get(node.original, 'Short name', _.get(node.original, 'Competency', '')), placeholders);
            const id = App.tree.replacePlaceholders(_.get(node.original, 'ID number', _.get(node.original, 'ID', '')), placeholders);
            const description = App.tree.replacePlaceholders(_.get(node.original, 'Description', ''), placeholders);
            const crossReferencedIDs = createCrossReferencedHTML(node);

            if (!id) {
                console.error("Node ID is undefined for node:", node);
                return '';
            }

            const level = App.state.getTaxonomyLevel(node.original, App.state.appState.taxonomyLevels);
            const levelIndex = App.state.appState.taxonomyLevels.indexOf(level) + 1;

            let editableFields = '';
            for (const key in node.original) {
                const value = App.tree.replacePlaceholders(_.get(node.original, key, ''), placeholders);
                if (key === 'Description') {
                    editableFields += `
                        <div class="form-floating mb-2">
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
                        <div class="form-floating mb-2">
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
                        <h5 class="card-title">${name} <kbd>${id}</kbd></h5>
                        ${crossReferencedIDs}
                        ${editableFields}
                    </div>
                </div>
            `;
        }).join('');

        $('#details').html(detailsHtml).show();
        $('#statistics').hide();

        App.editController.attachEventListeners();
        if (App.state.getEditMode()) {
            App.editController.toggleEditMode();
        }
    }

    function createCrossReferencedHTML(node) {
        const crossReferencedIDs = _.get(node.original, 'Cross-referenced competency ID numbers', '').split(',').filter(id => id.trim() !== '');
        return crossReferencedIDs.length > 0 ? `
            <h6>Cross-referenced competencies:</h6>
            <p>${crossReferencedIDs.map(refId => `<button class="btn btn-link p-0" onclick="App.details.selectNode('${refId.trim()}')"><kbd>${refId.trim()}</kbd></button>`).join('<br>')}</p>
        ` : '';
    }

    function selectNode(nodeId) {
        const nodeData = App.state.appState.data.find(node => node['ID number'] === nodeId);
        if (nodeData) {
            $('#tree').jstree('deselect_all');
            $('#tree').jstree('select_node', nodeId);
            showDetails([{
                original: nodeData,
                id: nodeId
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

