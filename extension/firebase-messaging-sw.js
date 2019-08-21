const channel = new BroadcastChannel('sw-messages')

self.addEventListener('push', event => {

    const title = 'SW Office doorbell'

    const options = {
        type    : "basic",
        iconUrl : "bell-notification.png",
        message : "Someones at the door!",
        actions : [
            {
                action : "dismiss",
                title : "I got it!"
            },
            {
                action : "mute",
                title : "Mute"
            }
        ]
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