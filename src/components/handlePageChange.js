import { processAdditionalArgs } from './populatePages';
const isDev = processAdditionalArgs('isDev');

export function changePage(page) {
	// in production pages are changed using hashrouter and require page refresh
	// in dev, href is used

	if (isDev === "true"){
		console.log(isDev);
		console.log(page);
		window.location.href = page;
	} else {
		window.location.hash = page;  // using hash router in production
		window.location.reload();  // only changes page in prod if refreshed
	}

}