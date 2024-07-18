// assets/JS/Controller/editController.js

var App = App || {};

App.editController = (function() {
    var dataModified = false;

    function init() {
        setupEditToggle();
        checkInitialEditMode(); // Ensure initial edit mode is checked
    }

    function setupEditToggle() {
        const editSwitch = document.getElementById('editSwitch');
        if (editSwitch) {
            editSwitch.addEventListener('change', function(event) {
                const isEditMode = event.target.checked;
                App.state.setEditMode(isEditMode);
                toggleEditMode(isEditMode);
                App.details.showDetails(App.state.appState.currentNode);
                App.utilities.updateURL(isEditMode ? 'edit' : App.state.appState.isStatisticsActive ? 'stats' : 'preview', App.state.appState.fileName, App.state.appState.selectedIDs);
            });
        }
    }

    function toggleEditMode(isEditMode = false) {
        const editableFields = document.querySelectorAll('.editable');
        editableFields.forEach(field => {
            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                field.readOnly = !isEditMode;
                field.classList.toggle('editing', isEditMode);
            } else {
                field.contentEditable = isEditMode.toString();
                field.classList.toggle('editing', isEditMode);
            }
        });

        App.tree.updateTreeDraggable(isEditMode);

        if (isEditMode) {
            initializeTinyMCE();
            $('#sub-nav').collapse('show');
        } else {
            destroyTinyMCE();
            $('#sub-nav').collapse('hide');
        }

        // Apply settings for the mode to show/hide fields correctly
        App.settings.applySettings(isEditMode ? 'edit' : 'preview');

        // Update URL to reflect the current mode
        App.utilities.updateURL(isEditMode ? 'edit' : App.state.appState.isStatisticsActive ? 'stats' : 'preview', App.state.appState.fileName, App.state.appState.selectedIDs);
    }

    function updateTreeDraggable(isEditMode) {
        const treeNodes = document.querySelectorAll('#tree li a');
        treeNodes.forEach((node, index) => {
            if (index === 0) {
                node.setAttribute('draggable', 'false');
            } else {
                node.setAttribute('draggable', isEditMode.toString());
            }
        });
    }

    function initializeTinyMCE() {
        destroyTinyMCE(); // Ensure any existing instances are destroyed
        tinymce.init({
            license_key: 'gpl',
            menubar: false,
            promotion: false,
            branding: false,
            skin_url: 'assets/JS/tinymce/skins/ui/mcf',
            content_css: "https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css",
            selector: 'textarea.editable[data-id$="_Description"]',
            height: 606,
            plugins: 'link image supercode searchreplace quickbars preview media fullscreen emoticons charmap accordion anchor autoresize autosave insertdatetime lists advlist table visualblocks',
            toolbar: 'supercode | undo redo | styles | bold italic underline strikethrough blockquote removeformat | fontfamily fontsize forecolor backcolor casechange | formatselect alignleft aligncenter alignright alignjustify lineheight | numlist bullist checklist | indent outdent | table | hr anchor accordion | emoticons charmap insertdatetime | image media link | searchreplace | wordcount | selectall visualblocks fullscreen preview |',
            toolbar_mode: 'floating',
            supercode: {
                theme: 'chaos',
                fontSize: 14,
                wrap: true,
                autocomplete: true,
                iconName: 'sourcecode',
                language: 'html',
                shortcut: true,
                fontFamily: 'Monospace',
              },
            setup: function(editor) {
                editor.on('init', () => {
                    editor.getContainer().style.transition='border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out';
                });
                editor.on('focus', () => {
                    editor.getContainer().style.boxShadow='0 0 0 .2rem rgba(0, 123, 255, .25)';
                    editor.getContainer().style.borderColor='#80bdff';
                });
                editor.on('change', function(e) {
                    handleFieldEdit({ target: editor.getElement() });
                });
                editor.on('blur', function(e) {
                    handleFieldEdit({ target: editor.getElement() });
                    editor.getContainer().style.boxShadow='';
                    editor.getContainer().style.borderColor='';
                });
            }
        });
    }

    function destroyTinyMCE() {
        tinymce.remove();
    }

    function attachEventListeners() {
        const editableFields = document.querySelectorAll('.editable');
        editableFields.forEach(field => {
            field.removeEventListener('input', handleFieldEdit);
            field.addEventListener('input', handleFieldEdit);
        });

        if (App.state.getEditMode()) {
            $('.delete-item').on('click', function(e) {
                e.preventDefault();
                const nodeId = $(this).data('id');
                deleteNode(nodeId);
            });
        }
    }

    function handleFieldEdit(event) {
        const field = event.target;
        const id = field.getAttribute('data-id');
        let value = field.value || field.innerText;
        if (tinymce.get(field.id)) {
            value = tinymce.get(field.id).getContent(); // Get TinyMCE content
        }
        const [sanitizedNodeId, ...fieldKeyArr] = id.split('_');
        const fieldKey = fieldKeyArr.join('_');
        const nodeId = App.state.getOriginalID(sanitizedNodeId);
        const nodeData = App.state.appState.data.find(node => node['ID number'] === nodeId);

        if (nodeData) {
            nodeData[fieldKey] = value;
            dataModified = true;
            App.statisticsLoader.updateJsonOutput(); // Update JSON output on data change

            if (fieldKey === 'Short name') {
                if (!value || value.length > 100) {
                    field.classList.add('is-invalid');
                } else {
                    field.classList.remove('is-invalid');
                    updateTreeTitle(nodeId, value);
                    updateCardTitle(sanitizedNodeId, value);
                }
            }
        }
    }

    function deleteNode(nodeId) {
        const originalNodeId = App.state.getOriginalID(nodeId);
    
        // Check if the node is a competency framework node
        const nodeData = App.state.appState.data.find(node => node['ID number'] === originalNodeId);
        if (nodeData && nodeData['Is framework'] === '1') {
            App.alerts.showAlert('Competency framework node cannot be deleted.', 'danger');
            return;
        }
    
        // Recursive function to delete node and its children
        function deleteRecursively(nodeId) {
            // Get the children of the node
            const children = App.state.appState.data.filter(node => node['Parent ID number'] === nodeId);
    
            // Recursively delete each child
            children.forEach(child => {
                deleteRecursively(child['ID number']);
            });
    
            // Remove node from appState data
            App.state.appState.data = App.state.appState.data.filter(node => node['ID number'] !== nodeId);
    
            // Remove node from the tree
            $('#tree').jstree(true).delete_node(nodeId);
        }
    
        // Start the recursive deletion
        deleteRecursively(originalNodeId);
    
        // Update the details view
        $('#details').empty();
        App.state.deselectNode(originalNodeId);
    
        // Update the output
        App.statisticsLoader.updateJsonOutput();
    
        App.alerts.showAlert('Item deleted successfully.', 'success');
    }    

    function refreshEditBindings() {
        const isEditMode = App.state.getEditMode();
        toggleEditMode(isEditMode);
    }

    function saveData() {
        if (dataModified) {
            dataModified = false;
        }
    }

    function exportData() {
        saveData();
        const data = App.state.appState.data;
        const csvContent = Papa.unparse(data);
        const frameworkShortName = data.find(row => row['Is framework'] === '1')['Short name'];
        let fileName = App.state.appState.fileName;
        if (fileName.endsWith('.csv')) {
            fileName = fileName.slice(0, -4); // Remove the .csv extension
        }
        fileName = `_mcf_${frameworkShortName}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function updateTreeTitle(nodeId, newValue) {
        let nodeElement = document.getElementById(nodeId + "_anchor");
        if (nodeElement) {
            const iconElement = nodeElement.querySelector('i.jstree-icon');
            nodeElement.innerHTML = '';
            if (iconElement) {
                nodeElement.appendChild(iconElement);
            }
            nodeElement.appendChild(document.createTextNode(newValue));
        }
    }

    function updateCardTitle(sanitizedNodeId, newValue) {
        const titleElement = document.querySelector(`[data-sanitized-id="${sanitizedNodeId}"]`);
        if (titleElement) {
            titleElement.firstChild.textContent = newValue;
        }
    }

    function checkInitialEditMode() {
        const { mode, fileName, selectedIDs } = App.utilities.getURLParams();
        if (mode === 'edit') {
            App.state.setEditMode(false);
            App.utilities.updateURL('preview', fileName, selectedIDs);
        }
    }

    return {
        init: init,
        saveData: saveData,
        exportData: exportData,
        refreshEditBindings: refreshEditBindings,
        toggleEditMode: toggleEditMode,
        handleFieldEdit: handleFieldEdit,
        updateTreeTitle: updateTreeTitle,
        updateCardTitle: updateCardTitle,
        checkInitialEditMode: checkInitialEditMode,
        attachEventListeners: attachEventListeners,
        deleteNode: deleteNode // Ensure deleteNode is exposed
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.editController.init();
    document.getElementById('exportButton').addEventListener('click', () => {
        App.editController.exportData();
    });
});

App.details.showDetails = (function(originalShowDetails) {
    return function(nodes) {
        originalShowDetails(nodes);
        if (App.state.getEditMode()) {
            setTimeout(() => {
                App.editController.initializeTinyMCE(); // Ensure TinyMCE is initialized after DOM update
            }, 0);
        }
    };
})(App.details.showDetails);
