// assets/JS/View/chartView.js

var App = App || {};

App.chart = (function() {
    let currentDoughnutChart;

    function generateDoughnutChartContent(data) {
        if (!data || data.length === 0) {
            console.error('No temporary data available');
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

        const chartData = {
            labels: Object.keys(filteredStats),
            datasets: [{
                data: Object.values(filteredStats),
                backgroundColor: ['#ea4335', '#9510ac', '#34a853', '#fbbc04', '#4285f4'],
            }]
        };

        const ctx = document.getElementById('stats-chart');
        if (ctx) {
            const context = ctx.getContext('2d');
            if (currentDoughnutChart) {
                currentDoughnutChart.destroy();
            }

            currentDoughnutChart = new Chart(context, {
                type: 'doughnut',
                data: chartData,
                options: {
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    },
                    onClick: function(event, elements) {
                        if (elements.length > 0) {
                            const clickedElementIndex = elements[0].index;
                            const label = this.data.labels[clickedElementIndex];
                            selectItemsByTaxonomyLevel(label);
                        }
                    },
                    onHover: function(event, elements) {
                        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
                    }
                }
            });
            ctx.style.display = 'block';
        } else {
            console.error('Canvas element for doughnut chart not found');
        }
    }

    function selectItemsByTaxonomyLevel(level) {
        const matchedItems = App.state.appState.data.filter(item => 
            App.state.getTaxonomyLevel({ 'ID number': item['ID number'] || item['ID'] }, App.state.appState.taxonomyLevels) === level
        );
        const nodeIds = matchedItems.map(item => item['ID number'] || item['ID']);
        $('#tree').jstree('deselect_all');
        $('#tree').jstree('select_node', nodeIds);
    }

    return {
        generateDoughnutChartContent: generateDoughnutChartContent
    };
})();
