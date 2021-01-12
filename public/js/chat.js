const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormFile = $messageForm.querySelector('.img')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const emojiBtn = document.querySelector('.emoji-pop .emoji-btn')
const emojiList = document.querySelector('.emoji-pop ul')
const emojis = document.querySelectorAll('.emoji-pop ul li')

emojiBtn.addEventListener('click', () => {
    if (emojiList.classList.contains('active')) {
        emojiList.classList = ''
    } else {
        emojiList.classList = 'active'
    }
})

emojis.forEach((e) => {
    e.addEventListener('click', () => {
        $messageFormInput.value = $messageFormInput.value + e.dataset.code

        if (emojiList.classList.contains('active')) {
            emojiList.classList = ''
        } else {
            emojiList.classList = 'active'
        }
    })
})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const contentHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if (contentHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

// function previewFile() {
//     const preview = document.querySelector('img');
//     const file = document.querySelector('input[type=file]').files[0];
//     const reader = new FileReader();
  
//     reader.addEventListener("load", function () {
//       // convert image file to base64 string
//       preview.src = reader.result;
//     }, false);
  
//     if (file) {
//       reader.readAsDataURL(file);
//     }
//   }

socket.on('message', (message) => {
    // console.log(message)
    let txtMsg = message.text ? message.text : '';
    if (txtMsg.split("http://").length > 1 || txtMsg.split("https://").length > 1) {
        txtMsg = `<a href="${txtMsg}" target="_blank">${txtMsg}</a>`;
    }
    
    // let sendfile = $messageFormFile.files ? $messageFormFile.files[0] : false;
    // if ($messageFormFile.value) { 
    //     sendfile = getBase64(sendfile);
    //     console.log(sendfile)
    // } else {
    //     sendfile = '';
    // }

    // let file = $messageFormFile.value
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: txtMsg,
        // file: sendfile,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
    showNotification(message.username, txtMsg)
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        // console.log('Message delivered!')
    })
})

// $sendLocationButton.addEventListener('click', () => {
//     if (!navigator.geolocation) {
//         return alert('Geolocation is not supported by your browser.')
//     }

//     $sendLocationButton.setAttribute('disabled', 'disabled')

//     navigator.geolocation.getCurrentPosition((position) => {
//         socket.emit('sendLocation', {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude
//         }, () => {
//             $sendLocationButton.removeAttribute('disabled')
//             console.log('Location shared!')  
//         })
//     })
// })

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

// var audio = new Audio("/img/blat.mp3");

/// NOTIFICATIONS
let permission = Notification.permission;
if(permission === "granted") {
   showNotification();
} else if(permission === "default"){
   requestAndShowPermission();
} else {
//   alert("New message");
}
function showNotification(user = false, message = false) {
    if (!user || !message) return;
    if(document.visibilityState === "visible") {
        return;
    }
    var title = `${user} says:`;
    let options = {
        body: message,
        icon: "/img/favicon.png",
        sound: "/img/blat.mp3",
        // silent: true
    }

    var notification = new Notification(title, options);
    notification.onclick = () => { 
          notification.close();
          window.parent.focus();
   }
}
function requestAndShowPermission() {
   Notification.requestPermission(function (permission) {
      if (permission === "granted") {
            showNotification();
      }
   });
}

