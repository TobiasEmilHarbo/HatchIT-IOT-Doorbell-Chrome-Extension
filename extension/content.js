chrome.runtime
	.onMessage.addListener(request => {

		if (request.notify === true)
			showInBrowserNotification(request)
})

const showInBrowserNotification = (request) => {

	chrome.storage.sync.get(null, data => {

		const tabId = request.tabId

		let notifiedTabs = new Set()

		if(data.browserNotify)
		{
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

		chrome.storage.sync.set({
			browserNotify : Array.from(notifiedTabs)
		})

		let btnDismiss = document.getElementById('HITLAB_notification_dismiss')
		let btnMute = document.getElementById('HITLAB_notification_mute')

		btnDismiss.addEventListener('click', () => {
			hideNotification(dom, tabId)
			chrome.runtime.sendMessage(null, { dismiss: true })
		})

		btnMute.addEventListener('click', () => {
			hideNotification(dom, tabId)
			chrome.runtime.sendMessage(null, { mute: true })
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
			notifiedTabs = new Set(data.browserNotify)

			notifiedTabs.delete(tabId)
		}
		
		chrome.storage.sync.set({
			browserNotify : Array.from(notifiedTabs)
		})
	})

	dom.classList.add('hidden')

	setTimeout(() => {
		dom.remove()
	}, 400)
}
