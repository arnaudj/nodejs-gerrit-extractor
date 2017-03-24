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

    getEvents(): Array<Object> { return this.events; }
    getChangesets(): Array<Object> { return this.changesets; }
}

export default GerritChangesData;