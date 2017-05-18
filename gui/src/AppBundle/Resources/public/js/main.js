function jump(id, value)
{
    var element = document.getElementById(id);
    element.play();
    element.pause();
    element.currentTime = value;
    element.play();
}
// only in to demonstrate video
function playVideo(id)
{
    var element = document.getElementById(id);
    if (element.paused) {
        element.play();
    } else {
        element.pause();
    }
}

// request permission on page load
document.addEventListener('DOMContentLoaded', function () {
    if (!Notification) {
        alert('Les notifications ne sont pas disponibles avec votre navigateur, essayez Chrome !');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
});

function notifyMe(title, body, link) {
    if (Notification.permission !== "granted")
        Notification.requestPermission();
    else {
        var notification = new Notification(title, {
            icon: copIconPath,
            body: body,
        });

        notification.onclick = function () {
            if (typeof link !== 'undefined')
            {
                window.open(link);
            }
            else
            {
                window.focus();
            }
            notification.close();
        };
    }

}