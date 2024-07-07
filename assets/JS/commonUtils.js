// 🧩 assets/JS/commonUtils.js

var App = App || {};

window.addEventListener('DOMContentLoaded', event => {
    // Toggle the side navigation
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
            localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
        });
    }
});

// URLs configuration

App.utilities = (function () {
function encodeParams(params, separator) {
        return params.map(param => encodeURIComponent(param)).join(separator);
    }

    function decodeParams(params, separator) {
        return params.split(separator).map(decodeURIComponent);
    }

    function updateURL(mode, fileName, selectedIDs = []) {
        if (!fileName) {
            console.error('fileName is undefined in updateURL');
            return;
        }

        const modeSuffix = mode ? `&mode=${mode}` : '';
        const encodedSelectedIDs = encodeParams(selectedIDs, '➕');
        const selectedIDsSuffix = selectedIDs.length ? `&ids=${encodedSelectedIDs}` : '';

        let newURL = `#file=${fileName}${modeSuffix}${selectedIDsSuffix}`; // Use fileName directly
        window.history.replaceState({}, '', window.location.origin + window.location.pathname + newURL);
    }

    function updatePageTitle(fileName) {
        document.title = fileName ? `${fileName} | mcf` : 'Moodle Competency Framework';
    }

    return {
        encodeParams,
        decodeParams,
        updateURL,
        updatePageTitle,
        getURLParams: function () {
            let hash = window.location.hash ? window.location.hash.substring(1) : null;
            if (!hash) return {};

            const params = new URLSearchParams(hash);
            const fileName = params.get('file');
            const mode = params.get('mode') || 'preview';
            const ids = params.get('ids') ? decodeParams(params.get('ids'), '➕') : [];

            return { fileName, mode, selectedIDs: ids };
        },
    };
})();

// debouncingSystem

App.utils = (function() {
    function debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    return {
        debounce: debounce
    };
})();

// alertsSystem

App.alerts = (function() {
    const displayedAlerts = new Set();

    function showAlert(message, type = 'info') {
        const alertId = `${type}-${message}`;

        if (displayedAlerts.has(alertId)) {
            return; // Alert already displayed, do nothing
        }

        displayedAlerts.add(alertId);

        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alert-container').append(alertHtml);

        setTimeout(() => {
            $(`.alert:contains("${message}")`).alert('close');
            displayedAlerts.delete(alertId);
        }, 1000);
    }

    function initializeTooltips() {
        $('[data-bs-toggle="tooltip"]').tooltip();
    }

    return {
        showAlert: showAlert,
        initializeTooltips: initializeTooltips
    };
})();

// sliderSystem

$(document).ready(function () {
    $(".slider").on("mousedown", function (e) {
        const slider = $(this);
        const startX = e.pageX;
        const startWidth = slider.prev().width();
        const startPanel = slider.prev();
        const endPanel = slider.next();

        $(document).on("mousemove.slider", function (e) {
            const newWidth = startWidth + (e.pageX - startX);
            const maxWidth = slider.parent().width() - slider.width();
            if (newWidth > 0 && newWidth < maxWidth) {
                startPanel.width(newWidth);
                endPanel.width(maxWidth - newWidth);
            }
        });

        $(document).on("mouseup.slider", function () {
            $(document).off(".slider");
        });
    });
});


