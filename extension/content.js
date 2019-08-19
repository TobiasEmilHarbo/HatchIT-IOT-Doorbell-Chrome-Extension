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

	let btn = document.getElementsById('HITLAB_notification_dismiss')

	btn.addEventListener('click', () => {
		dom.classList.add('hidden')
		setTimeout(() => {
			dom.remove()
		}, 100);
	})

	setTimeout(() => {
		dom.classList.remove('hidden')
	}, 10);
}