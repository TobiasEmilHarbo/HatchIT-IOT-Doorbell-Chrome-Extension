console.log('BACKGROUND')

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

firebase.firestore().collection('notifications').where('notify', '==', true).onSnapshot(query => {
    
    query.forEach(doc => {
        console.log("Current data: ", doc.data())
    })

    if(query.size < 1) return

    let config = {
        type    : "basic",
        iconUrl : "bell.png",
        title   : "Doorbell",
        message : "Someone's at the door!",
        buttons : [
            { title : "I got it!" },
            { title : "Mute" }
        ]
    }

    chrome.storage.sync.get('muted', data => {

        if(data.muted) return

        chrome.notifications.create('doorbell', config)
    })
})

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    console.log(buttonIndex)

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

chrome.storage.sync.get('muted', data => {
    const muted = data.muted

    chrome.browserAction.setIcon({
        path : (muted) ? "../bell-off.png" : "../bell.png"
    })
})