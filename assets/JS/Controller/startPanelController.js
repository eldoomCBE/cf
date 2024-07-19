// assets/JS/Controller/startPanelController.js

$(document).ready(function () {
    function handleFileLoad(fileName, alertMessage = null) {
        App.state.appState.fileName = fileName;
        App.statistics.displayStatistics();
        App.utilities.updateURL(App.state.getEditMode() ? 'edit' : 'preview', fileName, App.state.appState.selectedIDs);
        App.utilities.updatePageTitle(fileName);

        if (alertMessage) {
            App.alerts.showAlert(alertMessage);
        }

        cleanInvalidSelections();
        App.statisticsLoader.updateJsonOutput();
    }

    function cleanInvalidSelections() {
        setTimeout(() => {
            const { selectedIDs } = App.utilities.getURLParams();
            const validIDs = App.state.appState.data.map(item => item['ID number']);

            const invalidIDs = selectedIDs.filter(id => !validIDs.includes(id));
            if (invalidIDs.length > 0) {
                $('#tree').jstree('deselect_node', invalidIDs);
                App.state.setSelectedIDs(selectedIDs.filter(id => validIDs.includes(id)));
                App.details.showDetails([]);
            }
        }, 100);
    }

    function handleFileSelect(event) {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            App.fileHandling.parseCSV(file)
                .then(() => {
                    handleFileLoad(file.name, `✅ Uploaded file parsed`);
                    cleanInvalidSelections();
                })
                .catch(error => console.error('Error parsing file:', error));
        }
    }

    function handleSampleFileSelect(path, fileName) {
        App.fileHandling.fetchAndParseCSV(path, fileName)
            .then(() => {
                handleFileLoad(fileName);
                cleanInvalidSelections();
            })
            .catch(error => {
                console.error('Error parsing file:', error);
                App.alerts.showAlert(`❌ Error parsing file: ${fileName}`, 'danger');
            });
    }

    function handleURLFile() {
        const { mode, fileName, selectedIDs } = App.utilities.getURLParams();
        const samplesFile = fileName ? fileName.split('/').pop() : 'samples.json'; // Extract samples.json from the URL if present

        if (!fileName) {
            App.state.appState.fileName = '';
            App.utilities.updateURL('preview', '', []);
            App.utilities.updatePageTitle('');
            return;
        }

        // If the URL contains mode=edit, fall back to preview mode while retaining the fileName and selectedIDs
        if (mode === 'edit') {
            App.state.setEditMode(false);
            App.utilities.updateURL('preview', fileName, selectedIDs);
        }

        const filePath = fileName.startsWith('http') ? fileName : `framework_samples/${fileName}`;
        App.state.appState.fileName = fileName;
        App.utilities.updatePageTitle(fileName);

        const fileLoadPromise = filePath.startsWith('http') ?
        fetch(filePath)
        .then(response => {
            if (response.headers.get('Content-Type').includes('application/json')) {
                return response.json().then(data => {
                    App.fileHandling.populateSampleFilesDropdown(data);
                });
            } else {
                return App.fileHandling.fetchAndParseCSV(filePath, fileName);
            }
        })
    :
            $.getJSON('framework_samples/samples.json').then(sampleFiles => {
                const sampleFile = sampleFiles.find(file => file.path === filePath);
                if (sampleFile) {
                    return App.fileHandling.fetchAndParseCSV(sampleFile.path, fileName);
                } else {
                    throw new Error(`File not found in samples: ${fileName}`);
                }
            });

        fileLoadPromise.then(() => {
            handleFileLoad(fileName, `✅ Loaded file: ${fileName}`);
            if (selectedIDs && selectedIDs.length > 0) {
                $('#tree').one('loaded.jstree', function () {
                    $('#tree').jstree('deselect_all');
                    $('#tree').jstree('select_node', selectedIDs);
                    App.state.setSelectedIDs(selectedIDs);
                });
            }

            if (mode === 'stats') {
                const offcanvasElement = document.getElementById('offcanvasStats');
                if (offcanvasElement) {
                    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
                    bsOffcanvas.show();
                }
            }

            const finalMode = mode === 'stats' ? 'stats' : 'preview';
            App.utilities.updateURL(finalMode, fileName, selectedIDs);

        }).catch(error => {
            App.alerts.showAlert(`❌ Error loading file: ${fileName}`, 'danger');
        });
    }

    $('#csvFileInput').on('change', handleFileSelect);

    $('#sampleFilesDropdown').on('click', '.dropdown-item', function(e) {
        e.preventDefault();
        const filePath = $(this).data('path');
        const fileName = filePath.split('/').pop();
        const fileMessage = $(this).data('message');
        if (filePath && fileName) {
            handleSampleFileSelect(filePath, fileName);
        }
    });

    $('#search').on('input', function () {
        const query = $(this).val();
        $('#tree').jstree(true).search(query);
    });

    $('#search-clear').on('click', function () {
        $('#search').val('');
        $('#tree').jstree('clear_search');
    });

    $('#toggle-expand-collapse').on('click', function () {
        const tree = $('#tree').jstree(true);
        if (App.state.appState.isTreeExpanded) {
            tree.close_all();
            $('#expand-collapse-icon').removeClass('bi-arrows-collapse').addClass('bi-arrows-expand');
            App.state.appState.isTreeExpanded = false;
        } else {
            tree.open_all();
            $('#expand-collapse-icon').removeClass('bi-arrows-expand').addClass('bi-arrows-collapse');
            App.state.appState.isTreeExpanded = true;
        }
    });

    $('#show-stats').on('click', function () {
        const offcanvasElement = document.getElementById('offcanvasStats');
        if (offcanvasElement) {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
            bsOffcanvas.show();
            App.state.appState.isStatisticsActive = true;
            App.utilities.updateURL('stats', App.state.appState.fileName, App.state.appState.selectedIDs);
        }
    });

    const offcanvasElement = document.getElementById('offcanvasStats');
    if (offcanvasElement) {
        offcanvasElement.addEventListener('hide.bs.offcanvas', function () {
            offcanvasElement.classList.add('closing');
            const fileName = App.state.appState.fileName;
            App.state.appState.isStatisticsActive = false;
            App.utilities.updateURL('preview', fileName, App.state.appState.selectedIDs);
        });

        offcanvasElement.addEventListener('hidden.bs.offcanvas', function () {
            offcanvasElement.classList.remove('show', 'closing');
        });
    }

    const updateSelectedIDsInURLDebounced = App.utils.debounce(function() {
        App.utilities.updateURL(App.state.getEditMode() ? 'edit' : (App.state.appState.isStatisticsActive ? 'stats' : 'preview'), App.state.appState.fileName, App.state.appState.selectedIDs);
    }, 300);

    $('#tree').on('select_node.jstree', function (e, data) {
        const nodes = data.selected.map(id => {
            const node = data.instance.get_node(id);
            return node.original || null;
        }).filter(node => node);
        App.state.appState.currentNode = nodes;
        const fileName = App.state.appState.fileName;
        if (!fileName) {
            console.error('File name is missing');
            return;
        }
        nodes.forEach(node => {
            App.state.selectNode(node['ID number']);
        });
        App.details.showDetails(nodes);
        updateSelectedIDsInURLDebounced();
    });

    $('#tree').on('deselect_node.jstree', function (e, data) {
        const nodes = data.instance.get_selected(true).map(node => node.original).filter(node => node !== null);
        App.state.appState.currentNode = nodes;
        const fileName = App.state.appState.fileName;
        if (!fileName) {
            console.error('File name is missing');
            return;
        }
        data.node.original && App.state.deselectNode(data.node.original['ID number']);
        App.details.showDetails(nodes);
        updateSelectedIDsInURLDebounced();
    });

    $('#modalInput').on('click', function() {
        $('#inputModal').modal('show');
    });

    $('#inputTextarea').on('input', function() {
        const text = $(this).val();
        if (App.fileHandling.isValidFrameworkInput(text)) {
            $('#importButton').prop('disabled', false);
            $('#inputError').hide();
        } else {
            $('#importButton').prop('disabled', true);
            $('#inputError').show();
        }
    });

    $('#importButton').on('click', function() {
        const text = $('#inputTextarea').val();
        const data = JSON.parse(text);
        App.state.appState.temporaryData = data;
        App.state.updateTaxonomyLevels();

        const frameworkId = data.find(row => row['Is framework'] === '1')['ID number'];
        const newFrameworkData = {
            id: frameworkId,
            data: data,
        };

        const nodeMap = App.fileHandling.createNodeMap(newFrameworkData.data);

        if (nodeMap[frameworkId]) {
            const rootNode = nodeMap[frameworkId];
            Object.values(nodeMap).forEach(node => {
                if (!node['Parent ID number'] && node['ID number'] !== frameworkId) {
                    rootNode.children.push(node);
                }
            });
            App.fileHandling.createFrameworkUI(rootNode);
        } else {
            console.error('Root node not found in nodeMap');
        }

        App.state.appState.data = data;

        $('#details').empty();
        $('#tree').jstree('deselect_all');

        const jsonOutput = JSON.stringify(data, null, 2);
        $('#floatingOutput').val(jsonOutput);

        const newFileName = data.find(row => row['Is framework'] === '1')['Short name'];
        App.state.appState.fileName = newFileName;
        App.utilities.updateURL('preview', newFileName);

        App.utilities.updatePageTitle(newFileName);

        App.statistics.displayStatistics();
        $('#inputModal').modal('hide');
        App.fileHandling.hideLoadingEffects();
    });

    App.alerts.initializeTooltips();
 
    // Check if a samples.json URL is provided in the URL parameters
    const samplesFileURL = new URLSearchParams(window.location.search).get('file');
    if (samplesFileURL && samplesFileURL.endsWith('samples.json')) {
        fetch(samplesFileURL)
            .then(response => response.json())
            .then(data => App.fileHandling.populateSampleFilesDropdown(data))
            .catch(error => console.error('Error fetching custom samples.json:', error));
    } else {
        $.getJSON('framework_samples/samples.json', function(data) {
            App.fileHandling.populateSampleFilesDropdown(data);
        });
    }

    App.startPanelController = {
        handleURLFile: handleURLFile
    };

    handleURLFile();
    if (App.state.appState.data.length === 0) {
        handleURLFile();
    }

    // Load the generator.js script
    $.getScript("assets/JS/Controller/generator.js", function() {

        // Initialize the dropdowns for level types
        const levelTypes = ["competency", "behaviour", "concept", "domain", "indicator", "level", "outcome", "practice", "proficiency", "skill", "value"];
        const dropdownSelectors = ['#level1Type', '#level2Type', '#level3Type', '#level4Type'];
        dropdownSelectors.forEach(selector => {
            const dropdown = $(selector);
            levelTypes.forEach(type => {
                dropdown.append(new Option(type.charAt(0).toUpperCase() + type.slice(1), type));
            });
        });
    });

    // Event listeners
    $('#modalGenerator').on('click', function() {
        $('#generatorModal').modal('show');
    });

    $('#closeOutputPanel').on('click', function() {
        document.body.classList.remove('sb-right-sidenav-toggled');
    });
});
