/* @flow */

import GerritChangesDataExtracter from './GerritChangesDataExtracter';
import GerritUsersStatsBuilder from './GerritUsersStatsBuilder';
import UserStats from './UserStats';

const fs = require('fs');

describe('Tests gerrit data extraction', () => {

    test('Extractor can load 1 gerrit change with its comments data [in memory store]', () => {
        const extracter = new GerritChangesDataExtracter();
        extracter.fromJSON(loadFixture('../fixtures/open_change_1.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(1);
        expect(gerritData.getEvents().length).toBe(30);

        expect(gerritData.getEvents()[0]).toEqual({ // first 3rd party reviewer event
            "id": "c4a0bcb8_35186",
            "date": "2017-01-30 12:01:36.253000000",
            "epoch": 1485774096253,
            "username": "inameb",
            "psNumber": "3",
            "reviewScore": "+1",
            "csNumber": 74147,
            "csAuthor": "jdoe"
        });

        expect(gerritData.getChangesets()[0]).toEqual({
            id: 'project-1~master~I4030d100fdcdf57eee4f50dabe7a10b47563732c',
            project: 'project-1',
            status: 'new',
            subject: 'IMP Some feature',
            created: '2017-01-30 11:29:56.044000000',
            updated: '2017-03-20 14:07:18.661000000',
            submittable: false,
            mergeable: true,
            owner: 'jdoe',
            reviewScore: '-2',
            verifyScore: '1',
            priorityScore: '-2'
        });
    });

    test('Extractor can load all changes with their comments data', () => {
        const extracter = new GerritChangesDataExtracter();
        extracter.fromJSON(loadFixture('../fixtures/pa_open_changes.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(200);
        expect(gerritData.getEvents().length).toBe(713);
    });

    test('Extractor throws for empty payload', () => {
        const extracter = new GerritChangesDataExtracter();

        const expError = 'Empty json data, cannot continue';
        expect(() => extracter.fromJSON("")).toThrow(expError);
        expect(() => extracter.fromJSON(null)).toThrow(expError);
    });
});


describe('Tests users statistics', () => {

    test('StatsBuilder can analyze 1 user', () => {
        // setup:
        const extracter = new GerritChangesDataExtracter();
        extracter.fromJSON(loadFixture('../fixtures/open_change_1.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(1);
        expect(gerritData.getEvents().length).toBe(30);

        // test:
        const statsBuilder = new GerritUsersStatsBuilder();
        statsBuilder.build(gerritData);

        const users: Map<string, UserStats> = statsBuilder.getUsers();
        expect(users.size).toBe(7);

        // test change owner
        expect(users.get('jdoe')).toEqual({
            username: 'jdoe',
            nbChanges: 1,
            nbChangesOpenReadyForReview: 1,
            nbChangesOpenVerifyPlus2: 0,
            nbEvents: 0
        });

        // test few reviewers
        expect(users.get('inameb')).toEqual({
            username: 'inameb',
            nbChanges: 0,
            nbChangesOpenReadyForReview: 0,
            nbChangesOpenVerifyPlus2: 0,
            nbEvents: 3
        });
        expect(users.get('lnamef')).toEqual({
            username: 'lnamef',
            nbChanges: 0,
            nbChangesOpenReadyForReview: 0,
            nbChangesOpenVerifyPlus2: 0,
            nbEvents: 2
        });
        // bots filtered
        expect(users.get('builder')).toBe(undefined);
        expect(users.get('bot')).toBe(undefined);
    });


    test('StatsBuilder can analyze all users', () => {
        // setup:
        const extracter = new GerritChangesDataExtracter();
        extracter.fromJSON(loadFixture('../fixtures/pa_open_changes.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesets().length).toBe(200);
        expect(gerritData.getEvents().length).toBe(713);

        // test:
        const statsBuilder = new GerritUsersStatsBuilder();
        statsBuilder.build(gerritData);

        const users: Map<string, UserStats> = statsBuilder.getUsers();
        expect(users.size).toBe(57);

        expect(users.get('janedoe')).toEqual({
            "username": "janedoe",
            "nbChanges": 21,
            "nbChangesOpenReadyForReview": 14,
            "nbChangesOpenVerifyPlus2": 17,
            "nbEvents": 89,
        });

        // bots filtered
        expect(users.get('builder')).toBe(undefined);
        expect(users.get('bot')).toBe(undefined);

        statsBuilder.saveUsersStats(users);
    });
});

function loadFixture(path: string): string {
    return fs.readFileSync(__dirname + '/' + path).toString();
}






