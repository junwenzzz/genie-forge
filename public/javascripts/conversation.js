"use strict";
$(() => {
    var baseUrl = document.body.dataset.baseUrl;
    var thingpediaUrl = document.body.dataset.thingpediaUrl;
    var url = new URL('ws/conversation', location.href);
    if (url.protocol === 'https:')
        url.protocol = 'wss:';
    else
        url.protocol = 'ws:';
    url = url.toString();

    var ws;
    var open = false;

    var pastCommandsUp = []; // array accessed by pressing up arrow
    var pastCommandsDown = []; // array accessed by pressing down arrow
    var currCommand = ""; // current command between pastCommandsUp and pastCommandsDown

    var conversationId = null;
    var lastMessageId = -1;

    var container = $('#chat');
    var currentGrid = null;

    function updateConnectionFeedback() {
        if (!ws || !open) {
            $('#input-form-group').addClass('has-warning');
            manageSpinner('remove');
            manageLostConnectionMsg('add');
            manageLostConnectionMsg('show');
            scrollChat();
            return;
        }

        $('#input-form-group').removeClass('has-warning');
        manageLostConnectionMsg('remove');
    }

    function updateSpinner(thinking) {
        if (!ws || !open)
            return;

        let to_do;

        if (thinking)
            to_do = 'show';
        else
            to_do = 'remove';

        manageSpinner(to_do);
    }

    function manageLostConnectionMsg(todo) {
        switch (todo) {
            case 'remove':
                $('#chat > .help-block').remove();
                break;
            case 'show':
                $('#chat > .help-block').removeClass('hidden');
                break;
            case 'add':
                $('#chat > .help-block').remove();
                $(".help-block").clone().appendTo("#chat").last();
                break;
        }
        return;
    }

    function manageSpinner(todo) {
        let last_elem = $(".from-user").last();
        switch (todo) {
            case 'remove':
                $('#chat > .almond-thinking').remove();
                break;
            case 'show':
                $('#chat > .almond-thinking').remove();
                $(".almond-thinking").clone().insertAfter(last_elem);
                $('#chat > .almond-thinking').removeClass('hidden');
                break;
        }
        return;
    }

    (function() {
        var reconnectTimeout = 100;

        function connect() {
            ws = new WebSocket(url);

            ws.onmessage = function(event) {
                if (!open) {
                    open = true;
                    reconnectTimeout = 100;
                    updateConnectionFeedback();
                }
                onWebsocketMessage(event);
            };

            ws.onclose = function() {
                console.error('Web socket closed');
                ws = undefined;
                open = false;
                updateConnectionFeedback();

                // reconnect immediately if the connection previously succeeded, otherwise
                // try again in a little bit
                if (open) {
                    setTimeout(connect, 100);
                } else {
                    reconnectTimeout = 1.5 * reconnectTimeout;
                    setTimeout(connect, reconnectTimeout);
                }
            };
        }

        connect();
    })();

    function syncCancelButton(msg) {
        var visible = msg.ask !== null;
        if (visible)
            $('#cancel').removeClass('hidden');
        else
            $('#cancel').addClass('hidden');
    }

    function almondMessage(icon) {
        var msg = $('<span>').addClass('message-container from-almond');
        icon = icon || 'org.thingpedia.builtin.thingengine.builtin';
        var src = thingpediaUrl + '/api/v3/devices/icon/' + icon;
        msg.append($('<img>').addClass('icon').attr('src', src));
        container.append(msg);

        addVoteButtons();
        manageLostConnectionMsg('add');
        manageSpinner('remove');
        scrollChat();
        return msg;
    }

    function addVoteButtons() {
        $('.comment-options').remove();
        $('#comment-block').val('');
        const upvote = $('<i>').addClass('far fa-thumbs-up').attr('id', 'upvoteLast');
        const downvote = $('<i>').addClass('far fa-thumbs-down').attr('id', 'downvoteLast');
        const comment = $('<i>').addClass('far fa-comment-alt').attr('id', 'commentLast')
            .attr('data-toggle', 'modal')
            .attr('data-target', '#comment-popup');
        upvote.click((event) => {
            $.post(baseUrl + '/recording/vote/up', {
                id: conversationId,
                _csrf: document.body.dataset.csrfToken
            }).then((res) => {
                if (res.status === 'ok') {
                    upvote.attr('class', 'fa fa-thumbs-up');
                    downvote.attr('class', 'far fa-thumbs-down');
                }
            });
            event.preventDefault();
        });
        downvote.click((event) => {
            $.post(baseUrl + '/recording/vote/down', {
                id: conversationId,
                _csrf: document.body.dataset.csrfToken
            }).then((res) => {
                if (res.status === 'ok') {
                    upvote.attr('class', 'far fa-thumbs-up');
                    downvote.attr('class', 'fa fa-thumbs-down');
                }
            });
            event.preventDefault();
        });
        const div = $('<span>').addClass('comment-options');
        div.append(upvote);
        div.append(downvote);
        div.append(comment);
        container.append(div);
        return div;
    }

    function maybeScroll(container) {
        if (!$('#input:focus').length)
            return;
        //keep scroll bar to the bottom
        scrollChat();
        setTimeout(scrollChat, 1000);
    }

    function scrollChat() {
        let chat = document.getElementById('chat');
        chat.scrollTop = chat.scrollHeight;
    }

    function textMessage(text, icon) {
        var container = almondMessage(icon);
        container.append($('<span>').addClass('message message-text')
            .text(text));
        maybeScroll(container);
    }

    function picture(url, icon) {
        var container = almondMessage(icon);
        container.append($('<img>').addClass('message message-picture')
            .attr('src', url));
        maybeScroll(container);
    }

    function rdl(rdl, icon) {
        var container = almondMessage(icon);
        var rdlMessage = $('<a>').addClass('message message-rdl')
            .attr('href', rdl.webCallback).attr("target", "_blank").attr("rel", "noopener nofollow");
        rdlMessage.append($('<span>').addClass('message-rdl-title')
            .text(rdl.displayTitle));
        if (rdl.pictureUrl) {
            rdlMessage.append($('<span>').addClass('message-rdl-content')
                .append($('<img>').attr('src', rdl.pictureUrl)));
        }
        rdlMessage.append($('<span>').addClass('message-rdl-content')
            .text(rdl.displayText));
        container.append(rdlMessage);

        maybeScroll(container);
    }

    function getGrid() {
        if (!currentGrid) {
            var wrapper = $('<div>').addClass('message-container button-grid container');
            currentGrid = $('<div>').addClass('row');
            wrapper.append(currentGrid);
            container.append(wrapper);
        }
        return currentGrid;
    }

    function choice(idx, title) {
        var holder = $('<div>').addClass('col-xs-12 col-sm-6');
        var btn = $('<a>').addClass('message message-choice btn btn-default')
            .attr('href', '#').text(title);
        btn.click((event) => {
            handleChoice(idx, title);
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function buttonMessage(title, json) {
        var holder = $('<div>').addClass('col-xs-12 col-sm-6');
        var btn = $('<a>').addClass('message message-button new-msg-button btn btn-default')
            .attr('href', '#').text(title);
        btn.click((event) => {
            handleParsedCommand(json, title);
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function linkMessage(title, url) {
        /*if (url === '/apps')
            url = '/me';
        else if (url.startsWith('/devices'))
            url = '/me' + url;*/

        var holder = $('<div>').addClass('col-xs-12 col-sm-6');
        var btn = $('<a>').addClass('message message-button new-msg-button btn btn-default')
            .attr('href', baseUrl + url).attr("target", "_blank").attr("rel", "noopener").text(title);
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function yesnoMessage() {
        var holder = $('<div>').addClass('col-xs-6 col-sm-4 col-md-3');
        var btn = $('<a>').addClass('message message-yesno new-msg-button btn btn-default')
            .attr('href', '#').text("Yes");
        btn.click((event) => {
            handleSpecial('yes', "Yes");
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        holder = $('<div>').addClass('col-xs-6 col-sm-4 col-md-3');
        btn = $('<a>').addClass('message message-yesno new-msg-button btn btn-default')
            .attr('href', '#').text("No");
        btn.click(function(event) {
            handleSpecial('no', "No");
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function collapseButtons() {
        $('.message-button, .message-choice, .message-yesno').remove();
        $('.comment-options').remove();
    }

    function syncKeyboardType(ask) {
        if (ask === 'password')
            $('#input').attr('type', 'password');
        else
            $('#input').attr('type', 'text');
    }

    // TODO: develop function to convert Genie results into Forge API calls
    function control_forge(code, results){
        let f_start_idx = code.indexOf('@org.thingpedia.fm') + 19; // 19 is the lenght of "org.thingpedia.fm"
        let f_end_idx = code.indexOf('(', f_start_idx);
        const thingtalk_function = code.substring(f_start_idx, f_end_idx);
        let id_list = [];
        for (let r of results) {
            id_list.push(parseInt(r.id.value));
        }
        console.log(results);

        switch (thingtalk_function){
            case 'building_object':
                console.log("list to be fit to view", id_list);
                // viewer.showAll();
                if (id_list.length > 1){
                    viewer.fitToView(id_list);
                    viewer.isolate(id_list);
                } else{
                    viewer.fitToView(id_list);
                    viewer.select(id_list);
                }
                break;
            case 'forge_floor':
                var guid = results[0].id.value;
                viewer.loadDocumentNode(stored_doc, stored_doc.getRoot().findByGuid(guid));
                break;
            case 'forge_building':
                var urn = results[0].id.value;
                $("#forgeViewer").empty();
                launchViewer(urn);
                break
            case 'hide_object':
                let hide_list = [];
                for (let r of results) {
                    hide_list.push(parseInt(r.building_object.value));
                }
                viewer.fitToView(hide_list);
                for (let i of hide_list) {
                    viewer.hide([i]);
                }
                break;
            default:
                console.warn(`Un-recognized ThinkTalk function '${thingtalk_function}'`);
        }

    }

    function onWebsocketMessage(event) {
        var parsed = JSON.parse(event.data);
        console.log('received ' + event.data);

        if (parsed.type === 'id') {
            conversationId = parsed.id;
            return;
        }

        if (parsed.type === 'askSpecial') {
            syncKeyboardType(parsed.ask);
            syncCancelButton(parsed);
            if (parsed.ask === 'yesno')
                yesnoMessage();
            updateSpinner(false);
            return;
        }
        if (parsed.type === 'hypothesis') {
            $('#input').val(parsed.hypothesis);
            return;
        }

        if (parsed.id <= lastMessageId)
            return;
        lastMessageId = parsed.id;

        switch (parsed.type) {
            // Add Forge control
            case 'new-program':
                control_forge(parsed.code, parsed.results);
                break;
            case 'text':
            case 'result':
                // FIXME: support more type of results
                textMessage(parsed.text, parsed.icon);
                currentGrid = null;
                break;

            case 'picture':
                picture(parsed.url, parsed.icon);
                currentGrid = null;
                break;

            case 'rdl':
                rdl(parsed.rdl, parsed.icon);
                currentGrid = null;
                break;

            case 'choice':
                choice(parsed.idx, parsed.title);
                break;

            case 'button':
                buttonMessage(parsed.title, parsed.json);
                break;

            case 'link':
                linkMessage(parsed.title, parsed.url);
                break;

            case 'command':
                $('#input').val('');
                collapseButtons();
                appendUserMessage(parsed.command);
                break;
        }
    }

    function handleSlashR(line) {
        line = line.trim();
        if (line.startsWith('{'))
            handleParsedCommand(JSON.parse(line));
        else
            handleParsedCommand({ code: line.split(' '), entities: {} });
    }

    function handleCommand(text) {
        if (text.startsWith('\\r')) {
            handleSlashR(text.substring(3));
            return;
        }
        if (text.startsWith('\\t')) {
            handleThingTalk(text.substring(3));
            return;
        }

        updateSpinner(true);
        ws.send(JSON.stringify({ type: 'command', text: text }));
    }

    function handleParsedCommand(json, title) {
        updateSpinner(true);
        ws.send(JSON.stringify({ type: 'parsed', json: json, title: title }));
    }

    function handleThingTalk(tt) {
        updateSpinner(true);
        ws.send(JSON.stringify({ type: 'tt', code: tt }));
    }

    function handleChoice(idx, title) {
        handleParsedCommand({ code: ['bookkeeping', 'choice', String(idx)], entities: {} }, title);
    }

    function handleSpecial(special, title) {
        handleParsedCommand({ code: ['bookkeeping', 'special', 'special:' + special], entities: {} }, title);
    }

    function appendUserMessage(text) {
        container.append($('<span>').addClass('message message-text from-user')
            .text(text));

        manageLostConnectionMsg('add');
        manageSpinner('show');
        scrollChat();
    }

    $('#input-form').submit((event) => {
        var text = $('#input').val();
        if (currCommand !== "")
            pastCommandsUp.push(currCommand);
        if (pastCommandsDown.length !== 0) {
            pastCommandsUp = pastCommandsUp.concat(pastCommandsDown);
            pastCommandsDown = [];
        }
        pastCommandsUp.push(text);

        $('#input').val('');

        handleCommand(text);
        event.preventDefault();
    });

    $('#cancel').click(() => {
        handleSpecial('nevermind', "Cancel.");
    });

    $('#input-form').on('keydown', (event) => { // button is pressed
        if (event.keyCode === 38) { // Up
            // removes last item from array pastCommandsUp, displays it as currCommand, adds current input text to pastCommandsDown
            currCommand = pastCommandsUp.pop();
            if ($('#input').val() !== "")
                pastCommandsDown.push($('#input').val());
            $('#input').val(currCommand);
        }

        if (event.keyCode === 40) { // Down
            // removes last item from array pastCommandsDown, displays it as currCommand, adds current input text to pastCommandsUp
            currCommand = pastCommandsDown.pop();
            if ($('#input').val() !== "")
                pastCommandsUp.push($('#input').val());
            $('#input').val(currCommand);
        }
    });

    $('#save-log').click(() => {
        $.get(baseUrl + '/recording/log/' + conversationId + '.txt').then((res) => {
            $('#recording-log').text(res);
            const email = 'oval-bug-reports@lists.stanford.edu';
            const subject = 'Genie Conversation Log';
            const body = encodeURIComponent(res);
            $('#recording-share').prop('href', `mailto:${email}?subject=${subject}&body=${body}`);
            $('#recording-save').modal('toggle');
        });
    });

    $('#recording-download').click(() => {
        window.open(baseUrl + '/recording/log/' + conversationId + '.txt', "Genie Conversation Log");
    });

    $('#recording-save-done').click(() => {
        $('#recording-save').modal('toggle');
    });

    $('#comment-popup').submit((event) => {
        event.preventDefault();
        $.post(baseUrl + '/recording/comment', {
            id: conversationId,
            comment: $('#comment-block').val(),
            _csrf: document.body.dataset.csrfToken
        }).then((res) => {
            if (res.status === 'ok') {
                $('#commentLast').attr('class', 'fa fa-comment-alt');
                $('#comment-popup').modal('toggle');
            }
        });
    });
});
