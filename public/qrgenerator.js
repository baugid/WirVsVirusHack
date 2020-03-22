//author: Gideon Baur
function sendRequest(url, options, jsonCallback) {
    fetch(url, options).then(response => {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.indexOf("application/json") !== -1) {
            response.json().then(jsonCallback)
        }
        else { //display error
            response.text().then(text => {
                console.error(text)
            })
        }
    })
}

async function sendFiles() {
    var files = []
    for (file of $("#files")[0].files) {

        //create post data
        const formData = new FormData();
        formData.append("file", file);
        const options = {
            method: 'POST',
            body: formData
        }
        const response = await fetch('/submitFile', options)
        const contentType = response.headers.get("content-type")
        if (!contentType || contentType.indexOf("application/json") === -1) {
            const text = await response.text()
            console.error(text)
            return
        }

        const json = await response.json()
        files.push(json)
    }
    return files
}

function sendForm(items, files) {
    const data = { content: items, files }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    sendRequest('/submitForm', options, data => {
        $('#qrcode').qrcode({
            render: 'canvas',
            text: data.id,
            width: 600,
            height: 600,
            background: "#ffffff",
            foreground: "#000000"
        })
    })
}

$(document).ready(function () {
    $('#generate_qr_code').on("click", function () {
        $('#qrcode canvas').remove();
        $('#qrcode-frame').show();

        var items = [];
        $('#qrform input').each(function (i, v) {
            if (jQuery(v).attr('type') == "button") {
                return;
            }
            if (v.id != 'files')
                items.push(jQuery(v).val());
        });

        sendFiles().then(files => sendForm(items, files))
    })

});

$('#qrcode-frame').on('click', function () {
    $('#qrcode-frame').hide();
});