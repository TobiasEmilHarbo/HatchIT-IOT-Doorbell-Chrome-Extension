
let config = {
    apiKey: "AIzaSyA4Y0wZ6Z1PcNCQkWfBeT22ln4tP1ocVlA",
    authDomain: "hatchit-doorbell.firebaseapp.com",
    databaseURL: "https://hatchit-doorbell.firebaseio.com",
    projectId: "hatchit-doorbell",
    storageBucket: "hatchit-doorbell.appspot.com",
    messagingSenderId: "1089941867226",
    appId: "1:1089941867226:web:c38c5ef895544c1c"
}

firebase.initializeApp(config);

firebase.firestore().collection('notifications').onSnapshot(query => {
    
    let notifications = 0

    query.forEach(doc => {
        if(doc.data().notify)
            notifications++;
    })

    chrome.browserAction.setBadgeText({text: ''})

    if(notifications < 1) return

    let config = {
        type    : "basic",
        iconUrl : "bell-notification.png",
        title   : "Office doorbell",
        message : "Someones at the door!",
        buttons : [
            { title : "I got it!" },
            { title : "Mute" }
        ]
    }

    chrome.browserAction.setBadgeBackgroundColor({color : '#ee5519'})
    chrome.browserAction.setBadgeText({text : String(notifications)})

    chrome.storage.sync.get(null, data => {

        const {
            hoursStart,
            minsStart,
            hoursEnd,
            minsEnd
        } = data.officeHours
    
        const d     = new Date() // current time
        const hours = d.getHours()
        const mins  = String(d.getMinutes())
        
        const currentTime  = parseInt(hours + mins.padStart(2, '0'))

        const officeHoursStart  = parseInt(hoursStart + `${minsStart}`.padStart(2, '0'))
        const officeHoursEnd    = parseInt(hoursEnd   + `${minsEnd}`.padStart(2, '0'))

        const withInOfficeHours = (
            (officeHoursStart <= currentTime &&
            officeHoursEnd > currentTime) ||
            (officeHoursStart > currentTime &&
            officeHoursEnd >= currentTime)
        )

        if(data.muted || (!withInOfficeHours && data.onlyOfficeHours) ) return

        chrome.notifications.create('doorbell', config)
    })
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {

    switch(buttonIndex)
    {
        case (0):

            firebase.firestore().collection('notifications').where('notify', '==', true).onSnapshot(querySnapshot => {

                querySnapshot.forEach(doc => {
                    doc.ref.update({
                        notify : false
                    })
                })
            
            })
        break
        case (1):

            chrome.storage.sync.set({ muted: true })
            chrome.browserAction.setIcon({
                path : "../bell-off.png"
            })

        break
    }
})

chrome.browserAction.onClicked.addListener(tab =>
{
    console.log(tab)
})

chrome.storage.sync.get(null, data => {
    const muted = data.muted

    chrome.browserAction.setIcon({
        path : (muted) ? "../bell-off.png" : "../bell.png"
    })

    if(!data.officeHours)
    {
        chrome.storage.sync.set({ 
            officeHours : {
                hoursStart : 8,
                minsStart  : 0,
                hoursEnd   : 16,
                minsEnd    : 30
            }
        })
    }
})