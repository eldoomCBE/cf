// assets/JS/commonUtils.js

var App = App || {};

// Monkey patching to add passive event listeners by default
(function() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];

    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (typeof options === 'boolean') {
            options = { capture: options };
        }
        if (!options || typeof options !== 'object') {
            options = {};
        }
        if (passiveEvents.includes(type)) {
            options.passive = true;
        }
        originalAddEventListener.call(this, type, listener, options);
    };
})();

// Sidebars

window.addEventListener('DOMContentLoaded', event => {
    // Toggle the left side navigation
    const leftsidebarToggle = document.body.querySelector('#left-sidebarToggle');
    if (leftsidebarToggle) {
        leftsidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-left-sidenav-toggled');
        });
    }

    // Toggle the right side navigation
    const rightsidebarToggle = document.body.querySelector('#right-sidebarToggle');
    if (rightsidebarToggle) {
        rightsidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-right-sidenav-toggled');
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
        const modeSuffix = mode ? `mode=${mode}` : '';
        const fileSuffix = fileName ? `&file=${fileName}` : '';
        const encodedSelectedIDs = encodeParams(selectedIDs, '➕');
        const selectedIDsSuffix = selectedIDs.length ? `&ids=${encodedSelectedIDs}` : '';

        let newURL = `#${modeSuffix}${fileSuffix}${selectedIDsSuffix}`;
        window.history.replaceState({}, '', window.location.origin + window.location.pathname + newURL);
    }

    function updatePageTitle(fileName) {
        document.title = fileName ? `${fileName} | mcf` : 'Moodle Competency Framework';
    }

    function getURLParams() {
        let hash = window.location.hash ? window.location.hash.substring(1) : null;
        if (!hash) return {};

        const params = new URLSearchParams(hash);
        const mode = params.get('mode') || 'preview';
        const fileName = params.get('file');
        const ids = params.get('ids') ? decodeParams(params.get('ids'), '➕') : [];

        return { mode, fileName, selectedIDs: ids };
    }

    return {
        encodeParams,
        decodeParams,
        updateURL,
        updatePageTitle,
        getURLParams
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

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const context = this, args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    return {
        debounce: debounce,
        throttle: throttle
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
        }, 5000);
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
            
    // Toggle left sidebar
    $('#hamburger-icon, #left-sidebarToggle').on('click', function() {
        $('body').toggleClass('sb-left-sidenav-toggled');
        $('#hamburger-icon').toggleClass('collapsed');
        $('#left-sidebarToggle').toggleClass('collapsed'); // Toggle animation
    });

    // Toggle sub-nav
    $('#editSwitch').on('change', function() {
        $('#sub-nav').collapse('toggle');
    });
});
