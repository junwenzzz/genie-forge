// -*- mode: typescript; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Genie
//
// Copyright 2016-2019 The Board of Trustees of the Leland Stanford Junior University
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

import * as crypto from 'crypto';

import platform from '../service/platform';

export function getSecretKey() {
    const prefs = platform.getSharedPreferences();

    let sessionKey = prefs.get('session-key') as string|undefined;
    if (sessionKey === undefined) {
        sessionKey = crypto.randomBytes(32).toString('hex');
        prefs.set('session-key', sessionKey);
    }
    return sessionKey;
}
