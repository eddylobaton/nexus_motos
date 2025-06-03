
function loading(args) {
    if (!args.hasOwnProperty('fontawesome')) {
        args.fontawesome = 'fa-solid fa-circle-notch fa-spin';
    }
    if (!args.hasOwnProperty('text')) {
        args.text = 'Loading...'; // Corrección aquí
    }
    $.LoadingOverlay("show", {
        image: "",
        fontawesome: args.fontawesome,
        custom: $("<div>", {
            "class": "loading",
            "text": args.text
        })
    });
}