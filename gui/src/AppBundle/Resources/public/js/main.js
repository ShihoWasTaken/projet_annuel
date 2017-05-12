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