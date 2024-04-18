const jsonfilePath = window.process.argv.slice(-4, -1)[1];
console.log()
const jsonfile = require(jsonfilePath);
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');

// on page load, current settings are returned so can be accessed as js vars in page

export function getValuesToPopulatePage(storagePath) {
	//let formSettings = store.getSync('formSettings');
	//let privateSettings = store.getSync('privateSettings');
	//let allSettings = {...formSettings, ...privateSettings};
	
	//return(allSettings);
	//var settings = {};
	//var data;
	//fs.readFile(storagePath, 'utf8', function (err, data) {
	//	if (err){
	//		alert(err.message)
	//	};
	//	settings = JSON.parse(data);
	//});
	//console.log(settings)
	console.log(storagePath);

	let formSettings = jsonfile.readFileSync(storagePath)

	return(formSettings);
}