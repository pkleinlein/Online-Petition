(function() {
    var canvas = document.getElementById("sigCanvas");
    var context = canvas.getContext("2d");
    var hidden = document.getElementById("hiddenInput");
    context.strokeStyle = "#900";
    context.lineWidth = 1;
    context.beginPath();

    var y = 0;
    var x = 0;

    var draw = function() {
        $("#sigCanvas").on("mousedown", function(e) {
            console.log("click");
            y = e.offsetY;
            x = e.offsetX;
            context.moveTo(x, y);
            $("#sigCanvas").on("mousemove", function(e) {
                y = e.offsetY;
                x = e.offsetX;
                context.lineTo(x, y);
                context.stroke();
                hidden.value = canvas.toDataURL();
            });
        });
    };
    $(document).on("mouseup", function() {
        $("#sigCanvas").off();
        draw();
    });
})();
