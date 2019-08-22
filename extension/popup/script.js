Number.prototype.between = function(min, max) {
    return (parseInt(this) > max) ? parseInt(max) : (parseInt(this) < min ? parseInt(min) : this)
}

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

let mutedCheckbox       = document.getElementById('muted')
let officeHoursCheckbox = document.getElementById('only-office-hours')
let officeHoursInputs   = document.querySelectorAll('input.office-hours')
let logButton = document.getElementById('log')

mutedCheckbox.addEventListener('click', (event) => {

    const muted = event.target.checked

    officeHoursCheckbox.disabled = muted

    Array.from(officeHoursInputs).forEach(input => {
        if(officeHoursCheckbox.checked)
            input.disabled = muted
    })

    firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
        muted : muted
    }, { merge: true }).catch(() => {})

    chrome.browserAction.setIcon({
        path : (muted) ? "../bell-off.png" : "../bell.png"
    })
})

chrome.storage.sync.get(null, data => {

    mutedCheckbox.checked = data.muted
    officeHoursCheckbox.checked = data.officeHoursOnly

    officeHoursCheckbox.disabled = data.muted

    Array.from(officeHoursInputs).forEach(input => {
        input.disabled = data.muted || !data.officeHoursOnly
    })

    if(data.officeHours)
    {
        const {
            hoursStart,
            minsStart,
            hoursEnd,
            minsEnd
        } = data.officeHours

        officeHoursInputs[0].value = String(hoursStart).padStart(2, '0')
        officeHoursInputs[1].value = String(minsStart).padStart(2, '0')
        officeHoursInputs[2].value = String(hoursEnd).padStart(2, '0')
        officeHoursInputs[3].value = String(minsEnd).padStart(2, '0')
    }
})

officeHoursCheckbox.addEventListener('click', () => {

    const officeHoursOnly = event.target.checked

    Array.from(officeHoursInputs).forEach(input => {
        input.disabled = !officeHoursOnly
    })

    firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
        officeHoursOnly : officeHoursOnly
    }, { merge: true }).catch(() => {})
})

Array.from(officeHoursInputs).forEach(input => {

    input.addEventListener('change', event => {
        const sanitized = parseInt(input.value).between(input.min, input.max)
        input.value = String(sanitized).padStart(2, '0')

        let hoursStart  = parseInt(officeHoursInputs[0].value)
        let minsStart   = parseInt(officeHoursInputs[1].value)

        let hoursEnd    = parseInt(officeHoursInputs[2].value)
        let minsEnd     = parseInt(officeHoursInputs[3].value)

        firebase.firestore().collection('apps').doc(chrome.runtime.id).set({
            officeHours : {
                hoursStart : hoursStart,
                minsStart  : minsStart,
                hoursEnd   : hoursEnd,
                minsEnd    : minsEnd
            }
        }, { merge: true }).catch(() => {})
    })
})

logButton.addEventListener('click', () => {
    firebase.firestore()
        .collection('notifications')
        .where('dismissed', '==', false)
        .get().then(querySnapshot => {

            querySnapshot.forEach(doc => {
                doc.ref.update({
                    dismissed : true
                })
            })

        logButton.classList.remove('show')
    })
})

firebase.firestore()
    .collection('notifications')
    .where('dismissed', '==', false)
    .onSnapshot(querySnapshot => {
    
        if(querySnapshot.size > 0)
            logButton.classList.add('show')
        else
            logButton.classList.remove('show')

})

