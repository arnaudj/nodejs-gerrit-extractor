/* @flow */

import GerritChangesDataExtracter from './GerritChangesDataExtracter';
import GerritUsersStatsBuilder from './GerritUsersStatsBuilder';
import GerritChangesDataStore from './GerritChangesDataStore';
import GerritChangesDataStoreIndexedMemory from './GerritChangesDataStoreIndexedMemory';
import UserStats from './UserStats';

const fs = require('fs');

let store: GerritChangesDataStore;

beforeEach(() => {
    store = new GerritChangesDataStoreIndexedMemory(
        false // skip disk load
    );
});

describe('Tests gerrit data extraction', () => {

    test('Extractor can load 1 gerrit change with its comments data', () => {
        const extracter = new GerritChangesDataExtracter(store);
        extracter.fromJSON(loadFixture('../fixtures/changes-aosp-system-x1.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(1);
        expect(gerritData.getEvents().length).toBe(16);

        expect(gerritData.getEvents()[0]).toEqual({
            "id": "2597a3e0700c55e832e491c9e500d9416af39f85",
            "date": "2017-04-14 23:22:56.000000000",
            "epoch": 1492204976000,
            "message": "Uploaded patch set 1.",
            "username": "enh",
            "psNumber": "",
            "reviewScore": "",
            "csNumber": 373476,
            "csAuthor": "enh"
        });

        expect(gerritData.getEvents()[2]).toEqual({
            "id": "1510cb0cc7842d24e4ad0589d026c43b1c03cd2d",
            "date": "2017-04-14 23:40:43.000000000",
            "epoch": 1492206043000,
            "message": "Patch Set 2:\n\n(4 comments)",
            "username": "cferris",
            "psNumber": "2",
            "reviewScore": "",
            "csNumber": 373476,
            "csAuthor": "enh"
        });

        expect(gerritData.getEvents()[3]).toEqual({
            "date": "2017-04-14 23:52:01.000000000",
            "epoch": 1492206721000,
            "id": "aeb3ca0a96f437d37e460a51ae87441d9c0fdf31",
            "message": "Patch Set 2: Code-Review+1\n\nIs the intent to let gitiles display this, and provide links to that?",
            "username": "ccraik",
            "psNumber": "2",
            "reviewScore": "1",
            "csNumber": 373476,
            "csAuthor": "enh"
        });

        expect(gerritData.getChangesets()[0]).toEqual({
            id: 'platform%2Fsystem%2Fcore~master~I649803ac846917a45f4b7b89cffe5b450179c479',
            number: 373476,
            project: 'platform/system/core',
            status: 'merged',
            subject: 'Add a README.md about our shell and utilities.',
            created: '2017-04-14 23:22:56.000000000',
            updated: '2017-04-15 15:33:39.000000000',
            owner: 'enh',
            reviewScore: '2',
            verifyScore: '2',
            priorityScore: ''
        });
    });

    test('Extractor can load all changes with their comments data', () => {
        const extracter = new GerritChangesDataExtracter(store);
        extracter.fromJSON(loadFixture('../fixtures/changes-aosp-system-x10.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(10);
        expect(gerritData.getEvents().length).toBe(133);
    });

    test('Extractor throws for empty payload', () => {
        const extracter = new GerritChangesDataExtracter(store);

        const expError = 'Empty json data, cannot continue';
        expect(() => extracter.fromJSON("")).toThrow(expError);
        expect(() => extracter.fromJSON(null)).toThrow(expError);
    });
});


describe('Tests users statistics', () => {

    test('StatsBuilder can analyze 1 user', () => {
        // setup:
        const extracter = new GerritChangesDataExtracter(store);
        extracter.fromJSON(loadFixture('../fixtures/changes-aosp-system-x1.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(1);
        expect(gerritData.getEvents().length).toBe(16);

        // test:
        const statsBuilder = new GerritUsersStatsBuilder();
        statsBuilder.build(gerritData);

        const users: Map<string, UserStats> = statsBuilder.getUsers();
        expect(users.size).toBe(3);

        // test change owner
        expect(users.get('enh')).toEqual({
            username: 'enh',
            nbChanges: 1,
            nbChangesMerged: 1,
            nbChangesOpenReadyForReview: 0,
            nbChangesOpenVerifyPlus2: 0,
            nbEvents: 13,
            nbOwnChangeEvents: 13,
            nb3rdPartyChangeEvents: 0,
        });

        // test few reviewers
        expect(users.get('cferris')).toEqual({
            username: 'cferris',
            nbChanges: 0,
            nbChangesMerged: 0,
            nbChangesOpenReadyForReview: 0,
            nbChangesOpenVerifyPlus2: 0,
            nbEvents: 2,
            nbOwnChangeEvents: 0,
            nb3rdPartyChangeEvents: 2,
        });
        expect(users.get('ccraik')).toEqual({
            username: 'ccraik',
            nbChanges: 0,
            nbChangesMerged: 0,
            nbChangesOpenReadyForReview: 0,
            nbChangesOpenVerifyPlus2: 0,
            nbEvents: 1,
            nbOwnChangeEvents: 0,
            nb3rdPartyChangeEvents: 1,
        });

        // bots filtered
        extracter.skippedUsers.forEach((name) => expect(users.get(name)).toBe(undefined));
        expect(users.get('bot')).toBe(undefined);
    });


    test('StatsBuilder can analyze all users', () => {
        // setup:
        const extracter = new GerritChangesDataExtracter(store);
        extracter.fromJSON(loadFixture('../fixtures/changes-aosp-system-x10.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(10);
        expect(gerritData.getEvents().length).toBe(133);

        // test:
        const statsBuilder = new GerritUsersStatsBuilder();
        statsBuilder.build(gerritData);

        const users: Map<string, UserStats> = statsBuilder.getUsers();
        expect(users.size).toBe(16);

        expect(users.get('janedoe')).toEqual({
            "username": "janedoe",
            "nbChanges": 21,
            "nbChangesOpenReadyForReview": 14,
            "nbChangesOpenVerifyPlus2": 17,
            "nbEvents": 89,
        });

        // bots filtered
        extracter.skippedUsers.forEach((name) => expect(users.get(name)).toBe(undefined));
        expect(users.get('bot')).toBe(undefined);

        // detect possible foremen: console.log(Array.from(users.values()).filter((user) => user.nb3rdPartyChangeEvents > user.nbOwnChangeEvents));
    });

    test.skip('StatsBuilder can export CSV data', () => {
        const extracter = new GerritChangesDataExtracter(store);
        extracter.fromJSON(loadFixture('../../pa_open_changes.json'));

        const statsBuilder = new GerritUsersStatsBuilder();
        statsBuilder.build(extracter.gerritData);

        console.log('users', statsBuilder.getUsers());
        statsBuilder.saveUsersStats();
    });
});

function loadFixture(path: string): string {
    return fs.readFileSync(__dirname + '/' + path).toString();
}






