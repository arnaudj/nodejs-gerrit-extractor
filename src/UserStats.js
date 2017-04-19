/* @flow */

class UserStats {
    username: string;
    nbChanges: number;
    nbChangesOpenReadyForReview: number;
    nbChangesOpenVerifyPlus2: number;
    nbEvents: number;

    constructor(username: string) {
        this.username = username;
        this.nbChanges = 0;
        this.nbChangesOpenReadyForReview = 0;
        this.nbChangesOpenVerifyPlus2 = 0;
        this.nbEvents = 0;
    }

    acceptChangeset(cs: Object) {
        this.nbChanges++;

        if (cs.status === 'MERGED')
            return;

        if (['', '-1', '- 2'].indexOf(cs.reviewScore) === -1
            && ['', '-1', '-2'].indexOf(cs.verifyScore) === -1)
            this.nbChangesOpenReadyForReview++;

        if (cs.verifyScore === '2')
            this.nbChangesOpenVerifyPlus2++;
    }

    acceptEvent(event: Object) {
        this.nbEvents++;
    }

    static getCSVHeader(): string {
        return "username,nbEvents,nbChanges,nbChangesOpenReadyForReview,nbChangesOpenVerifyPlus2,eventsOverChangesRatio\n";
    }

    toCSVString(): string {
        return this.username + "," + this.nbEvents + "," + this.nbChanges + "," + this.nbChangesOpenReadyForReview
            + "," + this.nbChangesOpenVerifyPlus2
            + "," + (this.nbChanges > 0 ? (this.nbEvents / this.nbChanges).toFixed(3) : '0')
            + "\n";
    }
}
export default UserStats;