chrome.runtime
	.onMessage.addListener(request => {

		if (request.notify === true)
			showInBrowserNotification(request)
})

const showInBrowserNotification = (request) => {

	chrome.storage.sync.get(null, data => {

		const tabId = request.tabId

		console.log('i am', tabId)
		let notifiedTabs = new Set()

		if(data.browserNotify)
		{
			console.log('old', data.browserNotify)
			notifiedTabs = new Set(data.browserNotify)

			if(notifiedTabs.has(tabId))
			{
				console.log(tabId, 'already in the array')
				return
			}
		}
		
		const dom = document.createElement('div')
		dom.id = request.id
		dom.innerHTML = request.dom
		dom.classList.add('hidden')

		document.body.appendChild(dom)

		setTimeout(() => {
			dom.classList.remove('hidden')
		}, 100)

		notifiedTabs.add(tabId)

		console.log('new', notifiedTabs)

		chrome.storage.sync.set({
			browserNotify : Array.from(notifiedTabs)
		})

		let btn = document.getElementById('HITLAB_notification_dismiss')

		btn.addEventListener('click', () => {
			hideNotification(dom, tabId)
		})

		setTimeout(() => {
			hideNotification(dom, tabId)
		}, 10000)

	})
}

const hideNotification = (dom, tabId) => {
	
	chrome.storage.sync.get(null, data => {

		let notifiedTabs = new Set()

		if(data.browserNotify)
		{
			console.log('old', data.browserNotify)

			notifiedTabs = new Set(data.browserNotify)

			notifiedTabs.delete(tabId)
		}
		
		console.log('new', notifiedTabs)
		
		chrome.storage.sync.set({
			browserNotify : Array.from(notifiedTabs)
		})
	})

	dom.classList.add('hidden')

	setTimeout(() => {
		dom.remove()
	}, 100)
}