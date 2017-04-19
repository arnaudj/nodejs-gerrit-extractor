/* @flow */

import type {GerritChangesDataStore } from './GerritChangesDataStore';
import GerritChangesDataStoreArrayMemory from './GerritChangesDataStoreArrayMemory';

class GerritChangesData {
    store: GerritChangesDataStore;

    constructor(store: GerritChangesDataStore) {
        this.store = store;
    }


    addChangeSet(changeset: Object) {
        this.store.addChangeSet(changeset);
    }

    addEvents(events: Array<Object>, sourceChangeset: Object) {
        this.store.addEvents(events);
    }

    loadStore() { this.store.load(); }
    saveStore() { this.store.commit(); }

    getEvents(): Array<Object> { return this.store.getEvents(); }
    getChangesets(): Array<Object> { return this.store.getChangesets(); }
}

export default GerritChangesData;