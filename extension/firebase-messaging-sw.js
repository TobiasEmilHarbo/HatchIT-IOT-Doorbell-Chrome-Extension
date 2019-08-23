const channel = new BroadcastChannel('sw-messages')

self.addEventListener('push', event => {

    const title = 'Office doorbell'

    const options = {
        actions : [
            {
                action : "dismiss",
                title : "I got it!"
            },
            {
                action : "mute",
                title : "Mute"
            }
        ],
        type    : "basic",
        icon    : "images/bell-circled-icon48.png",
        body    : "Someones at the door!"
    }

    channel.postMessage({
        action: 'notification'
    })

    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {

    event.notification.close()

    if(!event.action) return

    channel.postMessage({
        action: event.action
    })
})