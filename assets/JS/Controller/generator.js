// assets/JS/Controller/generator.js

var App = App || {};

App.generator = (function() {
    const levelTypes = ["competency", "behaviour", "concept", "domain", "indicator", "level", "outcome", "practice", "proficiency", "skill", "value"];
    const defaultScaleValues = "Not yet competent,Competent";
    const defaultScaleConfiguration = '[{"scaleid":"2"},{"id":1,"scaledefault":1,"proficient":0},{"id":2,"scaledefault":0,"proficient":1}]';

    function generateIDs(prefix, levels, counts) {
        let output = [];
        let currentLevel = [{
            id: prefix,
            level: 0,
            parentID: ""
        }];

        levels.forEach((levelType, levelIndex) => {
            let newLevel = [];
            currentLevel.forEach(parent => {
                for (let i = 1; i <= counts[levelIndex]; i++) {
                    const newID = `${parent.id}-${levelType.charAt(0).toUpperCase()}${i}`;
                    newLevel.push({
                        id: newID,
                        level: levelIndex + 1,
                        parentID: parent.level === 0 ? "" : parent.id
                    });
                }
            });
            output = output.concat(newLevel);
            currentLevel = newLevel;
        });

        return output;
    }

    function generateCompetencyFramework() {
        const frameworkName = $('#frameworkName').val().trim();
        const idPrefix = $('#idPrefix').val().trim();
        const counts = [
            $('#level1Number').val(),
            $('#level2Number').val(),
            $('#level3Number').val(),
            $('#level4Number').val()
        ].map(Number);

        const levels = [
            $('#level1Type').val(),
            $('#level2Type').val(),
            $('#level3Type').val(),
            $('#level4Type').val()
        ];

        const generatedData = generateIDs(idPrefix, levels, counts);

        const output = [{
            "Parent ID number": "",
            "ID number": idPrefix,
            "Short name": frameworkName,
            "Description": "",
            "Description format": "",
            "Scale values": defaultScaleValues,
            "Scale configuration": defaultScaleConfiguration,
            "Rule type (optional)": "",
            "Rule outcome (optional)": "",
            "Rule config (optional)": "",
            "Cross-referenced competency ID numbers": "",
            "Exported ID (optional)": "",
            "Is framework": "1",
            "Taxonomy": levels.join(',')
        }];

        generatedData.forEach(item => {
            output.push({
                "Parent ID number": item.parentID,
                "ID number": item.id,
                "Short name": `${item.id.split('-').pop()}`,
                "Description": "",
                "Description format": "",
                "Scale values": "",
                "Scale configuration": "",
                "Rule type (optional)": "",
                "Rule outcome (optional)": "",
                "Rule config (optional)": "",
                "Cross-referenced competency ID numbers": "",
                "Exported ID (optional)": "",
                "Is framework": "",
                "Taxonomy": ""
            });
        });

        return output;
    }

    function displayGeneratedOutput() {
        const form = document.getElementById('generatorForm');
        if (form.checkValidity() === false) {
            form.classList.add('was-validated');
            return;
        }
        form.classList.remove('was-validated');

        const output = generateCompetencyFramework();
        const outputText = JSON.stringify(output, null, 2);
        $('#generatedOutput').val(outputText);
        $('#importGeneratedButton').prop('disabled', false);
    }

    function importGeneratedOutput() {
        const generatedOutput = $('#generatedOutput').val();
        if (App.fileHandling.isValidFrameworkInput(generatedOutput)) {
            const data = JSON.parse(generatedOutput);
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
            $('#generatorModal').modal('hide');
            App.fileHandling.hideLoadingEffects();
        }
    }

    function initializeDropdowns() {
        const dropdownSelectors = ['#level1Type', '#level2Type', '#level3Type', '#level4Type'];
        dropdownSelectors.forEach(selector => {
            const dropdown = $(selector);
            dropdown.empty();
            levelTypes.forEach(type => {
                dropdown.append(new Option(type.charAt(0).toUpperCase() + type.slice(1), type));
            });
        });
    }

    $(document).ready(function() {
        initializeDropdowns();

        $('#generateButton').on('click', displayGeneratedOutput);
        $('#importGeneratedButton').on('click', importGeneratedOutput);
    });

    return {
        generateIDs: generateIDs,
        generateCompetencyFramework: generateCompetencyFramework,
        displayGeneratedOutput: displayGeneratedOutput,
        importGeneratedOutput: importGeneratedOutput,
        initializeDropdowns: initializeDropdowns
    };
})();
