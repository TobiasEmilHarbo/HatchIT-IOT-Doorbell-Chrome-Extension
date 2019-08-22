
const notificationDOM = document.getElementById('HITLAB_notification')

let config = {
    apiKey: "AIzaSyA4Y0wZ6Z1PcNCQkWfBeT22ln4tP1ocVlA",
    authDomain: "hatchit-doorbell.firebaseapp.com",
    databaseURL: "https://hatchit-doorbell.firebaseio.com",
    projectId: "hatchit-doorbell",
    storageBucket: "hatchit-doorbell.appspot.com",
    messagingSenderId: "1089941867226",
    appId: "1:1089941867226:web:c38c5ef895544c1c"
}

firebase.initializeApp(config)

const messaging = firebase.messaging()

chrome.runtime.onInstalled.addListener(details => {
    switch(details.reason)
    {
        case('install') :

            firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
                muted : false,
                officeHours : {
                    hoursStart  : 8,
                    minsStart   : 30,
                    hoursEnd    : 16,
                    minsEnd     : 0
                },
                inBrowserNotifications : true,
                systemNotifications : true,
                badgeNotifications : true,
                officeHoursOnly : true,
                timezoneOffset : (new Date()).getTimezoneOffset() / 60
            }).catch(error => console.log(error))
        
        break

        default : 
            chrome.storage.sync.set({
                browserNotify : []
            })
            console.log('onInstalled reason', details.reason)
        break
    }
})

chrome.runtime.setUninstallURL(`https://hatchit-doorbell.firebaseapp.com/uninstall/${chrome.runtime.id}`)

messaging.requestPermission()
    .then(() => {
        return messaging.getToken()
    })
    .then(token => {
        return firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
            token : token,
            timezoneOffset : (new Date()).getTimezoneOffset() / 60
        }, { merge: true })
    })
    .catch(error => {
        return firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
            token : null
        }, { merge: true })
    })

firebase.firestore()
    .collection('apps')
    .doc(chrome.runtime.id)
    .onSnapshot(documentSnapshot => {

        if(!documentSnapshot.data()) return

        const {
            inBrowserNotifications,
            systemNotifications,
            badgeNotifications,
            officeHoursOnly,
            notifyBrowser,
            officeHours,
            muted,
        } = documentSnapshot.data()

        if(!inBrowserNotifications)
            chrome.browserAction.setBadgeText({text: ''})

        if(notifyBrowser && inBrowserNotifications)
            sendInBrowserNotification(documentSnapshot.ref)

        if(inBrowserNotifications   === undefined
        || systemNotifications      === undefined
        || badgeNotifications       === undefined
        || officeHoursOnly          === undefined
        || officeHours              === undefined
        || muted                    === undefined
        ) return

        chrome.storage.sync.set({
            inBrowserNotifications  : inBrowserNotifications,
            systemNotifications     : systemNotifications,
            badgeNotifications      : badgeNotifications,
            officeHoursOnly         : officeHoursOnly,
            officeHours             : officeHours,
            muted                   : muted
        })
})

firebase.firestore()
    .collection('notifications')
    .where('dismissed', '==', false)
    .onSnapshot(query => {
        
        chrome.browserAction.setBadgeText({text: ''})

        chrome.storage.sync.get(['badgeNotifications'], data => {

            if(data.badgeNotifications)
            {
                chrome.browserAction.setBadgeText({text: ''})

                if(query.size < 1)
                    return

                chrome.browserAction.setBadgeBackgroundColor({color : '#ee5519'})
                chrome.browserAction.setBadgeText({text : String(query.size)})
            }
        })
})

const channel = new BroadcastChannel('sw-messages')
channel.addEventListener('message', payload => {

    switch(payload.data.action)
    {
        case('notification') :
            chrome.storage.sync.get(null, data => {
                if(data.inBrowserNotifications)
                    sendInBrowserNotification()
            })
        break

        case('dismiss') : 
            
            dismissNotifications()
        break
    }
})

chrome.notifications
    .onButtonClicked.addListener((notificationId, buttonIndex) => {

        switch(buttonIndex)
        {
            case (0) :

                dismissNotifications()

            break
            
            case (1) :

                muteNotificaitons()

            break
        }
})

chrome.storage.sync.get(null, data => {
    const muted = data.muted

    chrome.browserAction.setIcon({
        path : (muted) ? "../images/bell-off.png" : "../images/bell.png"
    })
})

chrome.runtime
	.onMessage.addListener(request => {
        if (request.mute === true)
            muteNotificaitons()
        if(request.dismiss === true)
            dismissNotifications()
})

const sendInBrowserNotification = (docRef) => {
    if(docRef)
    {
        docRef.set({
            notifyBrowser : false
        }, { merge : true })
    }

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, tabs => {

        let activeTab = tabs[0]

        if(!activeTab) return

        chrome.tabs.sendMessage(activeTab.id, {
            notify  : true,
            tabId   : activeTab.id,
            id      : notificationDOM.id,
            dom     : notificationDOM.innerHTML
        })
    })
}

const muteNotificaitons = () => {
    firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
        muted : true
    }, { merge: true })

    chrome.browserAction.setIcon({
        path : "../images/bell-off.png"
    })
}

const dismissNotifications = () => {
    firebase.firestore()
        .collection('notifications')
        .where('dismissed', '==', false)
        .get().then(querySnapshot => {

            querySnapshot.forEach(doc => {
                doc.ref.update({
                    dismissed : true
                })
            })
        })
}