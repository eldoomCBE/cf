// assets/JS/Controller/startPanelController.js

var App = App || {};

$(document).ready(function () {
    function handleFileLoad(fileName, alertMessage = null) {
        App.state.appState.fileName = fileName; // Ensure fileName is set in the appState
        App.statistics.displayStatistics();
        App.utilities.updateURL('preview', fileName, App.state.appState.selectedIDs); // Update the URL with the file name and selected IDs
        App.utilities.updatePageTitle(fileName); // Update the page title with the file name

        if (alertMessage) {
            App.alerts.showAlert(alertMessage);
        }

        cleanInvalidSelections(); // Deselect invalid nodes after loading the file
    }

    function waitForTreeToLoad() {
        return new Promise(resolve => {
            if ($('#tree').jstree(true)) {
                $('#tree').one('loaded.jstree', function() {
                    resolve();
                });
            } else {
                resolve(); // Resolve immediately if the tree is not yet initialized
            }
        });
    }

    function selectFirstNode() {
        return new Promise(resolve => {
            waitForTreeToLoad().then(() => {
                const firstNodeId = $('#tree').jstree(true).get_node('#').children[0];
                $('#tree').jstree('select_node', firstNodeId);
                App.state.setSelectedIDs([firstNodeId]);
                resolve();
            });
        });
    }

    function cleanInvalidSelections() {
        return new Promise(resolve => {
            setTimeout(() => {
                const { selectedIDs } = App.utilities.getURLParams();
                const validIDs = App.state.appState.data.map(item => item['ID number']);

                const invalidIDs = selectedIDs.filter(id => !validIDs.includes(id));
                if (invalidIDs.length > 0) {
                    $('#tree').jstree('deselect_node', invalidIDs);
                    App.state.setSelectedIDs(selectedIDs.filter(id => validIDs.includes(id)));
                    App.details.showDetails([]);
                }
                resolve();
            }, 100); // Delay to ensure tree is properly loaded
        });
    }

    function handleFileSelect(event) {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            App.fileHandling.parseCSV(file)
                .then(() => {
                    handleFileLoad(file.name, `✅ Uploaded file parsed`);
                    // Attendre que l'arbre soit complètement chargé avant de sélectionner la première node
                    selectFirstNode().then(cleanInvalidSelections); // Deselect invalid nodes after loading the file
                })
                .catch(error => console.error('Error parsing file:', error));
        }
    }

    function handleSampleFileSelect(path, fileName) {
        App.fileHandling.fetchAndParseCSV(path, fileName)
            .then(() => {
                handleFileLoad(fileName);
                // Sélectionner automatiquement la première node après le chargement du fichier sample
                selectFirstNode().then(cleanInvalidSelections); // Deselect invalid nodes after loading the file
            })
            .catch(error => {
                console.error('Error parsing file:', error);
                App.alerts.showAlert(`❌ Error parsing file: ${fileName}`, 'danger');
            });
    }

    function handleURLFile() {
        const { mode, fileName, selectedIDs } = App.utilities.getURLParams();
        if (fileName) {
            const filePath = fileName.startsWith('http') ? fileName : `framework_samples/${fileName}`;
            App.state.appState.fileName = fileName; // S'assurer que fileName est défini dans appState
            App.utilities.updatePageTitle(fileName); // Mettre à jour le titre de la page avec le nom du fichier
            if (filePath.startsWith('http')) {
                App.fileHandling.fetchAndParseCSV(filePath, fileName)
                    .then(() => {
                        handleFileLoad(fileName, `✅ Loaded file from URL: ${fileName}`);
                        if (mode === 'stats') {
                            const offcanvasElement = document.getElementById('offcanvasStats');
                            if (offcanvasElement) {
                                const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
                                bsOffcanvas.show();
                                App.utilities.updateURL('stats', fileName, selectedIDs);
                            }
                        }
                        if (selectedIDs && selectedIDs.length > 0) {
                            $('#tree').one('loaded.jstree', function () {
                                $('#tree').jstree('deselect_all');
                                $('#tree').jstree('select_node', selectedIDs);
                                App.state.setSelectedIDs(selectedIDs);
                            });
                        } else {
                            // Sélectionner automatiquement la première node si aucun ID n'est dans l'URL
                            selectFirstNode();
                        }
                        cleanInvalidSelections(); // Deselect invalid nodes after loading the file
                    })
                    .catch(error => {
                        console.error('Error fetching and parsing file from URL:', error);
                        App.alerts.showAlert(`❌ Error fetching file from URL: ${fileName}`, 'danger');
                    });
            } else {
                $.getJSON('framework_samples/samples.json', function(sampleFiles) {
                    const sampleFile = sampleFiles.find(file => file.path === filePath);
                    if (sampleFile) {
                        App.fileHandling.fetchAndParseCSV(sampleFile.path, fileName)
                            .then(() => {
                                handleFileLoad(fileName, `✅ Sample loaded: ${fileName}`);
                                if (mode === 'stats') {
                                    const offcanvasElement = document.getElementById('offcanvasStats');
                                    if (offcanvasElement) {
                                        const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
                                        bsOffcanvas.show();
                                        App.utilities.updateURL('stats', fileName, selectedIDs);
                                    }
                                }
                                if (selectedIDs && selectedIDs.length > 0) {
                                    $('#tree').one('loaded.jstree', function () {
                                        $('#tree').jstree('deselect_all');
                                        $('#tree').jstree('select_node', selectedIDs);
                                        App.state.setSelectedIDs(selectedIDs);
                                    });
                                } else {
                                    // Sélectionner automatiquement la première node si aucun ID n'est dans l'URL
                                    selectFirstNode();
                                }
                                cleanInvalidSelections(); // Deselect invalid nodes after loading the file
                            })
                            .catch(error => {
                                console.error('Error fetching and parsing file from URL:', error);
                                App.alerts.showAlert(`❌ Error fetching file from samples: ${fileName}`, 'danger');
                            });
                    } else {
                        App.alerts.showAlert(`❌ File not found in samples: ${fileName}`, 'danger');
                        window.history.replaceState({}, '', window.location.pathname + "#");
                    }
                });
            }
        }
    }

    $('#csvFileInput').on('change', handleFileSelect);

    $('#sampleFilesDropdown').on('click', '.dropdown-item', function(e) {
        e.preventDefault();
        const filePath = $(this).data('path');
        const fileName = filePath.split('/').pop(); // Extract the file name from the path
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

    $('#offcanvasStats').on('hidden.bs.offcanvas', function () {
        const fileName = App.state.appState.fileName;
        const mode = App.state.appState.isEditMode ? 'edit' : 'preview';
        App.state.appState.isStatisticsActive = false;
        App.utilities.updateURL(mode, fileName, App.state.appState.selectedIDs);
    });

    const updateSelectedIDsInURLDebounced = App.utils.debounce(function() {
        App.utilities.updateSelectedIDsInURL();
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
        updateSelectedIDsInURLDebounced(); // Update URL with selected IDs
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
        updateSelectedIDsInURLDebounced(); // Update URL with selected IDs
    });

    App.alerts.initializeTooltips();
    $.getJSON('framework_samples/samples.json', function(data) {
        App.fileHandling.populateSampleFilesDropdown(data);
    });

    handleURLFile(); // Call this function when the document is ready to handle file from URL

    // Call handleURLFile on document ready if no framework is already loaded
    if (App.state.appState.data.length === 0) {
        handleURLFile();
    }
});
