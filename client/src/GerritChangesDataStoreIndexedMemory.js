/* @flow */
import GerritChangesDataStore from './GerritChangesDataStore';
import Config from '../Config';

const fs = require('fs');

/**
 * Index memory, on demande load/save.
 */
class GerritChangesDataStoreIndexedMemory implements GerritChangesDataStore {
    // store by UID to allow persistence+refresh
    changesets: Map<string, Object>; // <changeset UID, changeset>
    events: Map<string, Object>;     // <event UID, event>
    loadFromDisk: boolean;

    constructor(loadFromDisk: boolean) {
        this.loadFromDisk = loadFromDisk;
        this.changesets = new Map();
        this.events = new Map();
    }

    addChangeSet(cs: Object) {
        this.changesets.set(cs.id, cs);
    }

    addEvents(events: Array<Object>, sourceChangeset: Object) {
        events.forEach((ev) => this.events.set(ev.id, ev));
    }

    getEvents(): Array<Object> { return Array.from(this.events.values()); }
    getChangesets(): Array<Object> { return Array.from(this.changesets.values()); }

    load() {
        if (!this.loadFromDisk)
            return;

        const path = Config.DB_PATH;
        if (path) {
            let raw = '';
            try {
                raw = fs.readFileSync(path).toString();
            } catch (err) {
                if (err.code !== 'ENOENT') // overcome no entity found
                    throw err;
            }
            if (raw) {
                let um = JSON.parse(raw);
                this.changesets = this._objectToMap(um.changesets);
                this.events = this._objectToMap(um.events);
            }
        }
    }

    commit() {
        const path = Config.DB_PATH;
        if (path) {
            let m = JSON.stringify({
                changesets: this._mapToObject(this.changesets),
                events: this._mapToObject(this.events)
            }, null, 2);
            fs.writeFileSync(path, m);
        }
    }

    _objectToMap(sourceObject: Object): Map<any, any> {
        let ret = new Map();
        for (let key of Object.keys(sourceObject)) {
            ret.set(key, sourceObject[key]);
        }
        return ret;
    }

    _mapToObject(map: Map<any, any>) {
        let ret = Object.create(null);
        for (let [key, val] of map) {
            ret[key] = val;
        }
        return ret;
    }
}

export default GerritChangesDataStoreIndexedMemory;