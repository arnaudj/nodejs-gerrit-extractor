/* @flow */
'use strict';

var parser = require('relaxed-json'); // gerrit json trailing commas not json compliant

import GerritChangesData from './GerritChangesData';
import { GerritChangesDataStore } from './GerritChangesDataStore';
import GerritChangesDataStoreIndexedMemory from './GerritChangesDataStoreIndexedMemory';

/**
 * Extract Gerrit changes data
 */
class GerritChangesDataExtracter {
    gerritData: GerritChangesData;
    skippedUsers: Array<string>;

    constructor(store: GerritChangesDataStore) {
        this.gerritData = new GerritChangesData(store);
        this.skippedUsers = [
            'builder', 'bot', 'sonar', // UL
            'treehugger-gerrit', // AOSP
            ];
    }

    fromJSON(json: string | null) {
        if (!json || json.length === 0) {
            throw 'Empty json data, cannot continue';
        }

        const jsonData = this.parseJSONString(json);

        this.gerritData.loadStore();

        jsonData.forEach((cs) => {
            cs.owner.username = this._getGerritUserName(cs.owner); // ensure present
            this.gerritData.addChangeSet(this.extractChangesetStatus(cs));
            this.gerritData.addEvents(this.extractNonAuthorEvents(cs), cs);
        });

        this.gerritData.saveStore();
    }

    extractChangesetStatus(cs: Object): Object {
        // https://gerrit-review.googlesource.com/Documentation/rest-api-changes.html#change-info
        let status = this._pickAttributes(cs,
            'id', 'project',
            'status', // (new, merged, abandonned, draft)
            'subject', 'created', 'updated',
            'submittable', 'mergeable', // (can be submittable but not mergeable)
        );
        status.number = cs._number;
        status.owner = cs.owner.username;
        status.status = status.status.toLowerCase();

        status.reviewScore = this.extractLabelsScore(cs, ['Code-Review']);
        status.verifyScore = this.extractLabelsScore(cs, [
            'Verified', // UL
            'Presubmit-Verified'] // AOSP
        );
        status.priorityScore = this.extractLabelsScore(cs, ['Priority']);

        return status;
    }

    extractLabelsScore(cs: Object, labelCandidates: Array<string>): string {
        for (let i = 0; i < labelCandidates.length; i++) {
            let label = labelCandidates[i];
            if (cs.hasOwnProperty('labels') && cs.labels.hasOwnProperty(label)) {
                let codeReviewNode = cs.labels[label];

                if (codeReviewNode.hasOwnProperty('value')) // sometimes missing for some reason
                    return codeReviewNode['value'] + '';

                // check subnodes presence:
                if (codeReviewNode.hasOwnProperty('approved'))
                    return '2';
                if (codeReviewNode.hasOwnProperty('recommended'))
                    return '1';
                if (codeReviewNode.hasOwnProperty('disliked'))
                    return '-1';
                if (codeReviewNode.hasOwnProperty('rejected'))
                    return '-2';
            }
        }
        return '';
    }

    /**
     * Extract events: CS level messages (comments within files are not included),
     * messages with code review score, etc.
     */
    extractNonAuthorEvents(cs: Object): Array<Object> {
        let events: Array<Object> = [];
        cs.messages.forEach((msg) => {
            let event = this.buildEventForChangeSetMessage(msg, cs._number, cs.owner.username);
            if (this.skippedUsers.indexOf(event.username) !== -1)
                return;

            events.push(event);
        });

        return events;
    }

    buildEventForChangeSetMessage(msg: Object, csNumber: number, csAuthor: string): Object {
        let event: Object = {
            id: msg.id,

            date: msg.date,
            epoch: undefined,

            username: this._getGerritUserName(msg.author),
            message: msg.message,

            psNumber: '',
            reviewScore: '',

            // Related changeset data:
            csNumber: csNumber,
            csAuthor: csAuthor,
        }

        let reviewMessage = event.message;
        if (reviewMessage.startsWith('Patch Set ')) {
            if (reviewMessage.includes(': Code-Review')) {
                let psVotes: Array<Object> = reviewMessage.match(/^Patch Set (\d)+: Code-Review(.\d){1}/i)
                if (psVotes !== null) {
                    event.psNumber = psVotes[1]; // should be equivalent to msg._revision_number
                    if (psVotes[2].startsWith('+'))
                        psVotes[2] = psVotes[2].substring(1);
                    event.reviewScore = psVotes[2];

                }
            } else {
                let psComment: Array<Object> = reviewMessage.match(/^Patch Set (\d)+:/i) // 'Patch Set %d:\n\n(%d comments)''                
                if (psComment !== null) {
                    event.psNumber = psComment[1]; // should be equivalent to msg._revision_number
                }
            }

        }

        event.epoch = Date.parse(event.date); // nb: seems timezone error

        return event;
    }

    _getGerritUserName(node: Object): string {
        if (node.hasOwnProperty('username'))
            return node.username;
        else if (node.hasOwnProperty('email')) {
            return node.email.split('@')[0];
        }

        return '';
    }

    parseJSONString(json: string): any {
        let firstLineIdx = json.indexOf("\n");
        json = json.startsWith(")]}'") ? json.substring(firstLineIdx !== -1 ? firstLineIdx + 1 : 5) : json; // strip first line completely if XSSI header seen (allow comment)
        json = this._sanitize(json);
        return parser.parse(json);
    }

    _sanitize(s: string): string { // EdH - http://stackoverflow.com/a/27725393
        s = s.replace(/\\n/g, "\\n")
            .replace(/\\'/g, "\\'")
            .replace(/\\"/g, '\\"')
            .replace(/\\&/g, "\\&")
            .replace(/\\r/g, "\\r")
            .replace(/\\t/g, "\\t")
            .replace(/\\b/g, "\\b")
            .replace(/\\f/g, "\\f");
        // remove non-printable and other non-valid JSON chars
        return s.replace(/[\u0000-\u0019]+/g, "");
    }

    // http://stackoverflow.com/a/25835337
    _pickAttributes(o: Object, ...fields: string[]) {
        return fields.reduce((a, x) => {
            if (o.hasOwnProperty(x)) a[x] = o[x];
            return a;
        }, {});
    }
}

export default GerritChangesDataExtracter;