var default_urn = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amMyNGZuaXJ6aW1yNzE1Mzg0cGNkMWZ2ZGE1c3E3MjUtZGVtby9jb21iaW5lZC56aXA=";

$(document).ready(function () {
    $("#forgeViewer").empty();
    var msg = '<h1>We are waiting to start the demo</h1>'
            +'<button class="btn btn-xs btn-info" onclick="start_demo()"><span class="glyphicon glyphicon-eye-open"></span> ' + 'Start </button>';
    $("#forgeViewer").html(msg);
});

function start_demo(urn = default_urn){
    launchViewer(urn);
}
