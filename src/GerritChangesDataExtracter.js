/* @flow */

// https://gerrit-review.googlesource.com/Documentation/rest-api-changes.html#list-changes
// https://nodejs.org/api/
var parser = require('relaxed-json'); // gerrit json trailing commas not json compliant

import GerritChangesData from './GerritChangesData';
import { GerritChangesDataStore } from './GerritChangesDataStore';
import GerritChangesDataStoreIndexedMemory from './GerritChangesDataStoreIndexedMemory';

/**
 * Extract Gerrit changes data
 */
class GerritChangesDataExtracter {
    gerritData: GerritChangesData;

    constructor(store: GerritChangesDataStore) {
        this.gerritData = new GerritChangesData(store);
    }

    fromJSON(json: string | null) {
        if (!json || json.length === 0) {
            throw 'Empty json data, cannot continue';
        }

        const jsonData = this.parseJSONString(json);

        this.gerritData.loadStore();

        jsonData.forEach((cs) => {
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

        status.reviewScore = this.extractLabelsScore(cs, 'Code-Review');
        status.verifyScore = this.extractLabelsScore(cs, 'Verified');
        status.priorityScore = this.extractLabelsScore(cs, 'Priority');

        return status;
    }

    extractLabelsScore(cs: Object, labelType: string): string {
        if (cs.hasOwnProperty('labels') && cs.labels.hasOwnProperty(labelType)) {
            let codeReviewNode = cs.labels[labelType];

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
        return '';
    }

    /**
     * Extract events: CS level messages (comments within files are not included),
     * messages with code review score, etc.
     */
    extractNonAuthorEvents(cs: Object): Array<Object> {
        let events: Array<Object> = [];
        cs.messages.forEach((msg) => {
            let event = this.buildEventsForChangeSetMessages(msg, cs._number, cs.owner.username);
            if (['builder', 'bot', 'sonar'].indexOf(event.username) !== -1
                || event.message.startsWith('Uploaded patch set ') // drop author upload PS
                || event.username === cs.owner.username // drop author adds message/comments)
            ) {
                return;
            }

            delete event.message;
            events.push(event);
        });

        return events;
    }

    buildEventsForChangeSetMessages(msg: Object, csNumber: number, csAuthor: string): Object {
        let comment: Object = {
            id: msg.id,

            date: msg.date,
            epoch: undefined,

            username: msg.author.username,
            message: msg.message,

            psNumber: undefined,
            reviewScore: undefined,

            // Related changeset data:
            csNumber: csNumber,
            csAuthor: csAuthor,

        }

        if (comment.message.startsWith('Patch Set ')) {
            let psVotes: Array<Object> = comment.message.match(/^Patch Set (\d)+: Code-Review(.\d){1}/i)
            if (psVotes !== null) {
                comment.psNumber = psVotes[1]; // should be equivalent to msg._revision_number
                comment.reviewScore = psVotes[2];
            }
        }

        comment.epoch = Date.parse(comment.date); // nb: seems timezone error

        return comment;
    }

    parseJSONString(json: string): any {
        json = json.startsWith(")]}'") ? json.substring(5) : json; // strip XSSI header
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