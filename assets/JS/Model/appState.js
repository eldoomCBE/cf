// assets/JS/Model/appState.js

var App = App || {};

App.state = (function() {
    const appState = {
        data: [],
        temporaryData: [],
        taxonomyLevels: [],
        levelMap: {},
        isTreeExpanded: false,
        currentNode: [],
        isStatisticsActive: false,
        treeCount: 0,
        fileName: '',
        selectedIDs: [],
        isEditMode: false
    };

    function updateTaxonomyLevels() {
        const frameworks = appState.temporaryData.filter(row => row['Is framework'] === '1');
        if (frameworks.length > 0) {
            appState.taxonomyLevels = frameworks[0]['Taxonomy'].split(',');
        } else {
            appState.taxonomyLevels = [];
        }
    }

    function getTaxonomyLevel(node, taxonomy) {
        const nodeId = node['ID number'];
        if (!appState.levelMap[nodeId]) {
            calculateTaxonomyLevels();
        }
        const level = appState.levelMap[nodeId];
        return level === 0 ? 'Competency Framework' : (taxonomy[level - 1] || 'Competency');
    }

    function calculateTaxonomyLevels() {
        const nodeMap = {};
        appState.temporaryData.forEach(node => {
            nodeMap[node['ID number']] = node;
        });

        function calculateLevel(node) {
            if (node['Is framework'] === '1') {
                return 0;
            }
            const parentId = node['Parent ID number'];
            if (!parentId) {
                return 1;
            }
            const parent = nodeMap[parentId];
            return calculateLevel(parent) + 1;
        }

        appState.temporaryData.forEach(node => {
            const nodeId = node['ID number'];
            appState.levelMap[nodeId] = calculateLevel(node);
        });
    }

    function sanitizeID(id) {
        return id.replace(/[^a-zA-Z0-9-]/g, '-');
    }

    function toggleStatistics() {
        appState.isStatisticsActive = !appState.isStatisticsActive;
    }

    function updateUI() {
        if (appState.isStatisticsActive) {
            $('#statistics-container').show();
            $('#show-stats').addClass('active');
        } else {
            $('#statistics-container').hide();
            $('#show-stats').removeClass('active');
        }
    }

    function resetUI() {
        $('#tree').jstree("destroy").empty();
        $('#details').empty();
        $('#statistics-container').hide();
        appState.currentNode = [];
        appState.levelMap = {};
    }

    function updateURL() {
        const mode = appState.isStatisticsActive ? 'stats' : 'preview';
        App.utilities.updateURL(mode, appState.fileName, appState.selectedIDs);
    }

    function selectNode(nodeId) {
        if (!appState.selectedIDs.includes(nodeId)) {
            appState.selectedIDs.push(nodeId);
            updateURL();
            logSelection();
        }
    }

    function deselectNode(nodeId) {
        appState.selectedIDs = appState.selectedIDs.filter(id => id !== nodeId);
        updateURL();
        logSelection();
    }

    function setSelectedIDs(nodeIds) {
        appState.selectedIDs = nodeIds;
        updateURL();
        logSelection();
    }

    function logSelection() {}

    function setEditMode(isEditMode) {
        appState.isEditMode = isEditMode;
    }

    function getEditMode() {
        return appState.isEditMode;
    }

    return {
        appState,
        updateTaxonomyLevels,
        getTaxonomyLevel,
        sanitizeID,
        toggleStatistics,
        updateUI,
        resetUI,
        selectNode,
        deselectNode,
        setSelectedIDs,
        logSelection,
        updateURL,
        setEditMode,
        getEditMode
    };
})();

