const checkboxes = document.querySelectorAll('input[type="checkbox"]')

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

Array.from(checkboxes).forEach(checkbox => {
    checkbox.addEventListener('click', event => {
        const checked   = event.target.checked
        const name      = event.target.name
    
        firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
            [name] : checked
        }, { merge: true }).catch(() => {})
    })
})

chrome.storage.sync.get(null, data => {

    Array.from(checkboxes).forEach(checkbox => {
        const name = checkbox.name
        checkbox.checked = data[name]
    })
})
