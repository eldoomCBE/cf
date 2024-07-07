// assets/JS/Controller/editController.js

var App = App || {};

App.editController = (function() {
    var dataModified = false;

    function init() {
        setupEditToggle();
    }

    function setupEditToggle() {
        const editSwitch = document.getElementById('editSwitch');
        if (editSwitch) {
            editSwitch.addEventListener('change', function(event) {
                const isEditMode = event.target.checked;
                console.log(`Edit switch changed: ${isEditMode}`); // Debugging log
                App.state.setEditMode(isEditMode);
                toggleEditMode(isEditMode);
                App.details.showDetails(App.state.appState.currentNode);
            });
        }
    }

    function toggleEditMode(isEditMode = false) {
        console.log(`Toggling edit mode: ${isEditMode}`);
        const editableFields = document.querySelectorAll('.editable');
        editableFields.forEach(field => {
            console.log(`Before toggle - Field readOnly: ${field.readOnly}`);
            if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                field.readOnly = !isEditMode;
                field.classList.toggle('editing', isEditMode);
            } else {
                field.contentEditable = isEditMode.toString();
                field.classList.toggle('editing', isEditMode);
            }
            console.log(`After toggle - Field readOnly: ${field.readOnly}`);
        });
        if (isEditMode) {
            attachEventListeners();
        }
    }
    
    function attachEventListeners() {
        const editableFields = document.querySelectorAll('.editable');
        editableFields.forEach(field => {
            field.removeEventListener('input', handleFieldEdit);
            field.addEventListener('input', handleFieldEdit);
        });
    }    

    function handleFieldEdit(event) {
        const field = event.target;
        const id = field.getAttribute('data-id');
        let value = field.value || field.innerText; // Support for both input and div elements
        const [nodeId, ...fieldKeyArr] = id.split('_');
        const fieldKey = fieldKeyArr.join('_');
        const nodeData = App.state.appState.data.find(node => node['ID number'] === nodeId);
    
        if (nodeData) {
            // Check if the field is supposed to contain JSON data
            if (fieldKey === 'Scale configuration' || fieldKey === 'Rule config') {
                try {
                    // Attempt to parse the current value as JSON to check if it's valid JSON
                    JSON.parse(value);
                    // If it's valid JSON and an object, stringify it
                    value = JSON.stringify(value);
                } catch (e) {
                    // If it's not valid JSON, handle the exception or leave the value as is
                    console.error('Error parsing JSON for field:', fieldKey, e);
                }
            }
    
            nodeData[fieldKey] = value;
            dataModified = true;
            if (dataModified) {
                document.getElementById('exportButton').style.display = 'inline-block';
                showAutoSaveIndicator();
                App.tree.updateTreeTitles(); // Update the tree with the new titles
                App.details.showDetails(App.state.appState.currentNode); // Refresh details view
                console.log(`Field edited: ${event.target.name}, New Value: ${event.target.value}`);
            }
        }
    }

    function showAutoSaveIndicator() {
        const autosaveIndicator = document.getElementById('autosave-indicator');
        autosaveIndicator.style.display = 'flex';
        setTimeout(() => {
            autosaveIndicator.style.display = 'none';
        }, 2000);
    }

    function refreshEditBindings() {
        const isEditMode = App.state.getEditMode();
        toggleEditMode(isEditMode);
    }    

    function exportData() {
        const data = App.state.appState.data;
        const csvContent = Papa.unparse(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${App.state.appState.fileName}_edited.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return {
        init: init,
        toggleEditMode: toggleEditMode,
        attachEventListeners: attachEventListeners,
        refreshEditBindings: refreshEditBindings,
        exportData: exportData
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.editController.init();
    document.getElementById('exportButton').addEventListener('click', () => {
        App.editController.exportData();
    });
});
