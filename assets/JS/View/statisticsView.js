// assets/JS/View/statisticsView.js

var App = App || {};

App.statistics = (function() {
    function displayStatistics() {
        $('#statistics-container').show();

        $('#table-card').show();
        generateTableContent(App.state.appState.data);

        $('#chart-card').show();
        App.chart.generateDoughnutChartContent(App.state.appState.data);

        $('#tagcloud-card').show();
        App.tagcloud.generateTagCloudContent();
    }

    function generateTableContent(data) {
        if (!data || data.length === 0) {
            return;
        }

        const taxonomy = data[0]['Taxonomy'] ? data[0]['Taxonomy'].split(',') : App.state.appState.taxonomyLevels;
        const stats = {};

        taxonomy.forEach(level => {
            stats[level] = 0;
        });

        data.forEach((item) => {
            if (item['Is framework'] === '1') return;

            const level = App.state.getTaxonomyLevel({ 'ID number': item['ID number'] }, taxonomy);
            if (stats[level] !== undefined) {
                stats[level]++;
            }
        });

        const filteredStats = Object.keys(stats).reduce((filtered, key) => {
            if (stats[key] > 0) {
                filtered[key] = stats[key];
            }
            return filtered;
        }, {});

        const totalItems = Object.values(filteredStats).reduce((a, b) => a + b, 0);
        const tableBody = $('#table-body');

        tableBody.html(
            Object.keys(filteredStats).map((key, index) => {
                const count = filteredStats[key];
                const percentage = ((count / totalItems) * 100).toFixed(2);
                const percentageText = percentage + '%';
                return `<tr><td class="lead">${key}</td><td class="h4">${count}</td><td><mark>${percentageText}</mark></td></tr>`;
            }).join('')
        );
    }

    return {
        displayStatistics: displayStatistics,
        generateTableContent: generateTableContent
    };
})();
