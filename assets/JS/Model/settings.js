// assets/JS/Model/settings.js

var App = App || {};

App.settings = (function() {
    const settingsKey = 'mcf_settings';

    const defaultSettings = {
        preview: {
            "parent-id-number": false,
            "id-number": false,
            "short-name": false,
            "description": true,
            "description-format": false,
            "scale-values": false,
            "scale-configuration": false,
            "rule-type--optional-": false,
            "rule-outcome--optional-": false,
            "rule-config--optional-": false,
            "cross-referenced-competency-id-numbers": false,
            "exported-id--optional-": false,
            "is-framework": false,
            "taxonomy": false
        },
        edit: {
            "parent-id-number": false,
            "id-number": false,
            "short-name": true,
            "description": true,
            "description-format": true,
            "scale-values": false,
            "scale-configuration": false,
            "rule-type--optional-": false,
            "rule-outcome--optional-": false,
            "rule-config--optional-": false,
            "cross-referenced-competency-id-numbers": false,
            "exported-id--optional-": true,
            "is-framework": false,
            "taxonomy": false
        },
        customCSS: ''
    };

    function getSettings() {
        const savedSettings = localStorage.getItem(settingsKey);
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }

    function saveSettings(settings) {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        App.alerts.showAlert('Settings updated.', 'success');
    }

    function resetSettings() {
        localStorage.removeItem(settingsKey);
    }

    function toggleFieldVisibility(field, isVisible, mode) {
        const settings = getSettings();
        settings[mode][field] = isVisible;
        saveSettings(settings);

        const fieldClass = `.${field}`;
        if (isVisible) {
            $(fieldClass).show();
        } else {
            $(fieldClass).hide();
        }

        refreshDetailsPanel();
    }

    function applySettings(mode) {
        const settings = getSettings();
        Object.keys(settings[mode]).forEach(field => {
            const fieldClass = `.${field}`;
            if (settings[mode][field]) {
                $(fieldClass).show();
            } else {
                $(fieldClass).hide();
            }
        });
    }

    function toggleAllFields(mode, isVisible) {
        const settings = getSettings();
        Object.keys(settings[mode]).forEach(field => {
            settings[mode][field] = isVisible;
            const fieldClass = `.${field}`;
            if (isVisible) {
                $(fieldClass).show();
            } else {
                $(fieldClass).hide();
            }
        });
        saveSettings(settings);
        applySettings(mode);
        refreshDetailsPanel();
    }

    function injectCustomCSS(css) {
        let styleElement = document.getElementById('custom-css');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-css';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = css;
    }

    function initializeSettingsModal() {
        const settings = getSettings();
        const previewSettingsContainer = document.getElementById('previewSettings');
        const editSettingsContainer = document.getElementById('editSettings');
        const currentMode = document.getElementById('editSwitch').checked ? 'edit' : 'preview';
    
        previewSettingsContainer.innerHTML = '';
        editSettingsContainer.innerHTML = '';

        const globalPreviewSwitch = `
        <div class="form-check form-switch" id="preview-global-switch-container">
            <label class="form-check-label" for="preview-global-switch"><kbd>TOGGLE ALL PREVIEW FIELDS</kbd></label>
            <input class="form-check-input" type="checkbox" id="preview-global-switch" ${Object.values(settings.preview).every(Boolean) ? 'checked' : ''}>
            <hr>
        </div>`;
        previewSettingsContainer.innerHTML += globalPreviewSwitch;
    
        const globalEditSwitch = `
        <div class="form-check form-switch" id="edit-global-switch-container">
            <label class="form-check-label" for="edit-global-switch"><kbd>TOGGLE ALL EDIT FIELDS</kbd></label>
            <input class="form-check-input" type="checkbox" id="edit-global-switch" ${Object.values(settings.edit).every(Boolean) ? 'checked' : ''}>
            <hr>
        </div>`;
        editSettingsContainer.innerHTML += globalEditSwitch;
    
        Object.keys(settings.preview).forEach(field => {
            const previewSwitch = `
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="preview-${field}" ${settings.preview[field] ? 'checked' : ''}>
                    <label class="form-check-label" for="preview-${field}">${field.replace(/-/g, ' ')}</label>
                </div>`;
            previewSettingsContainer.innerHTML += previewSwitch;
        });
    
        Object.keys(settings.edit).forEach(field => {
            const editSwitch = `
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="edit-${field}" ${settings.edit[field] ? 'checked' : ''}>
                    <label class="form-check-label" for="edit-${field}">${field.replace(/-/g, ' ')}</label>
                </div>`;
            editSettingsContainer.innerHTML += editSwitch;
        });
    
        document.getElementById('preview-global-switch').addEventListener('change', function(event) {
            const isChecked = event.target.checked;
            toggleAllFields('preview', isChecked);
            Object.keys(settings.preview).forEach(field => {
                document.getElementById(`preview-${field}`).checked = isChecked;
            });
        });
    
        document.getElementById('edit-global-switch').addEventListener('change', function(event) {
            const isChecked = event.target.checked;
            toggleAllFields('edit', isChecked);
            Object.keys(settings.edit).forEach(field => {
                document.getElementById(`edit-${field}`).checked = isChecked;
            });
        });
    
        Object.keys(settings.preview).forEach(field => {
            document.getElementById(`preview-${field}`).addEventListener('change', App.utils.debounce(function(event) {
                toggleFieldVisibility(field, event.target.checked, 'preview');
            }, 300));
        });
    
        Object.keys(settings.edit).forEach(field => {
            document.getElementById(`edit-${field}`).addEventListener('change', App.utils.debounce(function(event) {
                toggleFieldVisibility(field, event.target.checked, 'edit');
            }, 300));
        });
    
        // Custom CSS handling
        const customCSS = document.getElementById('customCSS');
        customCSS.value = settings.customCSS;
    
        customCSS.addEventListener('input', App.utils.debounce(function() {
            const css = customCSS.value;
            settings.customCSS = css;
            saveSettings(settings);
            injectCustomCSS(css);
        }, 300));
    
    // Show or hide the global switches based on the current mode
    toggleGlobalSwitchVisibility(currentMode);

    // Apply current settings to ensure UI is correctly updated
    applySettings(currentMode);

    // Add event listener for mode switch to update toggle visibility
    document.getElementById('editSwitch').addEventListener('change', handleModeSwitch);
}

// Function to handle mode switch and update toggle visibility
function handleModeSwitch(event) {
    const isEditMode = event.target.checked;
    const currentMode = isEditMode ? 'edit' : 'preview';
    toggleGlobalSwitchVisibility(currentMode);
    applySettings(currentMode);
}

// Function to show/hide global switches based on mode
function toggleGlobalSwitchVisibility(currentMode) {
    document.getElementById('preview-global-switch-container').style.display = currentMode === 'preview' ? 'block' : 'none';
    document.getElementById('edit-global-switch-container').style.display = currentMode === 'edit' ? 'block' : 'none';
} 

    function refreshDetailsPanel() {
        // Directly refresh the details panel to ensure it updates correctly
        const selectedNode = App.state.appState.selectedIDs[0];
        if (selectedNode) {
            App.state.deselectNode(selectedNode);
            setTimeout(() => {
                App.state.selectNode(selectedNode);
            }, 100);
        }
    }

    function applyCurrentModeSettings() {
        const mode = document.getElementById('editSwitch').checked ? 'edit' : 'preview';
        applySettings(mode);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const currentMode = document.getElementById('editSwitch').checked ? 'edit' : 'preview';
        applySettings(currentMode);

        const settingsButton = document.getElementById('modalSetings');
        settingsButton.addEventListener('click', function() {
            initializeSettingsModal();
            $('#settingsModal').modal('show');
        });

        $('#settingsModal').on('hidden.bs.modal', function() {
            applyCurrentModeSettings(); // Ensure settings are applied when the modal is closed
        });

        document.getElementById('editSwitch').addEventListener('change', function() {
            const mode = document.getElementById('editSwitch').checked ? 'edit' : 'preview';
            applySettings(mode);
        });

        // Inject initial custom CSS
        const settings = getSettings();
        injectCustomCSS(settings.customCSS);
    });

    return {
        getSettings,
        saveSettings,
        resetSettings,
        toggleFieldVisibility,
        applySettings,
        toggleAllFields
    };
})();
