String.prototype.between = function(min, max) {
    return (parseInt(this) > max) ? String(max) : (parseInt(this) < min ? String(min) : this)
}

let mutedCheckbox       = document.getElementById('muted')
let officeHoursCheckbox = document.getElementById('only-office-hours')
let officeHoursInputs   = document.querySelectorAll('input.office-hours')

mutedCheckbox.addEventListener('click', () => {

    chrome.storage.sync.get('muted', data => {

        const muted = !data.muted

        chrome.storage.sync.set({ muted: muted })

        officeHoursCheckbox.disabled = muted

        Array.from(officeHoursInputs).forEach(input => {
            if(officeHoursCheckbox.checked)
                input.disabled = muted
        })

        chrome.browserAction.setIcon({
            path : (muted) ? "../bell-off.png" : "../bell.png"
        })
    })
})

chrome.storage.sync.get(null, data => {

    mutedCheckbox.checked = data.muted
    officeHoursCheckbox.checked = data.onlyOfficeHours

    officeHoursCheckbox.disabled = data.muted

    Array.from(officeHoursInputs).forEach(input => {
        input.disabled = data.muted || !data.onlyOfficeHours
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

    chrome.storage.sync.get(null, data => {

        const onlyOfficeHours = !data.onlyOfficeHours

        chrome.storage.sync.set({ onlyOfficeHours: onlyOfficeHours })

        Array.from(officeHoursInputs).forEach(input => {
            input.disabled = !onlyOfficeHours
        })
    })
})

Array.from(officeHoursInputs).forEach(input => {

    input.addEventListener('change', event => {
        
        input.value = input.value.between(input.min, input.max).padStart(2, '0')

        let hoursStart  = parseInt(officeHoursInputs[0].value)
        let minsStart   = parseInt(officeHoursInputs[1].value)

        let hoursEnd    = parseInt(officeHoursInputs[2].value)
        let minsEnd     = parseInt(officeHoursInputs[3].value)

        chrome.storage.sync.set({ 
            officeHours : {
                hoursStart : hoursStart,
                minsStart  : minsStart,
                hoursEnd   : hoursEnd,
                minsEnd    : minsEnd
            }
        })
    })
})



