/* @flow */

class UserStats {
    username: string;
    nbChanges: number;
    nbChangesMerged: number;
    nbChangesOpenReadyForReview: number;
    nbChangesOpenVerifyPlus2: number;
    nbEvents: number; // all user messages
    nbOwnChangeEvents: number; // messages on self-owned changes
    nb3rdPartyChangeEvents: number; // messages on changes owned by other people

    constructor(username: string) {
        this.username = username;
        this.nbChanges = 0;
        this.nbChangesMerged = 0;
        this.nbChangesOpenReadyForReview = 0;
        this.nbChangesOpenVerifyPlus2 = 0;
        this.nbEvents = 0;
        this.nbOwnChangeEvents = 0;
        this.nb3rdPartyChangeEvents = 0;
    }

    acceptChangeset(cs: Object) {
        this.nbChanges++;

        if (cs.status === 'merged') {
            this.nbChangesMerged++;
            return;
        }

        if (['', '-1', '- 2'].indexOf(cs.reviewScore) === -1
            && ['', '-1', '-2'].indexOf(cs.verifyScore) === -1)
            this.nbChangesOpenReadyForReview++;

        if (cs.verifyScore === '2')
            this.nbChangesOpenVerifyPlus2++;
    }

    acceptEvent(event: Object) {
        this.nbEvents++;
        if (event.username !== event.csAuthor)
            this.nb3rdPartyChangeEvents++;
        else
            this.nbOwnChangeEvents++;
    }

    static getCSVHeader(): string {
        return "username,nbChanges,nbChangesMerged,nbChangesOpenReadyForReview,nbChangesOpenVerifyPlus2,nbEvents,nbOwnChangeEvents,nb3rdPartyChangeEvents,"
        + "eventsTowards3PartyOverOwnChangesCountRatio,"
        + "eventsTowards3PartyOverEventsCount,"
        + "\n";
    }

    toCSVString(): string {
        return this.username + ","
            + this.nbChanges + ","
            + this.nbChangesMerged + ","
            + this.nbChangesOpenReadyForReview + ","
            + this.nbChangesOpenVerifyPlus2 + ","
            + this.nbEvents + ","
            + this.nbOwnChangeEvents + ","
            + this.nb3rdPartyChangeEvents + ","
            + ((this.nbChanges > 0) ? (this.nb3rdPartyChangeEvents / this.nbChanges).toFixed(3) : '0') + ','
            + ((this.nbEvents > 0) ? (this.nb3rdPartyChangeEvents / this.nbEvents).toFixed(3) : '0') + ','
            + "\n";
    }
}
export default UserStats;