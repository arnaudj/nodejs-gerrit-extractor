import GerritChangesDataExtracter from './GerritChangesDataExtracter';

const fs = require('fs');

describe('Tests for GerritChangesDataExtracter', () => {

    test('Extractor can load 1 gerrit change with its comments data', () => {
        const extracter = new GerritChangesDataExtracter();
        extracter.fromJSON(loadFixture('../fixtures/open_change_1.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesetsLength()).toBe(1);
        expect(gerritData.getEventsLength()).toBe(30);

        expect(gerritData.events[0]).toEqual({ // first 3rd party reviewer event
            "id": "c4a0bcb8_35186273",
            "date": "2017-01-30 12:01:36.253000000",
            "epoch": 1485774096253,
            "username": "inameb",
            "ps_number": "3",
            "review_score": "+1",
            "cs_number": 74147,
            "cs_author": "jdoe"
        });
    });

    test('Extractor can load all changes with their comments data', () => {
        const extracter = new GerritChangesDataExtracter();
        extracter.fromJSON(loadFixture('../fixtures/pa_open_changes.json'));

        const gerritData = extracter.gerritData;
        expect(gerritData.getChangesetsLength()).toBe(200);
        expect(gerritData.getEventsLength()).toBe(1255);

    });

    test('Extractor throws for empty payload', () => {
        const extracter = new GerritChangesDataExtracter();

        const expError = 'Empty json data, cannot continue';
        expect(() => extracter.fromJSON("")).toThrow(expError);
        expect(() => extracter.fromJSON(null)).toThrow(expError);
    });

    function loadFixture(path: string): string {
        return fs.readFileSync(__dirname + '/' + path).toString();
    }
});



