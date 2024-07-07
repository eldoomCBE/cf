// assets/JS/Model/treeModel.js

var App = App || {};

App.tree = (function() {
    function updateURLWithSelectedNodes() {
        const fileName = App.state.appState.fileName;
        const mode = App.state.appState.isStatisticsActive ? 'stats' : 'preview';
        const selectedIDs = App.state.appState.selectedIDs;
        const uniqueIDs = Array.from(new Set(selectedIDs)); // Remove duplicates
        App.utilities.updateURL(mode, fileName, uniqueIDs);
    }

    function initializeTree() {
        $('#tree').on('select_node.jstree', function(e, data) {
            // console.log('select_node event triggered', data);
            // console.log('Selected nodes:', data.selected);
            var nodes = data.selected.map(nodeId => {
                const node = data.instance.get_node(nodeId);
                // console.log('Node details:', node);
                return node ? node.original : null;
            }).filter(node => node !== null && node.id !== 'root'); // Ajout de la condition pour éviter 'root'
            App.state.appState.currentNode = nodes;
            App.details.updateSelectedTitle(nodes); // Update title on node select
            showLoadingInDetails();
            setTimeout(() => {
                App.details.showDetails(nodes);
            }, 500);

            App.state.appState.selectedIDs = [];
            nodes.forEach(node => {
                if (node) {
                    const nodeId = node['ID number'] || node.id;
                    // console.log("Calling selectNode for ID: ", nodeId);
                    if (nodeId) {
                        App.state.selectNode(nodeId);
                    } else {
                        console.error('ID number is undefined for node:', node);
                    }
                }
            });
            updateURLWithSelectedNodes();
        });

        $('#tree').on('deselect_node.jstree', function(e, data) {
            // console.log('deselect_node event triggered', data);
            // console.log('Deselected node:', data.node);

            var nodes = data.instance.get_selected(true).map(node => {
                // console.log('Remaining selected node details:', node);
                return node.original;
            }).filter(node => node !== null);
            App.state.appState.currentNode = nodes;
            App.details.updateSelectedTitle(nodes);
            showLoadingInDetails();
            setTimeout(() => {
                App.details.showDetails(nodes);
            }, 500);

            if (data.node && data.node.original) {
                const nodeId = data.node.original['ID number'] || data.node.original.id;
                // console.log("Calling deselectNode for ID: ", nodeId);
                if (nodeId) {
                    App.state.deselectNode(nodeId);
                } else {
                    console.error('ID number is undefined for node:', data.node.original);
                }
            }
            updateURLWithSelectedNodes();
        });
    }

    function createTree(data) {
        if (!data || !data.children || !Array.isArray(data.children)) {
            // console.error('Invalid data for creating tree:', data);
            return;
        }

        var treeData = formatDataToTree(data);

        if (typeof $.fn.jstree !== 'function') {
            // console.error("jstree is not loaded");
            return;
        }

        if ($.jstree.reference('#tree')) {
            $('#tree').jstree("destroy").empty();
        }

        $('#tree').jstree({
            'core': {
                'data': treeData
            },
            "search": {
                "case_insensitive": true,
                "show_only_matches": true
            },
            "plugins": ["search"]
        }).on('loaded.jstree', function() {
            $('#tree').jstree('open_all');
            $('#expand-collapse-icon').removeClass('bi-arrows-expand').addClass('bi-arrows-collapse');
            App.state.appState.isTreeExpanded = true;
            initializeTree();
        });

        $('#tree-loading').hide();
        $('#tree').show();
    }

    function formatDataToTree(node) {
        function buildTreeNode(node) {
            var treeNode = {
                id: node['ID number'],
                text: node['Short name'],
                children: node.children && node.children.length ? node.children.map(child => buildTreeNode(child)) : []
            };

            if (!node['ID number']) {
                console.error('ID number is missing in node:', node);
            }

            treeNode.original = node;

            return treeNode;
        }

        return [buildTreeNode(node)];
    }

    function replacePlaceholders(item, placeholders) {
        if (typeof item !== 'string') return item;

        let replacedItem = item;
        for (const [placeholder, value] of Object.entries(placeholders)) {
            const regex = new RegExp(`\\[${placeholder}\\]`, 'g');
            replacedItem = replacedItem.replace(regex, value);
        }
        return replacedItem;
    }

    function loadCardContent(selector, contentGenerator) {
        $(selector).html(createLoadingPlaceholder());

        setTimeout(() => {
            const content = contentGenerator();
            $(selector).html(content);
        }, 1000);
    }

    function createLoadingPlaceholder() {
        return `
            <div class="placeholder-glow">
                <p class="placeholder col-12"></p>
                <p class="placeholder col-12"></p>
                <p class="placeholder col-12"></p>
            </div>
        `;
    }

    function resetTreeAndDetails() {
        $('#tree').jstree("destroy").empty();
        $('#details').empty();
        $('#selected-title').text('Selected Competency Framework');
        $('#tree-loading').show();
        $('#details-loading').show();
        $('#statistics').hide();
        App.state.appState.currentNode = [];
    }

    function showLoadingInDetails() {
        $('#details').html(createLoadingPlaceholder());
    }

function refreshNode(nodeId, newName) {
    const node = $('#tree').jstree(true).get_node(nodeId);
    if (node) {
        $('#tree').jstree('rename_node', node, newName);
    }
}

function updateTreeTitles() {
    App.state.appState.data.forEach(node => {
        refreshNode(node['ID number'], node['Short name']);
    });
    App.editController.refreshEditBindings();  // Ensure this function is correctly called
}

    return {
        createTree: createTree,
        loadCardContent: loadCardContent,
        createLoadingPlaceholder: createLoadingPlaceholder,
        resetTreeAndDetails: resetTreeAndDetails,
        showLoadingInDetails: showLoadingInDetails,
        replacePlaceholders: replacePlaceholders,
        formatDataToTree: formatDataToTree,
        refreshNode: refreshNode,
        updateTreeTitles: updateTreeTitles
    };
})();
