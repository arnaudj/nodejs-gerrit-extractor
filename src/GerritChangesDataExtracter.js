/* @flow */

// https://gerrit-review.googlesource.com/Documentation/rest-api-changes.html#list-changes
// https://nodejs.org/api/
var parser = require('relaxed-json'); // gerrit json trailing commas not json compliant

import GerritChangesData from './GerritChangesData';

/**
 * Extract Gerrit changes data
 */
class GerritChangesDataExtracter {
    gerritData: GerritChangesData;

    constructor() {
        this.gerritData = new GerritChangesData();
    }

    fromJSON(json: string) {
        if (!json || json.length === 0) {
            throw 'Empty json data, cannot continue';
        }

        const jsonData = this.parseJSONString(json);

        jsonData.forEach((cs) => {
            let changeset = { status: 'TODO' }; // TODO Changeset overall data (status & co)
            this.gerritData.addChangeSet(changeset);
            this.gerritData.addEvents(this.extractNonAuthorEvents(cs), changeset);
        });
    }

    /**
     * Extract events: CS level messages (comments within files not includes),
     * messages with code review score, etc.
     */
    extractNonAuthorEvents(cs: Object): Array<Object> {
        let events: Array<Object> = [];
        cs.messages.forEach((msg) => {
            events.push(this.buildEventsForChangeSetMessages(msg, cs._number, cs.owner.username));
        });

        events = events.filter((event) => {
            return ['builder', 'bot'].indexOf(event.username) === -1
                && !event.message.startsWith('Uploaded patch set ') // drop author upload PS
                && event.username !== cs.owner.username // drop author adds message/comments
        });

        events = events.map((event) => {
            delete event.message;
            return event;
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

            ps_number: undefined,
            review_score: undefined,

            // Related changeset data:
            cs_number: csNumber,
            cs_author: csAuthor,

        }


        let psVotes: Array<Object> = comment.message.match(/^Patch Set (\d)+: Code-Review(.\d){1}/i)
        if (psVotes !== null) {
            comment.ps_number = psVotes[1]; // should be equivalent to msg._revision_number
            comment.review_score = psVotes[2];
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

}

export default GerritChangesDataExtracter;