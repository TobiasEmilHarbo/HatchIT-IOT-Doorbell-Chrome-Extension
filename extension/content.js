console.log('HELLLO FORM CONTENT')

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(request)
      if (request.greeting == "hello")
        sendResponse({message: "hi to you"});
});