// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Genie
//
// Copyright 2018-2019 The Board of Trustees of the Leland Stanford Junior University
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>

import 'thingpedia';
process.on('unhandledRejection', (up) => { throw up; });

// Login to Web Almond with username and password
// returns a Cookie header that can be used in subsequent requests

import assert from 'assert';
import * as Tp from 'thingpedia';
import * as tough from 'tough-cookie';
import * as minidom from './minidom';

function accumulateStream(stream) {
    return new Promise((resolve, reject) => {
        const buffers = [];
        let length = 0;
        stream.on('data', (buf) => {
            buffers.push(buf);
            length += buf.length;
        });
        stream.on('end', () => resolve(Buffer.concat(buffers, length)));
        stream.on('error', reject);
    });
}

function getCsrfToken(htmlString) {
    for (let input of minidom.getElementsByTagName(minidom.parse(htmlString), 'input')) {
        if (minidom.getAttribute(input, 'name') === '_csrf')
            return minidom.getAttribute(input, 'value');
    }

    throw new Error('Failed to find input[name=_csrf]');
}

const baseUrl = 'http://127.0.0.1:3000';

async function startSession() {
    const loginStream = await Tp.Helpers.Http.getStream(baseUrl + '/user/login');
    const cookieHeader = loginStream.headers['set-cookie'][0];
    assert(cookieHeader);
    const cookie = tough.Cookie.parse(cookieHeader);

    const loginResponse = (await accumulateStream(loginStream)).toString();
    const csrfToken = getCsrfToken(loginResponse);
    return { csrfToken, cookie: cookie.cookieString() };
}

async function login(session) {
    if (!session)
        session = await startSession();

    const password = '12345678';
    await Tp.Helpers.Http.post(baseUrl + '/user/login',
        `username=ignored&password=${encodeURIComponent(password)}&_csrf=${encodeURIComponent(session.csrfToken)}`, {
        dataContentType: 'application/x-www-form-urlencoded',
        extraHeaders: {
            'Cookie': session.cookie
        }
    });
    return session;
}
export {
    login,
    startSession
};

async function main() {
    const { cookie } = await login();
    console.log(cookie);
}
if (!module.parent)
    main();
