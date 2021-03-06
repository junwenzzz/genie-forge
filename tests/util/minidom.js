// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Genie
//
// Copyright 2019 The Board of Trustees of the Leland Stanford Junior University
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

import * as parse5 from 'parse5';

function* getElementsByTagName(root, tagName) {
    if (root.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
        root.tagName === tagName)
        yield root;

    for (let child of root.childNodes) {
        if (child.nodeName === '#text' || child.nodeName === '#comment')
            continue;
        yield* getElementsByTagName(child, tagName);
    }
}

function getDocumentElement(document) {
    for (let node of document.childNodes) {
        if (node.nodeName === 'html')
            return node;
    }
    return null;
}

function getAttribute(element, attrName) {
    for (let attr of element.attrs) {
        if (attr.name === attrName)
            return attr.value;
    }
    return undefined;
}

function parse(htmlString) {
    return getDocumentElement(parse5.parse(htmlString));
}

export {
    parse,

    getElementsByTagName,
    getDocumentElement,
    getAttribute,
};
