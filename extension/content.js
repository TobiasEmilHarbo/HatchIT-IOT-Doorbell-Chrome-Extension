console.log('CONTENT')

chrome.runtime.onMessage.addListener(request => {
	if (request.notify === true)
		showInBrowserNotification(request)
});

const showInBrowserNotification = (request) => {

	const dom = document.createElement('div')
	dom.id = request.id
	dom.innerHTML = request.dom
	dom.classList.add('hidden')

	document.body.appendChild(dom)

	setTimeout(() => {
		dom.classList.remove('hidden')
	}, 10);
}