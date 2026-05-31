const fs = require('fs');
const path = 'angular.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Adding to build options
data.projects['GestionAlquileres_365Soft'].architect.build.options.stylePreprocessorOptions = {
    includePaths: [".", "node_modules"]
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
