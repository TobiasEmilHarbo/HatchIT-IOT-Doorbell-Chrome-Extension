let buttons = document.getElementsByClassName('mute')

for (let index = 0; index < buttons.length; index++)
{
    const element = buttons[index]

    element.addEventListener('click', () => {

        chrome.storage.sync.get('muted', data => {

            const muted = !data.muted

            console.log('MUTED', muted)

            chrome.storage.sync.set({ muted: muted })

            chrome.browserAction.setIcon({
                path : (muted) ? "../bell-off.png" : "../bell.png"
            })
        })
    })
}