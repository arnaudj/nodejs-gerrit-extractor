/* @flow */

class GerritChangesData {
    changesets: Array<Object>;
    events: Array<Object>;

    constructor() {
        this.changesets = [];
        this.events = [];
    }

    addChangeSet(changeset: Object) {
        this.changesets.push(changeset);
    }

    addEvents(events: Array<Object>, sourceChangeset: Object) {
        this.events = this.events.concat(events);
    }

    getEventsLength(): number { return this.events.length; }
    getChangesetsLength(): number { return this.changesets.length; }
}

export default GerritChangesData;