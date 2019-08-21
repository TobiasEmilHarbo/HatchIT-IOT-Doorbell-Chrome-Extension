
const notificationDOM = document.querySelector('template#HITLAB_notification')

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
                    hoursStart : 8,
                    minsStart : 30,
                    hoursEnd : 16,
                    minsEnd : 0
                },
                officeHoursOnly : true,
                timezoneOffset : (new Date()).getTimezoneOffset() / 60
            }).catch(error => console.log(error))
        
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

firebase.firestore().collection('apps').doc(chrome.runtime.id).onSnapshot(querySnapshot => {

    const { muted, officeHours, officeHoursOnly } = querySnapshot.data()

    if(muted === undefined || officeHours === undefined || officeHoursOnly === undefined) return

    chrome.storage.sync.set({
        muted : muted,
        officeHoursOnly : officeHoursOnly,
        officeHours : {
            hoursStart : officeHours.hoursStart,
            minsStart  : officeHours.minsStart,
            hoursEnd   : officeHours.hoursEnd,
            minsEnd    : officeHours.minsEnd
        }
    })
})

const channel = new BroadcastChannel('sw-messages')
channel.addEventListener('message', payload => {

    switch(payload.data.action)
    {
        case('notification') :
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                let activeTab = tabs[0]

                if(!activeTab) return
        
                chrome.tabs.sendMessage(activeTab.id, {
                    notify: true,
                    id : notificationDOM.id,
                    dom : notificationDOM.innerHTML
                })
            })
        break

        case('dismiss') : 
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
        break
    }
})

firebase.firestore().collection('notifications').where('dismissed', '==', false).onSnapshot(query => {
    
    chrome.browserAction.setBadgeText({text: ''})

    if(query.size < 1)
        return

    chrome.browserAction.setBadgeBackgroundColor({color : '#ee5519'})
    chrome.browserAction.setBadgeText({text : String(query.size)})
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {

    switch(buttonIndex)
    {
        case (0) :

            firebase.firestore().collection('notifications').where('dismissed', '==', false).onSnapshot(querySnapshot => {

                querySnapshot.forEach(doc => {
                    doc.ref.update({
                        dismissed : true
                    })
                })
            })

        break
        case (1) :

            firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
                muted : true
            }, { merge: true })

            chrome.browserAction.setIcon({
                path : "../bell-off.png"
            })

        break
    }
})

chrome.storage.sync.get(null, data => {
    const muted = data.muted

    chrome.browserAction.setIcon({
        path : (muted) ? "../bell-off.png" : "../bell.png"
    })
})