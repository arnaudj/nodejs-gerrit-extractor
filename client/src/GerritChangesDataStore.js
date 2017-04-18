'use strict';

// https://flow.org/en/docs/types/modules/
export interface GerritChangesDataStore {
    addChangeset(changeset: Object): any;
    addEvents(eventsp: Array<Object>): any;

    getEvents(): Array<Object>;
    getChangesets(): Array<Object>;

    // persistence
    load(): any;
    commit(): any;
};
